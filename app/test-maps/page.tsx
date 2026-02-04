export default function TestMapsPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold">Test Maps Env</h1>
      <p className="mt-3">
        KEY presente?{" "}
        <span className="font-mono">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "SI ✅" : "NO ❌"}
        </span>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        (Se qui è NO, .env.local non viene letto o non hai riavviato npm run dev)
      </p>
    </main>
  );
}
