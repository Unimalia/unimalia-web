export function ProfessionistiBrand() {
  return (
    <h1 className="relative text-2xl font-bold tracking-tight">
      <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-lime-500 bg-clip-text text-transparent">
        UNIMALIA
      </span>

      {/* Swoosh sotto */}
      <span className="absolute left-0 right-0 -bottom-3 flex justify-center">
        <span className="h-2 w-2/3 rounded-full bg-gradient-to-r from-yellow-400 via-lime-400 to-teal-500 blur-[0.3px]" />
      </span>
    </h1>
  );
}