import React from "react";
import Image from "next/image";

const AboutPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>About Me</h1>
      <div style={styles.content}>
        <div style={styles.imageWrapper}>
          <Image
            src="/jama_home_screen.png" // Place an image in the public/ folder with this name
            alt="Profile"
            width={200}
            height={200}
            style={{ borderRadius: "10px" }}
          />
        </div>
        <div style={styles.text}>
          <p>
            Hello! I'm <strong>Your Name</strong>, a passionate photographer and software developer.
            I love capturing the world through a creative lens and sharing tools that help others grow their skills.
          </p>
          <p>
            This app is my personal project to combine tech and art. Stay tuned for more features,
            and feel free to reach out!
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  heading: {
    fontSize: "2rem",
    textAlign: "center",
    marginBottom: "2rem",
  },
  content: {
    display: "flex",
    alignItems: "flex-start",
    gap: "2rem",
    flexWrap: "wrap",
  },
  imageWrapper: {
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: "1.1rem",
    lineHeight: "1.6",
  },
};

export default AboutPage;
