'use client';

import { useRef, useState } from 'react';
import { Trash2, Upload, VideoOff } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { uploadFile } from '@/lib/api';

/**
 * Yüklenen yol görelidir (`/uploads/<uuid>.mp4`) ve API tarafından servis
 * edilir; panel ayrı origin'de çalıştığı için (dev: 3001) onu API origin'ine
 * tamamlamak gerekir. `api.ts` aynı env değişkenini `/api/v1` ile kullanıyor;
 * burada o son yol parçası atılır.
 */
function mediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1').replace(
    /\/api\/v1\/?$/,
    ''
  );
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** API'nin kabul ettiği video tipleri (`apps/api/src/middlewares/upload.js`). */
const ACCEPT = 'video/mp4,video/webm,video/ogg,video/quicktime';

/**
 * VideoField — tek video alanı: dosya seç → `POST /upload/video` → dönen
 * `/uploads/<ad>` yolu; önizleme; "URL kullan" alternatifi; kaldır.
 *
 * Kontrollü bileşen: değer (`value`) dışarıda tutulur, bileşen yalnızca yolu
 * bildirir. Yükleme sırasında `aria-busy` + `aria-live` ile durum duyurulur;
 * hata `role="alert"` ile okunur (form alanının hatası sessiz kalmasın). Düğme
 * adı yüklenme sırasında DEĞİŞMEZ: adı değişen kontrol kullanıcıyı şaşırtır,
 * geri bildirim durum satırından gelir.
 */
export default function VideoField({
  label,
  value,
  onChange,
  className,
  hint = 'MP4, WebM, OGG veya MOV — en fazla 50 MB',
}: {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const id = `video-field-${label.toLowerCase().replace(/[^a-zçğıöşü]+/g, '-')}`;

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await uploadFile('/upload/video', file);
      const url = res?.data?.url;
      if (!url) {
        setError('Yükleme yanıtında video yolu yok');
        return;
      }
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Video yüklenemedi');
    } finally {
      setBusy(false);
      // Aynı dosyayı tekrar seçebilmek için girişi sıfırla (change tetiklenmezdi).
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function applyDraft() {
    const url = draft.trim();
    if (!url) return;
    setError(null);
    setDraft('');
    onChange(url);
  }

  return (
    <Field label={label} htmlFor={id} className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-field border border-border bg-surface-variant">
          {value ? (
            <video
              controls
              preload="metadata"
              src={mediaUrl(value)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div role="img" aria-label={`${label}: video yok`} className="text-fg-subtle">
              <VideoOff className="h-6 w-6" aria-hidden />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={busy}
          aria-describedby={`${id}-durum`}
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="h-4 w-4" aria-hidden />
          Dosya seç
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            onChange(null);
          }}
          disabled={!value || busy}
          aria-label={`${label} videosunu kaldır`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Kaldır
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={`${label} URL`}
          className="min-w-[12rem] flex-1"
          value={draft}
          placeholder="/uploads/… veya https://…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyDraft();
            }
          }}
        />
        <Button variant="ghost" size="sm" onClick={applyDraft} disabled={!draft.trim()}>
          URL kullan
        </Button>
      </div>

      <span
        id={`${id}-durum`}
        aria-live="polite"
        aria-busy={busy}
        className="text-sm text-fg-muted"
      >
        {busy ? 'Video yükleniyor' : hint}
      </span>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </Field>
  );
}
