import React, { useState } from 'react';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

// API endpoints
const LIST_PHOTOS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_photos";
const FEATURE_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/feature_photo";

export default function AdminPhotoBrowser() {
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [photos, setPhotos] = useState<Array<{key: string, size: number, filename: string, subfolder: string}>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [featureLoading, setFeatureLoading] = useState<string>("");

  const handleLoadPhotos = async () => {
    if (!selectedFolder) return;
    
    setLoading(true);
    setError("");
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
    
    try {
      console.log("Featuring photo:", photo.key, "for user:", photo.subfolder);
      
      const res = await invokeLambdaIam({
        url: FEATURE_PHOTO_URL,
        method: "POST",
        body: { 
          sourceKey: photo.key,
          username: photo.subfolder, // Use the subfolder directly as username
          caption: "No Caption"
        },
      });
      
      if (res.success) {
        alert(`✅ Photo featured successfully for user: ${photo.subfolder}`);
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📸 Admin Photo Browser</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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

        {/* Right Panel: Photos List */}
        <div className="xl:col-span-2">
          {photos.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">
                📸 Photos ({photos.length})
              </h2>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {photos.map((photo, index) => (
                    <li
                      key={photo.key || index}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    >
                      <div className="flex-1" onClick={() => handlePhotoSelect(photo.key)}>
                        <p className="text-sm text-gray-700 break-all">{photo.filename}</p>
                        <p className="text-xs text-gray-500">
                          {Math.round(photo.size / 1024)} KB • {photo.subfolder}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeaturePhoto(photo);
                        }}
                        disabled={featureLoading === photo.key}
                        className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {featureLoading === photo.key ? "⏳" : "⭐ Feature"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}