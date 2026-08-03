import { getRequestConfig } from "next-intl/server";

import { defaultLocale } from "./config";

// Single-locale setup (Hebrew, RTL) — no locale-prefixed routing in this slice.
export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
