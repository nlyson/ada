import '@/lib/configureAmplify'; // This runs the Amplify.configure() automatically
import { Amplify } from 'aws-amplify';

console.log('🔥 AFTER CONFIG:', typeof Amplify !== 'undefined' ? Amplify.getConfig() : 'Amplify not loaded');

import "@/styles/app.css";
import type { AppProps } from "next/app";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Layout from "@/components/Layout";
import { UnreadProvider } from "@/context/UnreadContext";
import { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { motion } from "framer-motion";
import Image from "next/image";
import { deleteUser } from "aws-amplify/auth";

const CREATE_USER_URL =
  "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/create_user_with_email";
const GET_PROFILE_URL =
  "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const DELETE_ACCOUNT_URL =
  "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/delete_account";

function AuthenticatedApp({
  Component,
  pageProps,
  router,
  user,
  signOut,
}: AppProps & {
  user: any;
  signOut?: (data?: any) => void;
}) {
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const showWelcome = true;

  console.log('🔧 Amplify Configuration:', Amplify.getConfig());

  useEffect(() => {
    console.log('🔧 DEPLOYED in _app Amplify Config:', Amplify.getConfig());
    console.log('🔧 DEPLOYED in _app Auth Config:', Amplify.getConfig().Auth);
    const ensureProfileExists = async () => {
      try {
        let profile;
        try {
          profile = await invokeLambdaIam({
            url: GET_PROFILE_URL,
            method: "POST",
            body: { username: user?.username },
          });

          if (profile?.username) {
            setUserRole(profile.role);
            return;
          }
        } catch (err) {
          console.warn("No profile found, creating one.");
        }

        // Profile missing — create default one
        try {
          await invokeLambdaIam({
            url: CREATE_USER_URL,
            method: "POST",
            body: {
              username: user?.username,
              email: user?.signInDetails?.loginId,
              role: "user",
              skipCognito: true,
            },
          });
          setUserRole("user");
        } catch (creationErr) {
          console.error("❌ Failed to create new user profile:", creationErr);
        }
      } catch (err) {
        console.error("Failed to create or check user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      ensureProfileExists();
    }
  }, [user]);

  const handleDeleteAccount = async () => {
    // First confirmation
    const firstConfirm = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all your data.\n\n" +
      "This includes:\n" +
      "• All your photo submissions\n" +
      "• Your profile and progress\n" +
      "• All comments and likes\n" +
      "• Challenge history\n\n" +
      "This action CANNOT be undone.\n\n" +
      "Are you sure you want to continue?"
    );

    if (!firstConfirm) return;

    // Second confirmation with typing requirement
    const confirmText = prompt(
      "To confirm account deletion, please type: DELETE MY ACCOUNT\n\n" +
      "Type exactly (case sensitive):"
    );

    if (confirmText !== "DELETE MY ACCOUNT") {
      if (confirmText !== null) { // User didn't cancel
        alert("❌ Text didn't match exactly. Account deletion cancelled for your safety.");
      }
      return;
    }

    // Final confirmation
    const finalConfirm = window.confirm(
      "🚨 FINAL WARNING 🚨\n\n" +
      "You typed the confirmation text correctly.\n\n" +
      "Clicking OK will IMMEDIATELY and PERMANENTLY delete your account.\n\n" +
      "Are you absolutely certain you want to delete your Photo Mentor account?"
    );

    if (!finalConfirm) return;

    setIsDeleting(true);

    try {
      // Step 1: Delete user data from DynamoDB
      console.log("🗑️ Deleting user data from database...");
      await invokeLambdaIam({
        url: DELETE_ACCOUNT_URL,
        method: "POST",
        body: { 
          username: user?.username,
          email: user?.signInDetails?.loginId
        },
      });
      console.log("✅ Database deletion completed");

      // Step 2: Delete from Cognito
      console.log("👤 About to delete Cognito user...");
      await deleteUser();
      console.log("✅ Cognito user deletion completed");

      // Show success message
      alert("✅ Your account has been successfully deleted. You will now be signed out.");

      // Note: deleteUser() automatically signs out the user

    } catch (error: any) {
      console.error("❌ Error deleting account:", error);
      
      // Handle specific Cognito errors
      if (error.name === 'NotAuthorizedException') {
        alert("❌ Session expired. Please sign out and try again.");
        safeSignOut();
      } else if (error.name === 'UserNotFoundException') {
        alert("⚠️ Account not found in authentication system, but database data was deleted.");
        safeSignOut();
      } else {
        alert(
          "❌ There was an error deleting your account. Please try again or contact support at jamacpantel@gmail.com"
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const safeSignOut = () => {
    if (typeof signOut === "function") {
      signOut();
    }
  };

  if (!user || userRole === undefined) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <UnreadProvider user={user}>
      <Layout 
        user={user} 
        signOut={safeSignOut} 
        userRole={userRole}
        onDeleteAccount={handleDeleteAccount}
        isDeleting={isDeleting}
      >
        <Component signOut={safeSignOut} user={user} />
      </Layout>
    </UnreadProvider>
  );
}

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <Authenticator
      components={{
        Header: () => (
          <div style={{ textAlign: "center", padding: "2rem 1rem 1rem" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              style={{
                maxWidth: 300,
                margin: "0 auto",
              }}
            >
              <Image
                src="/photo_mentor_home.png"
                alt="Photo Mentor Logo"
                width={300}
                height={300}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "1.5rem",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                }}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: "1.5rem",
                fontSize: "1.5rem",
                color: "#b76e79",
                fontWeight: "bold",
              }}
            >
              Welcome to Photo Mentor
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: "1rem",
                color: "#555",
                marginTop: "0.75rem",
                maxWidth: 380,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Sign up or sign in to join challenges, get feedback, and grow your photography skills.
            </motion.p>
          </div>
        ),
      }}
    >
      {({ signOut, user }) => (
        <AuthenticatedApp
          Component={Component}
          pageProps={pageProps}
          router={router}
          user={user}
          signOut={signOut}
        />
      )}
    </Authenticator>
  );
}