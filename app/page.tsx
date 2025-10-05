import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
    <main className="flex min-h-svh flex-col justify-center bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <AuthForm />
      </div>
    </main>
  );
}
