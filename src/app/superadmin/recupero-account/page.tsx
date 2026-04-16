import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  phone: string | null;
  is_archived: boolean | null;
  is_deleted: boolean | null;
  archived_at: string | null;
};

type ProfessionalRow = {
  id: string;
  owner_id: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
  approved: boolean | null;
  is_vet: boolean | null;
  is_archived: boolean | null;
  is_deleted: boolean | null;
  archived_at: string | null;
};

type AuthListUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-zinc-200 bg-zinc-100 text-zinc-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("it-IT");
}

function displayProfileName(profile: ProfileRow) {
  const full =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.full_name ||
    profile.id;

  return full;
}

function displayProfessionalName(pro: ProfessionalRow) {
  return (
    pro.display_name ||
    [pro.first_name, pro.last_name].filter(Boolean).join(" ").trim() ||
    pro.business_name ||
    pro.email ||
    pro.id
  );
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isLegacyArchivedEmail(email: string | null | undefined) {
  const raw = String(email || "").trim().toLowerCase();
  return (
    raw.endsWith("@unimalia.local") &&
    (raw.startsWith("archived+") || raw.startsWith("deleted+"))
  );
}

async function listAllAuthUsers() {
  const admin = supabaseAdmin();
  const allUsers: AuthListUser[] = [];
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message || "Errore lettura utenti Auth");
    }

    const users = ((data?.users ?? []) as unknown[]) as AuthListUser[];
    allUsers.push(...users);

    if (users.length < perPage) break;
    page += 1;

    if (page > 20) break;
  }

  return allUsers;
}

