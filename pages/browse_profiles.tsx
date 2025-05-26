import { useEffect, useState } from "react";
import Link from "next/link";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const FETCH_PROFILES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_profiles";

export default function BrowseProfiles() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await invokeLambdaIam({
        url: FETCH_PROFILES_URL,
        method: "POST",
        body: {
          limit: 25,
          lastKey,
        },
      });

      setUsernames((prev) => Array.from(new Set([...prev, ...(res.usernames || [])])));
      setLastKey(res.lastEvaluatedKey || null);
      setHasMore(!!res.lastEvaluatedKey);
    } catch (err) {
      console.error("Failed to fetch profiles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles(); // initial load
  }, []);

  return (
    <div>
      <h1>📇 Browse Public Profiles</h1>
      <ul>
        {usernames.map((u) => (
          <li key={u}>
            <Link href={`/users/${u}`}>👤 {u}</Link>
          </li>
        ))}
      </ul>

      {loading && <p>Loading...</p>}

      {!loading && hasMore && (
        <button onClick={fetchProfiles} style={{ marginTop: "1rem" }}>
          Load More
        </button>
      )}
    </div>
  );
}