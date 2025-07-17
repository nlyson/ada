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
  badge?: number;
  condition?: boolean;
}

interface MenuSection {
  title: string;
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
      items: [
        { href: "/", label: "Home" },
        { href: `/users/${user?.username || ''}`, label: "My Profile", badge: unreadCount > 0 ? unreadCount : undefined, condition: !!user },
        { href: "/admin", label: "Admin Panel", condition: userRole === "admin" },
      ]
    },
    {
      title: "Create", 
      items: [
        { href: "/featured_photos", label: "Featured Photos" },
        { href: "/challenge", label: "Weekly Challenge" },
        { href: "/scavenger_hunt", label: "Scavenger Hunt" },
        { href: "/photo_feedback", label: "Get Feedback" },
      ]
    },
    {
      title: "Learn",
      items: [
        { href: "/daily_tip", label: "Daily Tips" },
        { href: "/learninghub", label: "Learning Hub" },
        { href: "/podcasts", label: "Podcast" },
      ]
    },
    {
      title: "Explore",
      items: [
        { href: "/challenges", label: "Challenge Archive" },
        { href: "/scavenger_browser", label: "Scavenger Gallery ✨ NEW" },
        { href: "/challenge_browser", label: "Challenge Gallery ✨ NEW" },
        { href: "/scoreboard", label: "High Scores" },
        { href: "/browse_profiles", label: "Browse Profiles" },
      ]
    },
    {
      title: "Account",
      items: [
        { href: "/settings", label: "Settings" },
        { href: "/feedback", label: "Report Issue" },
        { href: "/about_me", label: "About" },
      ]
    }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#efede4" }}>
      {/* Header */}
      <header style={{
        padding: "1rem",
        backgroundColor: "#44403c", 
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
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
          backgroundColor: "#8b7355",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          animation: "fadeIn 0.2s ease-out",
          overflowY: "auto"
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.5rem 2rem",
            borderBottom: "1px solid rgba(255,255,255,0.2)"
          }}>
            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: "700", 
              color: "white",
              margin: 0,
              letterSpacing: "-0.025em"
            }}>
              Photo Mentor
            </h1>
            <button
              onClick={() => setMenuOpen(false)}
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
              ✕
            </button>
          </div>

          {/* Menu Content */}
          <div style={{
            flex: 1,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            maxWidth: "400px",
            margin: "0 auto",
            width: "100%"
          }}>
            {/* User Search */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ 
                color: "white", 
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

            {/* Menu Sections */}
            <nav style={{
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              flex: 1
            }}>
              {menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  {/* Section Header */}
                  <h4 style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "1rem",
                    paddingLeft: "1rem"
                  }}>
                    {section.title}
                  </h4>
                  
                  {/* Section Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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
                            fontSize: "1.125rem",
                            fontWeight: "400",
                            padding: "0.75rem 1rem",
                            borderRadius: "8px",
                            transition: "all 0.2s ease",
                            backgroundColor: "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span style={{
                              backgroundColor: "#ef4444",
                              color: "white",
                              borderRadius: "50%",
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              minWidth: "1.5rem",
                              textAlign: "center"
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Sign Out */}
            {signOut && (
              <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <button
                  onClick={() => {
                    handleMenuClick();
                    signOut();
                  }}
                  style={{
                    width: "100%",
                    color: "white",
                    fontSize: "1.125rem",
                    fontWeight: "500",
                    padding: "1rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)"}
                >
                  Sign Out
                </button>
              </div>
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