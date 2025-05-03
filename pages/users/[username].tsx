import { useRouter } from "next/router"
import React, { useEffect, useState, ChangeEvent } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { getUrl, uploadData } from "aws-amplify/storage";

const FETCH_USER_PHOTOS_LAMBDA_URL =
  "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_photos";

const BUCKET_PROFILE_PATH = "public/profile-pics";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const UserProfile: React.FC<AppProps> = ({ user }) => {

  const router = useRouter();
  const { username } = router.query;

  const isOwner = user?.username === username
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);


  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await invokeLambdaIam({
          url: FETCH_USER_PHOTOS_LAMBDA_URL,
          method: "POST",
          body: { username },
        });
        setPhotos(res || []);
      } catch (err) {
        console.error("Failed to fetch user photos:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfilePic = async () => {
      try {
        const result = await getUrl({ path: `${BUCKET_PROFILE_PATH}/${username}.jpg` });

        const url = result?.url?.href;
        if (url) {
          // Try to fetch the image to confirm it actually exists
          const img = new Image();
          img.src = url;
          img.onload = () => setProfileUrl(url);
          img.onerror = () => setProfileUrl("/default-avatar.png");
        } else {
          setProfileUrl("/default-avatar.png");
        }
      } catch {
        setProfileUrl("/default-avatar.png");
      }
    };

    fetchPhotos();
    fetchProfilePic();
  }, [username]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setUploading(true);
    try {
      await uploadData({
        path: `${BUCKET_PROFILE_PATH}/${username}.jpg`,
        data: file,
        options: { contentType: file.type },
      });
      const { url } = await getUrl({ path: `${BUCKET_PROFILE_PATH}/${username}.jpg` });
      setProfileUrl(url.toString());
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>👤 {username}&apos;s Profile</h1>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src={profileUrl}
          alt={`${username}'s profile`}
          style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "2px solid #ccc" }}
        />
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        </div>
      </div>

      <h2>📷 Photos by {username}</h2>
      {loading ? (
        <p>Loading photos...</p>
      ) : photos.length === 0 ? (
        <p>No photos yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {photos.map((photo, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <img src={photo.imageUrl} alt={photo.caption} style={{ width: "100%", borderRadius: 8 }} />
              {photo.caption && <p>{photo.caption}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
