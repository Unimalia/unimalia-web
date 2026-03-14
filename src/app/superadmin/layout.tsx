export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { isAdminUser } from "@/lib/adminAccess";

type NavItem = {
  href: string;
  label: string;
  description?: string;
};

const navItems: NavItem[] = [
  {
    href: "/superadmin",
    label: "Dashboard",
    description: "Panoramica area superadmin.",
  },
  {
    href: "/superadmin/professionisti",
    label: "Professionisti",
    description: "Revisione e approvazione professionisti e veterinari.",
  },
  {
    href: "/superadmin/sistema",
    label: "Sistema",
    description: "Feature flag, manutenzione, emergency mode.",
  },
  {
    href: "/superadmin/audit",
    label: "Audit log",
    description: "Storico attività e azioni superadmin.",
  },
];

function isActive(pathname: string, href: string) {
  return href === "/superadmin" ? pathname === href : pathname.startsWith(href);
}

function SideLink({
  href,
  label,
  description,
  pathname,
}: {
  href: string;
  label: string;
  description?: string;
  pathname: string;
}) {
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl px-3 py-3 transition",
        active ? "bg-black text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-black",
      ].join(" ")}
    >
      <div className="text-sm font-semibold">{label}</div>
      {description ? (
        <div className={["mt-1 text-xs leading-relaxed", active ? "text-white/80" : "text-zinc-500"].join(" ")}>
          {description}
        </div>
      ) : null}
    </Link>
  );
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/professionisti/login?next=/superadmin");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  return (
    <>
      <style>
        {`
          body > header {
            display: none !important;
          }

          body > nav {
            display: none !important;
          }

          body > [data-site-header] {
            display: none !important;
          }
        `}
      </style>

      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="container-page flex items-center justify-between gap-3 px-3 py-3 sm:px-0 sm:py-4">
            <div className="min-w-0">
              <div className="text-lg font-bold tracking-tight text-zinc-900">UNIMALIA Superadmin</div>
              <div className="mt-1 text-xs text-zinc-600">Area interna privata di revisione e controllo</div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/superadmin"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
              >
                Dashboard
              </Link>
              <Link
                href="/professionisti/dashboard"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
              >
                Torna al portale
              </Link>
            </div>
          </div>
        </header>

        <div className="container-page grid grid-cols-1 gap-6 px-3 py-6 sm:px-0 sm:py-8 lg:grid-cols-[320px_1fr]">
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              <div className="px-3 py-2 text-xs font-semibold tracking-wide text-zinc-500">MENU SUPERADMIN</div>

              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <SideLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    description={item.description}
                    pathname=""
                  />
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}