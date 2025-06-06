import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #f7f7f7, #eaeaea)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Helvetica Neue', sans-serif",
        textAlign: "center",
        color: "#333",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        style={{
          maxWidth: 500,
          width: "100%",
        }}
      >
        <Image
          src="/photo_mentor_home.png"
          alt="Photo Mentor Logo"
          width={400}
          height={400}
          priority
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "1.5rem",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
          }}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          marginTop: "2rem",
          fontSize: "2rem",
          color: "#b76e79",
          fontWeight: "bold",
        }}
      >
        Welcome to Photo Mentor
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          maxWidth: 480,
          marginTop: "1rem",
          fontSize: "1rem",
          color: "#555",
          lineHeight: 1.5,
        }}
      >
        Submit your best shots. Compete in challenges. Grow as a photographer.
      </motion.p>
    </div>
  );
}
