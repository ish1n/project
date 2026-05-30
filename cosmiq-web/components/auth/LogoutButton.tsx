"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="settings-button"
      type="button"
      aria-label="Sign out"
      title="Sign out"
      disabled={isLoading}
      onClick={logout}
    >
      <LogOut size={18} />
    </button>
  );
}
