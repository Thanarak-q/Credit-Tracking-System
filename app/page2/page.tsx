import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import CourseTracker from "@/components/course-tracker";
import { readUserFromSessionCookie } from "@/lib/auth";

export default async function Page2() {
  const user = await readUserFromSessionCookie();

  if (!user) {
    redirect("/");
  }

  return <CourseTracker userEmail={user.email} />;
}
