import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalNav } from "./portal-nav";
import { PortalSignOut } from "./portal-sign-out";
import { BrandLogo } from "@/components/brand-logo";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireClient();

  // The client's company name (for the header greeting).
  let clientName: string | null = null;
  if (session.client_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("name")
      .eq("id", session.client_id)
      .single();
    clientName = data?.name ?? null;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo width={120} />
            <span className="hidden h-5 w-px bg-white/10 sm:block" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45 sm:inline">
              Client Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink/70 sm:inline">
              {clientName ?? session.full_name ?? session.username}
            </span>
            <PortalSignOut />
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <PortalNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
