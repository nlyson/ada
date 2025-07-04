import "@/lib/configureAmplify";
import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import Link from "next/link";
import { uploadData } from 'aws-amplify/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";
const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const GET_FEEDBACK_USAGE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_feedback_usage";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

type FeedbackResult = {
  score?: number;
  rubric?: Record<string, number | string>;
  feedback: string;
  tips?: string[];
};

// Mobile camera instruction generator
const generateMobileCameraInstructions = (feedback: string, score?: number, rubric?: Record<string, number | string>) => {
  const instructions = {
    ios: [] as string[],
    android: [] as string[],
  };

  const feedbackLower = feedback.toLowerCase();
  const rubricText = rubric ? Object.entries(rubric).map(([key, val]) => `${key}: ${val}`).join(' ').toLowerCase() : '';
  const allText = `${feedbackLower} ${rubricText}`;

  // Exposure and brightness issues
  if (allText.includes('dark') || allText.includes('underexposed') || allText.includes('shadow') || allText.includes('brighten')) {
    instructions.ios.push("📱 **Exposure:** Tap on the darker area of your subject, then slide the sun icon ☀️ upward to brighten");
    instructions.android.push("📱 **Exposure:** Tap to focus, then drag the exposure slider (☀️ icon) upward to brighten your shot");
  }

  if (allText.includes('bright') || allText.includes('overexposed') || allText.includes('blown out') || allText.includes('too light')) {
    instructions.ios.push("📱 **Exposure:** Tap on the brightest area, then slide the sun icon ☀️ downward to darken");
    instructions.android.push("📱 **Exposure:** Tap to focus, then drag the exposure slider (☀️ icon) downward to reduce brightness");
  }

  // Focus and sharpness issues
  if (allText.includes('blur') || allText.includes('focus') || allText.includes('sharp') || allText.includes('soft')) {
    instructions.ios.push("🎯 **Focus:** Tap directly on your main subject and wait for the yellow focus square to appear and lock");
    instructions.android.push("🎯 **Focus:** Tap your subject and wait for the focus circle to turn green before taking the shot");
  }

  // Composition issues
  if (allText.includes('rule of thirds') || allText.includes('composition') || allText.includes('center') || allText.includes('framing')) {
    instructions.ios.push("📐 **Composition:** Go to Settings > Camera > Grid, then align your subject along the grid lines (rule of thirds)");
    instructions.android.push("📐 **Composition:** Enable grid in camera settings, then place your subject at the intersection of grid lines");
  }

  if (allText.includes('angle') || allText.includes('perspective') || allText.includes('viewpoint')) {
    instructions.ios.push("📐 **Angles:** Try shooting from different heights - crouch down or hold your phone higher for more dynamic shots");
    instructions.android.push("📐 **Angles:** Experiment with camera height - low angles make subjects look powerful, high angles create intimacy");
  }

  // Lighting issues
  if (allText.includes('light') || allText.includes('lighting') || allText.includes('golden hour') || allText.includes('harsh')) {
    instructions.ios.push("💡 **Lighting:** Use the flash button (⚡) - tap it to cycle: Auto/On/Off. For portraits, try 'Auto' or 'Off' with natural light");
    instructions.android.push("💡 **Lighting:** Tap the flash icon (⚡) to toggle modes. For better lighting, face your subject toward a window or light source");
  }

  if (allText.includes('shadow') || allText.includes('contrast') || allText.includes('harsh light')) {
    instructions.ios.push("🌤️ **Soft Light:** Look for open shade (under a tree or building overhang) for even, flattering light");
    instructions.android.push("🌤️ **Soft Light:** Move to areas with indirect light - near windows or in open shade for more even lighting");
  }

  // Portrait mode and depth
  if (allText.includes('background') || allText.includes('depth') || allText.includes('bokeh') || allText.includes('subject separation')) {
    instructions.ios.push("🎭 **Portrait Mode:** Swipe to 'Portrait' mode for automatic background blur (works best 2-8 feet from subject)");
    instructions.android.push("🎭 **Portrait Mode:** Look for 'Portrait' or 'Live Focus' mode in your camera app for background blur effects");
  }

  // Color and white balance
  if (allText.includes('color') || allText.includes('white balance') || allText.includes('warm') || allText.includes('cool') || allText.includes('tint')) {
    instructions.ios.push("🎨 **Color:** Use built-in filters (swipe up from camera) or go to Settings > Camera > Preserve Settings > Filter");
    instructions.android.push("🎨 **Color:** Try different scene modes (Auto, Vivid, Natural) or use filters available in your camera app");
  }

  // Night and low light
  if (allText.includes('night') || allText.includes('low light') || allText.includes('dark') || allText.includes('noise')) {
    instructions.ios.push("🌙 **Night Mode:** On iPhone 11+, Night mode activates automatically in low light - keep steady for 1-3 seconds");
    instructions.android.push("🌙 **Night Mode:** Look for 'Night' or 'Low Light' mode in your camera settings for better dark photos");
  }

  // Stability and motion
  if (allText.includes('shake') || allText.includes('motion') || allText.includes('stability') || allText.includes('steady')) {
    instructions.ios.push("🤳 **Stability:** Hold your phone with both hands, tuck elbows against your body, and tap the volume button to take photos");
    instructions.android.push("🤳 **Stability:** Use both hands, brace against a wall/surface, or use the volume button instead of screen tap");
  }

  // Video-specific advice
  if (allText.includes('video') || allText.includes('motion') || allText.includes('movement')) {
    instructions.ios.push("🎬 **Video:** Swipe to 'Video' mode, tap to focus, then use slow, smooth movements - enable 'Lock Camera' in settings");
    instructions.android.push("🎬 **Video:** Switch to video mode, tap to focus first, then move camera smoothly - avoid quick pans or shakes");
  }

  // Default helpful tips if no specific issues detected
  if (instructions.ios.length === 0 && instructions.android.length === 0) {
    instructions.ios.push("📱 **General:** Tap to focus on your subject, check your lighting, and try different angles");
    instructions.ios.push("🧹 **Maintenance:** Clean your camera lens with a soft cloth for sharper photos");
    instructions.android.push("📱 **General:** Tap your subject to focus, ensure good lighting, and experiment with composition");
    instructions.android.push("🧹 **Maintenance:** Keep your camera lens clean for the best image quality");
  }

  // Add pro tip based on score
  if (score && score >= 80) {
    instructions.ios.push("🏆 **Pro Tip:** Try shooting in RAW format (Settings > Camera > Formats > ProRAW) for advanced editing flexibility");
    instructions.android.push("🏆 **Pro Tip:** Enable RAW/DNG format in camera settings for maximum editing control");
  } else if (score && score >= 60) {
    instructions.ios.push("📈 **Next Level:** Experiment with different camera modes and manual controls in third-party apps");
    instructions.android.push("📈 **Next Level:** Try manual controls (Pro mode) to fine-tune exposure, ISO, and focus");
  }

  return instructions;
};

