import Link from "next/link";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <header style={{ padding: "1rem", backgroundColor: "#333", color: "#fff" }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ fontSize: "1.5rem" }}>
          ☰
        </button>
        {menuOpen && (
          <nav style={{ marginTop: "1rem" }}>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/photo_feedback">Photo Feedback</Link></li>
              <li><Link href="/page2">Daily Photography Tip</Link></li>
              <li><Link href="/page3">Page 3 - TODO</Link></li>
            </ul>
          </nav>
        )}
      </header>
      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}