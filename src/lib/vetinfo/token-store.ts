import type { VetinfoTokenSet } from "@/lib/vetinfo/oauth"

type StoredVetinfoTokenSet = VetinfoTokenSet & {
  userId: string
  savedAt: number
}

const tokenStore = new Map<string, StoredVetinfoTokenSet>()

export async function saveVetinfoTokenSet(input: {
  userId: string
  tokenSet: VetinfoTokenSet
}) {
  tokenStore.set(input.userId, {
    userId: input.userId,
    ...input.tokenSet,
    savedAt: Date.now(),
  })
}

export async function getVetinfoTokenSet(userId: string) {
  return tokenStore.get(userId) ?? null
}
