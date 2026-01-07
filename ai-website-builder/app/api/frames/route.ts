import { db } from "@/config/db";
import { chatTable, frameTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const frameId = searchParams.get('frameId');

    if (!frameId) {
      return NextResponse.json({ error: "Missing frameId" }, { status: 400 });
    }

    const frameResult = await db.select().from(frameTable)
      //@ts-ignore
      .where(eq(frameTable.frameId, frameId));

    const chatResult = await db.select().from(chatTable)
      //@ts-ignore
      .where(eq(chatTable.frameId, frameId));

    if (frameResult.length === 0) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const finalResult = {
      ...frameResult[0],
      chatMessage: chatResult[0]?.chatMessage || []
    };

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}