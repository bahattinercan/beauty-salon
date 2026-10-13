'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import {
  Settings,
  Lock,
  Bell,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function SettingsPage() {
  // General Settings State
  const [platformName, setPlatformName] = useState('Beauty Salon');
  const [contactEmail, setContactEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // Security Settings State
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [tokenDuration, setTokenDuration] = useState('30');
  const [rateLimitingEnabled, setRateLimitingEnabled] = useState(true);

  // Notification Settings State
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [newSalonNotificationsEnabled, setNewSalonNotificationsEnabled] = useState(true);
  const [newReviewNotificationsEnabled, setNewReviewNotificationsEnabled] = useState(true);

  // Maintenance Mode State
  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Ayarları API'den yükle
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

      setSaveMessage({
        type: 'success',
        message: 'Ayarlar başarıyla kaydedildi.',
      });

      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({
        type: 'error',
        message: 'Ayarlar kaydedilirken bir hata oluştu.',
      });

      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Platform ayarlarını yönetin ve güvenlik seçeneklerini yapılandırın.
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              saveMessage.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {saveMessage.message}
          </div>
        )}

        {/* Section 1: Genel Ayarlar */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Genel Ayarlar</h2>
          </div>

          <div className="space-y-4">
            {/* Platform Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Platform Adı
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-opacity-20"
                style={{ '--tw-ring-color': 'rgb(183, 110, 121)' } as CSSProperties}
              />
            </div>

            {/* İletişim E-postası */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                İletişim E-postası
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="iletisim@beautyalon.com"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-opacity-20"
                style={{ '--tw-ring-color': 'rgb(183, 110, 121)' } as CSSProperties}
              />
            </div>

            {/* Destek Telefonu */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Destek Telefonu
              </label>
              <input
                type="tel"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+90 (555) 123-4567"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-opacity-20"
                style={{ '--tw-ring-color': 'rgb(183, 110, 121)' } as CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Güvenlik Ayarları */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Güvenlik Ayarları</h2>
          </div>

          <div className="space-y-4">
            {/* Maksimum Giriş Denemesi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maksimum Giriş Denemesi
              </label>
              <input
                type="number"
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-opacity-20"
                style={{ '--tw-ring-color': 'rgb(183, 110, 121)' } as CSSProperties}
              />
              <p className="mt-1 text-xs text-gray-500">
                Bu kadar başarısız denemeden sonra hesap kilitlenecektir.
              </p>
            </div>

            {/* Token Süresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Token Süresi
              </label>
              <select
                value={tokenDuration}
                onChange={(e) => setTokenDuration(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-opacity-20"
                style={{ '--tw-ring-color': 'rgb(183, 110, 121)' } as CSSProperties}
              >
                <option value="15">15 Dakika</option>
                <option value="30">30 Dakika</option>
                <option value="60">1 Saat</option>
              </select>
            </div>

            {/* Rate Limiting */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Rate Limiting</p>
                <p className="mt-1 text-xs text-gray-500">
                  Aşırı istekleri sınırla ve kötüye kullanımı önle.
                </p>
              </div>
              <ToggleSwitch
                enabled={rateLimitingEnabled}
                onChange={setRateLimitingEnabled}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bildirim Ayarları */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Bildirim Ayarları</h2>
          </div>

          <div className="space-y-4">
            {/* E-posta Bildirimleri */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">E-posta Bildirimleri</p>
                <p className="mt-1 text-xs text-gray-500">
                  Önemli olaylar için e-posta bildirimleri alın.
                </p>
              </div>
              <ToggleSwitch
                enabled={emailNotificationsEnabled}
                onChange={setEmailNotificationsEnabled}
              />
            </div>

            {/* Yeni Salon Bildirimi */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Yeni Salon Bildirimi</p>
                <p className="mt-1 text-xs text-gray-500">
                  Platformda yeni salon eklendiğinde bildirim alın.
                </p>
              </div>
              <ToggleSwitch
                enabled={newSalonNotificationsEnabled}
                onChange={setNewSalonNotificationsEnabled}
              />
            </div>

            {/* Yeni Yorum Bildirimi */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Yeni Yorum Bildirimi</p>
                <p className="mt-1 text-xs text-gray-500">
                  Salon yorumlarında yeni yorumlar için bildirim alın.
                </p>
              </div>
              <ToggleSwitch
                enabled={newReviewNotificationsEnabled}
                onChange={setNewReviewNotificationsEnabled}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Bakım Modu */}
        <div className="mb-8 rounded-lg border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h2 className="text-xl font-semibold text-gray-900">Bakım Modu</h2>
          </div>

          <p className="mb-4 text-sm text-gray-700">
            Bakım modu etkinleştirildiğinde, platform tüm kullanıcılara bakım altında olduğunu
            bildiren bir sayfa gösterecektir. Bu sırada yalnızca yöneticiler platforma erişebilecektir.
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Bakım Modunu Etkinleştir</p>
              {maintenanceModeEnabled && (
                <p className="mt-1 text-xs font-medium text-warning">
                  ⚠️ Platform şu anda bakım modunda
                </p>
              )}
            </div>
            <ToggleSwitch
              enabled={maintenanceModeEnabled}
              onChange={setMaintenanceModeEnabled}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-dark px-6 py-2 font-medium text-white transition-colors duration-200 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        enabled ? 'bg-green-500' : 'bg-gray-300'
      }`}
      style={{
        backgroundColor: enabled ? '#7CB69D' : '#D1D5DB',
        '--tw-ring-color': 'rgb(183, 110, 121)',
      } as CSSProperties}
      aria-pressed={enabled}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
