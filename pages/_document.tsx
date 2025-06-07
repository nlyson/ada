import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Square Web Payments SDK (loaded asynchronously to avoid blocking rendering) */}
        <Script
          src="https://web.squarecdn.com/v1/square.js"
          strategy="afterInteractive"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}