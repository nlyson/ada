// pages/create.tsx
import React from "react";
import Link from "next/link";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const CreateHub: React.FC<AppProps> = ({ user }) => {
  const createOptions = [
    {
      title: "Weekly Challenge",
      description: "Join this week's photography challenge and compete with the community",
      icon: "🎯",
      href: "/challenge",
      featured: true
    },
    {
      title: "Scavenger Hunt",
      description: "Complete photo missions and explore your creativity",
      icon: "🗺️", 
      href: "/scavenger_hunt",
      featured: true
    },
    {
      title: "Get Feedback",
      description: "Share your photos and receive constructive feedback from the community",
      icon: "💬",
      href: "/photo_feedback"
    },
    {
      title: "Upload to Gallery",
      description: "Add photos to your personal gallery and portfolio",
      icon: "📸",
      href: `/users/${user?.username}`,
      subtitle: "Go to your profile to upload"
    }
  ];

  const inspirationSection = [
    {
      title: "Featured Photos",
      description: "Get inspired by today's featured photography",
      icon: "⭐",
      href: "/featured_photos"
    },
    {
      title: "Challenge Gallery", 
      description: "Browse amazing submissions from other photographers",
      icon: "🎨",
      href: "/challenge_browser"
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
          Create & Share ✨
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "1.1rem" }}>
          Express your creativity and share your unique perspective with the world
        </p>
      </div>

      {/* Main Creation Options */}
      <div style={{
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
          What would you like to create today?
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {createOptions.map((option, index) => (
            <Link
              key={index}
              href={option.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.25rem",
                borderRadius: "12px",
                backgroundColor: option.featured ? "#fef3c7" : "#f9fafb",
                textDecoration: "none",
                color: "#374151",
                transition: "all 0.2s ease",
                border: option.featured ? "2px solid #f59e0b" : "1px solid #e5e7eb",
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
              <span style={{ fontSize: "2rem" }}>{option.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: "600", 
                  marginBottom: "0.25rem",
                  fontSize: "1.1rem"
                }}>
                  {option.title}
                  {option.featured && (
                    <span style={{
                      marginLeft: "0.5rem",
                      backgroundColor: "#f59e0b",
                      color: "white",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "700"
                    }}>
                      POPULAR
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: "1.4" }}>
                  {option.description}
                </div>
                {option.subtitle && (
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.25rem", fontStyle: "italic" }}>
                    {option.subtitle}
                  </div>
                )}
              </div>
              <span style={{ color: "#9ca3af", fontSize: "1.5rem" }}>→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Inspiration Section */}
      <div style={{
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
          Need Inspiration?
        </h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {inspirationSection.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
                textDecoration: "none",
                color: "#374151",
                transition: "all 0.2s ease",
                border: "1px solid #e5e7eb"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {item.description}
                </div>
              </div>
              <span style={{ color: "#9ca3af" }}>→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div style={{
        backgroundColor: "#e0f2fe",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid #0891b2"
      }}>
        <h3 style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          marginBottom: "0.75rem",
          color: "#0c4a6e",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          💡 Quick Tips for Great Photos
        </h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: "1.25rem", 
          color: "#0c4a6e",
          lineHeight: "1.5"
        }}>
          <li style={{ marginBottom: "0.5rem" }}>Use natural light when possible - golden hour is magical!</li>
          <li style={{ marginBottom: "0.5rem" }}>Follow the rule of thirds for better composition</li>
          <li style={{ marginBottom: "0.5rem" }}>Don`&apos;t be afraid to experiment with different angles</li>
          <li>Tell a story with your photos - what emotion do you want to convey?</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateHub;