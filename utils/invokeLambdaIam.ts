// utils/invokeLambdaIam.ts
import { fetchAuthSession } from 'aws-amplify/auth';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

export async function invokeLambdaIam({
  url,
  method = 'POST',
  body,
}: {
  url: string;
  method?: 'GET' | 'POST';
  body?: Record<string, any>;
}) {
  const { credentials } = await fetchAuthSession();

  console.log("🔐 Credentials fetched:", credentials);
  console.log("🔐 Calling URL:", url);

  if (!credentials) {
    throw new Error("IAM credentials not available.");
  }

  const parsedUrl = new URL(url);

  const signer = new SignatureV4({
    service: 'execute-api',
    region: 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
    sha256: Sha256,
  });

  const request = new HttpRequest({
    method,
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    headers: {
      host: parsedUrl.hostname,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const signedRequest = await signer.sign(request);

  const response = await fetch(url, {
    method,
    headers: signedRequest.headers as Record<string, string>,
    body: request.body,
  });

  if (!response.ok) {
    throw new Error(`Lambda request failed: ${response.status}`);
  }

  return response.json();
}
