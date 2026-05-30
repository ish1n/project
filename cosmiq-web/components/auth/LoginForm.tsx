"use client";

import { LockKeyhole, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("jatin@cosmiq.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    setIsLoading(false);
    if (!response.ok) {
      setError("Invalid email or password.");
      return;
    }

    router.replace(searchParams.get("next") || "/dashboard/chart");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-card panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Secure workspace</p>
            <h1>COSMIQ access</h1>
          </div>
          <ShieldCheck size={22} />
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>
              <LogIn size={16} />
              Email
            </span>
            <input
              required
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field">
            <span>
              <LockKeyhole size={16} />
              Password
            </span>
            <input
              required
              autoComplete="current-password"
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={18} /> : <LogIn size={18} />}
            Sign in
          </button>

          {error ? <p className="alert">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
