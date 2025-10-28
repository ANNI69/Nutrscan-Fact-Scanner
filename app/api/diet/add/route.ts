import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Append a meal to today's plan (creates plan if missing)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, calories, protein, carbs, fat } = body || {};

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    let plan = await prisma.dietPlan.findFirst({ where: { userID: userId, date: { gte: start, lt: end } } });
    if (!plan) {
      plan = await prisma.dietPlan.create({ data: { userID: userId, title: "Today's plan", date: start, caloriesTarget: 2000 } });
    }

    const created = await prisma.dietMeal.create({
      data: {
        planID: plan.id,
        name: String(name || "Meal"),
        calories: Number(calories || 0),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fat: Number(fat || 0),
      },
    });

    return NextResponse.json({ ok: true, meal: created, planId: plan.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to add meal" }, { status: 500 });
  }
}


