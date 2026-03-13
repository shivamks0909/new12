import { NextRequest } from "next/server";
import { handleTracking } from "@server/tracking-handler";

export async function GET(req: NextRequest) {
  return handleTracking(req);
}
