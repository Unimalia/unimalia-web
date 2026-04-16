export const dynamic = "force-dynamic";

import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f6f9fc_100%)]">
          <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[32px] border border-[#e3e9f0] bg-white/94 p-6 shadow-[0_24px_70px_rgba(48,72,111,0.08)] backdrop-blur sm:p-8 lg:p-10">
                <div className="h-3 w-32 rounded-full bg-[#dfe7f0]" />
                <div className="mt-6 h-12 w-3/4 rounded-2xl bg-[#eef3f8]" />
                <div className="mt-4 h-4 w-full rounded-full bg-[#f1f5f9]" />
                <div className="mt-3 h-4 w-5/6 rounded-full bg-[#f1f5f9]" />
                <div className="mt-8 rounded-[28px] border border-[#e3e9f0] bg-white p-6 shadow-sm">
                  <div className="h-10 w-40 rounded-full bg-[#eef3f8]" />
                  <div className="mt-6 space-y-4">
                    <div className="h-12 rounded-2xl bg-[#f6f9fc]" />
                    <div className="h-12 rounded-2xl bg-[#f6f9fc]" />
                    <div className="h-12 rounded-2xl bg-[#f6f9fc]" />
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-[#e3e9f0] bg-[linear-gradient(135deg,#30486f_0%,#5f708a_100%)] p-6 shadow-[0_22px_50px_rgba(48,72,111,0.18)] sm:p-8 lg:p-10">
                <div className="h-3 w-28 rounded-full bg-white/20" />
                <div className="mt-6 h-12 w-2/3 rounded-2xl bg-white/15" />
                <div className="mt-4 h-4 w-full rounded-full bg-white/15" />
                <div className="mt-3 h-4 w-5/6 rounded-full bg-white/15" />
                <div className="mt-8 space-y-4">
                  <div className="h-20 rounded-[24px] bg-white/10" />
                  <div className="h-20 rounded-[24px] bg-white/10" />
                  <div className="h-20 rounded-[24px] bg-white/10" />
                </div>
              </div>
            </div>
          </section>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}