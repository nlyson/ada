import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const FETCH_PROFILES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_profiles";
const PICTURE_THIS_STORAGE_FULL_PATH = "https://picture-this-storage.s3.amazonaws.com";
const BUCKET_PROFILE_PATH = "public/profile-pics";
const DEFAULT_PROFILE_IMG = "https://www.gravatar.com/avatar/?d=mp";

type Profile = {
  username: string;
  displayName?: string;
  profileUrl: string;
};

export default function BrowseProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await invokeLambdaIam({
        url: FETCH_PROFILES_URL,
        method: "POST",
        body: {
          limit: 25,
          lastKey,
        },
      });

      const usernames = res.usernames || [];
      
      // Create profile objects with profile picture URLs
      const profilesWithPics = usernames.map((username: string) => ({
        username,
        displayName: username, // You might want to fetch actual display names later
        profileUrl: `${PICTURE_THIS_STORAGE_FULL_PATH}/${BUCKET_PROFILE_PATH}/${username}.jpg?t=${Date.now()}`
      }));

      // Filter out profiles that don't have valid profile pictures
      const validProfiles: Profile[] = [];
      
      for (const profile of profilesWithPics) {
        try {
          // Check if profile picture exists
          const response = await fetch(profile.profileUrl, { method: 'HEAD' });
          if (response.ok) {
            validProfiles.push(profile);
          } else {
            console.log(`⏭️ Skipping ${profile.username} - no profile picture`);
          }
        } catch (err) {
          console.log(`⏭️ Skipping ${profile.username} - profile picture check failed`);
        }
      }

      setProfiles((prev) => Array.from(new Set([...prev, ...validProfiles].map(p => p.username)))
        .map(username => [...prev, ...validProfiles].find(p => p.username === username)!));
      setLastKey(res.lastEvaluatedKey || null);
      setHasMore(!!res.lastEvaluatedKey);
    } catch (err) {
      console.error("Failed to fetch profiles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles(); // initial load
  }, []);

  // Auto-load more when approaching the end
  useEffect(() => {
    if (currentIndex >= profiles.length - 3 && hasMore && !loading) {
      fetchProfiles();
    }
  }, [currentIndex, profiles.length, hasMore, loading]);

  const goToNext = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, profiles.length]);

  if (loading && profiles.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>📇</div>
        <p>Loading profiles with photos...</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Only showing users with profile pictures</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1>📇 Browse Public Profiles</h1>
        <p>No profiles with photos found.</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>We only show users who have uploaded profile pictures.</p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const safeProfileUrl = currentProfile.profileUrl && !["null", "undefined"].includes(currentProfile.profileUrl)
    ? currentProfile.profileUrl
    : DEFAULT_PROFILE_IMG;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#B76E79', // Changed to match your app's pink color
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
        📇 Browse Public Profiles
      </h1>

      {/* Profile Counter */}
      <div style={{
        color: 'white',
        fontSize: '1rem',
        marginBottom: '1rem',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
      }}>
        {currentIndex + 1} of {profiles.length} {hasMore && '+ more'}
      </div>

      {/* Main Card Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        height: '600px',
        perspective: '1000px'
      }}>
        {/* Profile Card */}
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            cursor: 'grab',
            transition: 'transform 0.2s ease',
            userSelect: 'none'
          }}
          onMouseDown={() => cardRef.current && (cardRef.current.style.cursor = 'grabbing')}
          onMouseUp={() => cardRef.current && (cardRef.current.style.cursor = 'grab')}
        >
          {/* Profile Image */}
          <div style={{
            height: '70%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <img
              src={safeProfileUrl}
              alt={`${currentProfile.username}'s profile`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null;
                img.src = DEFAULT_PROFILE_IMG;
              }}
            />
            
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '100px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
            }} />
          </div>

          {/* Profile Info */}
          <div style={{
            height: '30%',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#1f2937'
            }}>
              {currentProfile.displayName || currentProfile.username}
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}>
              @{currentProfile.username}
            </p>
            
            <Link 
              href={`/users/${currentProfile.username}`}
              style={{
                backgroundColor: '#B76E79', // Changed to match your app's pink color
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                display: 'inline-block'
              }}
            >
              View Profile →
            </Link>
          </div>
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
          disabled={currentIndex >= profiles.length - 1 && !hasMore}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: (currentIndex >= profiles.length - 1 && !hasMore) ? 'rgba(255,255,255,0.3)' : 'white',
            border: 'none',
            fontSize: '1.5rem',
            cursor: (currentIndex >= profiles.length - 1 && !hasMore) ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (currentIndex < profiles.length - 1 || hasMore) {
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

      {/* Loading indicator */}
      {loading && (
        <div style={{
          color: 'white',
          marginTop: '1rem',
          fontSize: '0.9rem',
          opacity: 0.8
        }}>
          {profiles.length === 0 ? 'Loading profiles...' : 'Loading more profiles...'}
        </div>
      )}

      {/* Dots indicator */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem',
        maxWidth: '300px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {profiles.slice(0, Math.min(profiles.length, 10)).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
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
        {profiles.length > 10 && (
          <span style={{ color: 'white', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
            ...{profiles.length - 10} more
          </span>
        )}
      </div>
    </div>
  );
}