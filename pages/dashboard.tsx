// pages/dashboard.tsx
import React, { useState, useEffect } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import UserSearch from "@/components/UserSearch";
import Link from "next/link";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

type DashboardSection = {
  title: string;
  items: {
    href: string;
    label: string;
    description: string;
    icon: string;
    badge?: number;
    condition?: boolean;
  }[];
};

type UserStats = {
  photosUploaded?: number;
  challengesCompleted?: number;
  streakDays?: number;
  profileCompleteness?: number;
  scavengerHuntProgress?: number;
};

type RecentActivity = {
  type: 'challenge' | 'upload' | 'scavenger';
  title: string;
  date: string;
  imageUrl?: string;
};

const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";
const FETCH_USER_PHOTOS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_photos";
const UPDATE_USER_CREATIONS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_creations";
const GET_UNREAD_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_unread_comment_flags";

const Dashboard: React.FC<AppProps> = ({ user }) => {
  const [userStats, setUserStats] = useState<UserStats>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user profile and stats
        const profile = await invokeLambdaIam({
          url: GET_PROFILE_URL,
          method: "POST",
          body: { username: user.username },
        });
        setUserProfile(profile);
        setUserStats({
          photosUploaded: profile.stats?.photosUploaded || 0,
          challengesCompleted: profile.stats?.challengesCompleted || 0,
          streakDays: profile.stats?.streakDays || 0,
          profileCompleteness: profile.stats?.profileCompleteness || 0,
          scavengerHuntProgress: profile.stats?.scavengerHuntProgress || 0,
        });

        // Fetch unread notifications
        try {
          const unreadResult = await invokeLambdaIam({
            url: GET_UNREAD_URL,
            method: "POST",
            body: { username: user.username },
          });
          setUnreadCount(unreadResult.unreadPhotos?.length || 0);
        } catch (err) {
          console.warn("Could not fetch unread count");
        }

        // Fetch recent activity (combine photos and uploads)
        const activities: RecentActivity[] = [];

        try {
          // Recent challenge submissions
          const photos = await invokeLambdaIam({
            url: FETCH_USER_PHOTOS_LAMBDA_URL,
            method: "POST",
            body: { username: user.username },
          });
          
          const challenges = await invokeLambdaIam({
            url: "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_all_challenges",
            method: "GET",
          });

          const challengeMap: Record<string, string> = {};
          for (const ch of challenges) {
            challengeMap[ch.challengeId] = ch.title;
          }

          photos.slice(0, 3).forEach((photo: any) => {
            activities.push({
              type: 'challenge',
              title: `Submitted to: ${challengeMap[photo.challengeId] || 'Challenge'}`,
              date: new Date().toLocaleDateString(), // You might want to store actual dates
              imageUrl: photo.imageUrl
            });
          });

          // Recent uploads
          const uploads = await invokeLambdaIam({
            url: UPDATE_USER_CREATIONS_LAMBDA_URL,
            method: "POST",
            body: { action: "list", username: user.username },
          });

          uploads.items?.slice(0, 2).forEach((upload: any) => {
            activities.push({
              type: 'upload',
              title: `Uploaded: ${upload.caption || 'Photo'}`,
              date: new Date().toLocaleDateString(),
              imageUrl: upload.url
            });
          });

        } catch (err) {
          console.warn("Could not fetch recent activity");
        }

        setRecentActivity(activities.slice(0, 5));

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchDashboardData();
    }
  }, [user]);

  const dashboardSections: DashboardSection[] = [
    {
      title: "Quick Actions",
      items: [
        { href: "/featured_photos", label: "Featured Photos", description: "View today's featured photography", icon: "⭐" },
        { href: "/challenge", label: "Weekly Challenge", description: "Join this week's photo challenge", icon: "🎯" },
        { href: "/daily_tip", label: "Daily Tip", description: "Learn something new today", icon: "💡" },
        { href: "/photo_feedback", label: "Get Feedback", description: "Share your photos for review", icon: "💬" },
      ]
    },
    {
      title: "Create & Share",
      items: [
        { href: "/scavenger_hunt", label: "Scavenger Hunt", description: "Complete photo missions", icon: "🗺️" },
        { href: `/users/${user?.username}`, label: "My Profile", description: "Manage your photography portfolio", icon: "👤", badge: unreadCount > 0 ? unreadCount : undefined },
      ]
    },
    {
      title: "Explore & Learn",
      items: [
        { href: "/challenges", label: "Challenge Archive", description: "Browse past challenges", icon: "📋" },
        { href: "/learninghub", label: "Learning Hub", description: "Improve your photography skills", icon: "📚" },
        { href: "/podcasts", label: "Podcast", description: "Listen to photography discussions", icon: "🎧" },
        { href: "/scoreboard", label: "High Scores", description: "See top performers", icon: "🏆" },
      ]
    },
    {
      title: "Community",
      items: [
        { href: "/browse_profiles", label: "Browse Profiles", description: "Discover other photographers", icon: "👥" },
        { href: "/scavenger_browser", label: "Scavenger Gallery", description: "View community submissions ✨ NEW", icon: "🖼️" },
        { href: "/challenge_browser", label: "Challenge Gallery", description: "Browse challenge entries ✨ NEW", icon: "🎨" },
      ]
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "50vh",
        fontSize: "1.1rem",
        color: "#6b7280"
      }}>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "700", 
          margin: "0 0 0.5rem 0",
          color: "#374151"
        }}>
          Welcome back, {userProfile?.displayName || user?.username}! 📸
        </h2>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Ready to capture some amazing moments today?
        </p>
        
        {userStats.streakDays && userStats.streakDays > 0 && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #f59e0b"
          }}>
            <span style={{ fontSize: "1.25rem" }}>🔥</span>
            <strong style={{ marginLeft: "0.5rem", color: "#92400e" }}>
              {userStats.streakDays} day streak!
            </strong>
            <span style={{ marginLeft: "0.5rem", color: "#d97706" }}>
              Keep it up!
            </span>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151"
        }}>
          Your Photography Journey
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "1rem"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📸</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#374151" }}>
              {userStats.photosUploaded || 0}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Photos</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🎯</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#374151" }}>
              {userStats.challengesCompleted || 0}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Challenges</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📊</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#374151" }}>
              {userStats.profileCompleteness || 0}%
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Profile</div>
          </div>
        </div>
      </div>

      {/* User Search */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151"
        }}>
          Find Photographers
        </h3>
        <UserSearch onSearch={() => {
          // On dashboard, we don't need to close a menu, but we could handle other actions
          // like clearing search state or tracking analytics
        }} />
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: "#374151"
          }}>
            Recent Activity
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recentActivity.map((activity, index) => (
              <div key={index} style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb"
              }}>
                {activity.imageUrl && (
                  <img 
                    src={activity.imageUrl} 
                    alt="" 
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "6px",
                      objectFit: "cover"
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "500", fontSize: "0.9rem", color: "#374151" }}>
                    {activity.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.125rem" }}>
                    {activity.date}
                  </div>
                </div>
                <div style={{ fontSize: "1.2rem" }}>
                  {activity.type === 'challenge' ? '🎯' : activity.type === 'upload' ? '📸' : '🗺️'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Sections */}
      {dashboardSections.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: "#374151"
          }}>
            {section.title}
          </h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {section.items.map((item, itemIndex) => {
              if (item.condition === false) return null;
              
              return (
                <Link
                  key={itemIndex}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    textDecoration: "none",
                    color: "#374151",
                    transition: "all 0.2s ease",
                    border: "1px solid #e5e7eb",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {item.description}
                    </div>
                  </div>
                  {item.badge && (
                    <span style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      backgroundColor: "#ef4444",
                      color: "white",
                      borderRadius: "50%",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      minWidth: "1.5rem",
                      textAlign: "center"
                    }}>
                      {item.badge}
                    </span>
                  )}
                  <span style={{ color: "#9ca3af" }}>→</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Account Management */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151"
        }}>
          Account
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link href="/feedback" style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem",
            borderRadius: "8px",
            backgroundColor: "#f9fafb",
            textDecoration: "none",
            color: "#374151",
            transition: "all 0.2s ease",
            border: "1px solid #e5e7eb"
          }}>
            <span style={{ fontSize: "1.5rem" }}>💬</span>
            <span>Report Issue</span>
            <span style={{ marginLeft: "auto", color: "#9ca3af" }}>→</span>
          </Link>
          
          <Link href="/about_me" style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem",
            borderRadius: "8px",
            backgroundColor: "#f9fafb",
            textDecoration: "none",
            color: "#374151",
            transition: "all 0.2s ease",
            border: "1px solid #e5e7eb"
          }}>
            <span style={{ fontSize: "1.5rem" }}>ℹ️</span>
            <span>About</span>
            <span style={{ marginLeft: "auto", color: "#9ca3af" }}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;