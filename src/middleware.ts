import { NextRequest, NextResponse } from 'next/server';
import { i18n } from './i18n';
import Negotiator from 'negotiator';
import { match } from '@formatjs/intl-localematcher';

function getLocale(request: NextRequest) {
  const headers = mapHeadersToObject(request.headers);
  const languages = new Negotiator({
    headers
  }).languages();

  return match(languages, i18n.locales, i18n.defaultLocale);
}

const mapHeadersToObject = (headers: Headers) => {
  return [...headers.entries()].reduce<Record<string, string>>(
    (headersObject, [key, value]) => ({
      ...headersObject,
      [key]: value
    }),
    {}
  );
};

export function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (!pathnameIsMissingLocale) return;

  const locale = getLocale(request);
  return NextResponse.redirect(new URL(`/${locale}/${pathname}`, request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
    // Optional: only run on root (/) URL
    // '/'
  ]
};
