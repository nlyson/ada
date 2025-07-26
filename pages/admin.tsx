import React, { useState, useRef, useEffect } from 'react';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

// API endpoints
const LIST_PHOTOS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_photos";
const FEATURE_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/feature_photo";
const LIST_FEEDBACK_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_feedback";
const GET_USAGE_DATA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_usage_data";

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

interface UsageItem {
  username: string;
  action: string;
  timestamp: string;
  success: boolean;
  responseTime?: number;
  accountTier?: string;
}

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const AdminDashboard: React.FC<AppProps> = ({ user }) => {
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
  
  // Usage tracking state
  const [usageData, setUsageData] = useState<UsageItem[]>([]);
  const [usageLoading, setUsageLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  const [activeTab, setActiveTab] = useState<'photos' | 'feedback' | 'usage'>('photos');

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

  const loadUsageData = async () => {
    setUsageLoading(true);
    try {
      const res = await invokeLambdaIam({
        url: GET_USAGE_DATA_URL,
        method: "POST",
        body: { 
          limit: 50,
          excludeUsers: ['nathan', 'jama'],
          hoursBack: 24  // Last 24 hours
        },
      });
      
      if (res && res.success && res.usageData) {
        setUsageData(res.usageData);
      } else {
        console.error("Failed to load usage data:", res);
        setUsageData([]);
      }
    } catch (err: any) {
      console.error("Failed to load usage data", err);
      setUsageData([]);
    } finally {
      setUsageLoading(false);
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

  // Helper functions for usage tracking display
  const formatActionName = (action: string): string => {
    const actionMap: { [key: string]: string } = {
      'get_profile': 'Profile View',
      'payment': 'Payment',
      'upgrade_premium': 'Upgrade',
      'update_profile': 'Update Profile',
      'photo_upload': 'Photo Upload',
      'challenge_submission': 'Challenge',
      'ai_feedback': 'AI Feedback',
      'scavenger_submission': 'Scavenger Hunt',
      'add_comment': 'Comment',
      'browse_profiles': 'Browse Users',
      'daily_tip': 'Daily Tip',
      'featured_photos': 'Featured Photos',
      'search_users': 'Search',
      'admin_feature_photo': 'Admin: Feature',
      'admin_list_photos': 'Admin: List'
    };
    return actionMap[action] || action.replace('_', ' ');
  };

  const getActionColor = (action: string): string => {
    if (action.includes('payment') || action.includes('upgrade')) return '#059669'; // Green for revenue
    if (action.includes('ai_feedback') || action.includes('premium')) return '#7c3aed'; // Purple for premium features
    if (action.includes('upload') || action.includes('submission')) return '#2563eb'; // Blue for content creation
    if (action.includes('admin')) return '#dc2626'; // Red for admin actions
    if (action.includes('comment') || action.includes('reaction')) return '#f59e0b'; // Orange for social
    return '#6b7280'; // Gray for other actions
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

  // Load feedback and usage data on mount
  useEffect(() => {
    loadFeedback();
    loadUsageData();
  }, []);

  const currentPhoto = photos[currentPhotoIndex];
  const unresolved = feedback.filter(f => !f.resolved).length;
  const filteredUsageData = usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase()));

  return (
    <div>
      {/* Header */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ 
          fontSize: "1.75rem", 
          fontWeight: "700", 
          margin: "0 0 0.5rem 0",
          color: "#374151"
        }}>
          👑 Admin Dashboard
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "1.1rem" }}>
          Welcome back, {user.username}! Manage photos, feedback, and monitor usage.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          display: "flex", 
          gap: "0.5rem",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setActiveTab('photos')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: activeTab === 'photos' ? '#44403c' : '#f9fafb',
              color: activeTab === 'photos' ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem'
            }}
          >
            📸 Photo Management
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: activeTab === 'feedback' ? '#44403c' : '#f9fafb',
              color: activeTab === 'feedback' ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              position: 'relative',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem'
            }}
          >
            💬 Feedback Reports
            {unresolved > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                minWidth: '1.25rem',
                textAlign: 'center'
              }}>
                {unresolved}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: activeTab === 'usage' ? '#44403c' : '#f9fafb',
              color: activeTab === 'usage' ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem'
            }}
          >
            📊 Usage Tracking
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1.5rem', 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #22c55e', 
          borderRadius: '8px',
          color: '#059669'
        }}>
          {successMessage}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1.5rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #ef4444', 
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Photo Management Tab */}
      {activeTab === 'photos' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '1.5rem' 
        }}>
          {/* Controls Panel */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#374151"
            }}>
              📂 Photo Controls
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Select Folder
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  fontSize: '1rem'
                }}
              >
                <option value="">Choose a folder...</option>
                <option value="challenge-submissions">📸 Challenge Submissions</option>
                <option value="picture-submissions">🖼️ Picture Submissions</option>
                <option value="profile-pics">👤 Profile Pictures</option>
                <option value="scavenger-hunts">🗺️ Scavenger Hunts</option>
                <option value="user-creations">✨ User Creations</option>
              </select>
            </div>

            <button
              onClick={handleLoadPhotos}
              disabled={!selectedFolder || loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: (!selectedFolder || loading) ? '#9ca3af' : '#44403c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (!selectedFolder || loading) ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
                fontWeight: '500',
                fontSize: '1rem'
              }}
            >
              {loading ? "🔄 Loading..." : "📂 Load Photos"}
            </button>

            {photos.length > 0 && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>📊 Photo Stats</h3>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  <p style={{ margin: '0.25rem 0' }}>Total: <strong>{photos.length}</strong></p>
                  <p style={{ margin: '0.25rem 0' }}>Current: <strong>{currentPhotoIndex + 1} of {photos.length}</strong></p>
                  <p style={{ margin: '0.25rem 0' }}>Folder: <strong>{selectedFolder}</strong></p>
                </div>
              </div>
            )}
          </div>

          {/* Photo Viewer Panel */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            {photos.length > 0 && currentPhoto ? (
              <>
                <h2 style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#374151",
                  textAlign: "center"
                }}>
                  📸 Photo Viewer
                </h2>
                
                <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
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
                    margin: '0 auto 1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    cursor: 'grab',
                    border: '1px solid #e5e7eb'
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
                  <div style={{ height: '25%', padding: '0.75rem' }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600' }}>{currentPhoto.filename}</h3>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>by @{currentPhoto.subfolder}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>{Math.round(currentPhoto.size / 1024)}KB</p>
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
                    margin: '0 auto 1rem',
                    padding: '0.75rem',
                    backgroundColor: featureLoading === currentPhoto.key ? '#9ca3af' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: featureLoading === currentPhoto.key ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}
                >
                  {featureLoading === currentPhoto.key ? "⏳ Featuring..." : "⭐ Feature This Photo"}
                </button>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={goToPreviousPhoto}
                    disabled={currentPhotoIndex === 0}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: currentPhotoIndex === 0 ? '#f3f4f6' : '#44403c',
                      color: currentPhotoIndex === 0 ? '#9ca3af' : 'white',
                      border: 'none',
                      cursor: currentPhotoIndex === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1.25rem'
                    }}
                  >
                    ←
                  </button>
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Swipe or use arrows</span>
                  <button
                    onClick={goToNextPhoto}
                    disabled={currentPhotoIndex >= photos.length - 1}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: currentPhotoIndex >= photos.length - 1 ? '#f3f4f6' : '#44403c',
                      color: currentPhotoIndex >= photos.length - 1 ? '#9ca3af' : 'white',
                      border: 'none',
                      cursor: currentPhotoIndex >= photos.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '1.25rem'
                    }}
                  >
                    →
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p>Select a folder and load photos to start managing content</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Management Tab */}
      {activeTab === 'feedback' && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '600', color: '#374151' }}>💬 Feedback Reports</h2>
            <button
              onClick={loadFeedback}
              disabled={feedbackLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: feedbackLoading ? '#9ca3af' : '#44403c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: feedbackLoading ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {feedbackLoading ? "🔄 Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#44403c' }}>{feedback.length}</div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Reports</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{feedback.filter(f => !f.resolved).length}</div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Unresolved</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{feedback.filter(f => f.resolved).length}</div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Resolved</div>
            </div>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>User</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Description</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.length > 0 ? (
                    feedback
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((item, index) => (
                      <tr key={item.feedbackId} style={{ borderBottom: index < feedback.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.username}</td>
                        <td style={{ padding: '0.75rem', maxWidth: '300px', wordWrap: 'break-word' }}>{item.description}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#6b7280' }}>
                          {new Date(item.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            backgroundColor: item.resolved ? '#f0fdf4' : '#fef2f2',
                            color: item.resolved ? '#059669' : '#dc2626',
                            border: `1px solid ${item.resolved ? '#bbf7d0' : '#fecaca'}`
                          }}>
                            {item.resolved ? '✅ Resolved' : '🔴 Open'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        {feedbackLoading ? "Loading feedback reports..." : "No feedback reports available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Usage Tracking Tab */}
      {activeTab === 'usage' && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '600', color: '#374151' }}>📊 Usage Tracking</h2>
            <button
              onClick={loadUsageData}
              disabled={usageLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: usageLoading ? '#9ca3af' : '#44403c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: usageLoading ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {usageLoading ? "🔄 Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#44403c' }}>{filteredUsageData.length}</div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total Actions</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#059669' }}>
                {filteredUsageData.filter(item => item.success).length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Successful</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#dc2626' }}>
                {filteredUsageData.filter(item => !item.success).length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Failed</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#7c3aed' }}>
                {new Set(filteredUsageData.map(item => item.username)).size}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Unique Users</div>
            </div>
          </div>

          {/* Usage Table */}
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>User</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Action</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Tier</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsageData.length > 0 ? (
                    filteredUsageData
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((item, index) => (
                      <tr key={`${item.username}-${item.timestamp}`} style={{ 
                        borderBottom: index < itemsPerPage - 1 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: item.success ? 'white' : '#fef2f2'
                      }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                          {item.username}
                          {item.accountTier === 'premium' && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.125rem 0.375rem',
                              backgroundColor: '#fbbf24',
                              color: '#92400e',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}>
                              ✨ PRO
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: getActionColor(item.action),
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {formatActionName(item.action)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                          {new Date(item.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            backgroundColor: item.success ? '#f0fdf4' : '#fef2f2',
                            color: item.success ? '#059669' : '#dc2626',
                            border: `1px solid ${item.success ? '#bbf7d0' : '#fecaca'}`
                          }}>
                            {item.success ? '✅ Success' : '❌ Failed'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                          {item.accountTier || 'free'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                          {item.responseTime ? `${item.responseTime}ms` : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        {usageLoading ? "Loading usage data..." : "No usage data available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredUsageData.length > itemsPerPage && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '1rem', 
              marginTop: '1.5rem' 
            }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : '#44403c',
                  color: currentPage === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Previous
              </button>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>
                Page {currentPage} of {Math.ceil(filteredUsageData.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredUsageData.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredUsageData.length / itemsPerPage)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage >= Math.ceil(filteredUsageData.length / itemsPerPage) ? '#f3f4f6' : '#44403c',
                  color: currentPage >= Math.ceil(filteredUsageData.length / itemsPerPage) ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage >= Math.ceil(filteredUsageData.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;