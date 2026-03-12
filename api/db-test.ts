import { pool } from "../server/db";

export default async function handler(req: any, res: any) {
  const diagnosticDetails: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    }
  };

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing from environment variables.");
    }

    const start = Date.now();
    const client = await pool.connect();
    const duration = Date.now() - start;
    
    diagnosticDetails.connection = {
      success: true,
      durationMs: duration,
    };

    const result = await client.query("SELECT 1 as ping");
    client.release();

    diagnosticDetails.query = {
      success: true,
      result: result.rows[0],
    };

    res.status(200).json({
      status: "success",
      message: "Database connectivity verified.",
      details: diagnosticDetails
    });
  } catch (err: any) {
    diagnosticDetails.error = {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    };

    res.status(500).json({
      status: "error",
      message: "Database connectivity failed.",
      details: diagnosticDetails
    });
  }
}
