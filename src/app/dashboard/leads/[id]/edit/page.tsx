import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "../../lead-form";
import type { Lead } from "../../actions";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();
  if (!lead) notFound();

  return <LeadForm mode="edit" lead={lead as Lead} />;
}
