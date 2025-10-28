import { getHealthierAlternatives } from "@/app/(app)/app/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const alternatives = await getHealthierAlternatives(productId, 3);

    return NextResponse.json(alternatives);
  } catch (error) {
    console.error("Error in healthier alternatives API:", error);
    return NextResponse.json(
      { error: "Failed to fetch healthier alternatives" },
      { status: 500 }
    );
  }
}
