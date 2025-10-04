"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

export function AuthForm(): JSX.Element {
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

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur-sm">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold">
          {mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ"
            : "กรอกข้อมูลเพื่อสร้างบัญชีใหม่"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "outline"}
            className="w-full"
            onClick={() => handleSwitchMode("login")}
          >
            เข้าสู่ระบบ
          </Button>
          <Button
            type="button"
            variant={mode === "register" ? "default" : "outline"}
            className="w-full"
            onClick={() => handleSwitchMode("register")}
          >
            สมัครสมาชิก
          </Button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          )}

          {message && (
            <p
              className={cn("text-sm", {
                "text-muted-foreground": variant === "neutral",
                "text-destructive": variant === "error",
                "text-emerald-500": variant === "success",
              })}
            >
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default AuthForm;
