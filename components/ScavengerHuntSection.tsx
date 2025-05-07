import React from "react";
import { ScavengerHuntGrid } from "@/components/ScavengerHuntGrid";

type Props = {
  username: string;
  isOwner: boolean;
  progress: { [promptId: string]: string };
  onUpload: (promptId: string, file: File) => void;
};

const ScavengerHuntSection: React.FC<Props> = ({
  username,
  isOwner,
  progress,
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

      <ScavengerHuntGrid
        username={username}
        isOwner={isOwner}
        unlockedCount={unlockedCount}
        submissions={progress}
        prompts={scavengerPrompts}
        onUpload={onUpload}
      />
    </div>
  );
};

export default ScavengerHuntSection;
