import { useEffect, useState } from "react";
import Link from "next/link";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const FETCH_PROFILES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_profiles";

export default function BrowseProfiles() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await invokeLambdaIam({
          url: FETCH_PROFILES_URL,
          method: "POST",
          body: {}, // if needed
        });
        setUsernames(res.usernames || []);
      } catch (err) {
        console.error("Failed to fetch profiles", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <div>
      <h1>📇 Browse Public Profiles</h1>
      {loading ? (
        <p>Loading...</p>
      ) : usernames.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {usernames.map((u) => (
            <li key={u}>
              <Link href={`/users/${u}`}>👤 {u}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
