import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PatchBody = {
  ids?: string[];
  markAllAsRead?: boolean;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("owner_notifications")
      .select("id, owner_id, animal_id, type, title, message, read, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Errore recupero notifiche" },
        { status: 500 }
      );
    }

    const unreadCount = (data ?? []).filter((item) => !item.read).length;

    return NextResponse.json({
      notifications: data ?? [],
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/owner/notifications error:", error);

    return NextResponse.json(
      { error: "Errore interno server" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = (await request.json()) as PatchBody;
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    const markAllAsRead = body.markAllAsRead === true;

    if (!markAllAsRead && ids.length === 0) {
      return NextResponse.json(
        { error: "Devi passare ids oppure markAllAsRead=true" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("owner_notifications")
      .update({ read: true })
      .eq("owner_id", user.id)
      .eq("read", false);

    if (!markAllAsRead) {
      query = query.in("id", ids);
    }

    const { data, error } = await query.select(
      "id, owner_id, animal_id, type, title, message, read, created_at"
    );

    if (error) {
      return NextResponse.json(
        { error: "Errore aggiornamento notifiche" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data ?? [],
      updatedCount: data?.length ?? 0,
    });
  } catch (error) {
    console.error("PATCH /api/owner/notifications error:", error);

    return NextResponse.json(
      { error: "Errore interno server" },
      { status: 500 }
    );
  }
}
