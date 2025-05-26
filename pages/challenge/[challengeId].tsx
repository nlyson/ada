// pages/challenge/[challengeId].tsx
import { useRouter } from "next/router";
import { useEffect, useState, ChangeEvent } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import Link from "next/link";

const FETCH_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_results";
const SUBMIT_CHALLENGE_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_challenge";
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";
const FETCH_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const FETCH_ALL_CHALLENGES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_all_challenges";

const DynamicChallenge = ({ user }: { user: { username: string } }) => {
  const router = useRouter();
  const { challengeId } = router.query;

  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [challenge, setChallenge] = useState<any | null>(null);
  const [accountTier, setAccountTier] = useState("free");
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  const submissionCount = results.filter(r => r.challengeId === challengeId).length;
  const hasUsedFree = accountTier !== "premium" && totalSubmissions > 0;
  const canSubmit = accountTier === "premium" || (!hasUsedFree && submissionCount === 0);

  useEffect(() => {
    if (!challengeId) return;

    async function init() {
      const [profile, challengeList, userResults] = await Promise.all([
        invokeLambdaIam({ url: FETCH_PROFILE_URL, method: "POST", body: { username: user.username } }),
        invokeLambdaIam({ url: FETCH_ALL_CHALLENGES_URL, method: "GET" }),
        invokeLambdaIam({ url: FETCH_RESULTS_URL, method: "POST", body: { username: user.username } }),
      ]);

      setAccountTier(profile.accountTier || "free");
      setResults(userResults || []);
      setTotalSubmissions(userResults.length);

      const match = (challengeList || []).find((c: any) => c.challengeId === challengeId);
      setChallenge(match || null);
    }
    init();
  }, [challengeId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] || null);
  };

  const toBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
  });

  const handleSubmit = async () => {
    if (!image) return alert("Please select an image.");
    const maxSize = (accountTier === "premium" ? 50 : 2) * 1024 * 1024;
    if (image.size > maxSize) return alert("File too large.");
    if (!canSubmit) return alert("Submission not allowed.");

    setLoading(true);
    try {
      const base64 = await toBase64(image);
      const result = await invokeLambdaIam({
        url: SUBMIT_CHALLENGE_LAMBDA_URL,
        method: "POST",
        body: {
          action: "submit",
          username: user.username,
          challengeId,
          fileName: image.name,
          fileContent: base64,
          fileType: image.type,
          caption,
        },
      });

      if (result.imageUrl && result.s3Key) {
        await invokeLambdaIam({
          url: REVIEW_PHOTO_LAMBDA_URL,
          method: "POST",
          body: {
            imageUrl: result.imageUrl,
            s3Key: result.s3Key,
            rubric: true,
            username: user.username,
            challengeId,
          },
        });
      }

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: { challengesCompleted: { op: "increment", value: 1 } },
        },
      });
    } catch (err) {
      console.error(err);
      setStatus("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const userResult = results.find(r => r.challengeId === challengeId);

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto", backgroundColor: "#fffaf0" }}>
      <h1 style={{ textAlign: "center" }}>📸 {challenge?.title || "Loading..."}</h1>
      {challenge?.description && <p>{challenge.description}</p>}

      {canSubmit && !userResult ? (
        <>
          <input type="file" accept="image/*" onChange={handleChange} />
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" style={{ marginTop: 8, padding: 8 }} />
          <button onClick={handleSubmit} disabled={loading} style={{ marginTop: 12 }}>
            {loading ? "Submitting..." : "Submit Photo"}
          </button>
        </>
      ) : userResult ? (
        <>
          <h3>📊 Your Result</h3>
          <img src={userResult.imageUrl} alt="Submission" style={{ width: "100%", maxWidth: 400, borderRadius: 8 }} />
          <p><strong>Score:</strong> {userResult.score}/100</p>
          <ul>
            {Object.entries(userResult.rubric).map(([k, v]) => (
            <li key={k}>{k}: {String(v)}/25</li>
            ))}
          </ul>
          <p><strong>Feedback:</strong> {userResult.feedback}</p>
        </>
      ) : (
        <p>You&apos;ve already used your free challenge submission.</p>
      )}
    </div>
  );
};

export default DynamicChallenge;
