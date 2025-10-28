import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return NextResponse.json({ plans: [] });

    const url = new URL(request.url);
    const dateStr = url.searchParams.get("date");

    if (dateStr) {
      // Return plan for a specific date (if exists)
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const plan = await prisma.dietPlan.findFirst({
        where: { userID: userId, date: { gte: dayStart, lt: dayEnd } },
        include: { meals: true },
      });
      return NextResponse.json({ plan });
    }

    const plans = await prisma.dietPlan.findMany({
      where: { userID: userId },
      orderBy: { updatedAt: "desc" },
      include: { meals: true },
    });
    return NextResponse.json({ plans });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, date, caloriesTarget, meals } = body || {};

    if (id) {
      // Update existing
      const updated = await prisma.dietPlan.update({
        where: { id },
        data: {
          title: title || "My plan",
          date: date ? new Date(date) : null,
          caloriesTarget: Number(caloriesTarget) || 2000,
          meals: {
            deleteMany: {},
            create: (meals || []).map((m: any) => ({
              name: String(m.name || "Meal"),
              calories: Number(m.calories || 0),
              protein: Number(m.protein || 0),
              carbs: Number(m.carbs || 0),
              fat: Number(m.fat || 0),
            })),
          },
        },
        include: { meals: true },
      });
      return NextResponse.json({ plan: updated });
    }

    const created = await prisma.dietPlan.create({
      data: {
        userID: userId,
        title: title || "My plan",
        date: date ? new Date(date) : new Date(),
        caloriesTarget: Number(caloriesTarget) || 2000,
        meals: {
          create: (meals || []).map((m: any) => ({
            name: String(m.name || "Meal"),
            calories: Number(m.calories || 0),
            protein: Number(m.protein || 0),
            carbs: Number(m.carbs || 0),
            fat: Number(m.fat || 0),
          })),
        },
      },
      include: { meals: true },
    });
    return NextResponse.json({ plan: created });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }
}


