import "server-only";

export async function getCurrentUserEmailOrThrow(): Promise<string> {
  // TODO: collega al tuo sistema auth reale (NextAuth/Clerk/custom)
  // Per adesso, fai fallire in modo chiaro così non va in prod per sbaglio
  throw new Error("AUTH_NOT_IMPLEMENTED: implement getCurrentUserEmailOrThrow()");
}