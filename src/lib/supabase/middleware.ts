import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If env vars are missing, just pass through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Public routes that don't require auth
    const publicRoutes = ['/', '/login', '/register'];
    const isPublicRoute = publicRoutes.includes(path);

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If user is logged in and on auth pages, redirect to their dashboard
    // BUT only if we can actually find their profile (prevents redirect loop)
    if (user && (path === '/login' || path === '/register')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Only redirect if profile exists — otherwise let them stay on auth page
      if (profile?.role) {
        const url = request.nextUrl.clone();
        url.pathname = `/${profile.role}`;
        return NextResponse.redirect(url);
      }

      // No profile found — don't redirect, let the page handle it
      return supabaseResponse;
    }

    // Role-based route protection — only if profile exists
    if (user && (path.startsWith('/admin') || path.startsWith('/client') || path.startsWith('/creator'))) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If no profile, let the dashboard layout handle it (it creates the profile)
      if (!profile?.role) {
        return supabaseResponse;
      }

      const requestedRole = path.split('/')[1];

      if (profile.role !== requestedRole) {
        const url = request.nextUrl.clone();
        url.pathname = `/${profile.role}`;
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  } catch (e) {
    // If Supabase connection fails, just pass through
    return supabaseResponse;
  }
}
