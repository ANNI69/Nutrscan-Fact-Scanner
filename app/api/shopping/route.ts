import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return NextResponse.json({ items: [] });
  const items = await prisma.shoppingItem.findMany({ where: { userID: userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, name, barcode, quantity, checked } = body || {};
  if (id) {
    const updated = await prisma.shoppingItem.update({ where: { id }, data: { name, barcode, quantity: Number(quantity)||1, checked: Boolean(checked) } });
    return NextResponse.json({ item: updated });
  }
  const created = await prisma.shoppingItem.create({ data: { userID: userId, name, barcode, quantity: Number(quantity)||1 } });
  return NextResponse.json({ item: created });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false });
  await prisma.shoppingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


