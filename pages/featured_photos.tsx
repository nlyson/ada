import React, { useState, useEffect, useRef } from "react";
import PhotoModal from "@/components/PhotoModal";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { CommentThread } from "@/components/CommentThread";
import { getCurrentUser } from "aws-amplify/auth";

type FeaturedPhoto = {
  username: string;
  photoId: string;
  caption: string;
  photoUrl: string;
  views: number;
  accountTier: string;
};

const FEATURED_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_featured_photos";
const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const PICTURE_THIS_STORAGE_FULL_PATH = "https://picture-this-storage.s3.amazonaws.com";
const BUCKET_PROFILE_PATH = "public/profile-pics";
const DEFAULT_PROFILE_IMG = "https://www.gravatar.com/avatar/?d=mp";

const FeaturedPhotos: React.FC = () => {
  const [photos, setPhotos] = useState<FeaturedPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [viewerAccountTier, setViewerAccountTier] = useState("free");
  const [showComments, setShowComments] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const cardRef = useRef<HTMLDivElement>(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchPhotosWithRetry = async (attempt: number = 0): Promise<void> => {
    try {
      // Only clear error on the first attempt, not on retries
      if (attempt === 0) {
        setError("");
      }
      
      const result = await invokeLambdaIam({
        url: FEATURED_LAMBDA_URL,
        method: "POST",
        body: {},
      });

      if (result.featuredPhotos && result.featuredPhotos.length > 0) {
        setPhotos(result.featuredPhotos);
        setRetryCount(0);
        return;
      } else if (result.featuredPhotos && result.featuredPhotos.length === 0) {
        // Empty array is a valid response, don't retry
        setPhotos([]);
        setRetryCount(0);
        return;
      } else {
        throw new Error(result.error || "No photos returned");
      }
    } catch (err: any) {
      console.error(`Error fetching featured photos (attempt ${attempt + 1}):`, err);
      
      if (attempt < MAX_RETRIES) {
        setRetryCount(attempt + 1);
        // DON'T set error during retries - keep loading state active
        
        await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        return fetchPhotosWithRetry(attempt + 1);
      } else {
        // Only set error after all retries have failed
        setError("Failed to load featured photos. Please try refreshing the page.");
        throw err;
      }
    }
  };

  const fetchUserDataWithRetry = async (attempt: number = 0): Promise<void> => {
    try {
      const user = await getCurrentUser();
      setCurrentUsername(user.username);

      const res = await invokeLambdaIam({
        url: GET_PROFILE_URL,
        method: "POST",
        body: { username: user.username },
      });

      setViewerAccountTier(res.accountTier || "free");
    } catch (err) {
      console.error(`Failed to get current user or tier (attempt ${attempt + 1}):`, err);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * (attempt + 1));
        return fetchUserDataWithRetry(attempt + 1);
      } else {
        console.error("Failed to fetch user data after retries");
        // Don't throw here as this is not critical for the main functionality
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Fetch user data and photos in parallel
        await Promise.all([
          fetchUserDataWithRetry(),
          fetchPhotosWithRetry()
        ]);
      } catch (err) {
        console.error("Failed to initialize data:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleImageError = (imageUrl: string) => {
    setImageLoadErrors(prev => new Set(prev).add(imageUrl));
    
    // Retry loading the image after a delay
    setTimeout(() => {
      setImageLoadErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageUrl);
        return newSet;
      });
    }, 2000);
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    setRetryCount(0);
    setImageLoadErrors(new Set());
    
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchUserDataWithRetry(),
          fetchPhotosWithRetry()
        ]);
      } catch (err) {
        console.error("Retry failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
    }
  };

  // Touch handlers for mobile swipe
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

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setShowComments(false);
        setSelectedPhotoUrl(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, photos.length]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>⭐</div>
        <p style={{ color: 'white' }}>Loading featured photos...</p>
        {retryCount > 0 && (
          <p style={{ color: 'white', fontSize: '0.9rem', opacity: 0.8 }}>
            Retry attempt {retryCount}/{MAX_RETRIES}
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '2rem' }}>❌</div>
        <p style={{ color: 'white', textAlign: 'center' }}>{error}</p>
        <button
          onClick={handleRetry}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'white',
            color: '#ff6b6b',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>📸</div>
        <p style={{ color: 'white' }}>No featured photos available.</p>
        <button
          onClick={handleRetry}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'white',
            color: '#ff6b6b',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🔄 Refresh
        </button>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];
  const profileUrl = `${PICTURE_THIS_STORAGE_FULL_PATH}/${BUCKET_PROFILE_PATH}/${currentPhoto.username}.jpg?t=${Date.now()}`;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{ 
        color: 'white', 
        textAlign: 'center', 
        marginBottom: '2rem',
        fontSize: '2rem',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        ⭐ Featured Photos
      </h1>

      {/* Photo Counter */}
      <div style={{
        color: 'white',
        fontSize: '1rem',
        marginBottom: '1rem',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
      }}>
        {currentIndex + 1} of {photos.length}
      </div>

      {/* Main Card Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        minHeight: '700px',
        perspective: '1000px'
      }}>
        {/* Photo Card */}
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: currentPhoto.accountTier === "premium" 
              ? '0 20px 40px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.5)' 
              : '0 20px 40px rgba(0,0,0,0.2)',
            border: currentPhoto.accountTier === "premium" ? "3px solid gold" : "none",
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            cursor: 'grab',
            transition: 'transform 0.2s ease',
            userSelect: 'none',
            position: 'relative'
          }}
          onMouseDown={() => cardRef.current && (cardRef.current.style.cursor = 'grabbing')}
          onMouseUp={() => cardRef.current && (cardRef.current.style.cursor = 'grab')}
        >
          {/* Premium Badge */}
          {currentPhoto.accountTier === "premium" && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: 'gold',
              color: 'black',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              ⭐ Premium
            </div>
          )}

          {/* Main Photo */}
          <div style={{
            height: '400px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {imageLoadErrors.has(currentPhoto.photoUrl) ? (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ fontSize: '2rem' }}>📷</div>
                <div>Image loading...</div>
              </div>
            ) : (
              <img
                src={currentPhoto.photoUrl}
                alt={`Photo by ${currentPhoto.username}`}
                onClick={() => setSelectedPhotoUrl(currentPhoto.photoUrl)}
                onError={() => handleImageError(currentPhoto.photoUrl)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'zoom-in'
                }}
              />
            )}
            
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))'
            }} />
          </div>

          {/* Photo Info */}
          <div style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <img
                src={profileUrl}
                alt={`${currentPhoto.username}'s profile`}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #e5e7eb'
                }}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.src = DEFAULT_PROFILE_IMG;
                }}
              />
              <div>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem',
                  color: '#1f2937'
                }}>
                  {currentPhoto.username}
                </h3>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👁️ {currentPhoto.views} views
                </div>
              </div>
            </div>

            {/* Caption */}
            {currentPhoto.caption && (
              <div style={{
                fontSize: '1rem',
                color: '#374151',
                lineHeight: '1.5',
                fontStyle: 'italic'
              }}>
                &quot;{currentPhoto.caption}&quot;
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.5rem'
            }}>
              <button
                onClick={() => setSelectedPhotoUrl(currentPhoto.photoUrl)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                🔍 View Full Size
              </button>
              
              <button
                onClick={() => setShowComments(!showComments)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: showComments ? '#ef4444' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                💬 {showComments ? 'Hide' : 'Show'} Comments
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && currentUsername && (
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '1rem 1.5rem',
              backgroundColor: '#f9fafb',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <CommentThread 
                photoId={currentPhoto.photoId} 
                currentUser={currentUsername} 
                accountTier={viewerAccountTier}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginTop: '2rem',
        alignItems: 'center'
      }}>
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: currentIndex === 0 ? 'rgba(255,255,255,0.3)' : 'white',
            border: 'none',
            fontSize: '1.5rem',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (currentIndex > 0) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ←
        </button>

        <div style={{ 
          color: 'white', 
          fontSize: '0.9rem',
          textAlign: 'center',
          minWidth: '120px'
        }}>
          <div>Swipe or use arrows</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>← →</div>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex >= photos.length - 1}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: currentIndex >= photos.length - 1 ? 'rgba(255,255,255,0.3)' : 'white',
            border: 'none',
            fontSize: '1.5rem',
            cursor: currentIndex >= photos.length - 1 ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (currentIndex < photos.length - 1) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          →
        </button>
      </div>

      {/* Dots indicator */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem',
        maxWidth: '300px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {photos.slice(0, Math.min(photos.length, 10)).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setShowComments(false);
            }}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          />
        ))}
        {photos.length > 10 && (
          <span style={{ color: 'white', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
            ...{photos.length - 10} more
          </span>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhotoUrl && (
        <PhotoModal 
          imageUrl={selectedPhotoUrl} 
          onClose={() => setSelectedPhotoUrl(null)} 
        />
      )}
    </div>
  );
};

export default FeaturedPhotos;