import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { getCurrentUser } from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData } from 'aws-amplify/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import ScavengerHuntSection from "@/components/ScavengerHuntSection";

const TEST_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/test_lambda";
const LIST_HUNTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_scavenger_hunts";
const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const GET_USER_HUNT_PROGRESS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get-user-hunt-progress";
const GET_SCAVENGER_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_scavenger_results";
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";
const SUBMIT_HUNT_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit-hunt-photo";

const STORAGE_URL = "https://picture-this-storage.s3.amazonaws.com";

type ScavengerHunt = {
  huntId: string;
  name: string;
  startDate?: string;
  prompts: { promptId: string; text: string }[];
};

export default function ScavengerHuntPage() {
  const [username, setUsername] = useState("");
  const [accountTier, setAccountTier] = useState("free");
  const [selectedHuntId, setSelectedHuntId] = useState("");
  const [availableHunts, setAvailableHunts] = useState<ScavengerHunt[]>([]);
  const [progress, setProgress] = useState<{ [promptId: string]: string }>({});
  const [results, setResults] = useState<{ [promptId: string]: { score: number; rubric: any; feedback: string } }>({});
  const [loadingMap, setLoadingMap] = useState<{ [promptId: string]: boolean }>({});
  const [scavengerRetries, setScavengerRetries] = useState<number | undefined>();

  // Camera states
  const [showCameraMap, setShowCameraMap] = useState<{ [promptId: string]: boolean }>({});
  const [selectedImages, setSelectedImages] = useState<{ [promptId: string]: File }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPromptId, setCurrentPromptId] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    getCurrentUser()
      .then((user) => setUsername(user.username))
      .catch(() => router.push("/"));
  }, [router]);

  useEffect(() => {
    if (!username) return;

    async function fetchData() {
        try {
        const [profileRes, huntsRes] = await Promise.all([
            invokeLambdaIam({ url: GET_PROFILE_URL, method: "POST", body: { username } }),
            invokeLambdaIam({ url: LIST_HUNTS_URL, method: "POST" }),
        ]);

        const userTier = profileRes.accountTier || "free";
        setAccountTier(userTier);
        setScavengerRetries(profileRes.scavengerRetries);

        const sortedHunts = (huntsRes || []).sort(
            (a: ScavengerHunt, b: ScavengerHunt) =>
            new Date(b.startDate || "").getTime() - new Date(a.startDate || "").getTime()
        );

        setAvailableHunts(sortedHunts);

        if (sortedHunts.length > 0 && !selectedHuntId) {
            if (userTier === "premium") {
            setSelectedHuntId(sortedHunts[0].huntId); // Premium: most recent, but dropdown shown
            } else {
            setSelectedHuntId(sortedHunts[0].huntId); // Free: forced to most recent
            }
        }
        } catch (err) {
        console.error("Failed to fetch profile or hunt list:", err);
        }
    }

    fetchData();
    }, [username]);

  useEffect(() => {
    if (!username || !selectedHuntId) return;

    async function fetchProgressAndResults() {
      try {
        const progressRes = await invokeLambdaIam({
          url: GET_USER_HUNT_PROGRESS_URL,
          method: "POST",
          body: { username, huntId: selectedHuntId },
        });

        const mappedProgress: { [promptId: string]: string } = {};
        for (const id of progressRes.promptIds || []) {
          mappedProgress[id] = `${STORAGE_URL}/public/scavenger-hunts/${selectedHuntId}/${username}/${id}.jpg`;
        }
        setProgress(mappedProgress);

        const resultsRes = await invokeLambdaIam({
          url: GET_SCAVENGER_RESULTS_URL,
          method: "POST",
          body: { username, huntId: selectedHuntId },
        });

        const mappedResults: typeof results = {};
        for (const r of resultsRes) {
          mappedResults[r.promptId] = {
            score: r.score,
            rubric: r.rubric,
            feedback: r.feedback,
          };
        }
        setResults(mappedResults);
      } catch (err) {
        console.error("Failed to fetch progress or results:", err);
      }
    }

    fetchProgressAndResults();
  }, [username, selectedHuntId]);

  // Take photo with Capacitor Camera plugin
  const takePhoto = async (promptId: string) => {
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
        
        setSelectedImages(prev => ({ ...prev, [promptId]: file }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Could not take photo. Please try again.');
    }
  };

  // Start web camera for specific prompt
  const startWebCamera = async (promptId: string) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        }
      });
      setShowCameraMap(prev => ({ ...prev, [promptId]: true }));
      setCurrentPromptId(promptId);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Stop web camera
  const stopWebCamera = (promptId: string) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCameraMap(prev => ({ ...prev, [promptId]: false }));
    setCurrentPromptId("");
  };

  // Capture photo from web camera
  const captureWebPhoto = () => {
    if (!videoRef.current || !canvasRef.current || !currentPromptId) return;

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
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        setSelectedImages(prev => ({ ...prev, [currentPromptId]: file }));
        stopWebCamera(currentPromptId);
      }
    }, 'image/jpeg', 0.9);
  };

  // Handle file selection
  const handleFileSelect = (promptId: string, file: File) => {
    setSelectedImages(prev => ({ ...prev, [promptId]: file }));
  };

  // Aggressive compression for large images
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
        }
      }).result;
      
      console.log("✅ Single-part upload completed:", result);
      return result;
      
    } catch (error: unknown) {
      console.error("❌ uploadData failed:", error);
      throw error;
    }
  }

  const handleUpload = async (promptId: string) => {
    const file = selectedImages[promptId];
    if (!file) {
      alert("Please select an image.");
      return;
    }

    setLoadingMap(prev => ({ ...prev, [promptId]: true }));

    try {
        // Compress the image first to avoid multipart upload
        console.log("📦 Compressing image to avoid multipart upload...");
        const compressedImage = await compressImage(file);
        
        // Use timestamp to ensure unique filenames
        const timestamp = Date.now();
        const s3Key = `public/scavenger-hunts/${selectedHuntId}/${username}/${promptId}.jpg`;

        console.log("🚀 Starting upload to path:", s3Key);

        // Use uploadData with single-part approach
        await uploadWithSinglePart(compressedImage, s3Key);

        console.log("✅ Upload completed");

        // Add a delay to ensure S3 consistency
        await new Promise(resolve => setTimeout(resolve, 1500));

        const imageUrl = `${STORAGE_URL}/${s3Key}`;

        await invokeLambdaIam({
        url: SUBMIT_HUNT_PHOTO_URL,
        method: "POST",
        body: { huntId: selectedHuntId, username, promptId, s3Key },
        });

        await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
            imageUrl,
            s3Key,
            rubric: true,
            username,
            huntId: selectedHuntId,
            scavengerPromptId: promptId,
        },
        });

        await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
            username,
            updates: {
            recomputeScavengerHuntStats: { op: "recomputeScavengerHuntStats" },
            },
        },
        });

        await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
            username,
            updates: {
            streakDays: { op: "updateStreak" },
            },
        },
        });

        // ✅ Refresh progress and results
        const [progressRes, resultsRes] = await Promise.all([
        invokeLambdaIam({
            url: GET_USER_HUNT_PROGRESS_URL,
            method: "POST",
            body: { username, huntId: selectedHuntId },
        }),
        invokeLambdaIam({
            url: GET_SCAVENGER_RESULTS_URL,
            method: "POST",
            body: { username, huntId: selectedHuntId },
        }),
        ]);

        const updatedProgress: { [promptId: string]: string } = {};
        for (const id of progressRes.promptIds || []) {
        updatedProgress[id] = `${STORAGE_URL}/public/scavenger-hunts/${selectedHuntId}/${username}/${id}.jpg`;
        }
        setProgress(updatedProgress);

        const updatedResults: typeof results = {};
        for (const r of resultsRes) {
        updatedResults[r.promptId] = {
            score: r.score,
            rubric: r.rubric,
            feedback: r.feedback,
        };
        }
        setResults(updatedResults);

        // Clear the selected image after successful upload
        setSelectedImages(prev => {
          const newState = { ...prev };
          delete newState[promptId];
          return newState;
        });

    } catch (err) {
        console.error("Upload failed:", err);
    } finally {
        setLoadingMap(prev => ({ ...prev, [promptId]: false }));
    }
    };

  // Photo selection component for each prompt with daily locks
  const PhotoSelector = ({ promptId, dayNumber }: { promptId: string; dayNumber: number }) => {
    const selectedImage = selectedImages[promptId];
    const showCamera = showCameraMap[promptId];
    const isLoading = loadingMap[promptId];
    const hasProgress = progress[promptId];

    // Calculate if this day is unlocked
    const huntStartDate = new Date(availableHunts.find(h => h.huntId === selectedHuntId)?.startDate || new Date());
    const today = new Date();
    const millisPerDay = 1000 * 60 * 60 * 24;
    const unlockedCount = Math.max(
      0,
      Math.floor((today.getTime() - huntStartDate.getTime()) / millisPerDay) + 1
    );
    const isUnlocked = dayNumber <= unlockedCount;

    // Check if user can upload (same logic as ScavengerHuntGrid)
    const maxRetries = 10;
    const retriesUsed = scavengerRetries ?? 0;
    const retryLimitReached = accountTier === "premium" && retriesUsed >= maxRetries;
    
    const canUpload = isUnlocked && (
      (accountTier !== "premium" && !hasProgress) ||
      (accountTier === "premium" && !retryLimitReached)
    );

    // If day is locked, show locked state
    if (!isUnlocked) {
      return (
        <div style={{ 
          marginTop: "1rem", 
          textAlign: "center", 
          padding: "2rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          color: "#6b7280"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔒</div>
          <div style={{ fontSize: "1rem", fontWeight: "500" }}>
            Day {dayNumber} Locked
          </div>
          <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Unlocks on {new Date(huntStartDate.getTime() + (dayNumber - 1) * millisPerDay).toLocaleDateString()}
          </div>
          <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", fontStyle: "italic" }}>
            {unlockedCount} of {availableHunts.find(h => h.huntId === selectedHuntId)?.prompts.length || 0} days currently unlocked
          </div>
        </div>
      );
    }

    // If already submitted and not loading
    if (hasProgress && !selectedImage) {
      return (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <img 
            src={progress[promptId]} 
            alt="Submitted" 
            style={{ 
              width: "100%", 
              maxHeight: "200px", 
              objectFit: "contain", 
              borderRadius: "8px",
              marginBottom: "0.5rem"
            }} 
          />
          <div style={{ fontSize: "0.9rem", color: "#22c55e", fontWeight: "500" }}>
            ✅ Photo submitted
          </div>
          
          {/* Show retry options for premium users */}
          {accountTier === "premium" && !retryLimitReached && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                🔁 Retries used: {retriesUsed} / {maxRetries}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                <label 
                  htmlFor={`fileInput-${promptId}`} 
                  style={{ 
                    display: "inline-block", 
                    padding: "0.5rem 1rem", 
                    backgroundColor: "#e5e7eb", 
                    borderRadius: "8px", 
                    fontSize: "0.9rem",
                    fontWeight: 500, 
                    cursor: "pointer" 
                  }}
                >
                  📁 Retry with File
                </label>
                <button 
                  type="button" 
                  onClick={() => takePhoto(promptId)}
                  style={{ 
                    padding: "0.5rem 1rem", 
                    backgroundColor: "#3b82f6", 
                    color: "white",
                    border: "none", 
                    borderRadius: "8px", 
                    fontSize: "0.9rem",
                    fontWeight: 500, 
                    cursor: "pointer" 
                  }}
                >
                  📷 Retry with Camera
                </button>
              </div>
            </div>
          )}
          
          {/* Show limit message for free users */}
          {accountTier !== "premium" && (
            <div style={{ 
              fontSize: "0.8rem", 
              color: "#ef4444", 
              marginTop: "0.5rem",
              fontStyle: "italic" 
            }}>
              Free users cannot retry submissions
            </div>
          )}
          
          {/* Show limit reached message */}
          {accountTier === "premium" && retryLimitReached && (
            <div style={{ 
              fontSize: "0.8rem", 
              color: "#ef4444", 
              marginTop: "0.5rem",
              fontStyle: "italic" 
            }}>
              Retry limit reached (10/10)
            </div>
          )}
        </div>
      );
    }

    // If can't upload (shouldn't happen with unlock logic, but safety check)
    if (!canUpload) {
      return (
        <div style={{ 
          marginTop: "1rem", 
          textAlign: "center", 
          padding: "1rem",
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
          color: "#dc2626"
        }}>
          <div>❌ Upload not available</div>
          {retryLimitReached && (
            <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Retry limit reached
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ marginTop: "1rem" }}>
        {/* Show unlock status */}
        <div style={{ 
          fontSize: "0.8rem", 
          color: "#22c55e", 
          marginBottom: "1rem",
          textAlign: "center",
          fontWeight: "500"
        }}>
          🔓 Day {dayNumber} Unlocked
        </div>

        {/* Photo upload options */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1rem" }}>
          <label 
            htmlFor={`fileInput-${promptId}`} 
            style={{ 
              display: "inline-block", 
              padding: "0.5rem 1rem", 
              backgroundColor: "#e5e7eb", 
              borderRadius: "8px", 
              fontSize: "0.9rem",
              fontWeight: 500, 
              cursor: "pointer" 
            }}
          >
            📁 Choose Photo
          </label>
          <button 
            type="button" 
            onClick={() => takePhoto(promptId)}
            style={{ 
              padding: "0.5rem 1rem", 
              backgroundColor: "#3b82f6", 
              color: "white",
              border: "none", 
              borderRadius: "8px", 
              fontSize: "0.9rem",
              fontWeight: 500, 
              cursor: "pointer" 
            }}
          >
            📷 Take Photo
          </button>
          <button 
            type="button" 
            onClick={() => startWebCamera(promptId)}
            style={{ 
              padding: "0.5rem 1rem", 
              backgroundColor: "#10b981", 
              color: "white",
              border: "none", 
              borderRadius: "8px", 
              fontSize: "0.9rem",
              fontWeight: 500, 
              cursor: "pointer"
            }}
          >
            🌐 Web Camera
          </button>
        </div>

        {/* Upload guidance */}
        <div style={{ 
          fontSize: "0.8rem", 
          color: "#6b7280", 
          textAlign: "center",
          marginBottom: "1rem"
        }}>
          Max size: {accountTier === "premium" ? "50MB" : "2MB"}
          {accountTier === "premium" && (
            <div>🔁 Retries: {retriesUsed} / {maxRetries}</div>
          )}
        </div>

        <input 
          id={`fileInput-${promptId}`} 
          type="file" 
          accept="image/*" 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              const maxSizeMB = accountTier === "premium" ? 50 : 2;
              const maxSizeBytes = maxSizeMB * 1024 * 1024;

              if (file.size > maxSizeBytes) {
                alert(`File too large. Maximum allowed size is ${maxSizeMB} MB.`);
                return;
              }
              
              handleFileSelect(promptId, file);
            }
          }}
          style={{ display: "none" }} 
        />

        {/* Camera interface */}
        {showCamera && currentPromptId === promptId && (
          <div style={{ 
            width: "100%", 
            maxWidth: "300px", 
            backgroundColor: "#000", 
            borderRadius: "12px", 
            overflow: "hidden", 
            position: "relative",
            margin: "0 auto 1rem auto"
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: "100%", height: "200px", objectFit: "cover" }}
            />
            <div style={{ 
              position: "absolute", 
              bottom: "0.5rem", 
              left: "50%", 
              transform: "translateX(-50%)", 
              display: "flex", 
              gap: "0.5rem" 
            }}>
              <button 
                type="button" 
                onClick={captureWebPhoto}
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  backgroundColor: "white", 
                  border: "2px solid #ccc", 
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                📸
              </button>
              <button 
                type="button" 
                onClick={() => stopWebCamera(promptId)}
                style={{ 
                  padding: "0.25rem 0.5rem", 
                  backgroundColor: "#ef4444", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px", 
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Selected image preview */}
        {selectedImage && (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="preview" 
              style={{ 
                width: "100%", 
                maxHeight: "200px", 
                objectFit: "contain", 
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                filter: isLoading ? "blur(1px) grayscale(0.6)" : "none"
              }} 
            />
          </div>
        )}

        {/* Upload button */}
        {selectedImage && (
          <div style={{ textAlign: "center" }}>
            <button 
              onClick={() => handleUpload(promptId)}
              disabled={isLoading}
              style={{ 
                padding: "0.5rem 1rem", 
                backgroundColor: isLoading ? "#9ca3af" : "#b76e79", 
                color: "white", 
                border: "none", 
                borderRadius: "8px", 
                fontSize: "0.9rem", 
                fontWeight: "bold", 
                cursor: isLoading ? "not-allowed" : "pointer",
                width: "100%"
              }}
            >
              {isLoading ? "Uploading..." : "Submit Photo"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const selectedHunt = availableHunts.find((h) => h.huntId === selectedHuntId);

  if (!username || !selectedHunt) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading scavenger hunt...</div>;
  }

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>🧭 Scavenger Hunt</h1>

      {accountTier === "premium" && (
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="hunt-select" style={{ fontWeight: "bold", marginRight: 8 }}>
            Select Hunt:
          </label>
          <select
            id="hunt-select"
            value={selectedHuntId}
            onChange={(e) => setSelectedHuntId(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 6 }}
          >
            {availableHunts.map((hunt) => (
              <option key={hunt.huntId} value={hunt.huntId}>
                {hunt.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hunt prompts with photo selectors */}
      <div style={{ marginTop: "2rem" }}>
        <h2>{selectedHunt.name}</h2>
        {selectedHunt.startDate && (
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Started: {new Date(selectedHunt.startDate).toLocaleDateString()}
          </p>
        )}

        {selectedHunt.prompts.map((prompt, index) => {
          const dayNumber = index + 1;
          
          return (
            <div 
              key={prompt.promptId} 
              style={{ 
                backgroundColor: "white", 
                borderRadius: "12px", 
                padding: "1.5rem", 
                marginBottom: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb"
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#1f2937" }}>
                Day {dayNumber}: {prompt.text}
              </h3>
              
              <PhotoSelector promptId={prompt.promptId} dayNumber={dayNumber} />

              {/* Results display */}
              {results[prompt.promptId] && (
                <div style={{ 
                  marginTop: "1rem", 
                  padding: "1rem", 
                  backgroundColor: "#f3f4f6", 
                  borderRadius: "8px" 
                }}>
                  <h4 style={{ marginTop: 0, fontSize: "1rem" }}>📊 Results</h4>
                  <p><strong>Score:</strong> {results[prompt.promptId].score}/100</p>
                  <p><strong>Feedback:</strong> {results[prompt.promptId].feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}