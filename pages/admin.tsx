import React, { useState, useRef, useEffect } from 'react';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

// API endpoints
const LIST_PHOTOS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_photos";
const FEATURE_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/feature_photo";
const LIST_FEEDBACK_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_feedback";

// Types
interface Photo {
  key: string;
  size: number;
  filename: string;
  subfolder: string;
}

interface FeedbackItem {
  feedbackId: string;
  description: string;
  resolved: boolean;
  timestamp: string;
  username: string;
}

export default function AdminPhotoBrowser() {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [featureLoading, setFeatureLoading] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Photo swiper state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'feedback'>('photos');

  const handleLoadPhotos = async () => {
    if (!selectedFolder) return;
    
    setLoading(true);
    setError("");
    setSuccessMessage("");
    setPhotos([]);
    setCurrentPhotoIndex(0);
    
    try {
      const res = await invokeLambdaIam({
        url: LIST_PHOTOS_URL,
        method: "POST",
        body: { folder: selectedFolder },
      });
      
      console.log("Lambda response:", res);
      
      if (res.success && res.photos) {
        setPhotos(res.photos);
        setSuccessMessage(`✅ Loaded ${res.photos.length} photos from ${selectedFolder}`);
      } else {
        setError(res?.message || "Failed to load photos.");
      }
    } catch (err: any) {
      console.error("Failed to load photos", err);
      setError("Failed to load photos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturePhoto = async (photo: Photo) => {
    setFeatureLoading(photo.key);
    setError("");
    setSuccessMessage("");
    
    try {
      console.log("Featuring photo:", photo.key, "for user:", photo.subfolder);
      
      const res = await invokeLambdaIam({
        url: FEATURE_PHOTO_URL,
        method: "POST",
        body: { 
          sourceKey: photo.key,
          username: photo.subfolder,
          caption: "No Caption"
        },
      });
      
      if (res.success) {
        setSuccessMessage(`✅ Photo featured successfully for user: ${photo.subfolder}`);
      } else {
        setError(res?.message || "Failed to feature photo.");
      }
    } catch (err: any) {
      console.error("Failed to feature photo", err);
      setError("Failed to feature photo.");
    } finally {
      setFeatureLoading("");
    }
  };

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const res = await invokeLambdaIam({
        url: LIST_FEEDBACK_URL,
        method: "POST",
        body: {},
      });
      
      if (res && res.feedbackList) {
        setFeedback(res.feedbackList);
      }
    } catch (err: any) {
      console.error("Failed to load feedback", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
    if (isRightSwipe && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const goToNextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const goToPreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const getThumbnailUrl = (photoKey: string): string => {
    return `https://picture-this-storage.s3.amazonaws.com/${photoKey}`;
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load feedback on mount
  useEffect(() => {
    loadFeedback();
  }, []);

  const currentPhoto = photos[currentPhotoIndex];
  const unresolved = feedback.filter(f => !f.resolved).length;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>
        📸 Admin Dashboard
      </h1>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('photos')}
          style={{
            padding: '12px 24px',
            marginRight: '8px',
            backgroundColor: activeTab === 'photos' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'photos' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📸 Photo Management
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'feedback' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'feedback' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          💬 Feedback Reports
          {unresolved > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              padding: '4px 8px',
              fontSize: '12px'
            }}>
              {unresolved}
            </span>
          )}
        </button>
      </div>
      
      {/* Messages */}
      {successMessage && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '4px',
          color: '#155724'
        }}>
          {successMessage}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          color: '#721c24'
        }}>
          {error}
        </div>
      )}

      {/* Photo Management Tab */}
      {activeTab === 'photos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Panel: Controls */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Select Folder
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
              >
                <option value="">Choose a folder...</option>
                <option value="challenge-submissions">Challenge Submissions</option>
                <option value="picture-submissions">Picture Submissions</option>
                <option value="profile-pics">Profile Pictures</option>
                <option value="scavenger-hunts">Scavenger Hunts</option>
                <option value="user-creations">User Creations</option>
              </select>
            </div>

            <button
              onClick={handleLoadPhotos}
              disabled={!selectedFolder || loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: (!selectedFolder || loading) ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (!selectedFolder || loading) ? 'not-allowed' : 'pointer',
                marginBottom: '16px'
              }}
            >
              {loading ? "🔄 Loading..." : "📂 Load Photos"}
            </button>

            {photos.length > 0 && (
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                <h3 style={{ marginBottom: '8px' }}>📊 Photo Stats</h3>
                <p>Total: {photos.length}</p>
                <p>Current: {currentPhotoIndex + 1} of {photos.length}</p>
                <p>Folder: {selectedFolder}</p>
              </div>
            )}
          </div>

          {/* Right Panel: Photo Swiper */}
          <div>
            {photos.length > 0 && currentPhoto && (
              <div>
                <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>📸 Photo Swiper</h2>
                
                <div style={{ textAlign: 'center', marginBottom: '16px', color: '#666' }}>
                  {currentPhotoIndex + 1} of {photos.length}
                </div>

                {/* Photo Card */}
                <div
                  ref={cardRef}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '400px',
                    margin: '0 auto 16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    cursor: 'grab'
                  }}
                >
                  <div style={{ height: '75%', overflow: 'hidden' }}>
                    <img
                      src={getThumbnailUrl(currentPhoto.key)}
                      alt={currentPhoto.filename}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2TDQwIDMyTDQ0IDM2VjQ0SDIwVjM2TDI4IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  <div style={{ height: '25%', padding: '12px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{currentPhoto.filename}</h3>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#666' }}>by @{currentPhoto.subfolder}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>{Math.round(currentPhoto.size / 1024)}KB</p>
                  </div>
                </div>

                {/* Feature Button */}
                <button
                  onClick={() => handleFeaturePhoto(currentPhoto)}
                  disabled={featureLoading === currentPhoto.key}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    display: 'block',
                    margin: '0 auto 16px',
                    padding: '12px',
                    backgroundColor: featureLoading === currentPhoto.key ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: featureLoading === currentPhoto.key ? 'not-allowed' : 'pointer'
                  }}
                >
                  {featureLoading === currentPhoto.key ? "⏳ Featuring..." : "⭐ Feature This Photo"}
                </button>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
                  <button
                    onClick={goToPreviousPhoto}
                    disabled={currentPhotoIndex === 0}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: currentPhotoIndex === 0 ? '#e9ecef' : '#007bff',
                      color: currentPhotoIndex === 0 ? '#6c757d' : 'white',
                      border: 'none',
                      cursor: currentPhotoIndex === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ←
                  </button>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>Swipe or use arrows</span>
                  <button
                    onClick={goToNextPhoto}
                    disabled={currentPhotoIndex >= photos.length - 1}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: currentPhotoIndex >= photos.length - 1 ? '#e9ecef' : '#007bff',
                      color: currentPhotoIndex >= photos.length - 1 ? '#6c757d' : 'white',
                      border: 'none',
                      cursor: currentPhotoIndex >= photos.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Management Tab */}
      {activeTab === 'feedback' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>💬 Feedback Reports</h2>
            <button
              onClick={loadFeedback}
              disabled={feedbackLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: feedbackLoading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: feedbackLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {feedbackLoading ? "🔄 Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{feedback.length}</div>
              <div style={{ color: '#666' }}>Total Reports</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{feedback.filter(f => !f.resolved).length}</div>
              <div style={{ color: '#666' }}>Unresolved</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{feedback.filter(f => f.resolved).length}</div>
              <div style={{ color: '#666' }}>Resolved</div>
            </div>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {feedback.length > 0 ? (
                  feedback
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((item, index) => (
                    <tr key={item.feedbackId} style={{ borderBottom: index < feedback.length - 1 ? '1px solid #eee' : 'none' }}>
                      <td style={{ padding: '12px' }}>{item.username}</td>
                      <td style={{ padding: '12px' }}>{item.description}</td>
                      <td style={{ padding: '12px' }}>
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor: item.resolved ? '#d4edda' : '#f8d7da',
                          color: item.resolved ? '#155724' : '#721c24'
                        }}>
                          {item.resolved ? '✅ Resolved' : '🔴 Open'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                      {feedbackLoading ? "Loading feedback reports..." : "No feedback reports available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}