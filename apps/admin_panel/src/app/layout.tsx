import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import { ThemeProvider } from "@/providers/ThemeProvider";
import LocaleProvider from "@/providers/LocaleProvider";
import { readLocalePreferences, serverLocale } from "@/lib/i18n/server";

// AP-001: daha önce `font-family: 'Inter'` bildiriliyordu ama font hiç yüklenmiyordu
// (next/font / @font-face / public'de dosya yok) → panel Segoe UI ile çiziliyordu.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Başlık imzası mobil ile aynı (Nunito w700-800); gövde yoğun tablo için Inter'da kalır.
const nunito = Nunito({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "Beauty Salon - Admin Panel",
  description: "Beauty Salon yönetim paneli",
};

/**
 * İlk boyamadan önce <html> elemanına tema sınıfını uygular (FOUC önleme).
 * ThemeProvider ile aynı localStorage anahtarını kullanır.
 */
const themeInitScript = `(function(){try{
var t=localStorage.getItem('app_theme')||'system';
var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var r=document.documentElement;
r.classList.toggle('dark',d);
r.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;

/**
 * İlk boyamadan önce <html lang> değerini yazar — tema script'iyle aynı desen.
 *
 * Kaynak sırası, `LocaleProvider` ile aynıdır: **localStorage → cookie → 'system'**.
 * localStorage birincil kaynak; cookie yalnız başka bir sekme/tarayıcı temizliği
 * sonrası kalan kopyadır (sunucu SSR'de onu okur, §AP-011 K2). Sunucu `<html lang>`'ı
 * zaten cookie'den yazdığı için script çoğu durumda aynı değeri tekrar onaylar.
 */
const localeInitScript = `(function(){try{
var k='app_locale_mode';
var m=null;
try{m=localStorage.getItem(k);}catch(e){}
if(m!=='tr'&&m!=='en'&&m!=='system'){
m='system';
try{
var p=document.cookie.match(/(?:^|; )app_locale_mode=([^;]*)/);
if(p){var v=decodeURIComponent(p[1]);if(v==='tr'||v==='en'||v==='system'){m=v;}}
}catch(e){}
}
var n=((typeof navigator!=='undefined'&&navigator.language)||'').toLowerCase();
var l=m==='system'?((n==='tr'||n.indexOf('tr-')===0)?'tr':'en'):m;
document.documentElement.lang=l;
}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // AP-011 K2: dil tercihi cookie'den sunucuda okunur → SSR HTML'i doğru dilde
  // üretilir. `cookies()`/`headers()` rotaları dinamik render'a çevirir; ölçüm ve
  // gerekçe plans/admin/AP-011-i18n-language.md §10 K2'de.
  const localePreferences = await readLocalePreferences();
  const initialLocale = serverLocale(localePreferences);

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
      </head>
      <body className={`antialiased ${inter.variable} ${nunito.variable}`}>
        <LocaleProvider
          initialMode={localePreferences.mode}
          initialSystemLocale={localePreferences.systemLocale}
        >
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
