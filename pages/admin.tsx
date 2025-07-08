import React, { useState, useRef, useEffect } from 'react';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";


// API endpoints
const LIST_PHOTOS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_photos";
const FEATURE_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/feature_photo";
const UNFEATURE_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/unfeature_photo";
const LIST_FEATURED_PHOTOS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_featured_photos";

export default function AdminPhotoBrowser() {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [featureLoading, setFeatureLoading] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [featuredPhotos, setFeaturedPhotos] = useState<Array<{photoId: string, username: string, caption: string}>>([]);
  const [featuredLoading, setFeaturedLoading] = useState<boolean>(false);
  const [unfeaturedLoading, setUnfeaturedLoading] = useState<string>("");

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

  const handlePhotoSelect = async (photoKey: string) => {
    setSelectedPhoto(photoKey);
    setPhotoLoading(true);
    setPhotoUrl("");
    setError("");
    setSuccessMessage("");
    
    console.log("Selected photo key:", photoKey);
    
    // Use direct S3 URL (works for public folders)
    const directUrl = `https://picture-this-storage.s3.amazonaws.com/${photoKey}`;
    
    console.log("Direct URL:", directUrl);
    
    // Test if the URL works
    const img = new Image();
    img.onload = () => {
      console.log("Photo loaded successfully");
      setPhotoUrl(directUrl);
      setPhotoLoading(false);
    };
    img.onerror = () => {
      console.error("Failed to load photo from:", directUrl);
      setError(`Failed to load photo: ${photoKey}`);
      setPhotoLoading(false);
    };
    
    img.src = directUrl;
  };

  const handleFeaturePhoto = async (photo: {key: string, subfolder: string}) => {
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
        loadFeaturedPhotos();
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

  const handleUnfeaturePhoto = async (photoId: string, username: string) => {
    setUnfeaturedLoading(photoId);
    setError("");
    setSuccessMessage("");
    
    try {
      console.log("Unfeaturing photo:", photoId, "for user:", username);
      
      const res = await invokeLambdaIam({
        url: UNFEATURE_PHOTO_URL,
        method: "POST",
        body: { 
          photoId: photoId,
          username: username
        },
      });
      
      if (res.success) {
        setSuccessMessage(`✅ Photo unfeatured successfully for user: ${username}`);
        loadFeaturedPhotos();
      } else {
        setError(res.message || "Failed to unfeature photo.");
      }
    } catch (err) {
      console.error("Failed to unfeature photo", err);
      setError("Failed to unfeature photo.");
    } finally {
      setUnfeaturedLoading("");
    }
  };

  const loadFeaturedPhotos = async () => {
    setFeaturedLoading(true);
    try {
      const res = await invokeLambdaIam({
        url: LIST_FEATURED_PHOTOS_URL,
        method: "POST",
        body: {},
      });
      
      if (res.featuredPhotos) {
        setFeaturedPhotos(res.featuredPhotos);
      }
    } catch (err) {
      console.error("Failed to load featured photos", err);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const getThumbnailUrl = (photoKey: string) => {
    return `https://picture-this-storage.s3.amazonaws.com/${photoKey}`;
  };

  // Auto-dismiss messages after 5 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load featured photos on component mount
  React.useEffect(() => {
    loadFeaturedPhotos();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📸 Admin Photo Browser</h1>
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md shadow-sm">
          {successMessage}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Panel: Controls & Preview */}
        <div className="xl:col-span-1 space-y-6">
          {/* Folder Selection */}
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

        {/* Center Panel: Photo Grid */}
        <div className="xl:col-span-2">
          {photos.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">
                📸 Photos ({photos.length})
              </h2>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.key || index}
                      className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Thumbnail */}
                      <div 
                        className="w-full aspect-square bg-gray-200 overflow-hidden cursor-pointer"
                        onClick={() => handlePhotoSelect(photo.key)}
                      >
                        <img
                          src={getThumbnailUrl(photo.key)}
                          alt={photo.filename}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2TDQwIDMyTDQ0IDM2VjQ0SDIwVjM2TDI4IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                          }}
                        />
                      </div>

                      {/* Photo Info & Actions */}
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate" title={photo.filename}>
                          {photo.filename}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400">
                            {Math.round(photo.size / 1024)}KB
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeaturePhoto(photo);
                            }}
                            disabled={featureLoading === photo.key}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                            title={`Feature photo for ${photo.subfolder}`}
                          >
                            {featureLoading === photo.key ? "⏳" : "⭐"}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1" title={photo.subfolder}>
                          User: {photo.subfolder}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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

        {/* Right Panel: Featured Photos Management */}
        <div className="xl:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">⭐ Featured Photos</h2>
              <button
                onClick={loadFeaturedPhotos}
                disabled={featuredLoading}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-400"
              >
                {featuredLoading ? "🔄" : "🔄 Refresh"}
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {featuredPhotos.length > 0 ? (
                <div className="p-2 space-y-2">
                  {featuredPhotos.map((featured, index) => (
                    <div
                      key={`${featured.photoId}-${featured.username}`}
                      className="flex items-center space-x-2 p-2 bg-gray-50 rounded border"
                    >
                      {/* Small thumbnail */}
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={`https://picture-this-storage.s3.amazonaws.com/${featured.photoId}`}
                          alt="Featured"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2TDQwIDMyTDQ0IDM2VjQ0SDIwVjM2TDI4IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                          }}
                        />
                      </div>
                      
                      {/* Photo info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {featured.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {featured.caption || "No caption"}
                        </p>
                      </div>
                      
                      {/* Remove button */}
                      <button
                        onClick={() => handleUnfeaturePhoto(featured.photoId, featured.username)}
                        disabled={unfeaturedLoading === featured.photoId}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-400 flex-shrink-0"
                        title="Remove from featured"
                      >
                        {unfeaturedLoading === featured.photoId ? "⏳" : "❌"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {featuredLoading ? "Loading..." : "No featured photos"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}