import React, { useEffect, useState } from "react";

type PodcastEpisode = {
  title: string;
  buzzsproutId: string;
};

type PodcastPageProps = {
  signOut: () => void;
  user: { username: string };
};

// ⛳ Change this to your Lambda URL
const PODCAST_FEED_URL = "https://7mkh77a56lyimluguwh6reh6rm0swncy.lambda-url.us-east-1.on.aws/fetchPodcastFeed";

const PodcastPage: React.FC<PodcastPageProps> = ({ signOut, user }) => {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch(PODCAST_FEED_URL);
        const xmlText = await response.text();
        console.log("📥 RSS Feed received", xmlText.slice(0, 200));

        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");

        const items = Array.from(xml.querySelectorAll("item"));
        const parsedEpisodes: PodcastEpisode[] = items.map((item) => {
          const title = item.querySelector("title")?.textContent || "Untitled";
          const enclosureUrl = item.querySelector("enclosure")?.getAttribute("url") || "";

          console.log("🎯 Enclosure URL:", enclosureUrl);

          // Extract Buzzsprout episode ID from URL
          const match = enclosureUrl.match(/buzzsprout\.com\/\d+\/episodes\/(\d+)/);
          const buzzsproutId = match ? match[1] : "";

          return { title, buzzsproutId };
        });

        console.log("✅ Parsed Episodes:", parsedEpisodes);
        setEpisodes(parsedEpisodes.filter(ep => ep.buzzsproutId));
      } catch (err) {
        console.error("❌ Error loading or parsing podcast feed:", err);
        setError("Failed to load podcast feed.");
      }
    };

    fetchFeed();
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#bfbfbf",
        color: "white",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>🎙️ Brand Building: Living The Whole Picture with Jama Pantel</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {episodes.map((ep, idx) => (
          <div key={idx} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>{ep.title}</h2>
            <iframe
              src={`https://www.buzzsprout.com/2340106/${ep.buzzsproutId}?client_source=small_player&iframe=true`}
              loading="lazy"
              width="100%"
              height="200"
              frameBorder="0"
              scrolling="no"
              title={ep.title}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodcastPage;
