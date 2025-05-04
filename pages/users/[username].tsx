// pages/users/[username].tsx
import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";
import { getUrl, uploadData } from "aws-amplify/storage";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { Amplify } from "aws-amplify";
import amplifyConfig from "@/amplify_outputs.json";
import { CommentThread } from "@/components/CommentThread";

Amplify.configure(amplifyConfig);


type UserProfile = {
  username: string;
  displayName: string;
  aboutMe: string;
  favoriteSubjects: string;
};


const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const SET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/set_user_profile";

const MAX_UPLOADS = 10;
const FETCH_USER_PHOTOS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_photos";
const UPDATE_USER_CREATIONS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_creations";

const BUCKET_PROFILE_PATH = "public/profile-pics"

type UploadItem = {
  key: string;
  url: string;
};

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const UserPage: React.FC<AppProps> = ({ user }) => {
  const { username } = useRouter().query as { username: string };
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState<string>("/default-avatar.png");
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [unreadPhotoIds, setUnreadPhotoIds] = useState<string[]>([]);
  const [editProfile, setEditProfile] = useState<UserProfile>({
    username,
    displayName: "",
    aboutMe: "",
    favoriteSubjects: "",
  });

  const isOwner = user?.username === username;

  useEffect(() => {
    if (!username) return;

    async function fetchPhotos() {
      try {
        const res = await invokeLambdaIam({
          url: FETCH_USER_PHOTOS_LAMBDA_URL,
          method: "POST",
          body: { username },
        });
        setPhotos(res || []);
      } catch (err) {
        console.error("Failed to fetch user photos:", err);
      }
    }

    async function fetchProfilePic() {
      try {
        const result = await getUrl({
          path: `${BUCKET_PROFILE_PATH}/${username}.jpg`,

        });

        console.log('-----------result : ', result)

        const url = result?.url?.href;
        console.log('----------url : ', url)
        if (url) {
          // Try to fetch the image to confirm it actually exists
          const img = new Image();
          img.src = url;
          img.onload = () => setProfileUrl(url);
          img.onerror = () => setProfileUrl("/default-avatar.png");
        } else {
          setProfileUrl("/default-avatar.png");
        }
      } catch (err){
        console.error('-----------Error fetchign profile pic', err)
        setProfileUrl("/default-avatar.png");
      }

    };

    async function fetchUploads() {
      try {
        const res = await invokeLambdaIam({
          url: UPDATE_USER_CREATIONS_LAMBDA_URL,
          method: "POST",
          body: {
            action: "list",
            username,
          },
        });

        const mapped = res.items?.map((item: any) => ({ key: item.key, url: item.url })) || [];
        setUploadItems(mapped);
      } catch (err) {
        console.error("Error fetching creations:", err);
      }
    }

    const fetchProfile = async () => {
      try {
        const result = await invokeLambdaIam({
          url: GET_PROFILE_URL,
          method: "POST",
          body: { username },
        });
        setProfile(result);
        setEditProfile(result ?? { username, displayName: "", aboutMe: "", favoriteSubjects: "" });
      } catch (err) {
        console.warn("No profile found.");
        setProfile(null);
        setEditProfile({ username, displayName: "", aboutMe: "", favoriteSubjects: "" });
      }
    };

    const fetchUnreadFlags = async () => {
      if (!isOwner) return;
      try {
        const response = await fetch("https://your-api-endpoint/getUnreadCommentFlags", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        });
        const data = await response.json();
        setUnreadPhotoIds(data.unreadPhotos || []);
      } catch (err) {
        console.error("Failed to fetch unread comments", err);
      }
    };

    fetchProfile();
    fetchPhotos();
    fetchProfilePic();
    fetchUploads();
    setLoading(false);
  }, [username]);

  async function handleUpload() {
    if (!image) return;
    if (uploadItems.length >= MAX_UPLOADS) {
      alert("Upload limit reached.");
      return;
    }

    setUploading(true);
    try {
      const base64 = await toBase64(image);
      await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: {
          action: "upload",
          username: user.username,
          fileName: image.name,
          fileContent: base64,
          fileType: image.type,
        },
      });
      setImage(null);
      const res = await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: { action: "list", username },
      });
      const mapped = res.items?.map((item: any) => ({ key: item.key, url: item.url })) || [];
      setUploadItems(mapped);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(key: string) {
    if (!confirm("Delete this image?")) return;
    try {
      await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: {
          action: "delete",
          username: user.username,
          fileName: key.replace(`user-creations/${user.username}/`, ""),
        },
      });
      setUploadItems((prev) => prev.filter((item) => item.key !== key));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
    });
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>👤 {username}&apos;s Profile</h1>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src={profileUrl}
          alt={`${username}&apos;profile`}
          style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }}
        />
        {isOwner && (
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              if (e.target.files?.length) {
                const file = e.target.files[0];
                await uploadData({
                  path: `${BUCKET_PROFILE_PATH}/${username}.jpg`,
                  data: file,
                  options: { contentType: file.type },
                });
                const result = await getUrl({ path: `${BUCKET_PROFILE_PATH}/${username}.jpg` });
                setProfileUrl(result.url.toString());
              }
            }}
          />
        )}

      </div>
      <h2>📝 Profile Info</h2>
{profile ? (
  <div style={{ marginBottom: 20 }}>
    <p><strong>Name:</strong> {profile.displayName}</p>
    <p><strong>About Me:</strong> {profile.aboutMe}</p>
    <p><strong>Favorite Subjects:</strong> {profile.favoriteSubjects}</p>
  </div>
) : (
  <p>No profile info available.</p>
)}

