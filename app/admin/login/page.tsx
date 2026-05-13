import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { hasAdminSession } from "@/lib/admin-auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const params = (await searchParams) ?? {};
  const error = firstValue(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-4 py-8 text-[var(--ink)]">
      <section className="w-full max-w-md rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_18px_60px_rgba(12,26,35,0.10)] sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-blue)] text-[var(--brand-blue)]">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-green)]">
              Admin Access
            </p>
            <h1 className="mt-1 text-3xl font-semibold leading-none text-[var(--ink)]">
              Open Mother's Day stats
            </h1>
          </div>
        </div>

        {error === "invalid-password" ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            Incorrect password.
          </div>
        ) : null}

        <form action="/api/admin/login" className="space-y-4" method="post">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--ink)]" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="h-10 w-full rounded-lg border border-[var(--panel-border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-blue)] focus:ring-3 focus:ring-[rgba(23,81,128,0.18)]"
              id="password"
              name="password"
              type="password"
            />
          </div>

          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(23,81,128,0.22)] transition hover:bg-[var(--brand-blue-strong)]"
            type="submit"
          >
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
