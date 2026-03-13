import { NextRequest } from "next/server";
import { handleTracking } from "@server/tracking-handler";

type Props = {
  params: {
    code: string;
  };
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return handleTracking(req, code);
}
