import Link from "next/link";
import { Activity, ArrowLeft, CalendarDays, Gauge, LogOut } from "lucide-react";

import { requireAdminSession } from "@/lib/admin-auth";
import { getGenerationStats } from "@/lib/generations";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminPage() {
  await requireAdminSession();

  let stats: Awaited<ReturnType<typeof getGenerationStats>> | null = null;
  let errorMessage: string | null = null;

  try {
    stats = await getGenerationStats();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load DP generation stats.";
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-6 text-[var(--ink)] md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_18px_60px_rgba(12,26,35,0.10)] md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-green)]">
                Admin Stats
              </p>
              <h1 className="mt-2 text-4xl font-semibold leading-none text-[var(--ink)]">
                Mother's Day DP generation counts
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">
                Count-only campaign reporting. The app stores timestamps and the
                frame ID, not uploaded photos or personal data.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--panel-border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--soft-blue)]"
                href="/"
              >
                <ArrowLeft className="size-4" />
                Back to Maker
              </Link>
              <form action="/api/admin/logout" method="post">
                <button
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--panel-border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--soft-blue)]"
                  type="submit"
                >
                  <LogOut className="size-4" />
                  Log Out
                </button>
              </form>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-900">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--panel-border)] bg-white p-5 shadow-[0_18px_60px_rgba(12,26,35,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--muted-ink)]">
                  All-time generated DPs
                </p>
                <p className="mt-3 text-5xl font-semibold text-[var(--ink)]">
                  {stats?.totalGenerations ?? "-"}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--soft-green)] text-[var(--brand-green)]">
                <Gauge className="size-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--panel-border)] bg-white p-5 shadow-[0_18px_60px_rgba(12,26,35,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--muted-ink)]">
                  Generated today
                </p>
                <p className="mt-3 text-5xl font-semibold text-[var(--ink)]">
                  {stats?.todayCount ?? "-"}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--soft-blue)] text-[var(--brand-blue)]">
                <CalendarDays className="size-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_18px_60px_rgba(12,26,35,0.10)] md:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Recent events
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                Latest generation log
              </h2>
            </div>
            <Activity className="size-5 text-[var(--brand-blue)]" />
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--panel-border)] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--soft-blue)] text-[var(--ink)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Generated At</th>
                  <th className="px-4 py-3 font-semibold">Frame ID</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentEvents.length ? (
                  stats.recentEvents.map((event) => (
                    <tr
                      className="border-t border-[var(--panel-border)]"
                      key={event.id}
                    >
                      <td className="px-4 py-3 text-[var(--ink)]">
                        {formatDate(event.generatedAt)}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-ink)]">
                        {event.frameId}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-[var(--muted-ink)]"
                      colSpan={2}
                    >
                      No generation events have been logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
