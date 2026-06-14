"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveLoginEmail, isStaffRole, type AnyUserRole } from "@/lib/utils";

export async function signInAction(formData: FormData) {
  // Single field for both team (username) and clients (email).
  const identifier = String(
    formData.get("identifier") ?? formData.get("username") ?? "",
  ).trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "missing_fields" as const };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolveLoginEmail(identifier),
    password,
  });

  if (error || !data.user) {
    return { error: "invalid" as const };
  }

  // Route by role: clients land in their portal, staff in the dashboard.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile?.role ?? "editor") as AnyUserRole;
  redirect(isStaffRole(role) ? "/dashboard" : "/portal");
}
