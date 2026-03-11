import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalizeMicrochip(value?: string | null) {
  const v = (value ?? '').trim()
  return v.length ? v : null
}

function isValidMicrochip(value: string) {
  return /^\d{15}$/.test(value)
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

    const body = await req.json()

    const animalId = body.animalId as string | undefined
    const name = body.name?.trim()
    const species = body.species?.trim()
    const microchip = normalizeMicrochip(body.microchip)

    if (!animalId) {
      return NextResponse.json({ error: 'animalId mancante' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    }

    if (!species) {
      return NextResponse.json({ error: 'Specie obbligatoria' }, { status: 400 })
    }

    const { data: existingAnimal, error: animalError } = await supabase
      .from('animals')
      .select('id, owner_id')
      .eq('id', animalId)
      .single()

    if (animalError || !existingAnimal) {
      return NextResponse.json({ error: 'Animale non trovato' }, { status: 404 })
    }

    if (existingAnimal.owner_id && existingAnimal.owner_id !== user.id) {
      return NextResponse.json({ error: 'Animale già collegato a un altro proprietario' }, { status: 409 })
    }

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
        return NextResponse.json({ error: 'Microchip già presente su un altro animale' }, { status: 409 })
      }
    }

    const { data: updatedAnimal, error: updateError } = await supabase
      .from('animals')
      .update({
        name,
        species,
        breed: body.breed?.trim() || null,
        color: body.color?.trim() || null,
        size: body.size?.trim() || null,
        birth_date: body.birth_date || null,
        microchip,
        photo_url: body.photo_url || null,
        owner_id: user.id,
        owner_claim_status: 'claimed',
        owner_claimed_at: new Date().toISOString(),
      })
      .eq('id', animalId)
      .select('id')
      .single()

    if (updateError || !updatedAnimal) {
      console.error('[OWNER_CLAIM_ANIMAL]', updateError)
      return NextResponse.json({ error: 'Errore durante il collegamento animale' }, { status: 500 })
    }

    return NextResponse.json({ success: true, animalId: updatedAnimal.id })
  } catch (error) {
    console.error('[OWNER_CLAIM_ANIMAL]', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}