import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { readUserFromSessionCookie } from "@/lib/auth";

export default async function HomePage() {
  try {
    const user = await readUserFromSessionCookie();
    if (user) {
      redirect("/page2");
    }
  } catch (error) {
    console.error("Failed to read session", error);
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.28),_transparent_60%)]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(2,132,199,0.18),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.1),transparent_45%),linear-gradient(120deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[length:24px_24px] bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)] opacity-40" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <AuthForm />
      </div>
    </div>
  );
}
