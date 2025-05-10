import React, { useState, useEffect } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

type FeaturedPhoto = {
  username: string;
  photoUrl: string;
};

const FEATURED_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_featured_photos";

const FeaturedPhotos: React.FC = () => {
  const [photos, setPhotos] = useState<FeaturedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const result = await invokeLambdaIam({
          url: FEATURED_LAMBDA_URL,
          method: "POST", // IAM-protected Function URLs must use POST (or signed GET)
          body: {}, // empty payload if none needed
        });

        if (result.featuredPhotos) {
          setPhotos(result.featuredPhotos);
        } else {
          throw new Error(result.error || "Unknown error");
        }
      } catch (err: any) {
        console.error("Error fetching featured photos:", err);
        setError("Failed to load featured photos. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#bfbfbf",
        minHeight: "100vh",
        padding: "2rem 1rem",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ maxWidth: 800, width: "100%" }}>
        <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
          Featured Photos
        </h1>

        {loading && <p>Loading featured photos...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            justifyContent: "center",
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo.photoUrl}
              style={{
                backgroundColor: "white",
                color: "black",
                borderRadius: 8,
                padding: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                width: 200,
                textAlign: "center",
              }}
            >
              <img
                src={photo.photoUrl}
                alt={`Photo by ${photo.username}`}
                style={{
                  width: "100%",
                  height: 200,
                  objectFit: "cover",
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              />
              <div style={{ fontWeight: "bold" }}>{photo.username}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPhotos;
