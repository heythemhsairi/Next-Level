"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function PortalSignOut() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSignOut() {
    start(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={onSignOut} disabled={pending}>
      {pending ? "…" : "Sign out"}
    </Button>
  );
}
