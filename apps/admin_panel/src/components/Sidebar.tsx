"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  Calendar,
  MessageSquare,
  FolderTree,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Salonlar", href: "/salons", icon: Store },
  { label: "Kullanıcılar", href: "/users", icon: Users },
  { label: "Randevular", href: "/appointments", icon: Calendar },
  { label: "Yorumlar", href: "/reviews", icon: MessageSquare },
  { label: "Kategoriler", href: "/categories", icon: FolderTree },
  { label: "Ayarlar", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-text-primary">Beauty Salon</h1>
            <p className="text-xs text-text-secondary">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-text-secondary hover:bg-secondary hover:text-primary"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Admin</p>
            <p className="text-xs text-text-secondary">admin@beautysalon.com</p>
          </div>
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="p-1.5 rounded-lg hover:bg-red-50 text-text-hint hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
