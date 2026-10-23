/**
 * AP-004 — `components/ui/DataTable.tsx`
 *
 * Kapsam: üç sayfada (salons/users/appointments) paylaşılan tablonun davranışı.
 * Test edilen sözleşmeler: `loading` → yükleme bloğu (tablo **yok**), boş satır →
 * `EmptyState`, kolon başlıkları `th[scope=col]`, hizalama sınıfı, satır başına
 * eylem yuvası ve mobil kart modunun `primary`/`mobile:false`/`block` kuralları.
 * Mobil kartta `mobile:false` kolonu düşürmek veri kaybı, `primary` seçmemek ise
 * başlıksız kart demektir — ikisi de burada kilitlenir.
 */
import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import DataTable, { type Column } from '@/components/ui/DataTable';

interface Row {
  id: string;
  name: string;
  city: string;
  amount: number;
}

const ROWS: Row[] = [
  { id: '1', name: 'Kuaför A', city: 'İstanbul', amount: 100 },
  { id: '2', name: 'Kuaför B', city: 'Ankara', amount: 250 },
];

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Salon', cell: (r) => r.name, mobile: 'primary' },
  { key: 'city', header: 'Şehir', cell: (r) => r.city },
  { key: 'amount', header: 'Tutar', cell: (r) => `${r.amount} TL`, align: 'right' },
];

function renderTable(props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  return render(
    <DataTable<Row>
      rows={ROWS}
      columns={COLUMNS}
      rowKey={(r) => r.id}
      {...props}
    />
  );
}

describe('DataTable — yükleme ve boş durum', () => {
  test('loading=true iken tablo yerine yükleme bloğu basılır', () => {
    renderTable({ loading: true });
    expect(screen.getByText('Yükleniyor…')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('listitem')).toBeNull();
  });

  test('boş satırda varsayılan "Kayıt yok" başlığı gösterilir', () => {
    renderTable({ rows: [] });
    expect(screen.getByText('Kayıt yok')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  test('boş durum başlığı ve açıklaması özelleştirilebilir', () => {
    renderTable({ rows: [], emptyTitle: 'Salon bulunamadı', emptyDescription: 'Filtreyi temizle' });
    expect(screen.getByText('Salon bulunamadı')).toBeTruthy();
    expect(screen.getByText('Filtreyi temizle')).toBeTruthy();
  });
});

describe('DataTable — geniş ekran tablosu', () => {
  test('kolon sayısı kadar th[scope=col] ve satır sayısı kadar gövde satırı basar', () => {
    renderTable();
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual(['Salon', 'Şehir', 'Tutar']);
    expect(headers.every((h) => h.getAttribute('scope') === 'col')).toBe(true);

    const bodyRows = within(table).getAllByRole('row').slice(1);
    expect(bodyRows).toHaveLength(2);
    expect(within(bodyRows[0]).getByText('Kuaför A')).toBeTruthy();
    expect(within(bodyRows[1]).getByText('250 TL')).toBeTruthy();
  });

  test('align="right" başlık ve hücreye text-right uygular', () => {
    renderTable();
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers[2].className).toContain('text-right');
    expect(headers[0].className).toContain('text-left');

    const firstRowCells = within(table).getAllByRole('row')[1].querySelectorAll('td');
    expect(firstRowCells[2].className).toContain('text-right');
  });

  test('minWidthClass tablo sınıfına yazılır (yatay kaydırma sözleşmesi)', () => {
    renderTable({ minWidthClass: 'min-w-[60rem]' });
    expect(screen.getByRole('table').className).toContain('min-w-[60rem]');
  });
});

describe('DataTable — dar ekran kart modu', () => {
  test('satır başına bir kart (listitem) basar', () => {
    renderTable();
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('Kuaför A')).toBeTruthy();
  });

  test('primary kolon kart başlığına, diğer kolonlar etiket:değer satırına gider', () => {
    renderTable();
    const card = screen.getAllByRole('listitem')[1];
    const terms = card.querySelectorAll('dt');
    expect(Array.from(terms).map((t) => t.textContent)).toEqual(['Şehir', 'Tutar']);
    expect(within(card).getByText('Ankara')).toBeTruthy();
    const heading = card.querySelector('.font-display');
    expect(heading?.textContent).toBe('Kuaför B');
  });

  test('mobile:false kolonu kartta hiç gösterilmez (opt-out)', () => {
    const columns: Column<Row>[] = [
      ...COLUMNS,
      { key: 'gizli', header: 'Gizli', cell: () => 'GİZLİ-DEĞER', mobile: false },
    ];
    renderTable({ columns });
    const card = screen.getAllByRole('listitem')[0];
    expect(within(card).queryByText('GİZLİ-DEĞER')).toBeNull();
    expect(within(card).queryByText('Gizli')).toBeNull();
  });

  test('block kolonu kartta tam satır (dt+dd) olarak render edilir', () => {
    const columns: Column<Row>[] = [
      COLUMNS[0],
      { key: 'city', header: 'Şehir', cell: (r) => r.city, block: true },
    ];
    renderTable({ columns });
    const card = screen.getAllByRole('listitem')[0];
    const blockRow = card.querySelector('dl > div.pt-1');
    expect(blockRow).not.toBeNull();
    expect(within(blockRow as HTMLElement).getByText('İstanbul')).toBeTruthy();
  });

  test('actions satır başına bir kez çağrılır ve kart alt bölgesinde basılır', () => {
    renderTable({ actions: (r) => <button type="button">Düzenle {r.name}</button> });
    expect(screen.getByRole('button', { name: 'Düzenle Kuaför A' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Düzenle Kuaför B' })).toBeTruthy();
    const card = screen.getAllByRole('listitem')[0];
    expect(within(card).getByRole('button', { name: 'Düzenle Kuaför A' })).toBeTruthy();
  });

  test('actions verilmezse kart alt bölgesi çizilmez', () => {
    renderTable();
    const card = screen.getAllByRole('listitem')[0];
    expect(card.querySelector('.border-t')).toBeNull();
  });
});
