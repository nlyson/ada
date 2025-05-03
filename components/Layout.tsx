import Link from "next/link";
import { useState } from "react";
import UserSearch from "@/components/UserSearch";

type LayoutProps = {
  children: React.ReactNode;
  signOut?: () => void;
};

export default function Layout({ children, signOut }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Small helper to handle clicking a menu item
  const handleMenuClick = () => {
    setMenuOpen(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      <header style={{
        padding: "1rem",
        backgroundColor: "#333",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            fontSize: "2rem",
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ☰
        </button>
        <h1 style={{ fontSize: "1.5rem" }}>📸 Picture This</h1>
      </header>

      {/* Menu Panel */}
      <div
        style={{
          maxHeight: menuOpen ? "1000px" : "0",
          opacity: menuOpen ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.5s ease",
          visibility: menuOpen ? "visible" : "hidden",
        }}
      >
        <nav style={{
          backgroundColor: "white",
          margin: "1rem",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          padding: menuOpen ? "1rem" : "0",
        }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li><Link href="/" onClick={handleMenuClick}>🏠 Home</Link></li>
            <li><Link href="/featured_photos" onClick={handleMenuClick}>🌟 Featured Photos</Link></li>
            <li><Link href="/photo_feedback" onClick={handleMenuClick}>📝 Photo Feedback</Link></li>
            <li><Link href="/daily_tip" onClick={handleMenuClick}>📸 Daily Tip</Link></li>
            <li><Link href="/podcasts" onClick={handleMenuClick}>🎧 Podcasts</Link></li>
            <li><Link href="/creations" onClick={handleMenuClick}>🎨 My Creations</Link></li>
            <li><Link href="/learninghub" onClick={handleMenuClick}>📚 Learning Hub</Link></li>
            <li><Link href="/challenge" onClick={handleMenuClick}>🏆 Photo Challenge</Link></li>
            <li><Link href="/scoreboard" onClick={handleMenuClick}>📊 High Scores</Link></li>
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
                    transition: "background-color 0.3s ease",
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

        {/* User Search just below menu */}
        <div style={{ marginTop: "1rem", padding: "0 1rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>🔍 Find a User Page</h3>
          <UserSearch onSearch={handleMenuClick} />
          </div>
        </div>

      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}