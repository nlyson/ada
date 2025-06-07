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

    console.log("👤 user:", user);


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
      👋    Thanks for joining early access! Some features (like payments) aren&apos;t live yet, and there may still be bugs or missing polish. If you run into any issues or have ideas, please report them — we&apos;re building this for the community, and your feedback really matters. ❤️ Your future support helps us cover maintenance costs too!
          </div>
        )}
        <Component signOut={safeSignOut} user={user} />
      </Layout>
    </UnreadProvider>
  );
}

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <Authenticator>
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
