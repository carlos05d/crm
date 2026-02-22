import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname

    // Public paths that never need guarding (login, forms, static)
    const isLoginPath = path === '/login' || path.startsWith('/(auth)')
    const isFormsPath = path.startsWith('/forms')
    const isRootPath = path === '/'

    const isSuperAdminRoute = path.startsWith('/sa')
    const isUniversityAdminRoute = path.startsWith('/u')
    const isAgentRoute = path.startsWith('/agent')
    const isProtectedRoute = isSuperAdminRoute || isUniversityAdminRoute || isAgentRoute

    // ── Not logged in ────────────────────────────────────────────────────────
    // Allow: login, forms, root (which shows login page)
    if (!user) {
        if (isProtectedRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        // Let them through to root/login/forms
        return supabaseResponse
    }

    // ── Logged in ─────────────────────────────────────────────────────────-─
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role as string | undefined

    // If profile not yet created (first login edge case), skip role redirect
    // to avoid loop — let login action handle it
    if (!role) {
        // Only redirect away from protected routes; let them reach login
        if (isProtectedRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // Enforce strict route<->role boundaries
    if (isSuperAdminRoute && role !== 'super_admin') {
        return redirectToDashboard(role, request.nextUrl)
    }
    if (isUniversityAdminRoute && role !== 'university_admin') {
        return redirectToDashboard(role, request.nextUrl)
    }
    if (isAgentRoute && role !== 'agent') {
        return redirectToDashboard(role, request.nextUrl)
    }

    // Auto-redirect logged-in users away from root & login
    if (isRootPath || isLoginPath) {
        return redirectToDashboard(role, request.nextUrl)
    }

    return supabaseResponse
}

function redirectToDashboard(role: string, url: URL) {
    const redirectUrl = url.clone()
    if (role === 'super_admin') {
        redirectUrl.pathname = '/sa/dashboard'
    } else if (role === 'university_admin') {
        redirectUrl.pathname = '/u/dashboard'
    } else if (role === 'agent') {
        redirectUrl.pathname = '/agent/dashboard'
    } else {
        redirectUrl.pathname = '/login'
    }
    return NextResponse.redirect(redirectUrl)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
