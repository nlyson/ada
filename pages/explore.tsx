// pages/explore.tsx
import React from "react";
import Link from "next/link";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const ExploreHub: React.FC<AppProps> = ({ user }) => {
  const discoverySections = [
    {
      title: "Community Galleries",
      items: [
        {
          title: "Scavenger Gallery ✨ NEW",
          description: "Explore creative submissions from scavenger hunt challenges",
          icon: "🖼️",
          href: "/scavenger_browser",
          isNew: true
        },
        {
          title: "Challenge Gallery ✨ NEW", 
          description: "Browse amazing entries from weekly photography challenges",
          icon: "🎨",
          href: "/challenge_browser",
          isNew: true
        }
      ]
    },
    {
      title: "Leaderboards & Recognition",
      items: [
        {
          title: "High Scores",
          description: "See top performers and photography champions",
          icon: "🏆",
          href: "/scoreboard",
          isNew: false
        },
        {
          title: "Featured Photos",
          description: "Discover today's most impressive photography",
          icon: "⭐",
          href: "/featured_photos",
          isNew: false
        }
      ]
    },
    {
      title: "Community",
      items: [
        {
          title: "Browse Profiles",
          description: "Discover talented photographers and their portfolios",
          icon: "👥",
          href: "/browse_profiles",
          isNew: false
        },
        {
          title: "Challenge Archive",
          description: "Explore past photography challenges and themes",
          icon: "📋",
          href: "/challenges",
          isNew: false
        }
      ]
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ 
          fontSize: "1.75rem", 
          fontWeight: "700", 
          margin: "0 0 0.5rem 0",
          color: "#374151"
        }}>
          Explore & Discover 🔍
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "1.1rem" }}>
          Dive into the vibrant photography community and discover amazing work from talented creators
        </p>
      </div>

      {/* Discovery Sections */}
      {discoverySections.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: "#374151"
          }}>
            {section.title}
          </h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {section.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  backgroundColor: item.isNew ? "#f0f9ff" : "#f9fafb",
                  textDecoration: "none",
                  color: "#374151",
                  transition: "all 0.2s ease",
                  border: item.isNew ? "2px solid #0284c7" : "1px solid #e5e7eb",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "2rem" }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: "600", 
                    marginBottom: "0.25rem",
                    fontSize: "1.1rem"
                  }}>
                    {item.title}
                    {item.isNew && (
                      <span style={{
                        marginLeft: "0.5rem",
                        backgroundColor: "#0284c7",
                        color: "white",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "700"
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: "1.4" }}>
                    {item.description}
                  </div>
                </div>
                <span style={{ color: "#9ca3af", fontSize: "1.5rem" }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Trending Section */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        color: "white"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          margin: "0 0 1rem 0"
        }}>
          🔥 What`&apos;s Trending
        </h2>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          <div style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "1rem",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📸</div>
            <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Portrait Photography</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Stunning portrait submissions are taking over this week`&apos;s challenges
            </div>
          </div>
          <div style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "1rem",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🌅</div>
            <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Golden Hour</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Photographers are mastering the art of golden hour lighting
            </div>
          </div>
        </div>
      </div>

      {/* Tips for Exploration */}
      <div style={{
        backgroundColor: "#fef7ed",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid #fb923c"
      }}>
        <h3 style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          marginBottom: "0.75rem",
          color: "#9a3412",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          💡 Make the Most of Your Exploration
        </h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: "1.25rem", 
          color: "#9a3412",
          lineHeight: "1.5"
        }}>
          <li style={{ marginBottom: "0.5rem" }}>Leave thoughtful comments on photos you admire</li>
          <li style={{ marginBottom: "0.5rem" }}>Follow photographers whose style inspires you</li>
          <li style={{ marginBottom: "0.5rem" }}>Study composition techniques in high-scoring submissions</li>
          <li>Use the galleries as inspiration for your own photography projects</li>
        </ul>
      </div>
    </div>
  );
};

export default ExploreHub;