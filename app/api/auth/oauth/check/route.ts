import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string };
  const url = body.url ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || !url.startsWith(supabaseUrl)) {
    return NextResponse.json({ error: "disabled" }, { status: 400 });
  }

  const response = await fetch(url, { method: "GET", redirect: "manual" });
  const text = await response.text();
  if (
    response.status === 400 ||
    text.includes("provider is not enabled") ||
    text.includes("Unsupported provider")
  ) {
    return NextResponse.json({ error: "disabled" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
