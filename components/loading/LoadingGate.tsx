"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LoadingScreen = dynamic(() => import("@/components/loading/LoadingScreen"), {
  ssr: false,
});

const LOAD_MS = 4000;
const FADE_MS = 500;

export default function LoadingGate({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setExiting(true), LOAD_MS - FADE_MS);
    const hideTimer = window.setTimeout(() => setVisible(false), LOAD_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {visible && <LoadingScreen exiting={exiting} />}
      <div className={visible ? "loading-gate__content--hidden" : undefined}>
        {children}
      </div>
    </>
  );
}
