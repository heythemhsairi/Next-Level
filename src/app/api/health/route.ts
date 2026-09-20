import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Always run on the server, never cached — each hit must reach Supabase so it
// counts as activity and keeps a free-tier project from auto-pausing.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    // Tiny read. Even if RLS returns no rows, the query still hits Postgres,
    // which is what resets Supabase's inactivity timer.
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) {
      return NextResponse.json(
        { ok: false, db: "error", message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, db: "up", ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
