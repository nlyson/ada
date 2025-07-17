import React, { useState, useEffect } from 'react';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

// API endpoints
const GET_CHALLENGE_ENTRIES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_challenge_entries_by_date";
const REACT_TO_CHALLENGE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/react_to_challenge_entry";

// Types
interface ChallengeEntry {
  entryId: string;
  username: string;
  submissionDate: string;
  challengeTitle: string;
  imageKey: string;
  timestamp: string;
  likes?: number;
  userHasLiked?: boolean;
  caption?: string;
  score?: number;
  challengeId?: string;
  feedback?: string;
}

interface ChallengeBrowserProps {
  user?: { username: string };
}

export default function WeeklyChallengeBrowser({ user }: ChallengeBrowserProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string>("weekly_08"); // Default to latest
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [likeLoading, setLikeLoading] = useState<string>("");
  
  const entriesPerPage = 12; // Grid layout works well with 12

  console.log('🏆 DEBUG: Selected challenge:', selectedChallenge);

  const loadEntriesForChallenge = async (challengeId: string) => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
    
    try {
      const res = await invokeLambdaIam({
        url: GET_CHALLENGE_ENTRIES_URL,
        method: "POST",
        body: { 
          challengeId: challengeId,
          includeUserReactions: true,
          currentUser: user?.username
        },
      });
      
      if (res && res.success && res.entries) {
        setEntries(res.entries);
      } else {
        setError(res?.message || "Failed to load weekly challenge entries.");
        setEntries([]);
      }
    } catch (err: any) {
      console.error("Failed to load challenge entries", err);
      setError("Failed to load weekly challenge entries. Please try again.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeEntry = async (entryId: string) => {
    if (!user?.username) {
      setError("You must be logged in to like entries.");
      return;
    }

    setLikeLoading(entryId);
    try {
      const res = await invokeLambdaIam({
        url: REACT_TO_CHALLENGE_URL,
        method: "POST",
        body: {
          entryId: entryId,
          username: user.username,
          reaction: "like"
        },
      });

      if (res && res.success) {
        // Update the entry in our local state
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            entry.entryId === entryId 
              ? {
                  ...entry,
                  likes: res.newLikeCount || (entry.likes || 0) + (entry.userHasLiked ? -1 : 1),
                  userHasLiked: !entry.userHasLiked
                }
              : entry
          )
        );
      } else {
        setError(res?.message || "Failed to update reaction.");
      }
    } catch (err: any) {
      console.error("Failed to react to entry", err);
      setError("Failed to update reaction.");
    } finally {
      setLikeLoading("");
    }
  };

  const getImageUrl = (imageKey: string): string => {
    return `https://picture-this-storage.s3.amazonaws.com/${imageKey}`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get challenge options
  const getChallengeOptions = () => {
    return [
      { value: "weekly_08", label: "🏃‍♂️ Challenge #8: Motion & Movement" },
      { value: "weekly_07", label: "🌅 Challenge #7: Golden Hour" },
      { value: "weekly_06", label: "🌑 Challenge #6: Silhouettes & Shadows" },
      { value: "weekly_05", label: "🌸 Challenge #5: Patterns in Nature" },
      { value: "weekly_04", label: "💡 Challenge #4: Natural Lighting" },
      { value: "weekly_03", label: "🎨 Challenge #3: Creative Subjects" },
      { value: "weekly_02", label: "🏠 Challenge #2: Home Life" },
      { value: "weekly_01", label: "✈️ Challenge #1: Travel Photography" },
      { value: "manual-feedback", label: "🤖 Manual Feedback Sessions" },
    ];
  };

  const getCurrentChallengeTitle = () => {
    const options = getChallengeOptions();
    const current = options.find(opt => opt.value === selectedChallenge);
    return current ? current.label : "Weekly Challenge";
  };

  // Load entries when component mounts or challenge changes
  useEffect(() => {
    loadEntriesForChallenge(selectedChallenge);
  }, [selectedChallenge]);

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Calculate pagination
  const totalPages = Math.ceil(entries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = entries.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#efede4',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
        🏆 Weekly Challenge Gallery
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Browse weekly challenge submissions from the community
      </p>
      
      {/* Challenge Selector */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #d6d3d1'
      }}>
        <label style={{ fontWeight: 'bold', color: '#333' }}>
          🏆 Select Challenge:
        </label>
        <select
          value={selectedChallenge}
          onChange={(e) => setSelectedChallenge(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d6d3d1',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            fontSize: '1rem',
            minWidth: '300px'
          }}
        >
          {getChallengeOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => loadEntriesForChallenge(selectedChallenge)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#a8a29e' : '#8b7355',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "🔄 Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Error Message */}
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

      {/* Stats Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f9f7f4',
        borderRadius: '8px',
        border: '1px solid #d6d3d1'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#333' }}>
            {getCurrentChallengeTitle()}
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            {entries.length} submissions found
          </p>
        </div>
        {entries.length > 0 && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              {new Set(entries.map(e => e.username)).size} unique participants
            </p>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              Avg score: {Math.round(entries.reduce((sum, e) => sum + (e.score || 0), 0) / entries.length) || 0}/100
            </p>
          </div>
        )}
      </div>

      {/* Entries Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔄</div>
          Loading weekly challenge entries...
        </div>
      ) : currentEntries.length > 0 ? (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            {currentEntries.map((entry) => (
              <div
                key={entry.entryId}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #d6d3d1',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', paddingBottom: '75%', overflow: 'hidden' }}>
                  <img
                    src={getImageUrl(entry.imageKey)}
                    alt={`Weekly challenge entry by ${entry.username}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2TDQwIDMyTDQ0IDM2VjQ0SDIwVjM2TDI4IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                    }}
                  />
                  {/* Time overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    {formatTime(entry.timestamp)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  {/* User info and score */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        @{entry.username}
                      </h4>
                      {entry.score && (
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#8b7355',
                          fontWeight: 'bold'
                        }}>
                          Score: {entry.score}/100
                        </div>
                      )}
                    </div>
                    
                    {/* Like button */}
                    <button
                      onClick={() => handleLikeEntry(entry.entryId)}
                      disabled={likeLoading === entry.entryId || !user?.username}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        backgroundColor: entry.userHasLiked ? '#ef4444' : '#f9f7f4',
                        color: entry.userHasLiked ? 'white' : '#666',
                        border: '1px solid #d6d3d1',
                        borderRadius: '20px',
                        cursor: (!user?.username || likeLoading === entry.entryId) ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {likeLoading === entry.entryId ? (
                        "⏳"
                      ) : entry.userHasLiked ? (
                        "❤️"
                      ) : (
                        "🤍"
                      )}
                      {entry.likes || 0}
                    </button>
                  </div>

                  {/* Challenge Title */}
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    padding: '8px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    border: '1px solid #0ea5e9'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem', 
                      color: '#0369a1',
                      fontWeight: 'bold'
                    }}>
                      🏆 {entry.challengeTitle}
                    </p>
                  </div>

                  {/* User Caption */}
                  {entry.caption && (
                    <div style={{
                      backgroundColor: '#f9f7f4',
                      padding: '8px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      border: '1px solid #d6d3d1'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.85rem', 
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        💭 &quot;{entry.caption}&quot;
                      </p>
                    </div>
                  )}

                  {/* AI Feedback (shortened) */}
                  {entry.feedback && (
                    <div style={{
                      backgroundColor: '#fef7ed',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #fb923c'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.8rem', 
                        color: '#c2410c',
                        fontWeight: 'bold',
                        marginBottom: '4px'
                      }}>
                        🤖 AI Feedback:
                      </p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.8rem', 
                        color: '#92400e',
                        lineHeight: '1.3'
                      }}>
                        {entry.feedback.length > 120 ? 
                          `${entry.feedback.substring(0, 120)}...` : 
                          entry.feedback
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '16px', 
              marginTop: '32px' 
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
                ← Previous
              </button>
              
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                Page {currentPage} of {totalPages} ({entries.length} total entries)
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage >= totalPages ? '#f5f2ed' : '#8b7355',
                  color: currentPage >= totalPages ? '#a8a29e' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f9f7f4',
          borderRadius: '8px',
          border: '1px solid #d6d3d1'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ marginBottom: '8px' }}>No submissions found</h3>
          <p>No entries were submitted for {getCurrentChallengeTitle()}.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '16px' }}>
            Try selecting a different challenge or check back later!
          </p>
        </div>
      )}
    </div>
  );
}