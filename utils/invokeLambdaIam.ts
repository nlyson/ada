import { fetchAuthSession } from 'aws-amplify/auth';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

type InvokeLambdaOptions = {
  url: string;
  method?: 'GET' | 'POST';
  body?: Record<string, any>;
  responseType?: 'json' | 'text';
  retries?: number;
  delayMs?: number;
};

export async function invokeLambdaIam({
  url,
  method = 'POST',
  body,
  responseType = 'json',
  retries = 2,
  delayMs = 750,
}: InvokeLambdaOptions) {
  //console.log('🔐 Starting invokeLambdaIam for URL:', url);
  
  try {
    //console.log('🎫 Fetching auth session...');
    const { credentials } = await fetchAuthSession();
    //console.log('✅ Auth session fetched, credentials available:', !!credentials);

    if (!credentials) {
      console.error('❌ No IAM credentials available');
      throw new Error('IAM credentials not available.');
    }

    const parsedUrl = new URL(url);
    //console.log('🌐 Parsed URL:', parsedUrl.hostname);

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
        //console.log(`🔄 Attempt ${attempt + 1}/${retries + 1} for ${url}`);
        
        const signedRequest = await signer.sign(request);
        //console.log('✅ Request signed successfully');

        //console.log('📡 Making fetch request...');
        const response = await fetch(url, {
          method,
          headers: signedRequest.headers as Record<string, string>,
          body: request.body,
        });

        //console.log('📨 Response received, status:', response.status);

        if (!response.ok) {
          console.error(`❌ Response not OK: ${response.status}`);
          if (response.status === 503 && attempt < retries) {
            console.log('⏳ 503 error, retrying...');
            await new Promise((res) => setTimeout(res, delayMs));
            continue;
          }
          throw new Error(`Lambda request failed: ${response.status}`);
        }

        //console.log('✅ Request successful, parsing response...');
        const result = responseType === 'text' ? await response.text() : await response.json();
        //console.log('✅ Response parsed successfully');
        return result;
      } catch (err: any) {
        console.error(`❌ Attempt ${attempt + 1} failed:`, err.message);
        const isRetryable =
          err?.message?.includes('503') || 
          err?.message?.includes('network') || 
          err?.message?.includes('fetch') ||
          err?.message?.includes('Failed to fetch');
        
        if (attempt < retries && isRetryable) {
          console.log('⏳ Retryable error, waiting before retry...');
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
        throw err;
      }
    }

    throw new Error('invokeLambdaIam: retries exhausted');
  } catch (error) {
    console.error('❌ invokeLambdaIam failed completely:', error);
    throw error;
  }
}