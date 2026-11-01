'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import WorkingHoursEditor, {
  WORKING_DAYS,
  type WorkingHours,
} from '@/components/salons/WorkingHoursEditor';
import ImageField from '@/components/salons/ImageField';
import { useI18n } from '@/providers/LocaleProvider';
import type { TranslateVars } from '@/lib/i18n';

export interface SalonEditSource {
  id: string;
  name: string;
  phone?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workingHours?: WorkingHours | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  galleryImages?: string[] | null;
}

/**
 * `PATCH /salons/:id` gövdesi. **`email` alanı bilinçli olarak yoktur**: e-posta
 * değişikliği OTP akışından geçer, API de PATCH'te e-posta alanlarını ayıklar
 * (`salon.controller.js`). Bu nesneye e-posta eklemek sessiz bir yetki aşımı olur.
 */
export interface SalonEditPayload {
  name: string;
  phone: string;
  description: string | null;
  address: string;
  city: string;
  district: string;
  latitude?: number;
  longitude?: number;
  workingHours: WorkingHours;
  logoUrl: string | null;
  coverImageUrl: string | null;
  galleryImages: string[];
}

type FieldKey =
  | 'name'
  | 'phone'
  | 'description'
  | 'address'
  | 'city'
  | 'district'
  | 'latitude'
  | 'longitude'
  | 'workingHours';

type FieldErrors = Partial<Record<FieldKey, string>>;

interface FormState {
  name: string;
  phone: string;
  description: string;
  address: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
  workingHours: WorkingHours;
  logoUrl: string | null;
  coverImageUrl: string | null;
  galleryImages: string[];
}

const PHONE_PATTERN = /^\+?[1-9]\d{9,14}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const MAX_DESCRIPTION = 1000;
const MAX_GALLERY = 12;

function toForm(salon: SalonEditSource | null): FormState {
  return {
    name: salon?.name ?? '',
    phone: salon?.phone ?? '',
    description: salon?.description ?? '',
    address: salon?.address ?? '',
    city: salon?.city ?? '',
    district: salon?.district ?? '',
    latitude: typeof salon?.latitude === 'number' ? String(salon.latitude) : '',
    longitude: typeof salon?.longitude === 'number' ? String(salon.longitude) : '',
    workingHours: salon?.workingHours ?? {},
    logoUrl: salon?.logoUrl ?? null,
    coverImageUrl: salon?.coverImageUrl ?? null,
    galleryImages: salon?.galleryImages ?? [],
  };
}

/**
 * Alan bazlı doğrulama; API validator'ıyla aynı sınırlar (plan R6).
 * `t` parametre olarak alınır: modül saf kalsın, hata metinleri aktif dilde çıksın.
 */
function validate(form: FormState, t: (key: string, vars?: TranslateVars) => string): FieldErrors {
  const errors: FieldErrors = {};

  const name = form.name.trim();
  if (name.length < 2 || name.length > 100) errors.name = t('salons.edit.errors.name');

  const phone = form.phone.trim();
  if (!phone) errors.phone = t('salons.edit.errors.phoneRequired');
  else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = t('salons.edit.errors.phoneInvalid');
  }

  if (form.description.trim().length > MAX_DESCRIPTION) {
    errors.description = t('salons.edit.errors.descriptionMax', { max: MAX_DESCRIPTION });
  }

  if (form.address.trim().length < 5) errors.address = t('salons.edit.errors.addressMin');
  if (!form.city.trim()) errors.city = t('salons.edit.errors.cityRequired');
  if (!form.district.trim()) errors.district = t('salons.edit.errors.districtRequired');

  const latitude = form.latitude.trim();
  if (latitude) {
    const value = Number(latitude);
    if (!Number.isFinite(value) || value < -90 || value > 90) {
      errors.latitude = t('salons.edit.errors.latitudeRange');
    }
  }

  const longitude = form.longitude.trim();
  if (longitude) {
    const value = Number(longitude);
    if (!Number.isFinite(value) || value < -180 || value > 180) {
      errors.longitude = t('salons.edit.errors.longitudeRange');
    }
  }

  // Kapalı gün anahtar olarak yoktur; yazılan her gün HH:MM ve open < close olmalı.
  for (const { key, labelKey } of WORKING_DAYS) {
    const hours = form.workingHours[key];
    if (!hours) continue;
    const day = t(labelKey);
    if (!TIME_PATTERN.test(hours.open) || !TIME_PATTERN.test(hours.close)) {
      errors.workingHours = t('salons.edit.errors.workingHoursFormat', { day });
      break;
    }
    if (hours.open >= hours.close) {
      errors.workingHours = t('salons.edit.errors.workingHoursOrder', { day });
      break;
    }
  }

  return errors;
}

function buildPayload(form: FormState): SalonEditPayload {
  const payload: SalonEditPayload = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    description: form.description.trim() || null,
    address: form.address.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    // Nesne gönderilir, string DEĞİL: model setter'ı çift stringify riskini kapatır.
    workingHours: form.workingHours,
    logoUrl: form.logoUrl,
    coverImageUrl: form.coverImageUrl,
    galleryImages: form.galleryImages,
  };

  const latitude = form.latitude.trim();
  if (latitude) payload.latitude = Number(latitude);
  const longitude = form.longitude.trim();
  if (longitude) payload.longitude = Number(longitude);

  return payload;
}

