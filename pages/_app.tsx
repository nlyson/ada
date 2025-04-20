import "@/styles/app.css";
import type { AppProps } from "next/app";
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => (
        <Component {...pageProps} signOut={signOut} user={user} />
      )}
    </Authenticator>
  );
}
