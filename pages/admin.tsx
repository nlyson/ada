import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/router";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const CREATE_USER_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/create_user_with_email";

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ Admin access protection
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        const allowedAdmins = ["jama", "nathan"];
        if (!allowedAdmins.includes(user.username)) {
          router.push("/");
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername || !trimmedEmail) {
      setError("Both fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await invokeLambdaIam({
        url: CREATE_USER_URL,
        method: "POST",
        body: { username: trimmedUsername, email: trimmedEmail },
      });

      if (res.success) {
        setStatus(`✅ Invite sent to ${trimmedEmail}`);
        setUsername("");
        setEmail("");
      } else {
        setError(res.message || "Failed to create user.");
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>🛠️ Admin Panel</h1>
      <p>Invite a new user by entering their username and email. They will receive a verification email from Cognito.</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 400, marginTop: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
            required
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#0077cc",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Inviting..." : "➕ Invite User"}
        </button>
      </form>

      {status && <p style={{ color: "green", marginTop: "1rem" }}>{status}</p>}
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}
