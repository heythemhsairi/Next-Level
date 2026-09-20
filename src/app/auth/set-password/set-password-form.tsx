"use client";

import { useState, useTransition } from "react";
import { setPasswordAction } from "./actions";

export function SetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    start(async () => {
      const result = await setPasswordAction(formData);
      if (result.ok) window.location.assign(result.next);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-white/80">
        New password
        <input name="password" type="password" autoComplete="new-password" required minLength={12}
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-brand" />
      </label>
      <label className="block text-sm font-medium text-white/80">
        Confirm password
        <input name="confirm" type="password" autoComplete="new-password" required minLength={12}
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-brand" />
      </label>
      {error && <p role="alert" className="text-sm text-brand-light">{error}</p>}
      <button type="submit" disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white disabled:opacity-50">
        {pending ? "Saving…" : "Set password and continue"}
      </button>
    </form>
  );
}
