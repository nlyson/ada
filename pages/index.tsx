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
          src="/photo_mentor_home.png"
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
    </div>
  );
}