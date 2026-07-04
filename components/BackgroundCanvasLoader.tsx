"use client";

import dynamic from "next/dynamic";

const BackgroundCanvas = dynamic(() => import("@/components/BackgroundCanvas"), {
  ssr: false,
});

export default function BackgroundCanvasLoader() {
  return <BackgroundCanvas />;
}
