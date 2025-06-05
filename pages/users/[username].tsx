// pages/users/[username].tsx
import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import ProfileCard from "@/components/ProfileCard";
import EditProfileSection from "@/components/EditProfileSection";
import UserUploads from "@/components/UserUploads";
import ChallengeSubmissions from "@/components/ChallengeSubmissions";
import ScavengerHuntSection from "@/components/ScavengerHuntSection";
import ProfileDetails from "@/components/ProfileDetails";
import { UserStatsCard } from "@/components/UserStatsCard";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fetchAuthSession } from "aws-amplify/auth";


type UserProfile = {
  username: string;
  displayName: string;
  aboutMe: string;
  favoriteSubjects: string;
  accountTier?: string;
  scavengerRetries?: number;
};

const TEST_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/test_lambda";

const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const SET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/set_user_profile";

const MAX_UPLOADS = 10;
const FETCH_USER_PHOTOS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_photos";
const UPDATE_USER_CREATIONS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_creations";
const GET_UNREAD_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_unread_comment_flags";
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";

const SUBMIT_HUNT_PHOTO_URL = TEST_LAMBDA_URL; // "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit-hunt-photo";
const GET_USER_HUNT_PROGRESS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get-user-hunt-progress";
const GET_SCAVENGER_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_scavenger_results";
const BUCKET_PROFILE_PATH = "public/profile-pics";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";

const PICTURE_THIS_STORAGE_FULL_PATH = "https://picture-this-storage.s3.amazonaws.com";
const LIST_HUNTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_scavenger_hunts";

type UploadItem = {
  key: string;
  url: string;
  caption?: string;
};

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

type ScavengerHunt = {
  huntId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  prompts: {
    promptId: string;
    text: string;
    optional?: boolean;
  }[];
};