/**
 * AP-007 W3 — salon düzenleme diyaloğu (plan §5.1, D10 tam kapsam).
 *
 * Beş bölüm: Temel (ad/telefon/açıklama), Adres, Konum, Çalışma saatleri,
 * Görseller (logo + kapak + galeri). Kaydet → `PATCH /salons/:id`.
 *
 * Başarı duyurusu **sayfada** yapılır (`aria-live` bölgesi): diyalog kaydettikten
 * sonra kapanır, kendi içindeki bir canlı bölge kapanışla birlikte sökülür ve
 * ekran okuyucu duyuruyu kaçırırdı.
 */
export default function SalonEditDialog({
  open,
  salon,
  onClose,
  onSaved,
}: {
  open: boolean;
  salon: SalonEditSource | null;
  onClose: () => void;
  onSaved: (id: string, payload: SalonEditPayload) => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(() => toForm(salon));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Her açılışta satırın güncel değerleriyle tazelenir (önceki denemenin
  // hataları ve yarım düzenlemeleri taşınmaz).
  useEffect(() => {
    if (!open) return;
    setForm(toForm(salon));
    setErrors({});
    setFormError(null);
  }, [open, salon]);

  if (!salon) return null;

  const patch = (next: Partial<FormState>) => setForm((prev) => ({ ...prev, ...next }));

  const submit = async () => {
    const nextErrors = validate(form, t);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = buildPayload(form);
    setSaving(true);
    try {
      await apiFetch(`/salons/${salon.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      onSaved(salon.id, payload);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('salons.edit.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('salons.edit.title')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('salons.edit.cancel')}
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            {t('salons.edit.sections.basics')}
          </h3>
          <Field
            label={t('salons.edit.fields.name')}
            htmlFor="salon-edit-name"
            required
            error={errors.name}
          >
            <Input
              id="salon-edit-name"
              value={form.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t('salons.edit.fields.phone')}
              htmlFor="salon-edit-phone"
              required
              error={errors.phone}
              hint={t('salons.edit.fields.phoneHint')}
            >
              <Input
                id="salon-edit-phone"
                inputMode="tel"
                value={form.phone}
                aria-invalid={Boolean(errors.phone)}
                onChange={(e) => patch({ phone: e.target.value })}
              />
            </Field>
            <Field
              label={t('salons.edit.fields.description')}
              htmlFor="salon-edit-description"
              error={errors.description}
            >
              <Textarea
                id="salon-edit-description"
                value={form.description}
                aria-invalid={Boolean(errors.description)}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            {t('salons.edit.sections.address')}
          </h3>
          <Field
            label={t('salons.edit.fields.address')}
            htmlFor="salon-edit-address"
            required
            error={errors.address}
          >
            <Input
              id="salon-edit-address"
              value={form.address}
              aria-invalid={Boolean(errors.address)}
              onChange={(e) => patch({ address: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t('salons.edit.fields.city')}
              htmlFor="salon-edit-city"
              required
              error={errors.city}
            >
              <Input
                id="salon-edit-city"
                value={form.city}
                aria-invalid={Boolean(errors.city)}
                onChange={(e) => patch({ city: e.target.value })}
              />
            </Field>
            <Field
              label={t('salons.edit.fields.district')}
              htmlFor="salon-edit-district"
              required
              error={errors.district}
            >
              <Input
                id="salon-edit-district"
                value={form.district}
                aria-invalid={Boolean(errors.district)}
                onChange={(e) => patch({ district: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            {t('salons.edit.sections.location')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t('salons.edit.fields.latitude')}
              htmlFor="salon-edit-latitude"
              error={errors.latitude}
            >
              <Input
                id="salon-edit-latitude"
                inputMode="decimal"
                value={form.latitude}
                aria-invalid={Boolean(errors.latitude)}
                onChange={(e) => patch({ latitude: e.target.value })}
              />
            </Field>
            <Field
              label={t('salons.edit.fields.longitude')}
              htmlFor="salon-edit-longitude"
              error={errors.longitude}
            >
              <Input
                id="salon-edit-longitude"
                inputMode="decimal"
                value={form.longitude}
                aria-invalid={Boolean(errors.longitude)}
                onChange={(e) => patch({ longitude: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            {t('salons.edit.sections.workingHours')}
          </h3>
          <WorkingHoursEditor
            value={form.workingHours}
            onChange={(next) => patch({ workingHours: next })}
          />
          {errors.workingHours ? (
            <p role="alert" className="text-sm text-error">
              {errors.workingHours}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            {t('salons.edit.sections.images')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageField
              label={t('salons.edit.fields.logo')}
              value={form.logoUrl}
              onChange={(url) => patch({ logoUrl: url })}
            />
            <ImageField
              label={t('salons.edit.fields.cover')}
              value={form.coverImageUrl}
              onChange={(url) => patch({ coverImageUrl: url })}
            />
          </div>

          {form.galleryImages.length > 0 ? (
            <ul aria-label={t('salons.edit.fields.galleryList')} className="space-y-2">
              {form.galleryImages.map((url, index) => (
                <li key={`${url}-${index}`} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">{url}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('salons.edit.fields.removeGalleryItem', { index: index + 1 })}
                    onClick={() =>
                      patch({ galleryImages: form.galleryImages.filter((_, i) => i !== index) })
                    }
                  >
                    {t('salons.edit.fields.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {form.galleryImages.length >= MAX_GALLERY ? (
            <p className="text-sm text-fg-muted">
              {t('salons.edit.fields.galleryLimit', { max: MAX_GALLERY })}
            </p>
          ) : (
            <ImageField
              label={t('salons.edit.fields.gallery')}
              value={null}
              hint={t('salons.edit.fields.galleryHint')}
              onChange={(url) => {
                if (!url) return;
                patch({ galleryImages: [...form.galleryImages, url].slice(0, MAX_GALLERY) });
              }}
            />
          )}
        </section>

        {formError ? (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
