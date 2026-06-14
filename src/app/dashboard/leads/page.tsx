import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LeadsView } from "./leads-view";
import type { Lead } from "./actions";

export default async function LeadsPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return <LeadsView leads={(data ?? []) as Lead[]} />;
}