const UserPage: React.FC<AppProps> = ({ user }) => {
  const router = useRouter();
  const username = router.query.username as string;
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
  const [huntUploadLoading, setHuntUploadLoading] = useState<{ [promptId: string]: boolean }>({});
  const [availableHunts, setAvailableHunts] = useState<ScavengerHunt[]>([]);
  const [selectedHuntId, setSelectedHuntId] = useState("");

  const [editProfile, setEditProfile] = useState<UserProfile>({
    username,
    displayName: "",
    aboutMe: "",
    favoriteSubjects: "",
  });

  const [scavengerResults, setScavengerResults] = useState<{ [promptId: string]: { score: number, rubric: any, feedback: string } }>({});
  const [userAccountTier, setUserAccountTier] = useState("free");


  const isOwner = user?.username === username;


  async function uploadToCustomBucket(file: File, s3Key: string) {
    // Step 1: Upload to S3
    const session = await fetchAuthSession();
    const credentials = session.credentials;

    if (!credentials) {
      throw new Error("Amplify credentials not found");
    }

    const s3 = new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: "picture-this-storage",
        Key: s3Key,
        Body: uint8Array,
        ContentType: file.type,
      })
    );
  }


  async function fetchAllScavengerResults(huntId: string) {
    try {
      const res = await invokeLambdaIam({
        url: GET_SCAVENGER_RESULTS_URL,
        method: "POST",
        body: {
          username,
          huntId,
        },
      });

      const mapped: typeof scavengerResults = {};
      for (const r of res) {
        mapped[r.promptId] = {
          score: r.score,
          rubric: r.rubric,
          feedback: r.feedback,
        };
      }

      setScavengerResults(mapped);
    } catch (err) {
      console.error("Failed to fetch scavenger results:", err);
    }
  }


  async function handleHuntUpload(promptId: string, file: File) {
    setHuntUploadLoading((prev) => ({ ...prev, [promptId]: true }));

    try {
      // Step 1: Upload to S3
      const s3Key = `public/scavenger-hunts/${selectedHuntId}/${user.username}/${promptId}.jpg`;

      await uploadToCustomBucket(file, s3Key);


      const imageUrl = `${PICTURE_THIS_STORAGE_FULL_PATH}/${s3Key}`;

      // Step 2: Call Lambda with just the s3Key
      await invokeLambdaIam({
        url: SUBMIT_HUNT_PHOTO_URL,
        method: "POST",
        body: {
          huntId: selectedHuntId,
          username: user.username,
          promptId,
          s3Key,
        },
      });

      // Step 3: Review / score the photo
      await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
          imageUrl,
          s3Key,
          rubric: true,
          username: user.username,
          huntId: selectedHuntId,
          scavengerPromptId: promptId,
        },
      });

      // Step 4: Update stats
      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: {
            recomputeScavengerHuntStats: { op: "recomputeScavengerHuntStats" },
          },
        },
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: {
            streakDays: { op: "updateStreak" },
          },
        },
      });

      setScavengerProgress((prev) => ({ ...prev, [promptId]: imageUrl }));

      await fetchAllScavengerResults(selectedHuntId);
    } catch (err) {
      console.error("Upload or scoring failed:", err);
    } finally {
      setHuntUploadLoading((prev) => ({ ...prev, [promptId]: false }));
    }
  }

  async function fetchHuntProgress(huntId: string) {
    try {
      const res = await invokeLambdaIam({
        url: GET_USER_HUNT_PROGRESS_URL,
        method: "POST",
        body: {
          username,
          huntId,
        },
      });

      const promptIds: string[] = res.promptIds || [];

      const mapped: { [promptId: string]: string } = {};
      for (const id of promptIds) {
        mapped[id] = `${PICTURE_THIS_STORAGE_FULL_PATH}/public/scavenger-hunts/${huntId}/${username}/${id}.jpg`;
      }

      setScavengerProgress(mapped);
    } catch (err) {
      console.error("Failed to fetch scavenger hunt progress:", err);
    }
  }

  useEffect(() => {
    if (!username) return;

    const fetchLoggedInUserProfile = async () => {
      try {
        const res = await invokeLambdaIam({
          url: GET_PROFILE_URL,
          method: "POST",
          body: { username: user.username }, // logged-in user
        });
        setUserAccountTier(res.accountTier || "free");
      } catch (err) {
        console.warn("Could not fetch current user profile — defaulting to free");
      }
    };

    const fetchAvailableHunts = async () => {
      try {
        const res = await invokeLambdaIam({
          url: LIST_HUNTS_URL,
          method: "POST"
        });
        const hunts = (res || []).sort((a: ScavengerHunt, b: ScavengerHunt) => {
          return new Date(b.startDate || "").getTime() - new Date(a.startDate || "").getTime();
        });

        setAvailableHunts(hunts);

        // Optionally auto-select the most recent hunt
        if (hunts.length > 0 && !selectedHuntId) {
          setSelectedHuntId(hunts[0].huntId);
        }
      } catch (err) {
        console.error("Failed to fetch hunt list:", err);
      }
    };

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
        const url = `${PICTURE_THIS_STORAGE_FULL_PATH}/${BUCKET_PROFILE_PATH}/${username}.jpg?t=${Date.now()}`
        setProfileUrl(url);
      } catch (err) {
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

        const mapped = res.items?.map((item: any) => ({
          key: item.key,
          url: item.url,
          caption: item.caption,
          views: item.views
        })) || [];
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
        setEditProfile({
          username,
          displayName: result?.displayName || "",
          aboutMe: result?.aboutMe || "",
          favoriteSubjects: Array.isArray(result?.favoriteSubjects)
            ? result.favoriteSubjects.join(", ")
            : result?.favoriteSubjects || ""
        });
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



    fetchLoggedInUserProfile();
    fetchAvailableHunts();
    fetchUnreadFlags();
    fetchProfile();
    fetchPhotos();
    fetchProfilePic();
    fetchUploads();
    setLoading(false);
  }, [username]);

  useEffect(() => {
    if (!selectedHuntId || !username) return;
    fetchHuntProgress(selectedHuntId);
    fetchAllScavengerResults(selectedHuntId);
  }, [selectedHuntId, username]);

  async function handleUpload(file: File, caption: string) {
    if (!file) return;

    if (uploadItems.length >= MAX_UPLOADS) {
      alert("Upload limit reached.");
      return;
    }

    setUploading(true);

    try {
      const s3Key = `user-creations/${user.username}/${Date.now()}-${file.name}`;


      if (!caption || caption.trim().length === 0) {
        caption = "(Untitled)";
      }

      // Upload to S3 using helper
      await uploadToCustomBucket(file, s3Key);

      // Trigger backend to update DB entries
      await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: {
          action: "register",
          username: user.username,
          fileName: file.name,
          s3Key,
          caption
        },
      });

      // Re-fetch updated creations list
      const res = await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: { action: "list", username },
      });

      const mapped = res.items?.map((item: any) => ({
        key: item.key,
        url: item.url,
        caption: item.caption,
      })) || [];
      setUploadItems(mapped);

      // Stats
      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: {
            photosUploaded: { op: "increment", value: 1 },
          },
        },
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: {
            streakDays: { op: "updateStreak" },
          },
        },
      });

      setImage(null);
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

  const selectedHunt = availableHunts.find(h => h.huntId === selectedHuntId);

  return (
    <div style={{ padding: 24 }}>
      <h1>
        👤 {username}&apos;s Profile{" "}
        {profile?.accountTier === "premium" && (
          <span style={{
            marginLeft: 8,
            backgroundColor: "gold",
            color: "black",
            padding: "4px 8px",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: "0.9em"
          }}>
            ⭐ Premium
          </span>
        )}
      </h1>


      <ProfileCard
        username={username}
        displayName={profile?.displayName}
        profileUrl={profileUrl}
        isOwner={isOwner}
        setProfileUrl={setProfileUrl}
      />
      <ProfileDetails profile={profile} />
      <UserStatsCard username={username} isOwner={isOwner} />

      {isOwner && (
        <EditProfileSection
          editProfile={editProfile}
          setEditProfile={setEditProfile}
          onSave={async () => {
            setSavingProfile(true);
            try {
              await invokeLambdaIam({
                url: SET_PROFILE_URL,
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

              // 🔥 Compute completeness after save
              const filled = [
                editProfile.displayName,
                editProfile.aboutMe,
                editProfile.favoriteSubjects,
                profileUrl !== "/default-avatar.png",
              ];
              const completeness = Math.round((filled.filter(Boolean).length / 4) * 100);


              await invokeLambdaIam({
                url: UPDATE_USER_STATS_LAMBDA_URL,
                method: "POST",
                body: {
                  username,
                  updates: {
                    profileCompleteness: { op: "set", value: completeness },
                  },
                },
              });
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
        username={username}
        viewerUsername={user.username}
        isOwner={isOwner}
        uploadItems={uploadItems}
        unreadPhotoIds={unreadPhotoIds}
        onUpload={isOwner ? handleUpload : undefined}
        onDelete={isOwner ? handleDelete : undefined}
        accountTier={userAccountTier}
      />
      <ChallengeSubmissions photos={photos} loading={loading} />
      {profile?.accountTier === "premium" && (
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="hunt-select" style={{ fontWeight: "bold", marginRight: 8 }}>
            🧭 Select Scavenger Hunt:
          </label>
            <select
              id="hunt-select"
              value={selectedHuntId}
              onChange={(e) => setSelectedHuntId(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 6, fontSize: "1rem" }}
              disabled={availableHunts.length === 0}
            >
              {availableHunts.map((hunt) => (
                <option key={hunt.huntId} value={hunt.huntId}>
                  {hunt.name}
                </option>
              ))}
            </select>
        </div>
      )}
      <ScavengerHuntSection
        huntId={selectedHuntId}
        huntName={selectedHunt?.name || ""}
        huntStartDate={selectedHunt?.startDate || "2025-05-01"} // fallback
        huntPrompts={selectedHunt?.prompts || []}        username={username}
        isOwner={isOwner}
        progress={scavengerProgress}
        results={scavengerResults}
        onUpload={handleHuntUpload}
        loadingMap={huntUploadLoading}
        accountTier={profile?.accountTier}
        scavengerRetries={profile?.scavengerRetries}
      />
    </div>

  );
};

export default UserPage;
