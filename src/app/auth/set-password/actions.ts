"use server";

import { createClient } from "@/lib/supabase/server";

export type SetPasswordResult =
  | { ok: true; next: string }
  | { ok: false; error: string };

export async function setPasswordAction(formData: FormData): Promise<SetPasswordResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 12) {
    return { ok: false, error: "Use at least 12 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "This link has expired. Ask an admin for a new one." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (profileError || !profile || profile.status !== "active") {
    return { ok: false, error: "This account cannot be updated. Contact an administrator." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  return { ok: true, next: profile?.role === "client" ? "/portal" : "/dashboard" };
}
