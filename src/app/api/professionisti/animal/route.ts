import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AnimalPayload = {
  name: string
  species: string
  breed?: string | null
  color?: string | null
  size?: string | null
  birth_date?: string | null
  microchip?: string | null
  photo_url?: string | null
  sex?: string | null
}

function normalizeMicrochip(value?: string | null) {
  const v = (value ?? '').trim()
  return v.length ? v : null
}

function isValidMicrochip(value: string) {
  return /^\d{15}$/.test(value)
}

async function getProfessionalOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from('professional_profiles')
    .select('org_id')
    .eq('user_id', userId)
    .single()

  if (error || !profile?.org_id) {
    return null
  }

  return profile.org_id as string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const orgId = await getProfessionalOrgId(supabase, user.id)

    if (!orgId) {
      return NextResponse.json({ error: 'Profilo professionista non valido' }, { status: 403 })
    }

    const animalId = req.nextUrl.searchParams.get('animalId')

    if (!animalId) {
      return NextResponse.json({ error: 'animalId mancante' }, { status: 400 })
    }

    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select(`
        id,
        name,
        species,
        breed,
        color,
        size,
        sex,
        birth_date,
        microchip,
        unimalia_code,
        photo_url,
        owner_id,
        owner_claim_status,
        owner_claimed_at,
        created_by_role,
        created_by_org_id,
        origin_org_id,
        microchip_verified_by_label
      `)
      .eq('id', animalId)
      .single()

    if (animalError || !animal) {
      return NextResponse.json({ error: 'Animale non trovato' }, { status: 404 })
    }

    const { data: grant } = await supabase
      .from('animal_access_grants')
      .select('id')
      .eq('animal_id', animalId)
      .eq('grantee_id', orgId)
      .eq('status', 'active')
      .maybeSingle()

    const canAccess =
      !!grant ||
      animal.created_by_org_id === orgId ||
      animal.origin_org_id === orgId

    if (!canAccess) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    return NextResponse.json({ animal })
  } catch (error) {
    console.error('[PROF_ANIMAL_GET]', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const orgId = await getProfessionalOrgId(supabase, user.id)

    if (!orgId) {
      return NextResponse.json({ error: 'Profilo professionista non valido' }, { status: 403 })
    }

    const body = (await req.json()) as AnimalPayload

    const name = body.name?.trim()
    const species = body.species?.trim()
    const microchip = normalizeMicrochip(body.microchip)

    if (!name) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    }

    if (!species) {
      return NextResponse.json({ error: 'Specie obbligatoria' }, { status: 400 })
    }

    if (microchip && !isValidMicrochip(microchip)) {
      return NextResponse.json({ error: 'Microchip non valido: servono 15 cifre' }, { status: 400 })
    }

    if (microchip) {
      const { data: existingChip } = await supabase
        .from('animals')
        .select('id')
        .eq('microchip', microchip)
        .maybeSingle()

      if (existingChip?.id) {
        return NextResponse.json(
          { error: 'Esiste già un animale con questo microchip', existingAnimalId: existingChip.id },
          { status: 409 }
        )
      }
    }

    const insertPayload = {
      name,
      species,
      breed: body.breed?.trim() || null,
      color: body.color?.trim() || null,
      size: body.size?.trim() || null,
      sex: body.sex?.trim() || null,
      birth_date: body.birth_date || null,
      microchip,
      photo_url: body.photo_url || null,
      owner_id: null,
      created_by_role: 'professional',
      created_by_org_id: orgId,
      origin_org_id: orgId,
      owner_claim_status: 'pending',
    }

    const { data: created, error: createError } = await supabase
      .from('animals')
      .insert(insertPayload)
      .select(`
        id,
        name,
        species,
        breed,
        color,
        size,
        sex,
        birth_date,
        microchip,
        unimalia_code,
        photo_url,
        owner_id,
        owner_claim_status,
        owner_claimed_at,
        created_by_role,
        created_by_org_id,
        origin_org_id,
        microchip_verified_by_label
      `)
      .single()

    if (createError) {
      console.error('[PROF_ANIMAL_POST]', createError)
      return NextResponse.json({ error: 'Errore creazione animale' }, { status: 500 })
    }

    return NextResponse.json({ animal: created }, { status: 201 })
  } catch (error) {
    console.error('[PROF_ANIMAL_POST]', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const orgId = await getProfessionalOrgId(supabase, user.id)

    if (!orgId) {
      return NextResponse.json({ error: 'Profilo professionista non valido' }, { status: 403 })
    }

    const body = await req.json()
    const animalId = body.animalId as string | undefined

    if (!animalId) {
      return NextResponse.json({ error: 'animalId mancante' }, { status: 400 })
    }

    const { data: existingAnimal, error: animalError } = await supabase
      .from('animals')
      .select('id, created_by_org_id, origin_org_id, microchip')
      .eq('id', animalId)
      .single()

    if (animalError || !existingAnimal) {
      return NextResponse.json({ error: 'Animale non trovato' }, { status: 404 })
    }

    const canAccess =
      existingAnimal.created_by_org_id === orgId ||
      existingAnimal.origin_org_id === orgId

    if (!canAccess) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const microchip = normalizeMicrochip(body.microchip)

    if (microchip && !isValidMicrochip(microchip)) {
      return NextResponse.json({ error: 'Microchip non valido: servono 15 cifre' }, { status: 400 })
    }

    if (microchip) {
      const { data: duplicateChip } = await supabase
        .from('animals')
        .select('id')
        .eq('microchip', microchip)
        .neq('id', animalId)
        .maybeSingle()

      if (duplicateChip?.id) {
        return NextResponse.json(
          { error: 'Microchip già associato a un altro animale', existingAnimalId: duplicateChip.id },
          { status: 409 }
        )
      }
    }

    const patchPayload = {
      name: body.name?.trim() || null,
      species: body.species?.trim() || null,
      breed: body.breed?.trim() || null,
      color: body.color?.trim() || null,
      size: body.size?.trim() || null,
      sex: body.sex?.trim() || null,
      birth_date: body.birth_date || null,
      microchip,
      photo_url: body.photo_url || null,
    }

    const { data: updated, error: updateError } = await supabase
      .from('animals')
      .update(patchPayload)
      .eq('id', animalId)
      .select(`
        id,
        name,
        species,
        breed,
        color,
        size,
        sex,
        birth_date,
        microchip,
        unimalia_code,
        photo_url,
        owner_id,
        owner_claim_status,
        owner_claimed_at,
        created_by_role,
        created_by_org_id,
        origin_org_id,
        microchip_verified_by_label
      `)
      .single()

    if (updateError) {
      console.error('[PROF_ANIMAL_PATCH]', updateError)
      return NextResponse.json({ error: 'Errore aggiornamento animale' }, { status: 500 })
    }

    return NextResponse.json({ animal: updated })
  } catch (error) {
    console.error('[PROF_ANIMAL_PATCH]', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}