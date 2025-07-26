// pages/settings.tsx
import React from "react";
import Link from "next/link";

type AppProps = {
  signOut: () => void;
  user: { username: string };
  onDeleteAccount?: () => void;
  isDeleting?: boolean;
};

const SettingsHub: React.FC<AppProps> = ({ user, signOut, onDeleteAccount, isDeleting }) => {
  const accountSettings = [
    {
      title: "My Profile",
      description: "Edit your profile information and manage your portfolio",
      icon: "👤",
      href: `/users/${user?.username}`,
      action: "Edit Profile"
    },
    {
      title: "Account Management",
      description: "View account details and manage your subscription",
      icon: "⚙️",
      items: [
        { label: "Profile Settings", href: `/users/${user?.username}`, disabled: false },
        //{ label: "Privacy Settings", href: "#", disabled: true },
        //{ label: "Notification Preferences", href: "#", disabled: true }
      ]
    }
  ];

  const supportOptions = [
    {
      title: "Report Issue",
      description: "Found a bug or have feedback? Let us know!",
      icon: "💬",
      href: "/feedback"
    },
    {
      title: "About Photo Mentor",
      description: "Learn more about our mission and features",
      icon: "ℹ️",
      href: "/about_me"
    }
  ];

  const appInfo = [
    { label: "Version", value: "1.2.0" },
    { label: "Last Updated", value: "July 2025" },
  ];

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
          Settings ⚙️
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "1.1rem" }}>
          Manage your account, preferences, and get support
        </p>
      </div>

      {/* Account Settings */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151"
        }}>
          Account Settings
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {accountSettings.map((setting, index) => (
            <div key={index}>
              {setting.href ? (
                <Link
                  href={setting.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1.25rem",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    textDecoration: "none",
                    color: "#374151",
                    transition: "all 0.2s ease",
                    border: "1px solid #e5e7eb"
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
                  <span style={{ fontSize: "1.5rem" }}>{setting.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                      {setting.title}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {setting.description}
                    </div>
                  </div>
                  {setting.action && (
                    <span style={{
                      backgroundColor: "#3b82f6",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500"
                    }}>
                      {setting.action}
                    </span>
                  )}
                  <span style={{ color: "#9ca3af" }}>→</span>
                </Link>
              ) : (
                <div style={{
                  padding: "1.25rem",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1rem"
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>{setting.icon}</span>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                        {setting.title}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {setting.description}
                      </div>
                    </div>
                  </div>
                  {setting.items && (
                    <div style={{ paddingLeft: "2.5rem" }}>
                      {setting.items.map((item, itemIndex) => (
                        <div key={itemIndex} style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.5rem 0",
                          borderBottom: itemIndex < setting.items!.length - 1 ? "1px solid #e5e7eb" : "none"
                        }}>
                          <span style={{
                            color: item.disabled ? "#9ca3af" : "#374151",
                            fontSize: "0.9rem"
                          }}>
                            {item.label}
                          </span>
                          {item.disabled ? (
                            <span style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              backgroundColor: "#f3f4f6",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px"
                            }}>
                              Coming Soon
                            </span>
                          ) : (
                            <Link href={item.href} style={{ color: "#3b82f6", fontSize: "0.875rem" }}>
                              Edit →
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Support & Help */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151"
        }}>
          Support & Help
        </h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {supportOptions.map((option, index) => (
            <Link
              key={index}
              href={option.href}
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
                border: "1px solid #e5e7eb"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{option.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                  {option.title}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {option.description}
                </div>
              </div>
              <span style={{ color: "#9ca3af" }}>→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* App Information */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151"
        }}>
          App Information
        </h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {appInfo.map((info, index) => (
            <div key={index} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              border: "1px solid #e5e7eb"
            }}>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>{info.label}</span>
              <span style={{ color: "#374151", fontSize: "0.9rem", fontWeight: "500" }}>{info.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{
        backgroundColor: "#fef2f2",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid #fecaca"
      }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#dc2626"
        }}>
          Account Actions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Sign Out Button */}
          <button
            onClick={signOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#dc2626",
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
              fontSize: "1rem"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🚪</span>
            <div>
              <div style={{ fontWeight: "600" }}>Sign Out</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                Sign out of your Photo Mentor account
              </div>
            </div>
          </button>

          {/* Delete Account Button */}
          {(
            <button
              onClick={onDeleteAccount}
              disabled={isDeleting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: "rgba(220, 53, 69, 0.1)",
                border: "1px solid rgba(220, 53, 69, 0.3)",
                color: "#dc2626",
                cursor: isDeleting ? "not-allowed" : "pointer",
                opacity: isDeleting ? 0.6 : 1,
                width: "100%",
                textAlign: "left",
                fontSize: "1rem",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
                }
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>🗑️</span>
              <div>
                <div style={{ fontWeight: "600" }}>
                  {isDeleting ? "Deleting Account..." : "Delete Account"}
                </div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Permanently delete your account and all data
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsHub;