import { Activity, CalendarClock, LayoutDashboard, Moon, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="app-shell">
      <aside className="side-nav">
        <Link className="brand" href="/dashboard/chart" aria-label="COSMIQ dashboard">
          <span>C</span>
          <strong>COSMIQ</strong>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-item is-active" href="/dashboard/chart">
            <LayoutDashboard size={18} />
            <span>Chart</span>
          </Link>
          <span className="nav-item is-disabled">
            <Activity size={18} />
            <span>Transits</span>
          </span>
          <span className="nav-item is-disabled">
            <CalendarClock size={18} />
            <span>Forecast</span>
          </span>
          <span className="nav-item is-disabled">
            <Moon size={18} />
            <span>Moon</span>
          </span>
        </nav>
        <button className="settings-button" type="button" aria-label="Settings" title="Settings">
          <Settings size={18} />
        </button>
      </aside>
      {children}
    </main>
  );
}
