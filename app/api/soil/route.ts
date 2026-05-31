import { NextResponse } from "next/server";
import { getSoilData } from "@/app/lib/services";

export async function GET() {
  try {
    const data = await getSoilData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Soil API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch soil data";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
