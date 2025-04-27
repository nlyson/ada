import React, { useState, useEffect, ChangeEvent } from "react";
import { uploadData, list, getUrl, remove } from 'aws-amplify/storage';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json';

Amplify.configure(amplifyConfig);

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const MAX_UPLOADS = 10;

const Creations: React.FC<AppProps> = ({ signOut, user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [uploads, setUploads] = useState<string[]>([]);
  const [uploadUrls, setUploadUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const userFolder = `user-creations/${user.username}/`;

  useEffect(() => {
    fetchUploads();
  }, []);

  async function handleDelete(path: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this photo?");
    if (!confirmDelete) return;
  
    try {
      await remove({ path });
      await fetchUploads();
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  }

  async function fetchUploads() {
    try {
      const { items } = await list({ path: userFolder });
      const paths = items.map((item: { path: string }) => item.path);
      setUploads(paths);

      const urls = await Promise.all(
        paths.map(async (path: string) => {
          const { url } = await getUrl({ path });
          return url.href;
        })
      );
      setUploadUrls(urls);
    } catch (err) {
      console.error("Error listing uploads:", err);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    } else {
      setImage(null);
    }
  }

  async function handleUpload() {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    if (uploads.length >= MAX_UPLOADS) {
      alert(`You can only upload up to ${MAX_UPLOADS} creations.`);
      return;
    }

    setLoading(true);

    try {
      const fileName = `${Date.now()}_${image.name}`;
      const path = `${userFolder}${fileName}`;

      await uploadData({
        path,
        data: image,
        options: { contentType: image.type },
      }).result;

      await fetchUploads();
      setImage(null);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
      <h1>Upload Your Creations</h1>

      <p>You have uploaded {uploads.length} of {MAX_UPLOADS} allowed photos.</p>

      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={uploads.length >= MAX_UPLOADS}
        style={{ marginTop: 16 }}
      />
      <button
        onClick={handleUpload}
        disabled={!image || loading || uploads.length >= MAX_UPLOADS}
        style={{
          marginLeft: 12,
          padding: "8px 16px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      <div style={{ marginTop: 32 }}>
        <h2>Your Uploaded Photos:</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {uploadUrls.map((url, idx) => (
            <div key={uploads[idx]} style={{ position: "relative" }}>
              <img
                src={url}
                alt="Uploaded creation"
                style={{
                  width: 150,
                  height: 150,
                  objectFit: "cover",
                  borderRadius: 8,
                  display: "block",
                }}
              />
              <button
                onClick={() => handleDelete(uploads[idx])}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Creations;