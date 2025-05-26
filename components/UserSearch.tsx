import React, { useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import Link from "next/link";

const SEARCH_USERNAMES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/search_usernames";

type UserSearchProps = {
  onSearch: () => void;
};

const UserSearch: React.FC<UserSearchProps> = ({ onSearch }) => {
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return;

    try {
      const res = await invokeLambdaIam({
        url: SEARCH_USERNAMES_URL,
        method: "POST",
        body: { query: trimmed },
      });

      if (res.exactMatch) {
        onSearch(); // Close menu
        window.location.href = `/users/${res.exactMatch}`;
      } else if (res.suggestions?.length > 0) {
        setSuggestions(res.suggestions);
        setError("");
      } else {
        setSuggestions([]);
        setError("No users found.");
      }
    } catch (err) {
      console.error(err);
      setSuggestions([]);
      setError("Something went wrong.");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          style={{
            flex: 1,
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#0077cc",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}

      {suggestions.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <p>Did you mean:</p>
          <ul style={{ paddingLeft: "1rem" }}>
            {suggestions.map((s) => (
              <li key={s}>
                <Link href={`/users/${s}`} onClick={onSearch}>
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
