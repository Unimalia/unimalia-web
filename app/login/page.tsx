"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Registrazione ok. Controlla la email (se richiesta la conferma).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg("Accesso effettuato ✅");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setMsg(null);

    if (!email.trim()) {
      setMsg("Scrivi prima la tua email, poi clicca 'Password dimenticata'.");
      return;
    }

    setLoading(true);
    try {
      // In locale ti manda comunque la mail; in produzione useremo il dominio vero.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setMsg("Ok ✅ Se l’email è corretta, riceverai un link per reimpostare la password.");
    } catch (err: any) {
      setMsg(err?.message ?? "Errore nel reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">
        {mode === "login" ? "Accedi" : "Crea account"}
      </h1>

      <p className="mt-3 max-w-2xl text-zinc-700">
        Per pubblicare uno smarrimento e creare l’identità animale serve un account.
      </p>

      <div className="mt-8 max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "login"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "signup"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuo@email.it"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              required={mode !== "login" ? true : true}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-60"
            type="submit"
          >
            {loading ? "Attendi..." : mode === "login" ? "Accedi" : "Crea account"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full rounded-lg border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              disabled={loading}
            >
              Password dimenticata
            </button>
          )}

          {msg && <p className="text-sm text-zinc-700">{msg}</p>}
        </form>
      </div>
    </main>
  );
}
