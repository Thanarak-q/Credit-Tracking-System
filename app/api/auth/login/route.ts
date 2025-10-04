import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSession,
  findUserByEmail,
  setSessionCookie,
  touchUser,
  verifyPassword,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีเมลและรหัสผ่าน",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    const existingUser = await findUserByEmail(email);

    if (!existingUser) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้งาน กรุณาสมัครสมาชิกก่อน" },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(password, existingUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    await touchUser(existingUser.id);
    const session = await createSession(existingUser.id);
    await setSessionCookie(session.token, session.expiresAt);

    return NextResponse.json({ success: true, mode: "login" });
  } catch (error) {
    console.error("Failed to handle login request", error);
    return NextResponse.json(
      { error: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
