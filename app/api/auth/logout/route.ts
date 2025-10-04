import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { deleteSessionByToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await deleteSessionByToken(token);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to handle logout request", error);
    return NextResponse.json({ error: "ไม่สามารถออกจากระบบได้" }, { status: 500 });
  }
}
