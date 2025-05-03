import "@/styles/app.css";
import type { AppProps } from "next/app";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import Layout from "@/components/Layout";
import amplifyConfig from "@/amplify_outputs.json";

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
        <Layout signOut={signOut} user={user}> {/* ✅ pass signOut here */}
          <Component {...pageProps} signOut={signOut} user={user} />
        </Layout>
      )}
    </Authenticator>
  );
}