const App: React.FC<AppProps> = ({ signOut, user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [accountTier, setAccountTier] = useState<string>("free");
  const [usage, setUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);
  const [showMobileGuide, setShowMobileGuide] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  
  // Camera states - simplified for Capacitor
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchProfileAndUsage = async () => {
      try {
        const profileResult = await invokeLambdaIam({
          url: GET_PROFILE_URL,
          method: "POST",
          body: { username: user.username },
        });

        const tier = profileResult.accountTier || "free";
        setAccountTier(tier);

        const usageResult = await invokeLambdaIam({
          url: GET_FEEDBACK_USAGE_URL,
          method: "POST",
          body: {
            username: user.username,
            accountTier: tier,
          },
        });

        setUsage(usageResult);
      } catch (err) {
        console.error("Failed to fetch profile or usage info:", err);
      }
    };

    if (user.username) {
      fetchProfileAndUsage();
    }
  }, [user.username]);

  // Take photo with Capacitor Camera plugin
  const takePhoto = async () => {
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
        
        setImage(file);
        setFeedback(null); // Clear previous feedback
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Could not take photo. Please try again.');
    }
  };

  // Fallback web camera for desktop/browsers
  const startWebCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        }
      });
      setShowCamera(true);
      
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
  };

  // Capture photo from web camera
  const captureWebPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

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
        setImage(file);
        stopWebCamera();
        setFeedback(null); // Clear previous feedback
      }
    }, 'image/jpeg', 0.9);
  };

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    } else {
      setImage(null);
    }
    // Clear previous feedback when new image is selected
    setFeedback(null);
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
          // These might help force single-part upload
          onProgress: undefined,
          // Try to prevent multipart by keeping size small in AWS's eyes
        }
      }).result;
      
      console.log("✅ Single-part upload completed:", result);
      return result;
      
    } catch (error: unknown) {
      console.error("❌ uploadData failed:", error);
      throw error;
    }
  }

  // Function to reset the form completely
  function resetForm() {
    setImage(null);
    setFeedback(null);
    setLoading(false);
    setShowMobileGuide(false);
    stopWebCamera(); // Stop camera if running
    // Reset the file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!image) {
      alert("Please select an image.");
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      // Compress the image first to avoid multipart upload
      console.log("📦 Compressing image to avoid multipart upload...");
      const compressedImage = await compressImage(image);
      
      // Use timestamp to ensure unique filenames
      const timestamp = Date.now();
      const path = `public/user-creations/${user.username}/${timestamp}-${compressedImage.name}`;

      console.log("🚀 Starting upload to path:", path);

      // Use uploadData with single-part approach
      const result1 = await uploadWithSinglePart(compressedImage, path);

      console.log("✅ Upload completed:", result1);

      // Add a delay to ensure S3 consistency
      await new Promise(resolve => setTimeout(resolve, 1500));

      const useRubric = accountTier === "premium";

      console.log("🔄 Sending for analysis...");

      const result = await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
          s3Key: path,
          imageUrl: `https://picture-this-storage.s3.amazonaws.com/${path}`,
          username: user.username,
          rubric: useRubric,
          challengeId: "manual-feedback",
          accountTier,
        },
      });

      console.log("✅ Analysis completed:", result);

      const feedbackResult: FeedbackResult = {
        feedback: result?.feedback || result?.result || "No feedback.",
        score: result?.score,
        rubric: result?.rubric,
        tips: result?.tips,
      };

      setFeedback(feedbackResult);
      setShowMobileGuide(true); // Show mobile guide when feedback is received
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      console.error("Error analyzing image:", err);
      setFeedback({ feedback: `Error analyzing image: ${err}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#f9fafb", color: "#111827", minHeight: "100vh", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "2rem", textAlign: "center" }}>
        <img src="/photo_mentor_logo.png" alt="Photo Mentor Logo" style={{ width: "100%", maxWidth: 200, margin: "0 auto 1rem auto", display: "block" }} />

        <h2 style={{ fontSize: "1.8rem", margin: "1.5rem 0 1rem" }}>Photo Feedback</h2>

        {usage && (
          <div style={{ fontSize: 14, marginBottom: 8, color: "#4b5563" }}>
            📸 Feedbacks used this week: <strong>{usage.used}</strong> of {usage.limit}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          
          {/* Photo upload options */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <label htmlFor="fileInput" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#e5e7eb", borderRadius: "9999px", fontWeight: 500, cursor: "pointer" }}>
              📁 Choose Photo
            </label>
            <button 
              type="button" 
              onClick={takePhoto}
              style={{ 
                padding: "0.75rem 1.5rem", 
                backgroundColor: "#3b82f6", 
                color: "white",
                border: "none", 
                borderRadius: "9999px", 
                fontWeight: 500, 
                cursor: "pointer" 
              }}
            >
              📷 Take Photo
            </button>
            <button 
              type="button" 
              onClick={startWebCamera}
              style={{ 
                padding: "0.75rem 1.5rem", 
                backgroundColor: "#10b981", 
                color: "white",
                border: "none", 
                borderRadius: "9999px", 
                fontWeight: 500, 
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              🌐 Web Camera
            </button>
          </div>

          <input id="fileInput" type="file" accept="image/*" onChange={handleChange} style={{ display: "none" }} />

          {/* Camera interface */}
          {showCamera && (
            <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "#000", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: "100%", height: "300px", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "1rem" }}>
                <button 
                  type="button" 
                  onClick={captureWebPhoto}
                  style={{ 
                    width: "60px", 
                    height: "60px", 
                    borderRadius: "50%", 
                    backgroundColor: "white", 
                    border: "4px solid #ccc", 
                    cursor: "pointer",
                    fontSize: "1.2rem"
                  }}
                >
                  📸
                </button>
                <button 
                  type="button" 
                  onClick={stopWebCamera}
                  style={{ 
                    padding: "0.5rem 1rem", 
                    backgroundColor: "#ef4444", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer" 
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <button type="submit" disabled={loading || !image} style={{ 
            padding: "0.75rem 1.5rem", 
            backgroundColor: (loading || !image) ? "#9ca3af" : "#b76e79", 
            color: "white", 
            border: "none", 
            borderRadius: "9999px", 
            fontSize: "1rem", 
            fontWeight: "bold", 
            cursor: (loading || !image) ? "not-allowed" : "pointer", 
            width: "100%", 
            maxWidth: "300px" 
          }}>
            {loading ? "Analyzing..." : "Analyze Photo"}
          </button>

          {/* Add a reset button for convenience */}
          {(image || feedback) && (
            <button 
              type="button" 
              onClick={resetForm}
              style={{ 
                padding: "0.5rem 1rem", 
                backgroundColor: "#6b7280", 
                color: "white", 
                border: "none", 
                borderRadius: "9999px", 
                fontSize: "0.9rem", 
                cursor: "pointer" 
              }}
            >
              🗑️ Clear & Start Over
            </button>
          )}
        </form>

        {accountTier !== "premium" && (
          <div style={{ backgroundColor: "#fffbe6", border: "1px solid #facc15", borderRadius: 12, padding: 16, marginTop: 32, textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 14 }}>🌟 <strong>Want the full critique?</strong> Premium users unlock:</p>
            <ul style={{ fontSize: 14, paddingLeft: 20, marginTop: 8 }}>
              <li>✅ 50 photo reviews per week</li>
              <li>🧠 Direct input from <strong>Jama Pantel</strong> — founder & expert photographer</li>
            </ul>
            <Link href="/settings" legacyBehavior>
              <a style={{ display: "inline-block", marginTop: 10, padding: "8px 16px", backgroundColor: "#16a34a", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                🚀 Upgrade to Premium
              </a>
            </Link>
          </div>
        )}

        {image && (
          <img src={URL.createObjectURL(image)} alt="preview" style={{ width: "100%", maxHeight: "50vh", objectFit: "contain", marginTop: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", filter: loading ? "blur(2px) grayscale(0.6)" : "none", transition: "filter 0.3s ease-in-out" }} />
        )}

        {feedback && (
          <div style={{ marginTop: 32, background: "#f3f4f6", padding: 24, borderRadius: 12, textAlign: "left", lineHeight: 1.6, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.25rem", fontWeight: 600 }}>🧠 Photographer Feedback</h3>

            {"score" in feedback && typeof feedback.score === "number" && <p><strong>Total Score:</strong> {feedback.score} / 100</p>}

            {feedback.rubric && (
              <>
                <h4>Rubric Breakdown</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {Object.entries(feedback.rubric).map(([key, val]) => (
                    <li key={key}>{key}: {typeof val === "number" ? `${val}/25` : <em>{val}</em>}</li>
                  ))}
                </ul>
              </>
            )}

            <div style={{ marginTop: 12 }}>
              <strong>Feedback:</strong>
              <div style={{ marginTop: 8 }}>
                <ReactMarkdown
                  components={{
                    strong: ({ children }) => <strong style={{ color: "#b76e79" }}>{children}</strong>,
                    p: ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ paddingLeft: 20, marginTop: 8 }}>{children}</ul>,
                  }}
                >
                  {feedback.feedback}
                </ReactMarkdown>
              </div>
            </div>

            {feedback.tips && feedback.tips.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>🔁 Retry Tips</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {feedback.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                </ul>
              </div>
            )}

            {/* Mobile Camera Instructions */}
            {showMobileGuide && (
              <div style={{ marginTop: 24, padding: 20, backgroundColor: "#f0f9ff", borderRadius: 12, border: "2px solid #0ea5e9" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h4 style={{ margin: 0, color: "#0369a1", fontSize: "1.1rem" }}>📱 Apply This on Your Phone Camera</h4>
                  <button 
                    onClick={() => setShowMobileGuide(false)}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      fontSize: "1.2rem", 
                      cursor: "pointer",
                      color: "#6b7280"
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Tab selector */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: 16 }}>
                  <button 
                    onClick={() => setActiveTab('ios')}
                    style={{ 
                      padding: "0.5rem 1rem", 
                      backgroundColor: activeTab === 'ios' ? "#3b82f6" : "#e5e7eb", 
                      color: activeTab === 'ios' ? "white" : "#374151",
                      border: "none", 
                      borderRadius: "8px", 
                      fontSize: "0.9rem", 
                      fontWeight: 500, 
                      cursor: "pointer" 
                    }}
                  >
                    🍎 iPhone
                  </button>
                  <button 
                    onClick={() => setActiveTab('android')}
                    style={{ 
                      padding: "0.5rem 1rem", 
                      backgroundColor: activeTab === 'android' ? "#10b981" : "#e5e7eb", 
                      color: activeTab === 'android' ? "white" : "#374151",
                      border: "none", 
                      borderRadius: "8px", 
                      fontSize: "0.9rem", 
                      fontWeight: 500, 
                      cursor: "pointer" 
                    }}
                  >
                    🤖 Android
                  </button>
                </div>

                {/* Instructions content */}
                <div style={{ minHeight: "200px" }}>
                  {(() => {
                    const instructions = generateMobileCameraInstructions(feedback.feedback, feedback.score, feedback.rubric);
                    const currentInstructions = activeTab === 'ios' ? instructions.ios : instructions.android;
                    
                    return (
                      <div>
                        <div style={{ 
                          fontSize: "0.9rem", 
                          color: "#6b7280", 
                          marginBottom: 12,
                          fontStyle: "italic"
                        }}>
                          {activeTab === 'ios' ? 
                            "Step-by-step instructions for iPhone Camera app:" : 
                            "Step-by-step instructions for Android Camera app:"
                          }
                        </div>
                        
                        {currentInstructions.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {currentInstructions.map((instruction, idx) => (
                              <div key={idx} style={{ 
                                padding: "12px 16px", 
                                backgroundColor: "white", 
                                borderRadius: "8px", 
                                border: "1px solid #e5e7eb",
                                fontSize: "0.9rem",
                                lineHeight: 1.5
                              }}>
                                <ReactMarkdown
                                  components={{
                                    strong: ({ children }) => <strong style={{ color: activeTab === 'ios' ? "#3b82f6" : "#10b981" }}>{children}</strong>,
                                    p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
                                  }}
                                >
                                  {instruction}
                                </ReactMarkdown>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ 
                            padding: "16px", 
                            backgroundColor: "white", 
                            borderRadius: "8px", 
                            border: "1px solid #e5e7eb",
                            textAlign: "center",
                            color: "#6b7280",
                            fontStyle: "italic"
                          }}>
                            Great job! Your photo technique is solid. Keep experimenting with different subjects and lighting conditions.
                          </div>
                        )}

                        {/* Quick reference card */}
                        <div style={{ 
                          marginTop: 16, 
                          padding: "12px 16px", 
                          backgroundColor: "#fef3c7", 
                          borderRadius: "8px",
                          border: "1px solid #f59e0b"
                        }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#92400e", marginBottom: 8 }}>
                            💡 Quick Reference:
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#92400e", lineHeight: 1.4 }}>
                            {activeTab === 'ios' ? 
                              "• Tap to focus • Swipe sun ☀️ for exposure • Volume buttons = shutter • Portrait mode for blur" :
                              "• Tap to focus • Drag exposure slider • Volume buttons = shutter • Pro mode for manual controls"
                            }
                          </div>
                        </div>

                        {/* App recommendations */}
                        <div style={{ 
                          marginTop: 16, 
                          padding: "12px 16px", 
                          backgroundColor: "#f3f4f6", 
                          borderRadius: "8px",
                          border: "1px solid #d1d5db"
                        }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                            📱 Pro Camera Apps:
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.4 }}>
                            {activeTab === 'ios' ? 
                              "VSCO, Adobe Lightroom, ProCamera, Halide Mark II" :
                              "Open Camera, Camera FV-5, Adobe Lightroom, ProShot"
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;