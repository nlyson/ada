import "@/styles/app.css";
import type { AppProps } from "next/app";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import Layout from "@/components/Layout";
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => (
        <Layout signOut={signOut}> {/* ✅ pass signOut here */}
          <Component {...pageProps} signOut={signOut} user={user} />
        </Layout>
      )}
    </Authenticator>
  );
}