import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("userId", "", { httpOnly: true, path: "/", maxAge: 0 });
  cookieStore.set("userName", "", { httpOnly: false, path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
