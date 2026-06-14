"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "./actions";

export function AccountForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    start(async () => {
      const res = await changePasswordAction(formData);
      if (res.ok) {
        setDone(true);
        form.reset();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form className="max-w-sm space-y-3" onSubmit={onSubmit}>
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
          New password
        </label>
        <Input name="password" type="password" minLength={8} required />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
          Confirm password
        </label>
        <Input name="confirm" type="password" minLength={8} required />
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {done && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Password updated.
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
