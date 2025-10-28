import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return NextResponse.json({ items: [] });
  const items = await prisma.favorite.findMany({ where: { userID: userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { name, barcode, image, brand } = body || {};
  const existing = await prisma.favorite.findFirst({ where: { userID: userId, barcode: barcode || undefined } });
  if (existing) return NextResponse.json({ item: existing });
  const created = await prisma.favorite.create({ data: { userID: userId, name, barcode, image, brand } });
  return NextResponse.json({ item: created });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false });
  await prisma.favorite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


