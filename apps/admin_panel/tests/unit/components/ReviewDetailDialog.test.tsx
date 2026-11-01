/**
 * `components/reviews/ReviewDetailDialog.tsx`
 *
 * Sözleşme: diyalog **salt okunurdur** — ağ çağrısı, form, kaydet yoktur. Bu
 * yüzden `@/lib/api` mock'lanmaz; `fetch` kasıtlı olarak spy'lanır ve hiçbir
 * istek atılmadığı burada kanıtlanır (AP-010 D3).
 *
 * Kilitlenen noktalar:
 * - `review === null` iken `open` doğru olsa bile hiçbir düğüm basılmaz.
 * - Yorum metni yoksa `Yorum yazılmamış.`, görseller varsa `alt` metni
 *   `<musteri> yorum görseli <n>` biçiminde, salon yanıtı yalnız `salonReply`
 *   varsa basılır.
 * - Görünürlük rozeti `Görünür` / `Gizli`; puan `Stars` ile (`aria-label`).
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReviewDetailDialog, {
  type ReviewDetail,
} from '@/components/reviews/ReviewDetailDialog';
import LocaleProvider from '@/providers/LocaleProvider';
import type { ReactElement } from 'react';

/** Bileşen `t()` kullanır: her render Türkçe locale ile sarılır. */
function renderTr(node: ReactElement) {
  return render(<LocaleProvider initialMode="tr">{node}</LocaleProvider>);
}

const review: ReviewDetail = {
  id: 'review-1',
  rating: 4,
  comment: 'Çok memnun kaldım, tekrar gelirim.',
  isVisible: true,
  salonReply: null,
  salonReplyAt: null,
  createdAt: '2026-09-20T08:30:00.000Z',
  customerName: 'Zeynep Kaya',
  salonName: 'Elegance Beauty Studio',
};

function renderDialog(overrides: Partial<ReviewDetail> = {}, open = true) {
  // Ağ yok iddiası testin parçası: fetch spy'lanır, çağrılırsa kırmızıya döner.
  const fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);

  const onClose = vi.fn();
  const utils = renderTr(
    <ReviewDetailDialog review={{ ...review, ...overrides }} open={open} onClose={onClose} />
  );
  return { onClose, fetchSpy, ...utils };
}

const valueOf = (label: string) => {
  const dt = screen.getByText(label);
  expect(dt.tagName).toBe('DT');
  return dt.nextElementSibling?.textContent ?? '';
};

