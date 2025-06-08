import React, { useState } from "react";
import PhotoModal from "@/components/PhotoModal";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const DELETE_CHALLENGE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/delete_challenge_submission";


type ChallengePhoto = {
  imageUrl: string;
  caption?: string;
  challengeId?: string;
  score?: number;
  feedback?: string;
  title?: string; // challenge name/title
};
type Props = {
  photos: ChallengePhoto[];
  loading: boolean;
  username: string;
  isOwner: boolean;
  onDeleteSuccess: (challengeId: string) => void;
};

const ChallengeSubmissions: React.FC<Props> = ({ photos, loading, username, isOwner, onDeleteSuccess }) => {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const handleDelete = async (challengeId: string) => {
    if (!confirm("Are you sure you want to delete this challenge submission?")) return;

    try {
      await invokeLambdaIam({
        url: DELETE_CHALLENGE_URL,
        method: "POST",
        body: {
          username,
          challengeId,
        },
      });

      onDeleteSuccess(challengeId); // caller updates local state
    } catch (err) {
      alert("Failed to delete submission.");
      console.error(err);
    }
  };

  return (
    <div style={{ marginTop: 32, marginBottom: 48 }}>
      <h2>📷 Challenge Submissions</h2>

      {loading ? (
        <p>Loading...</p>
      ) : photos.length === 0 ? (
        <p>No photos yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {photos.map((photo, i) => (
            <div key={i} style={{ textAlign: "center", backgroundColor: "#f9f9f9", padding: 8, borderRadius: 8 }}>
              <img
                src={photo.imageUrl}
                alt={photo.caption}
                onClick={() => setSelectedPhotoUrl(photo.imageUrl)}
                style={{ width: "100%", borderRadius: 8, cursor: "zoom-in" }}
              />
              {photo.title && <p style={{ margin: "8px 0 4px", fontWeight: "bold" }}>{photo.title}</p>}
              {photo.caption && <p style={{ margin: "4px 0" }}>{photo.caption}</p>}
              {photo.score !== undefined && <p style={{ margin: "4px 0" }}>🧮 Score: {photo.score}</p>}
              {photo.feedback && (
                <p style={{ margin: "4px 0", fontSize: 12, color: "#555" }}>
                  📝 {photo.feedback}
                </p>
              )}
              {isOwner && photo.challengeId && (
                <button
                  onClick={() => handleDelete(photo.challengeId!)}
                  style={{
                    marginTop: 6,
                    padding: "4px 8px",
                    fontSize: 12,
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  🗑 Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPhotoUrl && (
        <PhotoModal imageUrl={selectedPhotoUrl} onClose={() => setSelectedPhotoUrl(null)} />
      )}
    </div>
  );
};

export default ChallengeSubmissions;
