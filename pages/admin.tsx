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

interface UsageItem {
  username: string;
  action: string;
  timestamp: string;
  success: boolean;
  responseTime?: number;
  accountTier?: string;
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
        url: "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_usage_data",
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

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#efede4',
      minHeight: '100vh'
    }}>
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
            backgroundColor: activeTab === 'photos' ? '#8b7355' : '#f9f7f4',
            color: activeTab === 'photos' ? 'white' : '#333',
            border: '1px solid #d6d3d1',
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
            marginRight: '8px',
            backgroundColor: activeTab === 'feedback' ? '#8b7355' : '#f9f7f4',
            color: activeTab === 'feedback' ? 'white' : '#333',
            border: '1px solid #d6d3d1',
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
        <button
          onClick={() => setActiveTab('usage')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'usage' ? '#8b7355' : '#f9f7f4',
            color: activeTab === 'usage' ? 'white' : '#333',
            border: '1px solid #d6d3d1',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📊 Usage Tracking
        </button>
      </div>
      
      {/* Messages */}
      {successMessage && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #22c55e', 
          borderRadius: '4px',
          color: '#059669'
        }}>
          {successMessage}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #ef4444', 
          borderRadius: '4px',
          color: '#dc2626'
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
                  border: '1px solid #d6d3d1', 
                  borderRadius: '4px',
                  backgroundColor: '#ffffff'
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
                backgroundColor: (!selectedFolder || loading) ? '#a8a29e' : '#8b7355',
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
                backgroundColor: '#f9f7f4', 
                borderRadius: '4px',
                border: '1px solid #d6d3d1'
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
                    backgroundColor: featureLoading === currentPhoto.key ? '#a8a29e' : '#22c55e',
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
                      backgroundColor: currentPhotoIndex === 0 ? '#f5f2ed' : '#8b7355',
                      color: currentPhotoIndex === 0 ? '#a8a29e' : 'white',
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
                      backgroundColor: currentPhotoIndex >= photos.length - 1 ? '#f5f2ed' : '#8b7355',
                      color: currentPhotoIndex >= photos.length - 1 ? '#a8a29e' : 'white',
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
                backgroundColor: feedbackLoading ? '#a8a29e' : '#8b7355',
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
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b7355' }}>{feedback.length}</div>
              <div style={{ color: '#666' }}>Total Reports</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{feedback.filter(f => !f.resolved).length}</div>
              <div style={{ color: '#666' }}>Unresolved</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{feedback.filter(f => f.resolved).length}</div>
              <div style={{ color: '#666' }}>Resolved</div>
            </div>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9f7f4' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {feedback.length > 0 ? (
                  feedback
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((item, index) => (
                    <tr key={item.feedbackId} style={{ borderBottom: index < feedback.length - 1 ? '1px solid #f5f2ed' : 'none' }}>
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
                          backgroundColor: item.resolved ? '#f0fdf4' : '#fef2f2',
                          color: item.resolved ? '#059669' : '#dc2626'
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

      {/* Usage Tracking Tab */}
      {activeTab === 'usage' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>📊 Usage Tracking</h2>
            <button
              onClick={loadUsageData}
              disabled={usageLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: usageLoading ? '#a8a29e' : '#8b7355',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: usageLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {usageLoading ? "🔄 Loading..." : "🔄 Refresh"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b7355' }}>{usageData.length}</div>
              <div style={{ color: '#666' }}>Total Actions</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                {usageData.filter(item => item.success).length}
              </div>
              <div style={{ color: '#666' }}>Successful</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                {usageData.filter(item => !item.success).length}
              </div>
              <div style={{ color: '#666' }}>Failed</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>
                {new Set(usageData.map(item => item.username)).size}
              </div>
              <div style={{ color: '#666' }}>Unique Users</div>
            </div>
          </div>

          {/* Usage Table */}
          <div style={{ backgroundColor: 'white', border: '1px solid #d6d3d1', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9f7f4' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Timestamp</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Tier</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d6d3d1' }}>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {usageData.length > 0 ? (
                  usageData
                    .filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase()))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item, index) => (
                    <tr key={`${item.username}-${item.timestamp}`} style={{ 
                      borderBottom: index < itemsPerPage - 1 ? '1px solid #f5f2ed' : 'none',
                      backgroundColor: item.success ? 'white' : '#fef2f2'
                    }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>
                        {item.username}
                        {item.accountTier === 'premium' && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
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
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: getActionColor(item.action),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {formatActionName(item.action)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                        {new Date(item.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor: item.success ? '#f0fdf4' : '#fef2f2',
                          color: item.success ? '#059669' : '#dc2626'
                        }}>
                          {item.success ? '✅ Success' : '❌ Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                        {item.accountTier || 'unknown'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                        {item.responseTime ? `${item.responseTime}ms` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                      {usageLoading ? "Loading usage data..." : "No usage data available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase())).length > itemsPerPage && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '16px', 
              marginTop: '24px' 
            }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? '#f5f2ed' : '#8b7355',
                  color: currentPage === 1 ? '#a8a29e' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ color: '#666' }}>
                Page {currentPage} of {Math.ceil(usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase())).length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase())).length / itemsPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase())).length / itemsPerPage)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage >= Math.ceil(usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase())).length / itemsPerPage) ? '#f5f2ed' : '#8b7355',
                  color: currentPage >= Math.ceil(usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase())).length / itemsPerPage) ? '#a8a29e' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage >= Math.ceil(usageData.filter(item => !['nathan', 'jama'].includes(item.username.toLowerCase())).length / itemsPerPage) ? 'not-allowed' : 'pointer'
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
}