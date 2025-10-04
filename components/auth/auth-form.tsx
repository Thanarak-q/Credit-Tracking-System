"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

export function AuthForm(): React.ReactElement {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<"neutral" | "error" | "success">("neutral");

  const handleSwitchMode = (nextMode: "login" | "register") => {
    if (mode === nextMode) return;
    setMode(nextMode);
    setMessage(null);
    setVariant("neutral");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!email || !password || (mode === "register" && !confirmPassword)) {
      setVariant("error");
      setMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setVariant("error");
      setMessage(`รหัสผ่านต้องมีความยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setVariant("error");
      setMessage("รหัสผ่านและการยืนยันไม่ตรงกัน");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "register" ? { confirmPassword } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "เกิดข้อผิดพลาด" }));
        setVariant("error");
        setMessage(data.error ?? "ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      setVariant("success");
      setMessage("สำเร็จ กำลังพาไปยังหน้าหลักสูตร...");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/page2");
      }, 500);
    } catch (error) {
      console.error("Auth request failed", error);
      setVariant("error");
      setMessage("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "bg-slate-900/60 border-slate-700/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-indigo-500/40";
  const toggleClasses = "h-10 rounded-full text-sm font-semibold transition-colors duration-200";

  return (
    <Card className="relative w-full max-w-lg border border-slate-800/70 bg-slate-900/75 p-2 text-slate-100 shadow-[0_30px_140px_-60px_rgba(99,102,241,0.65)] supports-[backdrop-filter]:backdrop-blur-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-16 top-0 -z-10 h-24 rounded-full bg-gradient-to-r from-indigo-500/40 via-sky-400/25 to-violet-500/40 blur-3xl"
      />
      <CardHeader className="space-y-3 text-center">
        <CardDescription className="text-xs uppercase tracking-[0.4rem] text-indigo-300/80">
          Credit Tracking System
        </CardDescription>
        <CardTitle className="text-3xl font-semibold text-slate-50 sm:text-4xl">
          {mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}
        </CardTitle>
        <CardDescription className="text-sm text-slate-300">
          {mode === "login"
            ? "กลับมาจัดการแผนการเรียนของคุณอย่างต่อเนื่อง"
            : "สร้างบัญชีใหม่เพื่อเริ่มวางแผนหน่วยกิตของคุณ"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-2 rounded-full bg-slate-800/60 p-1 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              toggleClasses,
              mode === "login"
                ? "bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-300 hover:text-white"
            )}
            onClick={() => handleSwitchMode("login")}
          >
            เข้าสู่ระบบ
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              toggleClasses,
              mode === "register"
                ? "bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-300 hover:text-white"
            )}
            onClick={() => handleSwitchMode("register")}
          >
            สมัครสมาชิก
          </Button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-sm font-medium text-slate-200">
              อีเมล
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className={inputClasses}
              required
            />
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="password" className="text-sm font-medium text-slate-200">
              รหัสผ่าน
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className={inputClasses}
              required
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2 text-left">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-200">
                ยืนยันรหัสผ่าน
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className={inputClasses}
                required
              />
            </div>
          )}

          {message && (
            <div
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                variant === "neutral" && "border-slate-700/70 bg-slate-900/60 text-slate-200",
                variant === "error" && "border-red-500/40 bg-red-500/10 text-red-200",
                variant === "success" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              )}
            >
              {message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400">
          {mode === "login"
            ? "ยังไม่มีบัญชี? สมัครสมาชิกแล้วเริ่มติดตามหน่วยกิตของคุณได้เลย"
            : "มีบัญชีอยู่แล้วใช่ไหม? กดที่ปุ่มเข้าสู่ระบบด้านบนเพื่อกลับเข้าสู่ระบบ"}
        </p>
      </CardContent>
    </Card>
  );
}

export default AuthForm;
