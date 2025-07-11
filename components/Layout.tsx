import Link from "next/link";
import { useState, useEffect } from "react";
import UserSearch from "@/components/UserSearch";
import { useUnread } from "@/context/UnreadContext";
import { Amplify } from 'aws-amplify';

type LayoutProps = {
  children: React.ReactNode;
  signOut?: () => void;
  user?: { username: string };
  userRole?: string;
};

interface MenuItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  condition?: boolean;
}

interface MenuSection {
  title: string;
  icon: string;
  items: MenuItem[];
}

export default function Layout({ children, signOut, user, userRole }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount } = useUnread();

  const handleMenuClick = () => setMenuOpen(false);

  useEffect(() => {
    console.log("👀 Layout loaded. user:", user?.username, "role:", userRole);
    console.log('🔧 DEPLOYED Amplify Config:', Amplify.getConfig());
    console.log('🔧 DEPLOYED Auth Config:', Amplify.getConfig().Auth);
  }, [userRole]);

  const menuSections: MenuSection[] = [
    {
      title: "Navigate",
      icon: "🧭",
      items: [
        { href: "/", label: "Home", icon: "🏠" },
        { href: `/users/${user?.username || ''}`, label: "My Profile", icon: "👤", badge: unreadCount > 0 ? unreadCount : undefined, condition: !!user },
        { href: "/admin", label: "Admin Panel", icon: "⚙️", condition: userRole === "admin" },
      ]
    },
    {
      title: "Engage", 
      icon: "✨",
      items: [
        { href: "/featured_photos", label: "Featured Photos", icon: "⭐" },
        { href: "/challenge", label: "Weekly Challenge", icon: "🏆" },
        { href: "/scavenger_hunt", label: "Scavenger Hunt", icon: "🔍" },
        { href: "/photo_feedback", label: "Get Photo Feedback", icon: "💬" },
      ]
    },
    {
      title: "Learn",
      icon: "📚", 
      items: [
        { href: "/daily_tip", label: "Daily Tips", icon: "💡" },
        { href: "/learninghub", label: "Learning Hub", icon: "🎓" },
        { href: "/podcasts", label: "Podcast", icon: "🎧" },
      ]
    },
    {
      title: "Explore",
      icon: "🌟",
      items: [
        { href: "/challenges", label: "Challenge Archive", icon: "📁" },
        { href: "/scoreboard", label: "High Scores", icon: "🏅" },
      ]
    },
    {
      title: "Settings",
      icon: "🔧",
      items: [
        { href: "/about_me", label: "About Me", icon: "ℹ️" },
        { href: "/settings", label: "Settings", icon: "⚙️" },
        { href: "/feedback", label: "Report a Bug", icon: "🐛" },
      ]
    }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#B76E79" }}>
      {/* Header */}
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
            fontSize: "1.5rem",
            background: "none",
            border: "none", 
            color: "white",
            cursor: "pointer",
            padding: "0.5rem",
            borderRadius: "4px",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          ☰
        </button>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0 }}>Photo Mentor</h1>
        <div style={{ width: "2.5rem" }}></div> {/* Spacer for balance */}
      </header>

      {/* Full-Screen Overlay Menu */}
      {menuOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0, 
          width: "100vw",
          height: "100vh",
          backgroundColor: "#B76E79",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          animation: menuOpen ? "fadeIn 0.3s ease-in-out" : "fadeOut 0.3s ease-in-out",
        }}>
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
            maxWidth: "400px",
            margin: "0 auto",
            width: "100%"
          }}>
            {/* User Search */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{
                marginBottom: "1rem",
                fontSize: "1rem",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Search Users
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

            {/* Menu Sections */}
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Header */}
                <div style={{
                  display: "flex", 
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "1.5rem 0 0.5rem 0",
                  color: "white",
                  fontSize: "1.1rem",
                  fontWeight: "bold"
                }}>
                  <span style={{ marginRight: "0.5rem" }}>{section.icon}</span>
                  {section.title}
                </div>
                
                {/* Section Items */}
                {section.items.map((item, itemIndex) => {
                  if (item.condition === false) return null;
                  
                  return (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      onClick={handleMenuClick}
                      style={{
                        color: "white",
                        textDecoration: "none",
                        fontSize: "1.3rem",
                        fontWeight: "400",
                        padding: "0.8rem 2rem",
                        textAlign: "center",
                        display: "block",
                        width: "100%",
                        maxWidth: "300px",
                        transition: "all 0.2s ease",
                        borderRadius: "0",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ marginRight: "0.5rem" }}>{item.icon}</span>
                      {item.label}
                      {item.badge && (
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
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Separator */}
                <div style={{ 
                  width: "200px", 
                  height: "3px", 
                  backgroundColor: "white", 
                  margin: "1.5rem auto",
                  borderRadius: "2px",
                  border: "1px solid white"
                }} />
              </div>
            ))}

            {/* Sign Out */}
            {signOut && (
              <button
                onClick={() => {
                  handleMenuClick();
                  signOut();
                }}
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontSize: "1.3rem",
                  fontWeight: "400",
                  padding: "0.8rem 2rem",
                  textAlign: "center",
                  display: "block",
                  width: "100%",
                  maxWidth: "300px",
                  transition: "all 0.2s ease",
                  borderRadius: "0",
                  backgroundColor: "rgba(230, 57, 70, 0.8)",
                  border: "1px solid rgba(230, 57, 70, 0.9)",
                  cursor: "pointer",
                }}
              >
                🚪 Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      <main style={{ padding: "1rem" }}>{children}</main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}