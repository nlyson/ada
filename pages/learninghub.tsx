// pages/learninghub.tsx

import React from "react";

type LearningResource = {
  title: string;
  description: string;
  link: string;
};

const resources: LearningResource[] = [
  {
    title: "PICTURE THIS",
    description: "E-BOOK: QUICK TIPS FOR TAKING SOCIAL MEDIA PORTRAITS",
    link: "https://jamapantel.myflodesk.com/ebook",
  },
  {
    title: "STRIKE A POSE",
    description: "LOOK YOUR BEST & FEEL CONFIDENT ON CAMERA",
    link: "https://jamapantel.myflodesk.com/strike-a-pose",
  },
  {
    title: "CONFIDENCE on CAMERA",
    description: "VIDEO REPLAY: PRACTICAL EXERCISES FOR BEING CONFIDENT ON CAMERA",
    link: "https://checkout.square.site/merchant/6BDM5B4Y9XQG3/checkout/KWGUVVXLUPBIBR46WHQQYABK",
  },
];

export default function LearningHub() {
  return (
    <div style={{
      padding: "1rem",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4f8, #e2eafc)", // subtle gradient
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h1 style={{
        textAlign: "center",
        marginBottom: "2rem",
        fontSize: "2rem",
        color: "#333",
      }}>
        📚 Learning Hub
      </h1>
      <div style={{ width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {resources.map((resource, index) => (
          <a
            key={index}
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              color: "inherit",
              position: "relative",
              overflow: "hidden",
              borderRadius: "1rem",
            }}
            onMouseDown={(e) => {
              const ripple = document.createElement("span");
              ripple.style.position = "absolute";
              ripple.style.width = ripple.style.height = "100px";
              ripple.style.background = "rgba(0, 0, 0, 0.1)";
              ripple.style.borderRadius = "50%";
              ripple.style.pointerEvents = "none";
              ripple.style.left = `${e.nativeEvent.offsetX - 50}px`;
              ripple.style.top = `${e.nativeEvent.offsetY - 50}px`;
              ripple.style.transform = "scale(0)";
              ripple.style.opacity = "1";
              ripple.style.transition = "transform 0.6s ease, opacity 0.6s ease";
              e.currentTarget.appendChild(ripple);

              setTimeout(() => {
                ripple.style.transform = "scale(3)";
                ripple.style.opacity = "0";
              }, 10);

              setTimeout(() => {
                ripple.remove();
              }, 600);
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                padding: "1.5rem",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
              }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#222" }}>
                📖 {resource.title}
              </h2>
              <p style={{ fontSize: "1rem", color: "#555" }}>
                {resource.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}