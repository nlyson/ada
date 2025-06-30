// pages/users/[username].tsx
import React, { useState, useEffect, ChangeEvent, useRef } from "react";
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
import { uploadData } from 'aws-amplify/storage';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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

const SUBMIT_HUNT_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit-hunt-photo";
const GET_USER_HUNT_PROGRESS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get-user-hunt-progress";
const GET_SCAVENGER_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_scavenger_results";
const BUCKET_PROFILE_PATH = "public/profile-pics";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";

const PICTURE_THIS_STORAGE_FULL_PATH = "https://picture-this-storage.s3.amazonaws.com";
const LIST_HUNTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_scavenger_hunts";
const LOG_PROFILE_VIEW_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/track_usage";

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

  // Camera states
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [currentCameraMode, setCurrentCameraMode] = useState<'creation' | 'hunt' | null>(null);
  const [currentPromptId, setCurrentPromptId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [editProfile, setEditProfile] = useState<UserProfile>({
    username,
    displayName: "",
    aboutMe: "",
    favoriteSubjects: "",
  });

  const [scavengerResults, setScavengerResults] = useState<{ [promptId: string]: { score: number, rubric: any, feedback: string } }>({});
  const [userAccountTier, setUserAccountTier] = useState("free");

  const isOwner = user?.username === username;

  // Take photo with Capacitor Camera plugin
  const takePhoto = async (mode: 'creation' | 'hunt', promptId?: string) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        // Convert data URL to File
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        // Handle the photo based on mode
        if (mode === 'creation') {
          setImage(file);
        } else if (mode === 'hunt' && promptId) {
          await handleHuntUpload(promptId, file);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Could not take photo. Please try again.');
    }
  };

  // Start web camera for desktop/browsers
  const startWebCamera = async (mode: 'creation' | 'hunt', promptId?: string) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        }
      });
      setShowCamera(true);
      setCurrentCameraMode(mode);
      setCurrentPromptId(promptId || '');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Stop web camera
  const stopWebCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCurrentCameraMode(null);
    setCurrentPromptId('');
  };

  // Capture photo from web camera
  const captureWebPhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !currentCameraMode) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob then to File
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        stopWebCamera();
        
        // Handle the photo based on current mode
        if (currentCameraMode === 'creation') {
          setImage(file);
        } else if (currentCameraMode === 'hunt' && currentPromptId) {
          await handleHuntUpload(currentPromptId, file);
        }
      }
    }, 'image/jpeg', 0.9);
  };

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
      const path = `public/scavenger-hunts/${selectedHuntId}/${user.username}/${promptId}.jpg`;

      console.log("🚀 Starting platform-specific upload to path:", path);
      console.log("📱 Platform:", Capacitor.getPlatform());
      
      // Use platform-specific upload
      const uploadResult = await uploadForPlatform(file, path);
      console.log("✅ Upload completed:", uploadResult);

      // Add a small delay to ensure S3 consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      const imageUrl = `${PICTURE_THIS_STORAGE_FULL_PATH}/${path}`;

      // Call Lambda to register submission
      console.log("🔄 Registering hunt submission with Lambda...");
      await invokeLambdaIam({
        url: SUBMIT_HUNT_PHOTO_URL,
        method: "POST",
        body: {
          huntId: selectedHuntId,
          username: user.username,
          promptId,
          s3Key: path,
        },
      });
      console.log("✅ Hunt submission completed");

      // 🔄 REFRESH CREDENTIALS before scoring to prevent signature mismatch
      console.log("🔄 Refreshing credentials before scoring...");
      await fetchAuthSession({ forceRefresh: true });

      // Step 3: Review / score the photo
      console.log("🎯 Starting photo scoring...");
      await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
          imageUrl,
          path,
          rubric: true,
          username: user.username,
          huntId: selectedHuntId,
          scavengerPromptId: promptId,
        },
      });
      console.log("✅ Photo scoring completed");

      // 🔄 REFRESH CREDENTIALS again before stats updates
      console.log("🔄 Refreshing credentials before stats updates...");
      await fetchAuthSession({ forceRefresh: true });

      // Step 4: Update stats
      console.log("📊 Updating user stats...");
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
      console.log("✅ Stats updates completed");

      setScavengerProgress((prev) => ({ ...prev, [promptId]: imageUrl }));

      // Refresh results to get the new scores
      await fetchAllScavengerResults(selectedHuntId);

    } catch (err) {
      console.error("❌ Upload or scoring failed:", err);
      alert(`Upload or scoring failed: ${err}`);
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
        // Step 1: Fetch raw user photo results (challenge submissions)
        const res = await invokeLambdaIam({
          url: FETCH_USER_PHOTOS_LAMBDA_URL,
          method: "POST",
          body: { username },
        });

        // Step 2: Fetch all challenges (for title lookup)
        const challenges = await invokeLambdaIam({
          url: "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_all_challenges",
          method: "GET",
        });

        const challengeMap: Record<string, string> = {};
        for (const ch of challenges) {
          challengeMap[ch.challengeId] = ch.title;
        }

        // Step 3: Enrich each photo with title (and use optional score, feedback if available)
        const enriched = res.map((item: any) => ({
          imageUrl: item.imageUrl,
          caption: item.caption,
          challengeId: item.challengeId,
          title: challengeMap[item.challengeId] || item.challengeId,
          score: item.score ?? undefined,
          feedback: item.feedback ?? undefined,
        }));

        setPhotos(enriched);
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

        // 🔥 Log all profile views — including self
        await invokeLambdaIam({
          url: LOG_PROFILE_VIEW_URL,
          method: "POST",
          body: {
            viewer: user.username,
            target: username,
          },
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
      
      // 🔥 CLEAR OLD RESULTS when switching hunts
      console.log(`🧹 Clearing old scavenger results for hunt switch to: ${selectedHuntId}`);
      setScavengerResults({});
      setScavengerProgress({});
      
      // Then fetch new data
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
      const path = `public/user-creations/${user.username}/${Date.now()}-${file.name}`;

      if (!caption || caption.trim().length === 0) {
        caption = "(Untitled)";
      }

      console.log("🚀 Starting platform-specific upload to path:", path);
      console.log("📱 Platform:", Capacitor.getPlatform());
      
      // Use platform-specific upload
      const uploadResult = await uploadForPlatform(file, path);
      console.log("✅ Upload completed:", uploadResult);

      // Add a small delay to ensure S3 consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🔄 REFRESH CREDENTIALS before Lambda calls
      console.log("🔄 Refreshing credentials before Lambda registration...");
      await fetchAuthSession({ forceRefresh: true });

      // Register with Lambda
      console.log("🔄 Registering with Lambda...");
      await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: {
          action: "register",
          username: user.username,
          fileName: file.name,
          s3Key: path,
          caption
        },
      });
      console.log("✅ Lambda registration completed");

      // 🔄 REFRESH CREDENTIALS before fetching updated list
      console.log("🔄 Refreshing credentials before fetching updated list...");
      await fetchAuthSession({ forceRefresh: true });

      // Re-fetch updated creations list
      console.log("📋 Fetching updated creations list...");
      const res = await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: { action: "list", username: user.username },
      });

      const mapped = res.items?.map((item: any) => ({
        key: item.key,
        url: item.url,
        caption: item.caption,
      })) || [];
      setUploadItems(mapped);
      console.log("✅ Updated creations list fetched");

      // 🔄 REFRESH CREDENTIALS before stats updates
      console.log("🔄 Refreshing credentials before stats updates...");
      await fetchAuthSession({ forceRefresh: true });

      // Update stats
      console.log("📊 Updating user stats...");
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
      console.log("✅ Stats updates completed");

      setImage(null);

    } catch (err) {
      console.error("❌ Upload error:", err);
      alert(`Upload failed: ${err}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(key: string) {
    if (!confirm("Delete this image?")) return;
    try {
      const result = await invokeLambdaIam({
        url: UPDATE_USER_CREATIONS_LAMBDA_URL,
        method: "POST",
        body: {
          action: "delete",
          username: user.username,
          s3Key: key, // ✅ Send the full key
        },
      });
      console.log('------------Delete result', result)
      setUploadItems((prev) => prev.filter((item) => item.key !== key));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  // Aggressive compression for large images to avoid multipart upload
  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Start with aggressive sizing for large files
        const isLargeFile = file.size > 10 * 1024 * 1024; // 10MB+
        const maxSize = isLargeFile ? 1200 : 1500; // Smaller for large files
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress with aggressive quality for large files
        ctx.drawImage(img, 0, 0, width, height);
        const quality = isLargeFile ? 0.7 : 0.85; // Lower quality for large files
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            console.log(`📦 Compressed ${file.size} bytes to ${compressedFile.size} bytes`);
            
            // If still too large, compress more aggressively
            if (compressedFile.size > 4 * 1024 * 1024) { // Still > 4MB
              console.log("🔄 Still too large, compressing more aggressively...");
              compressMoreAggressively(file, resolve);
            } else {
              resolve(compressedFile);
            }
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Super aggressive compression for stubborn large files
  function compressMoreAggressively(file: File, resolve: (file: File) => void) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Much smaller dimensions
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const superCompressed = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          console.log(`📦 Super compressed to ${superCompressed.size} bytes`);
          resolve(superCompressed);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.5); // Very low quality but guaranteed small size
    };
    
    img.src = URL.createObjectURL(file);
  }

  // Force single-part upload with uploadData
  async function uploadWithSinglePart(file: File, path: string) {
    console.log("🌐 Using uploadData with forced single-part upload");
    
    try {
      const result = await uploadData({
        path,
        data: file,
        options: {
          contentType: file.type,
          useAccelerateEndpoint: false,
          onProgress: undefined,
        }
      }).result;
      
      console.log("✅ Single-part upload completed:", result);
      return result;
      
    } catch (error: unknown) {
      console.error("❌ uploadData failed:", error);
      throw error;
    }
  }

  // Updated upload function that ensures public access with compression
  async function uploadForPlatform(file: File, path: string) {
    console.log("🚀 Starting upload with compression to path:", path);
    console.log("📁 Original file size:", file.size);
    
    try {
      // Compress the image first to avoid multipart upload
      console.log("📦 Compressing image to avoid multipart upload...");
      const compressedFile = await compressImage(file);
      
      console.log("✅ Compression completed");
      console.log("📁 Compressed file size:", compressedFile.size);
      
      // Use uploadData with the compressed file
      const result = await uploadWithSinglePart(compressedFile, path);
      
      // Small delay for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return result;
      
    } catch (error) {
      console.error("❌ Upload with compression failed:", error);
      throw error;
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

      {/* Camera interface - only show when camera is active */}
      {showCamera && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.9)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: "90%", 
            maxWidth: "500px", 
            backgroundColor: "#000", 
            borderRadius: "12px", 
            overflow: "hidden", 
            position: "relative" 
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: "100%", height: "400px", objectFit: "cover" }}
            />
            <div style={{ 
              position: "absolute", 
              bottom: "1rem", 
              left: "50%", 
              transform: "translateX(-50%)", 
              display: "flex", 
              gap: "1rem",
              alignItems: "center"
            }}>
              <button 
                type="button" 
                onClick={captureWebPhoto}
                style={{ 
                  width: "70px", 
                  height: "70px", 
                  borderRadius: "50%", 
                  backgroundColor: "white", 
                  border: "4px solid #ccc", 
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                📸
              </button>
              <button 
                type="button" 
                onClick={stopWebCamera}
                style={{ 
                  padding: "0.75rem 1.5rem", 
                  backgroundColor: "#ef4444", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancel
              </button>
            </div>
            {currentCameraMode && (
              <div style={{
                position: "absolute",
                top: "1rem",
                left: "1rem",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontSize: "0.9rem"
              }}>
                📷 {currentCameraMode === 'creation' ? 'Taking photo for gallery' : 'Taking photo for scavenger hunt'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <UserUploads
        username={username}
        viewerUsername={user.username}
        isOwner={isOwner}
        uploadItems={uploadItems}
        unreadPhotoIds={unreadPhotoIds}
        onUpload={isOwner ? handleUpload : undefined}
        onDelete={isOwner ? handleDelete : undefined}
        accountTier={userAccountTier}
        // Pass camera functions to UserUploads component
        onTakePhoto={isOwner ? () => takePhoto('creation') : undefined}
        onStartWebCamera={isOwner ? () => startWebCamera('creation') : undefined}
        selectedImage={image}
        onImageChange={setImage}
      />
      
      <ChallengeSubmissions
        photos={photos}
        loading={loading}
        username={username}
        isOwner={isOwner}
        onDeleteSuccess={(challengeId) => {
          setPhotos((prev) => prev.filter((p) => p.challengeId !== challengeId));
        }}
      />
      
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
        huntStartDate={selectedHunt?.startDate || "2025-05-01"}
        huntPrompts={selectedHunt?.prompts || []}
        username={username}
        isOwner={isOwner}
        progress={scavengerProgress}
        results={scavengerResults}
        onUpload={handleHuntUpload}
        loadingMap={huntUploadLoading}
        accountTier={profile?.accountTier}
        scavengerRetries={profile?.scavengerRetries}
        // Pass camera functions for scavenger hunt
        onTakePhoto={isOwner ? (promptId: string) => takePhoto('hunt', promptId) : undefined}
        onStartWebCamera={isOwner ? (promptId: string) => startWebCamera('hunt', promptId) : undefined}
      />
    </div>
  );
};

export default UserPage;