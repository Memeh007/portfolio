"use client";

import dynamic from "next/dynamic";

const BackgroundCanvas = dynamic(() => import("@/components/BackgroundCanvas"), {
  ssr: false,
});

const LoadingGate = dynamic(() => import("@/components/loading/LoadingGate"), {
  ssr: false,
});

export default function HomeInteractiveShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadingGate>
      <BackgroundCanvas />
      {children}
    </LoadingGate>
  );
}
