import type { Metadata } from "next";
import "./globals.css";
import AdminLayoutShell from "@/components/AdminLayoutShell";

export const metadata: Metadata = {
  title: "Beauty Salon - Admin Panel",
  description: "Beauty Salon yönetim paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </body>
    </html>
  );
}
