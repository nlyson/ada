import React, { useState, useEffect, ChangeEvent } from "react";
import { Amplify } from "aws-amplify";
import amplifyConfig from "../amplify_outputs.json";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

Amplify.configure(amplifyConfig);

const UPDATE_USER_CREATIONS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_creations";


type UploadItem = {
  key: string;
  url: string;
};

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const MAX_UPLOADS = 10;

const Creations: React.FC<AppProps> = ({ signOut, user }) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  async function fetchUploads() {
    try {
      const res = await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL, // API Gateway URL
        method: "POST",
        body: {
          action: "list",
          username: user.username,
        },
      });


      if (!res.items) {
        console.error("No items from server:", res);
        return;
      }

      const mappedItems: UploadItem[] = res.items.map(
        (item: { key: string; url: string }) => ({
          key: item.key,
          url: item.url,
        })
      );

      setUploadItems(mappedItems);
    } catch (error) {
      console.error("Error fetching uploads:", error);
    }
  }

  async function handleUpload() {
    if (!image) {
      alert("Please select an image.");
      return;
    }

    if (uploadItems.length >= MAX_UPLOADS) {
      alert(`You can only upload up to ${MAX_UPLOADS} creations.`);
      return;
    }

    setLoading(true);

    try {
      const base64 = await toBase64(image);

      const res = await fetch(UPDATE_USER_CREATIONS_LAMBDA_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "upload",
          username: user.username,
          fileName: image.name,
          fileContent: base64,
          fileType: image.type,
        }),
      });

      const result = await res.json();
      console.log(result);

      await fetchUploads(); // Refresh list
      setImage(null); // Clear file input
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(key: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this photo?");
    if (!confirmDelete) return;

    try {
      await fetch(UPDATE_USER_CREATIONS_LAMBDA_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "delete",
          username: user.username,
          fileName: key.replace(`user-creations/${user.username}/`, ""),
        }),
      });

      await fetchUploads(); // Refresh list
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    } else {
      setImage(null);
    }
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  return (
    <div style={{ padding: 24, backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
      <h1>Upload Your Creations</h1>

      <p>You have uploaded {uploadItems.length} of {MAX_UPLOADS} allowed photos.</p>

      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={uploadItems.length >= MAX_UPLOADS}
        style={{ marginTop: 16 }}
      />
      <button
        onClick={handleUpload}
        disabled={!image || loading || uploadItems.length >= MAX_UPLOADS}
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
          {uploadItems.map(({ key, url }) => (
            <div key={key} style={{ position: "relative" }}>
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
                onClick={() => handleDelete(key)}
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
