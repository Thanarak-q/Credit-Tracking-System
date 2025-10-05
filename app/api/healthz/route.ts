import { NextResponse } from "next/server";

export async function GET() {
  // Simple healthcheck endpoint for platform probes
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

