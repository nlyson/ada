import React from "react";
import Image from "next/image";

const AboutPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>About Jama Pantel</h1>
      <div style={styles.content}>
        <div style={styles.imageWrapper}>
          <Image
            src="/jama_home_screen.png"
            alt="Jama Pantel"
            width={600}
            height={0} // Let it scale proportionally
            style={{ width: "100%", height: "auto", borderRadius: "10px" }}
          />
        </div>
        <div style={styles.text}>
          <p>
            Hi, I&apos;m <strong>Jama Pantel</strong>. A portrait photographer, educator, author, podcaster,
            and former influencer with over 30 years of experience behind the lens.
          </p>
          <p>
            With the help of an amazing friend, and genius software engineer, we created <strong>Photo Mentor</strong> to help anyone—no matter their experience level—take better, more intentional photos using simple techniques that work.
          </p>
          <p>
            Whether you&apos;re capturing people, places, or everyday moments, this app is designed to guide you with expert tips, feedback, and easy-to-follow tools that make photography feel less overwhelming and way more fun.
            Plus, who doesn&apos;t love a little friendly competition with our weekly photo challenge? You can use the daily tips to help guide you to get better images.
          </p>
          <p>
            <strong>Photo Mentor</strong> makes it easier than ever for anyone to create strong, beautiful images.
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
    flexDirection: "column", // Stacks vertically for mobile first
    gap: "2rem",
  },
  imageWrapper: {
    width: "100%", // Full width to scale down
  },
  text: {
    fontSize: "1.1rem",
    lineHeight: "1.6",
  },
};

export default AboutPage;
