"use client";

import { COOKIE_PREFERENCES_EVENT } from "./CookieNotice";

export function CookiePreferencesButton() {
  return <button className="editorial-information__action" type="button"
    onClick={() => window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))}>
    Άνοιξε ξανά τις επιλογές cookies <span aria-hidden="true">↗</span>
  </button>;
}
