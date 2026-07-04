"use client";

import dynamic from "next/dynamic";

const LoadingScene = dynamic(() => import("@/components/loading/LoadingScene"), {
  ssr: false,
});

type LoadingScreenProps = {
  exiting: boolean;
};

export default function LoadingScreen({ exiting }: LoadingScreenProps) {
  return (
    <div
      className={`loading-screen${exiting ? " loading-screen--exit" : ""}`}
      aria-live="polite"
      aria-busy={!exiting}
      aria-label="Loading portfolio"
    >
      <div className="loading-screen__canvas">
        <LoadingScene />
      </div>

      <div className="loading-bar" aria-hidden="true">
        <div className="loading-bar__oval">
          <div className="loading-bar__blocks">
            <span className="loading-bar__block" />
            <span className="loading-bar__block" />
            <span className="loading-bar__block" />
          </div>
        </div>
      </div>
    </div>
  );
}
