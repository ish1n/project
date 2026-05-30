"use client";

import { Activity, CalendarClock, LayoutDashboard, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";

const navItems = [
  { href: "/dashboard/chart", label: "Chart", icon: LayoutDashboard },
  { href: "/dashboard/transits", label: "Transits", icon: Activity },
  { href: "/dashboard/forecast", label: "Forecast", icon: CalendarClock },
  { href: "/dashboard/moon", label: "Moon", icon: Moon }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="side-nav">
      <Link className="brand" href="/dashboard/chart" aria-label="COSMIQ dashboard">
        <span>C</span>
        <strong>COSMIQ</strong>
      </Link>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              className={`nav-item ${isActive ? "is-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <LogoutButton />
    </aside>
  );
}
