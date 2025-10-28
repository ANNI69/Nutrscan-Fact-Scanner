import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const userName = cookieStore.get("userName")?.value;
    if (!userId) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: userId, name: userName || "" } });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}
