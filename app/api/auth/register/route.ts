import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSession,
  createUser,
  findUserByEmail,
  setSessionCookie,
} from "@/lib/auth";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8).optional(),
  })
  .refine(
    data => !data.confirmPassword || data.password === data.confirmPassword,
    {
      message: "รหัสผ่านและการยืนยันไม่ตรงกัน",
      path: ["confirmPassword"],
    }
  );

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้ไปแล้ว กรุณาเข้าสู่ระบบ" },
        { status: 409 }
      );
    }

    const user = await createUser(email, password);
    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);

    return NextResponse.json({ success: true, mode: "register" });
  } catch (error) {
    console.error("Failed to handle registration request", error);
    return NextResponse.json(
      { error: "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
