import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Must set on both request AND response for proper SSR session propagation
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do not add logic between createServerClient and getUser.
    // A simple mistake could be very hard to debug.
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    const isLoginPath = path === '/login'
    const isFormsPath = path.startsWith('/forms')
    const isRootPath = path === '/'

    const isSuperAdminRoute = path.startsWith('/sa')
    const isUniversityAdminRoute = path.startsWith('/u')
    const isAgentRoute = path.startsWith('/agent')
    const isProtectedRoute = isSuperAdminRoute || isUniversityAdminRoute || isAgentRoute

    // ── Not logged in ──────────────────────────────────────────────────────────
    if (!user) {
        if (isProtectedRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            // IMPORTANT: must use supabaseResponse-derived response to preserve cookies
            const redirectResponse = NextResponse.redirect(url)
            supabaseResponse.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value)
            })
            return redirectResponse
        }
        return supabaseResponse
    }

    // ── Logged in — fetch role ──────────────────────────────────────────────────
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role as string | undefined

    // No profile yet — send to login, not loop
    if (!role) {
        if (isProtectedRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            const redirectResponse = NextResponse.redirect(url)
            supabaseResponse.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value)
            })
            return redirectResponse
        }
        return supabaseResponse
    }

    // ── Role boundary enforcement ─────────────────────────────────────────────
    if (isSuperAdminRoute && role !== 'super_admin') {
        return redirectToDashboard(role, request, supabaseResponse)
    }
    if (isUniversityAdminRoute && role !== 'university_admin') {
        return redirectToDashboard(role, request, supabaseResponse)
    }
    if (isAgentRoute && role !== 'agent') {
        return redirectToDashboard(role, request, supabaseResponse)
    }

    // ── Logged-in users visiting root or login → bounce to their dashboard ────
    if (isRootPath || isLoginPath) {
        return redirectToDashboard(role, request, supabaseResponse)
    }

    return supabaseResponse
}

function redirectToDashboard(role: string, request: NextRequest, supabaseResponse: NextResponse) {
    const url = request.nextUrl.clone()
    if (role === 'super_admin') {
        url.pathname = '/sa/dashboard'
    } else if (role === 'university_admin') {
        url.pathname = '/u/dashboard'
    } else if (role === 'agent') {
        url.pathname = '/agent/dashboard'
    } else {
        url.pathname = '/login'
    }
    const redirectResponse = NextResponse.redirect(url)
    // Forward session cookies to keep the user logged in across the redirect
    supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
