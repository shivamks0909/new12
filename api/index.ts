import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
    try {
        // Dynamically load the server architecture *inside* the try-catch.
        // This allows us to intercept fatal module resolution failures (e.g. pg, vite missing) 
        // that typically crash Serverless Functions before initialization!
        const { app, initializeApp } = await import("../server/index");

        // Ensure routes and plugins are fully registered before accepting traffic
        await initializeApp();
        return app(req, res);
    } catch (err: any) {
        console.error("CRITICAL VERCEL INIT ERROR:", err);
        return res.status(500).send(`Vercel Init Crash: ${err.message}\nStack: ${err.stack}`);
    }
}
