import { NextRequest, NextResponse } from "next/server";
import { i18n } from "./i18n";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";

function getLocale(request: NextRequest) {
  const headers = [...request.headers.entries()].reduce<Record<string, string>>(
    (headersObject, [key, value]) => {
      return {
        ...headersObject,
        [key]: value,
      };
    },
    {}
  );
  const languages = new Negotiator({
    headers,
  }).languages();

  return match(languages, i18n.locales, i18n.defaultLocale);
}

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
    // Skip all internal paths (_next)
    "/((?!_next).*)",
    // Optional: only run on root (/) URL
    // '/'
  ],
};
