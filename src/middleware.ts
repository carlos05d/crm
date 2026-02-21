import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // 1. Run the Supabase session update to persist auth state
    const response = await updateSession(request)

    const url = request.nextUrl

    // Get hostname of request (e.g. harvard.platform.com, platform.com, localhost:3000)
    let hostname = request.headers
        .get('host')!
        .replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)

    // Extract the subdomain (remove root domain)
    // Example: harvard.platform.com -> harvard
    const currentHost =
        process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
            ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
            : hostname.replace(`.localhost:3000`, '')

    const searchParams = request.nextUrl.searchParams.toString()
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''
        }`

    // 2. Rewrite for app routes (the global dashboard for Agents/Admins)
    if (currentHost === 'app') {
        return NextResponse.rewrite(new URL(`/app${path === '/' ? '' : path}`, request.url))
    }

    // 3. Rewrite for subdomains (tenant public pages like forms)
    // If the host is not the root domain and isn't 'app'
    if (
        hostname !== 'localhost:3000' &&
        hostname !== process.env.NEXT_PUBLIC_ROOT_DOMAIN &&
        currentHost !== 'app'
    ) {
        return NextResponse.rewrite(new URL(`/${currentHost}${path}`, request.url))
    }

    // 4. Root domain routes (Marketing page / Login)
    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
