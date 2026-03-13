import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Stateless JWT logout is handled on the client by deleting the token.
  // We can return a success message.
  return NextResponse.json({ message: "Logged out" });
}
