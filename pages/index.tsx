import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #bfbfbf, #d9d9d9)",
        minHeight: "100vh",
        width: "100%",
        color: "#b76e79",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "1.5rem",
      }}
    >
      {/* Animated Logo Only */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "1rem",
        }}
      >
        <Image
          src="/jama_home_screen.png"
          alt="Company Logo"
          layout="responsive"
          width={400}
          height={400}
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