{isOwner && (
  <div style={{ marginBottom: 20 }}>
    <h3>Edit Profile</h3>
    <input
      placeholder="Name"
      value={editProfile?.displayName || ""}
      onChange={(e) => setEditProfile(prev => prev && { ...prev, displayName: e.target.value })}
    /><br />
    <textarea
      placeholder="About Me"
      value={editProfile?.aboutMe || ""}
      onChange={(e) => setEditProfile(prev => prev && { ...prev, aboutMe: e.target.value })}
    /><br />
    <input
      placeholder="Favorite Subjects"
      value={editProfile?.favoriteSubjects || ""}
      onChange={(e) => setEditProfile(prev => prev && { ...prev, favoriteSubjects: e.target.value })}
    /><br />
    <button
      disabled={savingProfile}
      onClick={async () => {
        setSavingProfile(true);
        try {
          await invokeLambdaIam({
            url: SET_PROFILE_URL,
            method: "POST",
            body: {
              username,
              displayName: editProfile.displayName, // map correctly
              aboutMe: editProfile.aboutMe,
              favoriteSubjects: editProfile.favoriteSubjects
                ? editProfile.favoriteSubjects.split(",").map((s) => s.trim())
                : [], // convert comma string to string[]
            },
          });
          setProfile(editProfile);
        } catch (err) {
          console.error("Error saving profile:", err);
        } finally {
          setSavingProfile(false);
        }
      }}
    >
      {savingProfile ? "Saving..." : "Save Profile"}
    </button>
  </div>
)}
      {isOwner && (
        <>
          <h2>🎨 Upload Your Creations</h2>
          <p>You’ve uploaded {uploadItems.length} of {MAX_UPLOADS}</p>
          <input type="file" accept="image/*" onChange={(e) => {
            if (e.target.files?.length) setImage(e.target.files[0]);
          }} />
          <button disabled={!image || uploading} onClick={handleUpload}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </>
      )}

      {uploadItems.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>🖼️ Uploaded Creations</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {uploadItems.map(({ key, url }) => {
            const hasUnread = unreadPhotoIds.includes(key);

            return (
              <div key={key} style={{ position: "relative" }}>
                <img src={url} style={{ width: 150, height: 150, borderRadius: 8 }} />

                {hasUnread && (
                  <span style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    background: "gold",
                    color: "black",
                    padding: "2px 6px",
                    borderRadius: 6,
                    fontWeight: "bold",
                    fontSize: "0.8rem"
                  }}>
                    🔔 New!
                  </span>
                )}

                <CommentThread
                  photoId={key}
                  currentUser={user.username}
                />

                {isOwner && (
                  <button
                    onClick={() => handleDelete(key)}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      background: "red", color: "white", borderRadius: "50%", width: 24, height: 24
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
          </div>
        </>
      )}

      <h2 style={{ marginTop: 32 }}>📷 Challenge Submissions</h2>
      {loading ? <p>Loading...</p> : photos.length === 0 ? <p>No photos yet.</p> : (
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

export default UserPage;
