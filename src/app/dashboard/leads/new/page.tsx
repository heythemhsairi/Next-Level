import { requireStaff } from "@/lib/auth";
import { LeadForm } from "../lead-form";

export default async function NewLeadPage() {
  await requireStaff();
  return <LeadForm mode="create" />;
}
