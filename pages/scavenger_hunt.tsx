import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCurrentUser } from "aws-amplify/auth";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import ScavengerHuntSection from "@/components/ScavengerHuntSection";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fetchAuthSession } from "aws-amplify/auth";

const LIST_HUNTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_scavenger_hunts";
const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const GET_USER_HUNT_PROGRESS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get-user-hunt-progress";
const GET_SCAVENGER_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_scavenger_results";
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";
const SUBMIT_HUNT_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_hunt_photo";

const STORAGE_URL = "https://picture-this-storage.s3.amazonaws.com";

type ScavengerHunt = {
  huntId: string;
  name: string;
  startDate?: string;
  prompts: { promptId: string; text: string }[];
};

export default function ScavengerHuntPage() {
  const [username, setUsername] = useState<string>("");
  const [accountTier, setAccountTier] = useState<string>("free");
  const [selectedHuntId, setSelectedHuntId] = useState("");
  const [availableHunts, setAvailableHunts] = useState<ScavengerHunt[]>([]);
  const [progress, setProgress] = useState<{ [promptId: string]: string }>({});
  const [results, setResults] = useState<{ [promptId: string]: { score: number; rubric: any; feedback: string } }>({});
  const [loadingMap, setLoadingMap] = useState<{ [promptId: string]: boolean }>({});
  const [scavengerRetries, setScavengerRetries] = useState<number | undefined>();

  const router = useRouter();

  useEffect(() => {
    getCurrentUser()
      .then(user => setUsername(user.username))
      .catch(() => router.push("/"));
  }, [router]);

  useEffect(() => {
    if (!username) return;

    async function fetchData() {
      const [profileRes, huntsRes] = await Promise.all([
        invokeLambdaIam({ url: GET_PROFILE_URL, method: "POST", body: { username } }),
        invokeLambdaIam({ url: LIST_HUNTS_URL, method: "POST" }),
      ]);

      setAccountTier(profileRes.accountTier || "free");
      setScavengerRetries(profileRes.scavengerRetries);

      const sorted = (huntsRes || []).sort(
        (a: ScavengerHunt, b: ScavengerHunt) =>
          new Date(b.startDate || "").getTime() - new Date(a.startDate || "").getTime()
      );

      setAvailableHunts(sorted);
      if (sorted.length > 0) setSelectedHuntId(sorted[0].huntId);
    }

    fetchData();
  }, [username]);

  useEffect(() => {
    if (!username || !selectedHuntId) return;

    async function fetchProgressAndResults() {
      try {
        const progressRes = await invokeLambdaIam({
          url: GET_USER_HUNT_PROGRESS_URL,
          method: "POST",
          body: { username, huntId: selectedHuntId },
        });

        const promptIds: string[] = progressRes.promptIds || [];
        const mappedProgress: { [promptId: string]: string } = {};
        for (const id of promptIds) {
          mappedProgress[id] = `${STORAGE_URL}/public/scavenger-hunts/${selectedHuntId}/${username}/${id}.jpg`;
        }
        setProgress(mappedProgress);

        const resultsRes = await invokeLambdaIam({
          url: GET_SCAVENGER_RESULTS_URL,
          method: "POST",
          body: { username, huntId: selectedHuntId },
        });

        const mappedResults: typeof results = {};
        for (const r of resultsRes) {
          mappedResults[r.promptId] = {
            score: r.score,
            rubric: r.rubric,
            feedback: r.feedback,
          };
        }
        setResults(mappedResults);
      } catch (err) {
        console.error("Failed to fetch hunt progress or results:", err);
      }
    }

    fetchProgressAndResults();
  }, [username, selectedHuntId]);

  const handleUpload = async (promptId: string, file: File) => {
    setLoadingMap(prev => ({ ...prev, [promptId]: true }));
    try {
      const s3Key = `public/scavenger-hunts/${selectedHuntId}/${username}/${promptId}.jpg`;

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const session = await fetchAuthSession();
      const credentials = session.credentials;

        if (!credentials) {
        throw new Error("AWS credentials not found");
        }

        const s3 = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
        },
        });

      await s3.send(
        new PutObjectCommand({
          Bucket: "picture-this-storage",
          Key: s3Key,
          Body: uint8Array,
          ContentType: file.type,
        })
      );

      const imageUrl = `${STORAGE_URL}/${s3Key}`;

      await invokeLambdaIam({
        url: SUBMIT_HUNT_PHOTO_URL,
        method: "POST",
        body: {
          huntId: selectedHuntId,
          username,
          promptId,
          s3Key,
        },
      });

      await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
          imageUrl,
          s3Key,
          rubric: true,
          username,
          huntId: selectedHuntId,
          scavengerPromptId: promptId,
        },
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username,
          updates: {
            recomputeScavengerHuntStats: { op: "recomputeScavengerHuntStats" },
          },
        },
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username,
          updates: {
            streakDays: { op: "updateStreak" },
          },
        },
      });

      setProgress(prev => ({ ...prev, [promptId]: imageUrl }));
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [promptId]: false }));
    }
  };

  const selectedHunt = availableHunts.find(h => h.huntId === selectedHuntId);

  if (!username || !selectedHunt) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading scavenger hunt...</div>;
  }

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>🧭 Scavenger Hunt</h1>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="hunt-select" style={{ fontWeight: "bold", marginRight: 8 }}>
          Select Hunt:
        </label>
        <select
          id="hunt-select"
          value={selectedHuntId}
          onChange={(e) => setSelectedHuntId(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 6 }}
        >
          {availableHunts.map(h => (
            <option key={h.huntId} value={h.huntId}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <ScavengerHuntSection
        huntId={selectedHunt.huntId}
        huntName={selectedHunt.name}
        huntStartDate={selectedHunt.startDate || ""}
        huntPrompts={selectedHunt.prompts}
        username={username}
        isOwner={true}
        progress={progress}
        results={results}
        onUpload={handleUpload}
        loadingMap={loadingMap}
        accountTier={accountTier}
        scavengerRetries={scavengerRetries}
      />
    </div>
  );
}