describe('ReviewDetailDialog — kapalı / boş hâller', () => {
  test('open=false iken hiçbir düğüm basmaz', () => {
    const { container } = renderDialog({}, false);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('review=null ise open doğru olsa bile hiçbir düğüm basılmaz', () => {
    const onClose = vi.fn();
    const { container } = renderTr(
      <ReviewDetailDialog review={null} open onClose={onClose} />
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('Yorum detayı')).toBeNull();
  });
});

describe('ReviewDetailDialog — alanlar', () => {
  test('başlık, müşteri, salon, puan ve görünürlük basılır; ağ isteği yapılmaz', () => {
    const { fetchSpy } = renderDialog();

    expect(screen.getByRole('dialog', { name: 'Yorum detayı' })).toBeTruthy();
    expect(valueOf('Müşteri')).toBe('Zeynep Kaya');
    expect(valueOf('Salon')).toBe('Elegance Beauty Studio');
    expect(valueOf('Görünürlük')).toBe('Görünür');
    // Puan `Stars` ile gösterilir: erişilebilir ad `aria-label`dan gelir.
    expect(valueOf('Puan')).toBe('');
    expect(document.querySelector('span[aria-label="4 yıldız"]')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('gizli yorumda rozet "Gizli" olur', () => {
    renderDialog({ isVisible: false });
    expect(valueOf('Görünürlük')).toBe('Gizli');
  });

  test('yorum tarihi tr-TR uzun biçimde basılır', () => {
    renderDialog();
    expect(valueOf('Yorum tarihi')).toBe('20 Eylül 2026');
  });

  test('bozuk createdAt basılabilir kalır (tarih çökmez)', () => {
    renderDialog({ createdAt: 'belirsiz' });
    expect(valueOf('Yorum tarihi')).toBe('belirsiz');
  });

  test('yorum metni varsa basılır', () => {
    renderDialog({ comment: 'Çok memnun kaldım, tekrar gelirim.' });
    expect(screen.getByText('Çok memnun kaldım, tekrar gelirim.')).toBeTruthy();
  });

  test('comment null → "Yorum yazılmamış."', () => {
    renderDialog({ comment: null });
    expect(screen.getByText('Yorum yazılmamış.')).toBeTruthy();
  });

  test('Kapat düğmesi onClose çağırır', async () => {
    const { onClose } = renderDialog();
    // scrim + başlıktaki X + footer'daki "Kapat": üçü de aynı erişilebilir ada sahip.
    const buttons = screen.getAllByRole('button', { name: 'Kapat' });
    expect(buttons).toHaveLength(3);
    await userEvent.click(buttons[2]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ReviewDetailDialog — görseller ve salon yanıtı', () => {
  test('images varsa her görsel alt metniyle basılır', () => {
    renderDialog({ images: ['/uploads/a.jpg', '/uploads/b.jpg'] });

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute('src')).toBe('/uploads/a.jpg');
    expect(images[0].getAttribute('alt')).toBe('Zeynep Kaya yorum görseli 1');
    expect(images[1].getAttribute('alt')).toBe('Zeynep Kaya yorum görseli 2');
  });

  test('images boş dizi veya undefined ise görsel basılmaz', () => {
    const { unmount } = renderDialog({ images: [] });
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    unmount();

    renderDialog({ images: undefined });
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  test('salonReply varsa yanıt bloğu ve yanıt tarihi basılır', () => {
    renderDialog({
      salonReply: 'Teşekkür ederiz, bekleriz.',
      salonReplyAt: '2026-09-21T10:00:00.000Z',
    });

    expect(screen.getByText('Salon yanıtı')).toBeTruthy();
    expect(screen.getByText('Teşekkür ederiz, bekleriz.')).toBeTruthy();
    expect(screen.getByText('21 Eylül 2026')).toBeTruthy();
  });

  test('salonReply var ama tarihi yoksa tarih satırı basılmaz', () => {
    renderDialog({ salonReply: 'Teşekkür ederiz.', salonReplyAt: null });

    expect(screen.getByText('Teşekkür ederiz.')).toBeTruthy();
    expect(screen.queryByText('21 Eylül 2026')).toBeNull();
  });

  test('salonReply null ise yanıt bloğu hiç basılmaz', () => {
    renderDialog({ salonReply: null, salonReplyAt: '2026-09-21T10:00:00.000Z' });
    expect(screen.queryByText('Salon yanıtı')).toBeNull();
  });

  test('dil en olunca başlık, etiketler, rozet ve tarihler İngilizceye döner', () => {
    render(
      <LocaleProvider initialMode="en">
        <ReviewDetailDialog
          review={{
            ...review,
            salonReply: 'Thank you, see you again.',
            salonReplyAt: '2026-09-21T10:00:00.000Z',
          }}
          open
          onClose={vi.fn()}
        />
      </LocaleProvider>
    );

    expect(screen.getByRole('dialog', { name: 'Review details' })).toBeTruthy();
    expect(valueOf('Customer')).toBe('Zeynep Kaya');
    expect(valueOf('Review date')).toBe('September 20, 2026');
    expect(valueOf('Visibility')).toBe('Visible');
    expect(screen.getByText('Salon reply')).toBeTruthy();
    expect(screen.getByText('September 21, 2026')).toBeTruthy();
    expect(screen.queryByText('20 Eylül 2026')).toBeNull();
  });
});