export default async function SuperAdminRecuperoAccountPage() {
  const admin = supabaseAdmin();

  const [{ data: profilesData, error: profilesError }, { data: professionalsData, error: professionalsError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, first_name, last_name, city, phone, is_archived, is_deleted, archived_at")
        .eq("is_archived", true)
        .eq("is_deleted", false)
        .order("archived_at", { ascending: false }),
      admin
        .from("professionals")
        .select("id, owner_id, display_name, first_name, last_name, business_name, email, approved, is_vet, is_archived, is_deleted, archived_at")
        .eq("is_archived", true)
        .eq("is_deleted", false)
        .order("archived_at", { ascending: false }),
    ]);

  const archivedProfiles = ((profilesData ?? []) as unknown[]) as ProfileRow[];
  const archivedProfessionals = ((professionalsData ?? []) as unknown[]) as ProfessionalRow[];

  let authUsers: AuthListUser[] = [];
  let authUsersError = "";

  try {
    authUsers = await listAllAuthUsers();
  } catch (err: unknown) {
    authUsersError = err instanceof Error ? err.message : "Errore lettura utenti Auth";
  }

  const authUserById = new Map<string, AuthListUser>();
  for (const user of authUsers) {
    authUserById.set(user.id, user);
  }

  const archivedProfessionalCountByOwner = archivedProfessionals.reduce<Record<string, number>>(
    (acc, row) => {
      const ownerId = String(row.owner_id || "").trim();
      if (!ownerId) return acc;
      acc[ownerId] = (acc[ownerId] || 0) + 1;
      return acc;
    },
    {}
  );

  const legacyArchivedAuthUsers = authUsers.filter((user) => {
    const currentEmail = readString(user.email);
    const originalEmail = readString(user.user_metadata?.original_email_archived_from);
    const accountDisabled = user.app_metadata?.account_disabled === true;
    const profile = archivedProfiles.find((row) => row.id === user.id);

    if (profile) return false;

    return (
      accountDisabled === true ||
      isLegacyArchivedEmail(currentEmail) ||
      !!originalEmail
    );
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">Recupero account</Badge>
            <Badge tone="warning">Area amministrativa</Badge>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Ripristino account archiviati
          </h1>

          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Da qui puoi recuperare account disattivati e vecchi utenti finiti nel precedente
            archivio Auth. Il ripristino riabilita l’accesso account; i profili professionali
            collegati tornano attivi ma restano non approvati finché non vengono nuovamente
            verificati.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/superadmin"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Torna alla dashboard
            </Link>

            <Link
              href="/superadmin/professionisti"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Vai ai professionisti
            </Link>
          </div>

          {profilesError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Errore caricamento profili archiviati: {profilesError.message}
            </div>
          ) : null}

          {professionalsError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Errore caricamento professionisti archiviati: {professionalsError.message}
            </div>
          ) : null}

          {authUsersError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Errore caricamento utenti Auth: {authUsersError}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-500">Profili owner archiviati</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
            {archivedProfiles.length}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Account archiviati nel nuovo flusso applicativo.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-500">Profili professionali archiviati</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
            {archivedProfessionals.length}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Schede professionali collegate ad account disattivati.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-500">Vecchi utenti Auth archiviati</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
            {legacyArchivedAuthUsers.length}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Utenti del vecchio archivio con email cambiata o flag di disattivazione lato Auth.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b bg-zinc-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Account archiviati (nuovo flusso)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Ripristina l’account owner e gli eventuali profili professionali collegati.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse">
            <thead className="border-b bg-zinc-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Email Auth</th>
                <th className="px-4 py-3">Città</th>
                <th className="px-4 py-3">Telefono</th>
                <th className="px-4 py-3">Archiviato il</th>
                <th className="px-4 py-3">Profili professionali</th>
                <th className="px-4 py-3">Azione</th>
              </tr>
            </thead>

            <tbody>
              {archivedProfiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Nessun account archiviato nel nuovo flusso.
                  </td>
                </tr>
              ) : (
                archivedProfiles.map((profile) => {
                  const authUser = authUserById.get(profile.id);
                  const authEmail = readString(authUser?.email) || "—";
                  const linkedProCount = archivedProfessionalCountByOwner[profile.id] || 0;

                  return (
                    <tr key={profile.id} className="border-t align-top">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-zinc-900">
                          {displayProfileName(profile)}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">{profile.id}</div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">{authEmail}</td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {profile.city || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {profile.phone || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {formatDateTime(profile.archived_at)}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {linkedProCount > 0 ? (
                          <Badge tone="warning">{linkedProCount} archiviati</Badge>
                        ) : (
                          <Badge>Nessuno</Badge>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <form action="/api/superadmin/accounts/restore" method="post">
                          <input type="hidden" name="userId" value={profile.id} />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value="/superadmin/recupero-account"
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                          >
                            Ripristina account
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b bg-zinc-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Vecchi utenti nel vecchio archivio Auth</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Utenti con email storicizzata o flag di disattivazione lato Auth precedenti al nuovo flusso.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse">
            <thead className="border-b bg-zinc-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Utente Auth</th>
                <th className="px-4 py-3">Email attuale</th>
                <th className="px-4 py-3">Email originale</th>
                <th className="px-4 py-3">Flag Auth</th>
                <th className="px-4 py-3">Collegamento profilo</th>
                <th className="px-4 py-3">Azione</th>
              </tr>
            </thead>

            <tbody>
              {legacyArchivedAuthUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Nessun utente legacy da recuperare.
                  </td>
                </tr>
              ) : (
                legacyArchivedAuthUsers.map((user) => {
                  const originalEmail = readString(
                    user.user_metadata?.original_email_archived_from
                  );
                  const currentEmail = readString(user.email);
                  const linkedProfile = archivedProfiles.find((row) => row.id === user.id);

                  return (
                    <tr key={user.id} className="border-t align-top">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-zinc-900">{user.id}</div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {currentEmail || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {originalEmail || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {user.app_metadata?.account_disabled === true ? (
                            <Badge tone="warning">account_disabled</Badge>
                          ) : null}
                          {isLegacyArchivedEmail(currentEmail) ? (
                            <Badge tone="info">email legacy archiviata</Badge>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {linkedProfile ? "Presente" : "Nessun profilo archiviato nel nuovo flusso"}
                      </td>

                      <td className="px-4 py-4">
                        <form action="/api/superadmin/accounts/restore" method="post">
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value="/superadmin/recupero-account"
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                          >
                            Ripristina utente
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b bg-zinc-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Profili professionali archiviati</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Vista rapida delle schede professionali oggi archiviate e collegate agli account.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse">
            <thead className="border-b bg-zinc-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Profilo professionale</th>
                <th className="px-4 py-3">Owner/Auth</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Stato accesso</th>
                <th className="px-4 py-3">Archiviato il</th>
                <th className="px-4 py-3">Dettaglio</th>
              </tr>
            </thead>

            <tbody>
              {archivedProfessionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                    Nessun profilo professionale archiviato.
                  </td>
                </tr>
              ) : (
                archivedProfessionals.map((pro) => (
                  <tr key={pro.id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-zinc-900">
                        {displayProfessionalName(pro)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{pro.id}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-600">
                      {pro.owner_id || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {pro.is_vet === true ? (
                        <Badge tone="info">Veterinario</Badge>
                      ) : (
                        <Badge>Professionista</Badge>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {pro.approved === true ? (
                        <Badge tone="success">Approvato</Badge>
                      ) : (
                        <Badge tone="warning">Non approvato</Badge>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-600">
                      {formatDateTime(pro.archived_at)}
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/superadmin/professionisti/${pro.id}`}
                        className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                      >
                        Apri dettaglio
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}