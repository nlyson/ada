import { fetchAuthSession } from 'aws-amplify/auth';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

type InvokeLambdaOptions = {
  url: string;
  method?: 'GET' | 'POST';
  body?: Record<string, any>;
  responseType?: 'json' | 'text';
  retries?: number;       // ✅ Optional retry count
  delayMs?: number;       // ✅ Optional delay between retries
};

export async function invokeLambdaIam({
  url,
  method = 'POST',
  body,
  responseType = 'json',
  retries = 2,             // ✅ Default: 2 retries
  delayMs = 750,           // ✅ Default: 750ms delay
}: InvokeLambdaOptions) {
  const { credentials } = await fetchAuthSession();

  if (!credentials) {
    throw new Error('IAM credentials not available.');
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const signedRequest = await signer.sign(request);

      const response = await fetch(url, {
        method,
        headers: signedRequest.headers as Record<string, string>,
        body: request.body,
      });

      if (!response.ok) {
        if (response.status === 503 && attempt < retries) {
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
        throw new Error(`Lambda request failed: ${response.status}`);
      }

      return responseType === 'text' ? response.text() : response.json();
    } catch (err: any) {
      const isRetryable =
        err?.message?.includes('503') || err?.message?.includes('network') || err?.message?.includes('fetch');
      if (attempt < retries && isRetryable) {
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }
      throw err;
    }
  }

  throw new Error('invokeLambdaIam: retries exhausted');
}
