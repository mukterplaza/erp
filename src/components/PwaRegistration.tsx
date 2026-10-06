"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    // Development-এ পুরোনো service worker debugging-এ বাধা দেবে না।
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => {
        console.error("PWA service worker registration failed:", error);
      });
  }, []);

  return null;
}