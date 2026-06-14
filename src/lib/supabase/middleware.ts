import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");
  const isDashboard = path.startsWith("/dashboard");
  const isPortal = path.startsWith("/portal");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path === "/";

  // Not logged in → only auth route / public assets allowed.
  if (!user && !isAuthRoute && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in: figure out which side of the app this user belongs to.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
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
