import type { ReactNode } from "react";

export function Section({
  title,
  children,
}: {
  title: string; // H2
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function SubSection({
  title,
  children,
}: {
  title: string; // H3 (solo dentro Section)
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}