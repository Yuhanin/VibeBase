import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: cookies => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && (request.nextUrl.pathname.startsWith('/projects') || request.nextUrl.pathname.startsWith('/tasks') || request.nextUrl.pathname.startsWith('/prompts') || request.nextUrl.pathname.startsWith('/knowledge') || request.nextUrl.pathname.startsWith('/github') || request.nextUrl.pathname.startsWith('/ai'))) return NextResponse.redirect(new URL('/login', request.url))
  return response
}
export const config = { matcher: ['/projects/:path*','/tasks/:path*','/prompts/:path*','/knowledge/:path*','/github/:path*','/ai/:path*'] }
