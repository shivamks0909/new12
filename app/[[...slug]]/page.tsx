"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Dynamically import the App component from the client source
// to avoid SSR issues with wouter and other client-only libs
const App = dynamic(() => import("@/App"), { ssr: false });

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Or a loading spinner
  }

  return <App />;
}
