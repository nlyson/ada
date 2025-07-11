import React, { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

type PodcastEpisode = {
  title: string;
  buzzsproutId: string;
};

type PodcastPageProps = {
  signOut: () => void;
  user: { username: string };
};

// ⛳ Change this to your Lambda URL
const PODCAST_FEED_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetchPodcastFeed";

const PodcastPage: React.FC<PodcastPageProps> = ({ signOut, user }) => {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Retry with exponential backoff
  const fetchFeedWithRetry = async (attempt: number = 1, maxAttempts: number = 3): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      
      console.log(`🎧 Attempting to fetch podcast feed (attempt ${attempt}/${maxAttempts})`);
      
      const xmlText = await invokeLambdaIam({
        url: PODCAST_FEED_URL,
        method: "GET",
        responseType: "text", // important: don't try to parse as JSON
      });        

      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "application/xml");

      // Check for XML parsing errors
      const parseError = xml.querySelector("parsererror");
      if (parseError) {
        throw new Error("Failed to parse XML response");
      }

      const items = Array.from(xml.querySelectorAll("item"));
      
      if (items.length === 0) {
        throw new Error("No podcast episodes found in feed");
      }

      const parsedEpisodes: PodcastEpisode[] = items.map((item) => {
        const title = item.querySelector("title")?.textContent || "Untitled";
        const enclosureUrl = item.querySelector("enclosure")?.getAttribute("url") || "";

        // Extract Buzzsprout episode ID from URL
        const match = enclosureUrl.match(/buzzsprout\.com\/\d+\/episodes\/(\d+)/);
        const buzzsproutId = match ? match[1] : "";

        return { title, buzzsproutId };
      });

      const validEpisodes = parsedEpisodes.filter(ep => ep.buzzsproutId);
      
      if (validEpisodes.length === 0) {
        throw new Error("No valid episodes with Buzzsprout IDs found");
      }

      setEpisodes(validEpisodes);
      setRetryCount(0);
      console.log(`✅ Successfully loaded ${validEpisodes.length} podcast episodes`);
      
    } catch (err: any) {
      console.error(`❌ Error loading podcast feed (attempt ${attempt}):`, err);
      
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);
        setRetryCount(attempt);
        
        setTimeout(() => {
          fetchFeedWithRetry(attempt + 1, maxAttempts);
        }, delay);
      } else {
        setError(`Failed to load podcast feed after ${maxAttempts} attempts. Please try refreshing the page.`);
        setRetryCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual retry function
  const handleRetry = () => {
    setRetryCount(0);
    fetchFeedWithRetry();
  };

  useEffect(() => {
    fetchFeedWithRetry();
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
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>
          🎙️ Brand Building: Living The Whole Picture with Jama Pantel
        </h1>

        {/* Loading State */}
        {loading && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>🎧</div>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>Loading podcast episodes...</p>
            {retryCount > 0 && (
              <p style={{ fontSize: "14px", opacity: 0.8 }}>
                Retry attempt {retryCount} of 3
              </p>
            )}
            <div style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "16px auto"
            }} />
          </div>
        )}

        {/* Error State with Retry Button */}
        {error && !loading && (
          <div style={{ 
            padding: "32px", 
            backgroundColor: "rgba(220, 53, 69, 0.2)", 
            border: "1px solid rgba(220, 53, 69, 0.4)",
            borderRadius: "8px",
            marginBottom: "24px"
          }}>
            <p style={{ color: "#ff6b6b", marginBottom: "16px", fontSize: "16px" }}>{error}</p>
            <button
              onClick={handleRetry}
              style={{
                padding: "12px 24px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0056b3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#007bff";
              }}
            >
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Success State - Episodes */}
        {episodes.length > 0 && !loading && (
          <>
            <div style={{ 
              marginBottom: "32px", 
              padding: "16px", 
              backgroundColor: "rgba(40, 167, 69, 0.2)",
              border: "1px solid rgba(40, 167, 69, 0.4)",
              borderRadius: "8px"
            }}>
              <p style={{ margin: 0, color: "#28a745" }}>
                ✅ Successfully loaded {episodes.length} episodes
              </p>
            </div>

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
                  onError={() => {
                    console.warn(`Failed to load iframe for episode: ${ep.title}`);
                  }}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* CSS Animation for Loading Spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PodcastPage;