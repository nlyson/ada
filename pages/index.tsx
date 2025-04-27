import Image from "next/image";
import { motion } from "framer-motion"; // ✨ Import Motion

export default function Home() {
  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #bfbfbf, #d9d9d9)",
        minHeight: "100vh",
        color: "#b76e79",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "1.5rem",
      }}
    >
      {/* Animated Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
          fontSize: "2.2rem",
          fontWeight: 600,
          letterSpacing: "0.5px",
          marginBottom: "1.2rem",
        }}
      >
        Picture <span style={{ fontStyle: "italic", fontWeight: 400 }}>This</span>
      </motion.h1>

      {/* Animated Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        style={{
          width: "80%",
          maxWidth: "300px",
        }}
      >
        <Image
          src="/jama_logo.png"
          alt="Company Logo"
          width={300}
          height={300}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "1rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        />
      </motion.div>
    </div>
  );
}
