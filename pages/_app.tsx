import "@/styles/app.css";
import type { AppProps } from "next/app";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import Layout from "@/components/Layout";
import amplifyConfig from "@/amplify_outputs.json";
import { UnreadProvider } from "@/context/UnreadContext";

Amplify.configure({
  ...amplifyConfig,
  Storage: {
    S3: {
      bucket: "picture-this-storage",
      region: "us-east-1"
    }
  }
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => (
        <UnreadProvider user={user}>
          <Layout user={user} signOut={signOut}>
            <Component signOut={signOut} user={user} />
          </Layout>
        </UnreadProvider>
      )}
    </Authenticator>
  );
}