import Link from "next/link";
import { useState, useEffect } from "react";
import UserSearch from "@/components/UserSearch";
import { useUnread } from "@/context/UnreadContext";
import { Amplify } from 'aws-amplify';

// Comment to force build

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
    console.log("👀 Layout loaded. user:", user?.username, "role:", userRole);
    console.log('🔧 DEPLOYED Amplify Config:', Amplify.getConfig());
    console.log('🔧 DEPLOYED Auth Config:', Amplify.getConfig().Auth);
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

      {/* Full-Screen Overlay Menu */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "linear-gradient(135deg, #c08497, #e4a5b5, #f0c7d0)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: menuOpen ? "fadeIn 0.3s ease-in-out" : "fadeOut 0.3s ease-in-out",
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              fontSize: "2rem",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              zIndex: 1001,
            }}
          >
            ✕
          </button>

          {/* App Title */}
          <h1 style={{
            fontSize: "3rem",
            fontWeight: "bold",
            color: "white",
            marginBottom: "2rem",
            textAlign: "center",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          }}>
            Photo<br />Mentor
          </h1>

          {/* Menu Items */}
          <nav style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            maxHeight: "60vh",
            overflowY: "auto",
            width: "100%",
          }}>
            {/* User Search */}
            <div style={{ marginBottom: "1rem", width: "80%", maxWidth: "300px" }}>
              <h3 style={{ color: "white", textAlign: "center", marginBottom: "0.5rem", fontSize: "1.2rem" }}>
                🔍 Find a User Page
              </h3>
              <UserSearch onSearch={handleMenuClick} />
            </div>

            {/* Browse Profiles */}
            <div style={{ marginBottom: "2rem", textAlign: "center" }}>
              <Link href="/browse_profiles" onClick={handleMenuClick} style={{
                color: "white",
                textDecoration: "none",
                fontSize: "1.1rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "inline-block",
              }}>
                📇 Browse Profiles
              </Link>
            </div>

            {/* Group 1: Main Navigation */}
            <Link href="/" onClick={handleMenuClick} style={menuItemStyle}>
              Home
            </Link>

            {user && (
              <Link href={`/users/${user.username}`} onClick={handleMenuClick} style={menuItemStyle}>
                My Profile
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
            )}

            {userRole === "admin" && (
              <Link href="/admin" onClick={handleMenuClick} style={menuItemStyle}>
                Admin Panel
              </Link>
            )}

            {/* Separator */}
            <div style={{ 
              width: "200px", 
              height: "3px", 
              backgroundColor: "white", 
              margin: "1.5rem auto",
              borderRadius: "2px",
              border: "1px solid white"
            }}></div>

            {/* Group 2: Engage Section */}
            <Link href="/featured_photos" onClick={handleMenuClick} style={menuItemStyle}>
              Featured Photos
            </Link>
            <Link href="/challenge" onClick={handleMenuClick} style={menuItemStyle}>
              Weekly Challenge
            </Link>
            <Link href="/scavenger_hunt" onClick={handleMenuClick} style={menuItemStyle}>
              Scavenger Hunt
            </Link>
            <Link href="/photo_feedback" onClick={handleMenuClick} style={menuItemStyle}>
              Get Photo Feedback
            </Link>

            {/* Separator */}
            <div style={{ 
              width: "200px", 
              height: "3px", 
              backgroundColor: "white", 
              margin: "1.5rem auto",
              borderRadius: "2px",
              border: "1px solid white"
            }}></div>

            {/* Group 3: Learn Section */}
            <Link href="/daily_tip" onClick={handleMenuClick} style={menuItemStyle}>
              Daily Tips
            </Link>
            <Link href="/learninghub" onClick={handleMenuClick} style={menuItemStyle}>
              Learning Hub
            </Link>
            <Link href="/podcasts" onClick={handleMenuClick} style={menuItemStyle}>
              Podcast
            </Link>

            {/* Separator */}
            <div style={{ 
              width: "200px", 
              height: "3px", 
              backgroundColor: "white", 
              margin: "1.5rem auto",
              borderRadius: "2px",
              border: "1px solid white"
            }}></div>

            {/* Group 4: Explore Section */}
            <Link href="/challenges" onClick={handleMenuClick} style={menuItemStyle}>
              Challenge Archive
            </Link>
            <Link href="/scoreboard" onClick={handleMenuClick} style={menuItemStyle}>
              High Scores
            </Link>

            {/* Separator */}
            <div style={{ 
              width: "200px", 
              height: "3px", 
              backgroundColor: "white", 
              margin: "1.5rem auto",
              borderRadius: "2px",
              border: "1px solid white"
            }}></div>

            {/* Group 5: Settings & Actions */}
            <Link href="/about_me" onClick={handleMenuClick} style={menuItemStyle}>
              About Me
            </Link>
            <Link href="/settings" onClick={handleMenuClick} style={menuItemStyle}>
              Settings
            </Link>
            <Link href="/feedback" onClick={handleMenuClick} style={menuItemStyle}>
              Report a Bug
            </Link>

            {/* Separator */}
            <div style={{ 
              width: "200px", 
              height: "3px", 
              backgroundColor: "white", 
              margin: "1.5rem auto",
              borderRadius: "2px",
              border: "1px solid white"
            }}></div>

            {/* Group 6: Sign Out */}
            {signOut && (
              <button
                onClick={() => {
                  handleMenuClick();
                  signOut();
                }}
                style={{
                  ...menuItemStyle,
                  backgroundColor: "rgba(230, 57, 70, 0.8)",
                  border: "1px solid rgba(230, 57, 70, 0.9)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(214, 40, 57, 0.9)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(230, 57, 70, 0.8)")}
              >
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}

      <main style={{ padding: "1rem" }}>{children}</main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const menuItemStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "1.3rem",
  fontWeight: "400",
  padding: "0.8rem 2rem",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  maxWidth: "300px",
  transition: "all 0.2s ease",
  borderRadius: "0",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
};