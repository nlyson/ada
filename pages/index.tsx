import Image from "next/image";


export default function Home() {
  return (
  
    <div style={{ backgroundColor: "#bfbfbf", minHeight: "100vh", color: "white", textAlign: "center", padding: "2rem" }}>
      <h1 style={{
          fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
          fontSize: "3rem",
          color: "#b76e79",
          fontWeight: 600,
          letterSpacing: "1px",
        }}>
          Picture <span style={{ fontStyle: "italic", fontWeight: 400 }}>This</span>
      </h1>
      <Image
        src="/jama_logo.png"
        alt="Company Logo"
        width={400}
        height={400}
      />
    </div>
  );
}