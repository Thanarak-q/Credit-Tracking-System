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
    <div className="flex min-h-screen items-center justify-center bg-muted/10 px-4 py-10 text-foreground">
      <AuthForm />
    </div>
  );
}
