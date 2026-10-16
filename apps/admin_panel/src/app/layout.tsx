import type { Metadata } from "next";
import "./globals.css";
import AdminLayoutShell from "@/components/AdminLayoutShell";
import { ThemeProvider } from "@/providers/ThemeProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AdminLayoutShell>{children}</AdminLayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
