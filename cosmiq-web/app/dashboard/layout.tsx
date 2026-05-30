import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="app-shell">
      <DashboardNav />
      {children}
    </main>
  );
}
