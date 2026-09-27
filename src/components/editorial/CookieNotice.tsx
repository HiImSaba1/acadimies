"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CookieConsent from "react-cookie-consent";

export const COOKIE_PREFERENCES_EVENT = "acadimies:open-cookie-preferences";

export function CookieNotice() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 800);
    const reopen = () => setPreferencesOpen(true);
    window.addEventListener(COOKIE_PREFERENCES_EVENT, reopen);
    return () => { window.clearTimeout(timer); window.removeEventListener(COOKIE_PREFERENCES_EVENT, reopen); };
  }, []);

  if (!ready || pathname?.startsWith("/admin")) return null;
  return <CookieConsent
    cookieName="acadimies_optional_cookies_v1"
    cookieValue="accepted"
    declineCookieValue="rejected"
    sameSite="strict"
    expires={180}
    enableDeclineButton
    acceptOnScroll={false}
    acceptOnOverlayClick={false}
    location="none"
    visible={preferencesOpen ? "show" : "byCookieValue"}
    disableStyles
    disableButtonStyles
    containerClasses="cookie-notice"
    contentClasses="cookie-notice__content"
    buttonWrapperClasses="cookie-notice__actions"
    buttonClasses="cookie-notice__button cookie-notice__button--accept"
    declineButtonClasses="cookie-notice__button cookie-notice__button--reject"
    buttonText="Αποδοχή"
    declineButtonText="Απόρριψη"
    ariaAcceptLabel="Αποδοχή προαιρετικών cookies"
    ariaDeclineLabel="Απόρριψη προαιρετικών cookies"
    onAccept={() => setPreferencesOpen(false)}
    onDecline={() => setPreferencesOpen(false)}
  >
    <p className="cookie-notice__eyebrow">Επιλογές cookies</p>
    <p>Χρησιμοποιούμε μόνο τα απαραίτητα για τη λειτουργία του ιστότοπου. Η επιλογή σου για προαιρετικά cookies αποθηκεύεται, αλλά δεν ενεργοποιεί υπηρεσία ανάλυσης ή διαφήμισης σήμερα.</p>
    <div className="cookie-notice__policy"><Link href="/cookies">Cookies</Link><Link href="/privacy-policy">Απόρρητο</Link></div>
  </CookieConsent>;
}
