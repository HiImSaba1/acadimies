"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { gsap } from "@/lib/animations/gsap";

export function AdminLoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function animateField(target: EventTarget & HTMLInputElement, active: boolean) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const field = target.closest<HTMLElement>(".admin-login-field");
    if (!field) return;
    gsap.to(field.querySelector("span"), {
      scaleX: active ? 1 : 0,
      duration: active ? 0.52 : 0.32,
      transformOrigin: active ? "left center" : "right center",
      ease: "power3.out",
      overwrite: true,
    });
    gsap.to(field.querySelector("label"), {
      x: active ? 5 : 0,
      color: active ? "#145a38" : "#62675f",
      duration: 0.35,
      ease: "power3.out",
      overwrite: true,
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      callbackUrl,
      redirect: false,
    });
    setPending(false);
    if (!result?.ok) {
      setError("Το όνομα χρήστη ή ο κωδικός δεν είναι σωστός.");
      return;
    }
    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <div className="admin-login-field" data-login-reveal>
        <label htmlFor="staff-username">Όνομα χρήστη</label>
        <input id="staff-username" name="username" type="text" autoComplete="username" required
          onFocus={(event) => animateField(event.currentTarget, true)}
          onBlur={(event) => animateField(event.currentTarget, false)} />
        <span aria-hidden="true" />
      </div>
      <div className="admin-login-field" data-login-reveal>
        <label htmlFor="staff-password">Κωδικός πρόσβασης</label>
        <input id="staff-password" name="password" type="password" autoComplete="current-password" required
          onFocus={(event) => animateField(event.currentTarget, true)}
          onBlur={(event) => animateField(event.currentTarget, false)} />
        <span aria-hidden="true" />
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={pending} data-login-reveal>
        <span>{pending ? "Έλεγχος…" : "Είσοδος στη σύνταξη"}</span>
        <b aria-hidden="true">↗</b>
      </button>
      {googleEnabled ? (
        <button type="button" className="admin-login-google" onClick={() => signIn("google", { callbackUrl })}>
          Σύνδεση με Google
        </button>
      ) : null}
    </form>
  );
}
