import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #f0f0f0, #e6e6e6)",
        minHeight: "100vh",
        width: "100%",
        color: "#b76e79",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "'Helvetica Neue', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <Image
          src="/picture_mentor.png"
          alt="Company Logo"
          layout="responsive"
          width={400}
          height={400}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "1.5rem",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          }}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          fontSize: "2rem",
          marginTop: "2rem",
          marginBottom: "0.5rem",
          fontWeight: 700,
        }}
      >
        Photo Mentor 📸
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{
          fontSize: "1.1rem",
          maxWidth: "600px",
          marginBottom: "2rem",
          padding: "0 1rem",
        }}
      >
        Get expert feedback on your photos, explore challenges, and become a better photographer — one snapshot at a time.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        style={{
          backgroundColor: "#b76e79",
          color: "#fff",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "2rem",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
        onClick={() => window.location.href = "/analyze"} // or any route you want
      >
        Get Started
      </motion.button>
    </div>
  );
}