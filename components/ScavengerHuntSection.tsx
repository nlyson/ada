import React from "react";
import { ScavengerHuntGrid } from "@/components/ScavengerHuntGrid";
import Link from "next/link";

type Props = {
  huntId: string;
  huntName: string;
  huntStartDate: string; // ISO string (e.g., "2025-05-05")
  huntPrompts: { promptId: string; text: string; optional?: boolean }[];
  username: string;
  isOwner: boolean;
  progress: { [promptId: string]: string };
  results: { [promptId: string]: { score: number, rubric: any, feedback: string } };
  loadingMap: { [promptId: string]: boolean };
  onUpload: (promptId: string, file: File) => void;
  accountTier?: string;
  scavengerRetries?: number;
};

const ScavengerHuntSection: React.FC<Props> = ({
  huntId,
  huntName,
  huntStartDate,
  huntPrompts,
  username,
  isOwner,
  progress,
  results,
  loadingMap,
  onUpload,
  accountTier,
  scavengerRetries
}) => {
  const huntStart = new Date(huntStartDate);
  const today = new Date();
  const unlockedCount = Math.min(
    30,
    Math.floor((today.getTime() - huntStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const scavengerPrompts = huntPrompts;


  return (
    <div style={{ marginTop: 48 }}>
      <h2>🕵️‍♂️ Scavenger Hunt</h2>
      <p style={{ fontStyle: "italic", marginBottom: 16 }}>
        One photo per prompt — choose your shot carefully! Once submitted, it counts as your official entry for that day.
      </p>
      {isOwner && accountTier === "free" && (
        <div
          style={{
            backgroundColor: "#f0faff",
            border: "1px solid #cceeff",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 24,
          }}
        >
          <p style={{ margin: 0, fontSize: 14 }}>
            🔓 <strong>Unlock more perks!</strong> Premium members get:
          </p>
          <ul style={{ fontSize: 14, paddingLeft: 20, marginTop: 8 }}>
            <li>🔥 Streak busts if you miss a day</li>
            <li>🧩 Access to future special hunts</li>
            <li>🔁 Ability to retry submissions</li>
          </ul>
          <Link href="/settings" legacyBehavior>
            <a
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "8px 16px",
                backgroundColor: "#0070f3",
                color: "white",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              Upgrade to Premium
            </a>
          </Link>
        </div>
      )}

      <ScavengerHuntGrid
        username={username}
        isOwner={isOwner}
        submissions={progress}
        prompts={scavengerPrompts}
        results={results}
        loadingMap={loadingMap}
        onUpload={onUpload}
        accountTier={accountTier}
        scavengerRetries={scavengerRetries}
        startDate={huntStartDate}
      />
      
    </div>
  );
};

export default ScavengerHuntSection;
