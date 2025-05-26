import React, { useState } from "react";
import PhotoModal from "@/components/PhotoModal";


type ChallengePhoto = {
  imageUrl: string;
  caption?: string;
};

type Props = {
  photos: ChallengePhoto[];
  loading: boolean;
};

const ChallengeSubmissions: React.FC<Props> = ({ photos, loading }) => {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 32, marginBottom: 48 }}>
      <h2>📷 Challenge Submissions</h2>

      {loading ? (
        <p>Loading...</p>
      ) : photos.length === 0 ? (
        <p>No photos yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          {photos.map((photo, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <img
                src={photo.imageUrl}
                alt={photo.caption}
                onClick={() => setSelectedPhotoUrl(photo.imageUrl)}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  cursor: "zoom-in",
                }}
              />
              {photo.caption && (
                <p style={{ marginTop: 4 }}>{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedPhotoUrl && (
        <PhotoModal
          imageUrl={selectedPhotoUrl}
          onClose={() => setSelectedPhotoUrl(null)}
        />
      )}
    </div>
  );
};

export default ChallengeSubmissions;
