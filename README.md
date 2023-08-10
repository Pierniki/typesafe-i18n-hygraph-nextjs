# Typesafe i18n using Next 13's App router and HygraphCMS

Next.js, a popular React framework, offers a robust platform for building web applications, and when combined with a Headless CMS (Content Management System) for translations, it becomes a powerful tool for delivering localized content. In this article, we'll delve into the best practices for achieving effective localization in Next.js apps using HygraphCMS as a source of translations.

### Why Localization Matters

Localization involves adapting a product or content to suit a specific locale, encompassing language, cultural nuances, and regional preferences. Effective localization provides several benefits:

- Enhanced User Experience: Users are more likely to engage with content that speaks their language and resonates with their culture.
- Increased Accessibility: Localization ensures that people who are not proficient in the app's default language can still use it effectively.
- Global Reach: By catering to different languages and cultures, your app can attract a broader audience and potentially tap into new markets.

### Goals

- Implement internationalization using app router introduced in Next.js version 13.
- Have a single source of truth for available locales. In our case - a Hygraph project.
- Make querying localized data as typesafe as possible.

### Hygraph Project Setup

Let's start with adding locales to our Hygraph project's settings. This setup will determine which locales are going to be available in our application.

<img width="533" alt="image" src="https://github.com/Pierniki/typesafe-i18n-nextjs-hygraph/assets/35572075/6ef8e6e7-e3c6-46b2-af16-1478284ace79">

Next step involves setting up a schema. I created a blogpost with two fields:

- title (single line text)
- content (rich text)

_Remember to mark these fields as localizable_.

<img width="471" alt="image" src="https://github.com/Pierniki/typesafe-i18n-nextjs-hygraph/assets/35572075/ee7059e2-eb52-4470-9d8a-4a22d7e7e2a1">

Last step involves creating some sample blogposts for testing purpouses.

### Next.js Project Initialization

I bootsrapped basic boilerplate and **graphql codegen** using `@graphql-codegen/cli` library. If you are interested in details you can check it out in this [repository](https://github.com/Pierniki/typesafe-i18n-nextjs-hygraph).

### Localization Setup

Start by creating `i18n.ts` file somewhere in your project. Thats where we are going to keep all our localization related types and values.

```typescript
//i18n.ts

// Import hygraph locale type generated by codegen
import { Locale as HygraphLocaleEnum } from "./gql/graphql";

// re-export for convenience
export { HygraphLocaleEnum };

// transform enum type into string union
// type HygraphLocale = "en" | "pl_PL"
export type HygraphLocale = `${HygraphLocaleEnum}`;

// hygraph locales are separated by "_"
// this utility type allows us to use standard notation while keeping the types tight
// type Locale = "en" | "pl-PL"
export type Locale = Replace<HygraphLocale, "_", "-">;

type Replace<
  T extends string,
  S extends string,
  D extends string,
  A extends string = ""
> = T extends `${infer L}${S}${infer R}`
  ? Replace<R, S, D, `${A}${L}${D}`>
  : `${A}${T}`;

// mapping locales into standard format
const locales = Object.values(HygraphLocaleEnum).map(
  (hygraphLocale) => hygraphLocale.replace("_", "-") as Locale
);

// having :Locale ensures we can only choose between "en" and "pl-PL"
const defaultLocale: Locale = "en";

export const i18n = {
  locales,
  defaultLocale,
};
```

We now have a source of our locales that is mostly in sync with related Hygraph project. Keep in mind that in production environemnt the codegen step will run before creating the production build. That means if you make some changes to locales in your hygraph project and want to apply them to your app you will have to redeploy it. Its a bit of a tradeoff, but if you do not plan to change locales very often it should be only a minor inconvenience.

Other ways to implement it would be to:

- hardcode the locales. It has the same issue as solution above and requires developers to keep the values synced between the app and CMS.
- dynamically fetch available locales via the API. It would keep the locale list always up to date, but it would require more development time and introduce more complexity to the project.

Time to setup the middleware responsible for finding user's prefered language and redirecting them into correct subpath if needed. The snippet below is heavily based on the implementation from official next.js docs with some minor, but key changes.

```typescript
// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { i18n } from "./i18n";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";

function getLocale(request: NextRequest) {
  // Negotiator expects headers as a record object, not a Set thus some mapping is required
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

  // we look for user's prefered languages in our available locales. Fallback to a default if none are available.
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
```
