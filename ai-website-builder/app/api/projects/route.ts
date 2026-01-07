import { db } from "@/config/db";
import { chatTable, frameTable, projectTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { projectId, frameId, messages } = await req.json();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  // FIX: This block adds the user to your 'users' table if they aren't there yet.
  // Without this, the 'projectTable' insert below will always fail.
  if (email) {
    await db.insert(usersTable)
      .values({
        name: user?.fullName ?? "New User",
        email: email,
      })
      .onConflictDoUpdate({
        target: usersTable.email,
        set: { name: user?.fullName ?? "New User" },
      });
  }

  // Create Project - This will now work because the user above exists
  const projectResult = await db.insert(projectTable).values({
    projectId: projectId,
    createdBy: email
  })

  // Create Frame
  const frameResult = await db.insert(frameTable).values({
    frameId: frameId,
    projectId: projectId,
  })

  // Save user Msg
  const chatResult = await db.insert(chatTable).values({
    chatMessage: messages,
    createdBy: email
  })

  return NextResponse.json({
    projectId, frameId, messages
  })
}