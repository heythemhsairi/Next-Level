"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { convertLeadToClientAction, deleteLeadAction } from "../actions";

export function LeadDetailActions({
  leadId,
  leadName,
  isAdmin,
  convertedClientId,
}: {
  leadId: string;
  leadName: string;
  isAdmin: boolean;
  convertedClientId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("Delete this lead? This action cannot be undone.")) return;
    const fd = new FormData();
    fd.set("id", leadId);
    startTransition(async () => {
      await deleteLeadAction(fd);
    });
  }

  function onConvert() {
    if (
      !confirm(
        `Convert "${leadName}" to a client? This will create a new client and mark the lead as won.`,
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", leadId);
    startTransition(async () => {
      await convertLeadToClientAction(fd);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {convertedClientId ? (
        <Link href={`/dashboard/clients/${convertedClientId}`}>
          <Button variant="outline" size="sm">
            View client
          </Button>
        </Link>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onConvert}
          disabled={pending}
        >
          {pending ? "Working…" : "Convert to client"}
        </Button>
      )}
      <Link href={`/dashboard/leads/${leadId}/edit`}>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </Link>
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-50"
          onClick={onDelete}
          disabled={pending}
        >
          {pending ? "Working…" : "Delete"}
        </Button>
      )}
    </div>
  );
}
