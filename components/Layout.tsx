import Link from "next/link";
import { useState, useEffect } from "react";
import UserSearch from "@/components/UserSearch";
import { useUnread } from "@/context/UnreadContext";

type LayoutProps = {
  children: React.ReactNode;
  signOut?: () => void;
  user?: { username: string };
  userRole?: string;
};

export default function Layout({ children, signOut, user, userRole }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount } = useUnread();

  const handleMenuClick = () => setMenuOpen(false);

  useEffect(() => {
    //console.log("👀 Layout loaded. user:", user?.username, "role:", userRole);
  }, [userRole]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      <header
        style={{
          padding: "1rem",
          backgroundColor: "#333",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            fontSize: "2rem",
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          ☰
        </button>
        <h1 style={{ fontSize: "1.5rem" }}>📸 Photo Mentor</h1>
      </header>

      {/* Menu Panel */}
      <div
        style={{
          maxHeight: menuOpen ? "1000px" : "0",
          opacity: menuOpen ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.4s ease",
          visibility: menuOpen ? "visible" : "hidden",
        }}
      >
        {/* User Search */}
        <div style={{ marginTop: "1rem", padding: "0 1rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>🔍 Find a User Page</h3>
          <UserSearch onSearch={handleMenuClick} />
        </div>

        {/* Browse Profiles */}
        <div style={{ marginTop: "1rem", padding: "0 1rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>📇 Browse Profiles</h3>
          <Link href="/browse_profiles" onClick={handleMenuClick}>
            View all public user profiles
          </Link>
        </div>

        <nav
          style={{
            backgroundColor: "white",
            margin: "1rem",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            padding: "1rem",
          }}
        >
          <ul className="mobile-menu">
            <li><Link href="/" onClick={handleMenuClick}>🏠 Home</Link></li>

            {user && (
              <>
                <li>
                  <Link href={`/users/${user.username}`} onClick={handleMenuClick}>
                    👤 My Profile
                    {unreadCount > 0 && (
                      <span style={{
                        background: "red",
                        color: "white",
                        marginLeft: 6,
                        borderRadius: "50%",
                        padding: "0 8px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        lineHeight: "1.5rem",
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
                {userRole === "admin" && (
                  <li><Link href="/admin" onClick={handleMenuClick}>🛠️ Admin Panel</Link></li>
                )}
              </>
            )}

            <hr />

            {/* Engage */}
            <li><Link href="/featured_photos" onClick={handleMenuClick}>🌟 Featured Photos</Link></li>
            <li><Link href="/challenge" onClick={handleMenuClick}>🏆 Weekly Challenge</Link></li>
            <li><Link href="/scavenger_hunt" onClick={handleMenuClick}>🔍 Scavenger Hunt</Link></li>
            <li><Link href="/photo_feedback" onClick={handleMenuClick}>📝 Get Photo Feedback</Link></li>

            <hr />

            {/* Learn */}
            <li><Link href="/daily_tip" onClick={handleMenuClick}>📸 Daily Tip</Link></li>
            <li><Link href="/learninghub" onClick={handleMenuClick}>📚 Learning Hub</Link></li>
            <li><Link href="/podcasts" onClick={handleMenuClick}>🎧 Podcasts</Link></li>

            <hr />

            {/* Explore */}
            <li><Link href="/challenges" onClick={handleMenuClick}>🗂️ Challenge Archive</Link></li>
            <li><Link href="/scoreboard" onClick={handleMenuClick}>📊 High Scores</Link></li>

            <hr />

            {/* Settings */}
            <li><Link href="/about_me" onClick={handleMenuClick}>👤 About Me</Link></li>
            <li><Link href="/settings" onClick={handleMenuClick}>⚙️ Settings</Link></li>
            <li><Link href="/feedback" onClick={handleMenuClick}>🐞 Report a Bug</Link></li>

            {signOut && (
              <li style={{ marginTop: "1rem" }}>
                <button
                  onClick={() => {
                    handleMenuClick();
                    signOut();
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#e63946",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    width: "100%",
                    fontSize: "1rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d62839")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e63946")}
                >
                  🚪 Sign Out
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}
