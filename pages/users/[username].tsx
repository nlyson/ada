// pages/users/[username].tsx
import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";
import { getUrl, uploadData } from "aws-amplify/storage";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import ProfileCard from "@/components/ProfileCard";
import EditProfileSection from "@/components/EditProfileSection";
import UserUploads from "@/components/UserUploads";
import ChallengeSubmissions from "@/components/ChallengeSubmissions";
import ScavengerHuntSection from "@/components/ScavengerHuntSection";
import ProfileDetails from "@/components/ProfileDetails";


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
const GET_UNREAD_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_unread_comment_flags";

const SUBMIT_HUNT_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit-hunt-photo";
const GET_USER_HUNT_PROGRESS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get-user-hunt-progress"


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
  const [scavengerProgress, setScavengerProgress] = useState<{ [promptId: string]: string }>({});

  const [editProfile, setEditProfile] = useState<UserProfile>({
    username,
    displayName: "",
    aboutMe: "",
    favoriteSubjects: "",
  });
  const huntStart = new Date("2025-05-05");
  const today = new Date();
  const unlockedCount = Math.min(30, Math.floor((today.getTime() - huntStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  const scavengerPrompts = [
      ...'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => ({
        promptId: letter,
        text: `Something that starts with ${letter.toUpperCase()}`
      })),
      { promptId: "number", text: "A photo with a number in it" },
      { promptId: "color", text: "A photo dominated by one color" },
      { promptId: "reflection", text: "Something with a reflection" },
      { promptId: "pattern", text: "A repeating pattern" }
    ];

  const isOwner = user?.username === username;



  async function handleHuntUpload(promptId: string, file: File) {
    const base64 = await toBase64(file);
    await invokeLambdaIam({
      url: SUBMIT_HUNT_PHOTO_URL, // TODO: update with real Lambda
      method: "POST",
      body: {
        huntId: "alphabet-hunt-2025",
        username: user.username,
        promptId,
        fileContent: base64,
        fileType: file.type,
      },
    });
  
    // After upload, fetch the updated photo URL (simplified)
    const url = `https://picture-this-storage.s3.amazonaws.com/public/scavenger-hunts/alphabet-hunt-2025/${user.username}/${promptId}.jpg`;
    setScavengerProgress((prev) => ({ ...prev, [promptId]: url }));
  }

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
      } catch (err){
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
        const result = await invokeLambdaIam({
          url: GET_UNREAD_URL,
          method: "POST",
          body: { username },
        });
        setUnreadPhotoIds(result.unreadPhotos || []);
      } catch (err) {
        console.error("Failed to fetch unread comments", err);
      }
    };

    async function fetchHuntProgress() {
      try {
        const res = await invokeLambdaIam({
          url: GET_USER_HUNT_PROGRESS_URL,
          method: "POST",
          body: {
            username,
            huntId: "alphabet-hunt-2025"
          }
        });
    
        const promptIds: string[] = res.promptIds || [];
    
        const mapped: { [promptId: string]: string } = {};
        for (const id of promptIds) {
          mapped[id] = `https://picture-this-storage.s3.amazonaws.com/public/scavenger-hunts/alphabet-hunt-2025/${username}/${id}.jpg`;
        }
    
        setScavengerProgress(mapped);
      } catch (err) {
        console.error("Failed to fetch scavenger hunt progress:", err);
      }
    }

    fetchHuntProgress();
    fetchUnreadFlags();
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



      <ProfileCard
      username={username}
      displayName={profile?.displayName}
      profileUrl={profileUrl}
      isOwner={isOwner}
      setProfileUrl={setProfileUrl}
    />
<ProfileDetails profile={profile} />

    {isOwner && (
      <EditProfileSection
        editProfile={editProfile}
        setEditProfile={setEditProfile}
        onSave={async () => {
          setSavingProfile(true);
          try {
            await invokeLambdaIam({
              url: "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/set_user_profile",
              method: "POST",
              body: {
                username,
                displayName: editProfile.displayName,
                aboutMe: editProfile.aboutMe,
                favoriteSubjects: editProfile.favoriteSubjects
                  ? editProfile.favoriteSubjects.split(",").map((s) => s.trim())
                  : [],
              },
            });
            setProfile(editProfile);
          } catch (err) {
            console.error("Error saving profile:", err);
          } finally {
            setSavingProfile(false);
          }
        }}
        saving={savingProfile}
      />
    )}
    <UserUploads
      uploadItems={uploadItems}
      unreadPhotoIds={unreadPhotoIds}
      onUpload={isOwner ? handleUpload : undefined}
      onDelete={isOwner ? handleDelete : undefined}
    />
      <ChallengeSubmissions photos={photos} loading={loading} />

      <ScavengerHuntSection
        username={username}
        isOwner={isOwner}
        progress={scavengerProgress}
        onUpload={handleHuntUpload}
      />
    </div>

  );
};

export default UserPage;
