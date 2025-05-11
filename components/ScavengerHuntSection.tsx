import React from "react";
import { ScavengerHuntGrid } from "@/components/ScavengerHuntGrid";
import Link from "next/link";

type Props = {
  username: string;
  isOwner: boolean;
  progress: { [promptId: string]: string };
  results: { [promptId: string]: { score: number, rubric: any, feedback: string } };
  loadingMap: { [promptId: string]: boolean };
  onUpload: (promptId: string, file: File) => void;
};

const ScavengerHuntSection: React.FC<Props> = ({
  username,
  isOwner,
  progress,
  results,
  loadingMap,
  onUpload,
}) => {
  const huntStart = new Date("2025-05-05");
  const today = new Date();
  const unlockedCount = Math.min(
    30,
    Math.floor((today.getTime() - huntStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const scavengerPrompts = [
    ...'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => ({
      promptId: letter,
      text: `Something that starts with ${letter.toUpperCase()}`,
    })),
    { promptId: "number", text: "A photo with a number in it" },
    { promptId: "color", text: "A photo dominated by one color" },
    { promptId: "reflection", text: "Something with a reflection" },
    { promptId: "pattern", text: "A repeating pattern" },
  ];


  return (
    <div style={{ marginTop: 48 }}>
      <h2>🕵️‍♂️ Scavenger Hunt</h2>
      <p style={{ fontStyle: "italic", marginBottom: 16 }}>
        One photo per prompt — choose your shot carefully! Once submitted, it counts as your official entry for that day.
      </p>
      {isOwner && (
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
        unlockedCount={unlockedCount}
        submissions={progress}
        prompts={scavengerPrompts}
        results={results}
        loadingMap={loadingMap}
        onUpload={onUpload}
      />
      
    </div>
  );
};

export default ScavengerHuntSection;
