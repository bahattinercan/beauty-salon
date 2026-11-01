'use client';

import { useEffect, useRef, useState } from 'react';
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/shell/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Field, Input, Select, Toggle } from '@/components/ui/Field';
import { cx } from '@/lib/cx';
import { useI18n } from '@/providers/LocaleProvider';
import { LOCALE_STORAGE_KEY, parseLocaleMode, type LocaleMode } from '@/lib/i18n';

/** Dil kartındaki üç seçenek; etiket aktif dile göre `t()` ile basılır. */
const LANGUAGE_OPTIONS: { value: LocaleMode; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.fields.languageSystem' },
  { value: 'tr', labelKey: 'settings.fields.languageTr' },
  { value: 'en', labelKey: 'settings.fields.languageEn' },
];

/**
 * localStorage'daki geçerli dil tercihi (yoksa `null`). Sunucudaki `language`
 * değeri yalnız yerel tercih YOKKEN uygulanır — kullanıcı seçimi ezilmez.
 */
function readStoredLocaleMode(): LocaleMode | null {
  try {
    return parseLocaleMode(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    /* private mode / storage kapalı: yerel tercih yok sayılır */
    return null;
  }
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-fg-muted">{description}</p> : null}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export default function SettingsPage() {
  const { mode, setMode, t } = useI18n();

  // Sunucu dili bir kez, yalnızca yerel tercih yokken uygulanır. Yükleme effect'i
  // tek kez koştuğu için `setMode` ref üzerinden okunur (dil değişimi formu sıfırlamaz).
  const setModeRef = useRef(setMode);
  useEffect(() => {
    setModeRef.current = setMode;
  }, [setMode]);

  // Genel
  const [platformName, setPlatformName] = useState('Beauty Salon');
  const [contactEmail, setContactEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // Güvenlik
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [tokenDuration, setTokenDuration] = useState('30');
  const [rateLimitingEnabled, setRateLimitingEnabled] = useState(true);

  // Bildirimler
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [newSalonNotificationsEnabled, setNewSalonNotificationsEnabled] = useState(true);
  const [newReviewNotificationsEnabled, setNewReviewNotificationsEnabled] = useState(true);

  // Bakım modu
  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  // Metin anahtar olarak tutulur: dil değişince bildirim de çevrilir.
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    messageKey: string;
    detail?: string | null;
  } | null>(null);

  useEffect(() => {
    apiFetch<{ data: Record<string, unknown> }>('/settings')
      .then(({ data }) => {
        setPlatformName(String(data.platformName ?? 'Beauty Salon'));
        setContactEmail(String(data.contactEmail ?? ''));
        setSupportPhone(String(data.supportPhone ?? ''));
        setMaxLoginAttempts(Number(data.maxLoginAttempts ?? 5));
        setTokenDuration(String(data.tokenDuration ?? '30'));
        setRateLimitingEnabled(Boolean(data.rateLimitingEnabled ?? true));
        setEmailNotificationsEnabled(Boolean(data.emailNotificationsEnabled ?? true));
        setNewSalonNotificationsEnabled(Boolean(data.newSalonNotificationsEnabled ?? true));
        setNewReviewNotificationsEnabled(Boolean(data.newReviewNotificationsEnabled ?? true));
        setMaintenanceModeEnabled(Boolean(data.maintenanceModeEnabled ?? false));

        // Sunucu dili yalnız yerel tercih yokken uygulanır (yerel seçim önceliklidir).
        const serverLanguage = parseLocaleMode(
          typeof data.language === 'string' ? data.language : null
        );
        if (serverLanguage && readStoredLocaleMode() === null) setModeRef.current(serverLanguage);
      })
      .catch((err: unknown) => {
        setSaveMessage({
          type: 'error',
          messageKey: 'settings.loadFailed',
          detail: err instanceof Error ? err.message : null,
        });
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          platformName,
          contactEmail,
          supportPhone,
          maxLoginAttempts: Number(maxLoginAttempts),
          tokenDuration,
          rateLimitingEnabled,
          emailNotificationsEnabled,
          newSalonNotificationsEnabled,
          newReviewNotificationsEnabled,
          maintenanceModeEnabled,
          language: mode,
        }),
      });
      setSaveMessage({ type: 'success', messageKey: 'settings.saved' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', messageKey: 'settings.saveFailed' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        actions={
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" aria-hidden />
            {isSaving ? t('settings.saving') : t('settings.save')}
          </Button>
        }
      />

      {saveMessage ? (
        <div
          role="status"
          className={cx(
            'mb-4 flex items-start gap-3 rounded-card border p-4',
            saveMessage.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-error/30 bg-error/10 text-error'
          )}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          )}
          <p className="text-sm font-semibold">{saveMessage.detail ?? t(saveMessage.messageKey)}</p>
        </div>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={t('settings.sections.appearance')}
            description={t('settings.sections.appearanceDescription')}
          />
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-fg-muted">{t('settings.sections.appearanceHint')}</p>
              <ThemeToggle />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t('settings.sections.language')}
            description={t('settings.sections.languageDescription')}
          />
          <CardBody>
            <Field label={t('settings.fields.language')} htmlFor="language">
              <Select
                id="language"
                value={mode}
                onChange={(e) => {
                  const next = parseLocaleMode(e.target.value);
                  if (next) setMode(next);
                }}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('settings.sections.general')} />
          <CardBody>
            <div className="space-y-4">
              <Field label={t('settings.fields.platformName')} htmlFor="platform-name">
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </Field>
              <Field label={t('settings.fields.contactEmail')} htmlFor="contact-email">
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={t('settings.fields.contactEmailPlaceholder')}
                />
              </Field>
              <Field label={t('settings.fields.supportPhone')} htmlFor="support-phone">
                <Input
                  id="support-phone"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder={t('settings.fields.supportPhonePlaceholder')}
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('settings.sections.security')} />
          <CardBody>
            <div className="space-y-4">
              <Field label={t('settings.fields.maxLoginAttempts')} htmlFor="max-attempts">
                <Input
                  id="max-attempts"
                  type="number"
                  min={1}
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                />
              </Field>
              <Field label={t('settings.fields.tokenDuration')} htmlFor="token-duration">
                <Select
                  id="token-duration"
                  value={tokenDuration}
                  onChange={(e) => setTokenDuration(e.target.value)}
                >
                  {['15', '30', '60', '120'].map((v) => (
                    <option key={v} value={v}>
                      {t('settings.fields.tokenDurationOption', { value: v, count: Number(v) })}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="divide-y divide-border">
                <ToggleRow
                  title={t('settings.fields.rateLimiting')}
                  description={t('settings.fields.rateLimitingDescription')}
                  checked={rateLimitingEnabled}
                  onChange={setRateLimitingEnabled}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('settings.sections.notifications')} />
          <CardBody>
            <div className="divide-y divide-border">
              <ToggleRow
                title={t('settings.fields.emailNotifications')}
                description={t('settings.fields.emailNotificationsDescription')}
                checked={emailNotificationsEnabled}
                onChange={setEmailNotificationsEnabled}
              />
              <ToggleRow
                title={t('settings.fields.newSalonNotifications')}
                checked={newSalonNotificationsEnabled}
                onChange={setNewSalonNotificationsEnabled}
              />
              <ToggleRow
                title={t('settings.fields.newReviewNotifications')}
                checked={newReviewNotificationsEnabled}
                onChange={setNewReviewNotificationsEnabled}
              />
            </div>
          </CardBody>
        </Card>

        <Card className={cx(maintenanceModeEnabled && 'border-warning/40 bg-warning/8')}>
          <CardHeader
            title={t('settings.sections.maintenance')}
            description={t('settings.sections.maintenanceDescription')}
          />
          <CardBody>
            <ToggleRow
              title={t('settings.maintenance.active')}
              description={t('settings.maintenance.activeDescription')}
              checked={maintenanceModeEnabled}
              onChange={setMaintenanceModeEnabled}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" aria-hidden />
          {isSaving ? t('settings.saving') : t('settings.saveAll')}
        </Button>
      </div>
    </>
  );
}
