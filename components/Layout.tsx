import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUnread } from "@/context/UnreadContext";
import { Amplify } from 'aws-amplify';

type LayoutProps = {
  children: React.ReactNode;
  signOut?: () => void;
  user?: { username: string };
  userRole?: string;
  onDeleteAccount?: () => void;
  isDeleting?: boolean;
  showBackButton?: boolean;
  pageTitle?: string;
};

interface TabItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  condition?: boolean;
}

export default function Layout({ 
  children, 
  signOut, 
  user, 
  userRole, 
  onDeleteAccount, 
  isDeleting,
  showBackButton = false,
  pageTitle
}: LayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { unreadCount } = useUnread();
  const router = useRouter();

  useEffect(() => {
    console.log("👀 Layout loaded. user:", user?.username, "role:", userRole);
    console.log('🔧 DEPLOYED Amplify Config:', Amplify.getConfig());
    console.log('🔧 DEPLOYED Auth Config:', Amplify.getConfig().Auth);
    
    // Set active tab based on current route
    const path = router.pathname;
    if (path.includes('/profile') || path.includes('/users/')) {
      setActiveTab('profile');
    } else if (path.includes('/create') || path.includes('/challenge') || path.includes('/scavenger_hunt') || path.includes('/photo_feedback')) {
      setActiveTab('create');
    } else if (path.includes('/explore') || path.includes('/browse') || path.includes('/scoreboard')) {
      setActiveTab('explore');
    } else if (path.includes('/learn') || path.includes('/daily_tip') || path.includes('/learninghub') || path.includes('/podcasts')) {
      setActiveTab('learn');
    } else if (path.includes('/settings') || path.includes('/feedback') || path.includes('/about')) {
      setActiveTab('settings');
    } else {
      setActiveTab('dashboard');
    }
  }, [router.pathname, userRole]);

  const tabs: TabItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠", condition: true },
    { href: `/users/${user?.username || ''}`, label: "Profile", icon: "👤", badge: unreadCount > 0 ? unreadCount : undefined, condition: !!user },
    { href: "/create", label: "Create", icon: "✨", condition: true },
    { href: "/explore", label: "Explore", icon: "🔍", condition: true },
    { href: "/learn", label: "Learn", icon: "📚", condition: true },
    { href: "/settings", label: "Settings", icon: "⚙️", condition: true },
  ];

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  // Check if we're on the dashboard page
  const isDashboard = router.pathname === '/dashboard';

  return (
    <div style={{ 
      minHeight: "100vh", 
      color: "#6b7280", 
      backgroundColor: "#efede4",
      paddingBottom: "80px" // Space for bottom tabs
    }}>
      {/* Header */}
      <header style={{
        padding: "1rem",
        backgroundColor: "#44403c",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        {showBackButton ? (
          <button
            onClick={handleBackClick}
            style={{
              fontSize: "1.5rem",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "4px",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ←
          </button>
        ) : (
          <div style={{ width: "2.5rem" }}></div>
        )}
        
        <h1 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0 }}>
          {pageTitle || "Photo Mentor"}
        </h1>
        
        {userRole === "admin" && (
          <Link href="/admin" style={{ color: "white", textDecoration: "none", fontSize: "1.5rem" }}>
            👑
          </Link>
        )}
        {userRole !== "admin" && <div style={{ width: "2.5rem" }}></div>}
      </header>

      {/* Main Content */}
      <main style={{ padding: "1rem", minHeight: "calc(100vh - 160px)" }}>
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-around",
        padding: "0.5rem 0",
        zIndex: 100,
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)"
      }}>
        {tabs.map((tab, index) => {
          if (tab.condition === false) return null;
          
          const isActive = activeTab === tab.label.toLowerCase() || 
                          (tab.href === "/dashboard" && isDashboard);
          
          return (
            <Link
              key={index}
              href={tab.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.5rem",
                textDecoration: "none",
                color: isActive ? "#44403c" : "#6b7280",
                fontSize: "0.75rem",
                fontWeight: isActive ? "600" : "400",
                transition: "color 0.2s ease",
                position: "relative",
                minWidth: "60px"
              }}
            >
              <span style={{ 
                fontSize: "1.25rem",
                filter: isActive ? "none" : "grayscale(0.3)"
              }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  position: "absolute",
                  top: "0.25rem",
                  right: "0.25rem",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  padding: "0.125rem 0.375rem",
                  fontSize: "0.625rem",
                  fontWeight: "600",
                  minWidth: "1rem",
                  textAlign: "center"
                }}>
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}