import { Amplify } from "aws-amplify";
import amplifyConfig from "@/amplify_outputs.json";
Amplify.configure(amplifyConfig);

import "@/styles/app.css";
import type { AppProps } from "next/app";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Layout from "@/components/Layout";
import { UnreadProvider } from "@/context/UnreadContext";
import { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import "@aws-amplify/ui-react/styles.css";
import { motion } from "framer-motion";
import Image from "next/image";

const CREATE_USER_URL =
  "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/create_user_with_email";
const GET_PROFILE_URL =
  "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";

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
  const showWelcome = true;

  useEffect(() => {
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
      <Layout user={user} signOut={safeSignOut} userRole={userRole}>
        {showWelcome && (
          <div style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "1rem",
            borderRadius: "0.5rem",
            margin: "1rem 0",
            border: "1px solid #ffeeba",
            textAlign: "center"
          }}>
👋 Thanks for joining early access! Some features are still being refined, and you may encounter occasional bugs or missing polish. If you run into any issues or have ideas, please report them — we&apos;re building this for the community, and your feedback really matters. ❤️ Payments are now live, and your support helps us cover maintenance costs and continue building great features!          </div>
        )}
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

