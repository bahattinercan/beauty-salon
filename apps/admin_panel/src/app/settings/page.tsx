'use client';

import { useEffect, useState } from 'react';
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/shell/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Field, Input, Select, Toggle } from '@/components/ui/Field';
import { cx } from '@/lib/cx';

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
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      })
      .catch((err: unknown) => {
        setSaveMessage({
          type: 'error',
          message: err instanceof Error ? err.message : 'Ayarlar yüklenemedi',
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
        }),
      });
      setSaveMessage({ type: 'success', message: 'Ayarlar başarıyla kaydedildi.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', message: 'Ayarlar kaydedilirken bir hata oluştu.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Ayarlar"
        subtitle="Platform, güvenlik ve bildirim tercihleri"
        actions={
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" aria-hidden />
            {isSaving ? 'Kaydediliyor…' : 'Kaydet'}
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
          <p className="text-sm font-semibold">{saveMessage.message}</p>
        </div>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Görünüm"
            description="Tema tercihi bu tarayıcıda saklanır; sunucu ayarlarına kaydedilmez."
          />
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-fg-muted">Light / Dark / Sistem — üst barda da erişilebilir.</p>
              <ThemeToggle />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Genel Ayarlar" />
          <CardBody>
            <div className="space-y-4">
              <Field label="Platform adı" htmlFor="platform-name">
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </Field>
              <Field label="İletişim e-postası" htmlFor="contact-email">
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="destek@beautysalon.com"
                />
              </Field>
              <Field label="Destek telefonu" htmlFor="support-phone">
                <Input
                  id="support-phone"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+90 212 000 00 00"
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Güvenlik Ayarları" />
          <CardBody>
            <div className="space-y-4">
              <Field label="Maksimum giriş denemesi" htmlFor="max-attempts">
                <Input
                  id="max-attempts"
                  type="number"
                  min={1}
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                />
              </Field>
              <Field label="Token süresi (dakika)" htmlFor="token-duration">
                <Select
                  id="token-duration"
                  value={tokenDuration}
                  onChange={(e) => setTokenDuration(e.target.value)}
                >
                  {['15', '30', '60', '120'].map((v) => (
                    <option key={v} value={v}>
                      {v} dakika
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="divide-y divide-border">
                <ToggleRow
                  title="Rate limiting"
                  description="Aşırı isteklerde bulunan istemcileri sınırla."
                  checked={rateLimitingEnabled}
                  onChange={setRateLimitingEnabled}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Bildirim Ayarları" />
          <CardBody>
            <div className="divide-y divide-border">
              <ToggleRow
                title="E-posta bildirimleri"
                description="Panel bildirimleri e-posta ile gönderilsin."
                checked={emailNotificationsEnabled}
                onChange={setEmailNotificationsEnabled}
              />
              <ToggleRow
                title="Yeni salon başvurusu"
                checked={newSalonNotificationsEnabled}
                onChange={setNewSalonNotificationsEnabled}
              />
              <ToggleRow
                title="Yeni yorum"
                checked={newReviewNotificationsEnabled}
                onChange={setNewReviewNotificationsEnabled}
              />
            </div>
          </CardBody>
        </Card>

        <Card className={cx(maintenanceModeEnabled && 'border-warning/40 bg-warning/8')}>
          <CardHeader
            title="Bakım Modu"
            description="Açıkken müşteri ve salon uygulamaları bakım sayfası görür."
          />
          <CardBody>
            <ToggleRow
              title="Bakım modu aktif"
              description="Yalnızca panel erişimi açık kalır."
              checked={maintenanceModeEnabled}
              onChange={setMaintenanceModeEnabled}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" aria-hidden />
          {isSaving ? 'Kaydediliyor…' : 'Ayarları kaydet'}
        </Button>
      </div>
    </>
  );
}
