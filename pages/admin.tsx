import React, { useState } from 'react';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";


// API endpoints
const LIST_PHOTOS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_photos";
const FEATURE_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/feature_photo";
const UNFEATURE_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/unfeature_photo";
const LIST_FEATURED_PHOTOS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_featured_photos";

export default function AdminPhotoBrowser() {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [photos, setPhotos] = useState<Array<{key: string, size: number, filename: string, subfolder: string}>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);
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
        setError(res.message || "Failed to load photos.");
      }
    } catch (err) {
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
        setError(res.message || "Failed to feature photo.");
      }
    } catch (err) {
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Folder
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a folder...</option>
              <option value="challenge-submissions">Challenge Submissions</option>
              <option value="picture-submissions">Picture Submissions</option>
              <option value="profile-pics">Profile Pictures</option>
              <option value="scavenger-hunts">Scavenger Hunts</option>
              <option value="user-creations">User Creations</option>
            </select>
          </div>

          {/* Load Photos Button */}
          <button
            onClick={handleLoadPhotos}
            disabled={!selectedFolder || loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "🔄 Loading..." : "📂 Load Photos"}
          </button>

          {/* Photo Preview */}
          <div>
            <h2 className="text-lg font-semibold mb-3">🖼️ Photo Preview</h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-64 flex items-center justify-center">
              {photoLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              ) : photoUrl ? (
                <div className="text-center">
                  <img
                    src={photoUrl}
                    alt="Selected photo"
                    className="max-w-full max-h-48 object-contain rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-xs text-gray-600 break-all">{selectedPhoto}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Select a photo to preview</p>
              )}
            </div>
          </div>
        </div>

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