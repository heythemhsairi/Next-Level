import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Race a promise against a timeout. If Supabase is slow/unreachable (e.g. a
 * paused free-tier project), the middleware would otherwise hang until Vercel
 * kills it with MIDDLEWARE_INVOCATION_TIMEOUT (a hard 504). Instead we bail
 * fast and let the caller degrade gracefully.
 */
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Env vars not set yet (e.g. fresh Vercel deploy without secrets).
    // Let the request through so the user sees a helpful page instead of a blank 500.
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");
  const isDashboard = path.startsWith("/dashboard");
  const isPortal = path.startsWith("/portal");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/api/health") ||
    path === "/";

  // Auth check, guarded by a timeout so a slow/paused Supabase can't hang the
  // whole request into a 504. `null` = we couldn't determine the user in time.
  const authResult = await withTimeout(supabase.auth.getUser(), 5000);

  // If Supabase didn't answer in time, fail safe: let auth routes / public
  // assets through (so /login still renders) and bounce everything else there.
  if (authResult === null) {
    if (isAuthRoute || isPublicAsset) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const user = authResult.data.user;

  // Not logged in → only auth route / public assets allowed.
  if (!user && !isAuthRoute && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in: figure out which side of the app this user belongs to.
  if (user) {
    const profileResult = await withTimeout(
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      5000,
    );
    // If the role lookup times out, let the request proceed rather than 504;
    // the page-level guards (requireStaff/requireClient) still enforce access.
    const profile = profileResult?.data ?? null;
    const isClient = profile?.role === "client";
    const home = isClient ? "/portal" : "/dashboard";

    const redirectTo = (pathname: string) => {
      const url = request.nextUrl.clone();
      url.pathname = pathname;
      return NextResponse.redirect(url);
    };

    // Send authenticated users off the login page to their home.
    if (isAuthRoute) return redirectTo(home);
    // Keep each role on its own side of the app.
    if (isClient && isDashboard) return redirectTo("/portal");
    if (!isClient && isPortal) return redirectTo("/dashboard");
  }

  return supabaseResponse;
}
