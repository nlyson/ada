// pages/learn.tsx
import React from "react";
import Link from "next/link";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const LearnHub: React.FC<AppProps> = ({ user }) => {
  const learningPaths = [
    {
      title: "Daily Learning",
      description: "Build your skills one tip at a time",
      items: [
        {
          title: "Daily Tips",
          description: "Get a new photography tip every day to improve your craft",
          icon: "💡",
          href: "/daily_tip",
          featured: true
        }
      ]
    },
    {
      title: "Comprehensive Learning",
      description: "Deep dive into photography mastery",
      items: [
        {
          title: "Learning Hub",
          description: "Structured courses and tutorials for all skill levels",
          icon: "📚",
          href: "/learninghub",
          featured: false
        },
        {
          title: "Photography Podcast",
          description: "Listen to expert discussions and photography insights",
          icon: "🎧",
          href: "/podcasts",
          featured: false
        }
      ]
    }
  ];

  const skillAreas = [
    {
      title: "Camera Basics",
      icon: "📷",
      topics: ["Aperture & F-stops", "Shutter Speed", "ISO Settings", "Manual Mode"]
    },
    {
      title: "Composition",
      icon: "🎨", 
      topics: ["Rule of Thirds", "Leading Lines", "Framing", "Symmetry"]
    },
    {
      title: "Lighting",
      icon: "💡",
      topics: ["Natural Light", "Golden Hour", "Blue Hour", "Indoor Lighting"]
    },
    {
      title: "Post-Processing",
      icon: "✨",
      topics: ["Color Correction", "Exposure Adjustment", "Cropping", "Filters"]
    }
  ];

  const quickTips = [
    "📸 Clean your lens regularly for sharper photos",
    "🌅 Shoot during golden hour for warm, flattering light",
    "📐 Use the rule of thirds to create more dynamic compositions",
    "👁️ Focus on the eyes when photographing people or animals",
    "📱 Don't be afraid to take multiple shots of the same subject"
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
          Learn & Grow 📚
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "1.1rem" }}>
          Master the art of photography with expert guidance, daily tips, and comprehensive resources
        </p>
      </div>

      {/* Learning Paths */}
      {learningPaths.map((path, pathIndex) => (
        <div key={pathIndex} style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              margin: "0 0 0.25rem 0",
              color: "#374151"
            }}>
              {path.title}
            </h2>
            <p style={{ color: "#6b7280", margin: 0, fontSize: "0.95rem" }}>
              {path.description}
            </p>
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {path.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  backgroundColor: item.featured ? "#f0fdf4" : "#f9fafb",
                  textDecoration: "none",
                  color: "#374151",
                  transition: "all 0.2s ease",
                  border: item.featured ? "2px solid #16a34a" : "1px solid #e5e7eb"
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
                    {item.featured && (
                      <span style={{
                        marginLeft: "0.5rem",
                        backgroundColor: "#16a34a",
                        color: "white",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "700"
                      }}>
                        DAILY
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

      {/* Skill Areas */}
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
          Core Photography Skills
        </h2>
        <div style={{ 
          display: "grid", 
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
        }}>
          {skillAreas.map((area, areaIndex) => (
            <div key={areaIndex} style={{
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              padding: "1rem",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                <span style={{ fontSize: "1.5rem" }}>{area.icon}</span>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  margin: 0,
                  color: "#374151"
                }}>
                  {area.title}
                </h3>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: "1rem",
                color: "#6b7280",
                fontSize: "0.9rem"
              }}>
                {area.topics.map((topic, topicIndex) => (
                  <li key={topicIndex} style={{ marginBottom: "0.25rem" }}>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div style={{
        backgroundColor: "#fffbeb",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid #fbbf24"
      }}>
        <h3 style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#92400e",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          ⚡ Quick Photography Tips
        </h3>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {quickTips.map((tip, tipIndex) => (
            <div key={tipIndex} style={{
              backgroundColor: "rgba(255,255,255,0.7)",
              borderRadius: "8px",
              padding: "1rem",
              color: "#92400e",
              fontSize: "0.95rem",
              fontWeight: "500"
            }}>
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Motivation Section */}
      <div style={{
        background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        color: "white",
        textAlign: "center"
      }}>
        <h3 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "0.75rem",
          margin: "0 0 0.75rem 0"
        }}>
          📈 Your Learning Journey
        </h3>
        <p style={{
          fontSize: "1rem",
          opacity: 0.9,
          marginBottom: "1rem",
          margin: "0 0 1rem 0",
          lineHeight: "1.5"
        }}>
          Every great photographer started as a beginner. With consistent practice and learning, 
          you`&apos;ll develop your unique style and technical expertise.
        </p>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: "8px",
          padding: "0.75rem",
          fontSize: "0.9rem",
          backdropFilter: "blur(10px)"
        }}>
          💡 <strong>Pro Tip:</strong> Try to learn one new technique each week and practice it in your daily photography
        </div>
      </div>
    </div>

)};

export default LearnHub;
