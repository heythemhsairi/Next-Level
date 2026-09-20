import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-2 p-6 shadow-2xl sm:p-8">
        <BrandLogo width={146} />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-brand-light">Client Portal</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">Set your password</h1>
        {user && !error ? (
          <>
            <p className="mt-2 text-sm text-white/60">Choose a password for {user.email} to access your portal.</p>
            <SetPasswordForm />
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-white/60">
              This link is invalid or expired. Ask your Next Level contact for a fresh access link.
            </p>
            <a href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-light hover:underline">Back to sign in</a>
          </>
        )}
      </section>
    </main>
  );
}
