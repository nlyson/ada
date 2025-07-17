import { fetchAuthSession } from 'aws-amplify/auth';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const USAGE_TABLE = 'PhotoApp-Usage-Tracking';

type InvokeLambdaOptions = {
  url: string;
  method?: 'GET' | 'POST';
  body?: Record<string, any>;
  responseType?: 'json' | 'text';
  retries?: number;
  delayMs?: number;
  username?: string; // Add username for tracking
};

export async function invokeLambdaIam({
  url,
  method = 'POST',
  body,
  responseType = 'json',
  retries = 2,
  delayMs = 750,
  username, // New parameter for tracking
}: InvokeLambdaOptions) {
  const startTime = Date.now();
  let success = false;
  let result = null;
  let error = null;

  // Auto-get username if not provided
  let trackingUsername: string | null = username || null;
  if (!trackingUsername) {
    try {
      const { getCurrentUser } = await import('aws-amplify/auth');
      const currentUser = await getCurrentUser();
      trackingUsername = currentUser.username || null;
      console.log('🔍 Auto-detected username:', trackingUsername);
    } catch (err: any) {
      console.log('🔍 Failed to auto-detect username:', err.message);
      trackingUsername = null; // User not authenticated, skip tracking
    }
  } else {
    console.log('🔍 Using provided username:', trackingUsername);
  }

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
        result = responseType === 'text' ? await response.text() : await response.json();
        success = true;
        //console.log('✅ Response parsed successfully');

        // Track successful usage (only for specific actions)
        if (trackingUsername) {
          const action = extractActionFromUrl(url);
          if (action) {
            console.log('🔍 About to track usage for:', trackingUsername, 'action:', action);
            trackUsage({
              username: trackingUsername,
              url,
              method,
              success: true,
              responseTime: Date.now() - startTime,
              accountTier: typeof result === 'object' && result?.accountTier ? result.accountTier : undefined,
            }).catch(err => {
              console.warn('Failed to track usage:', err);
            });
          } else {
            console.log('🔍 Skipping tracking - action not in tracked list:', url);
          }
        } else {
          console.log('🔍 Skipping tracking - no username available');
        }

        return result;
      } catch (err: any) {
        error = err;
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
  } catch (finalError) {
    error = finalError;
    console.error('❌ invokeLambdaIam failed completely:', finalError);

    // Track failed usage (only for specific actions)
    if (trackingUsername) {
      const action = extractActionFromUrl(url);
      if (action) {
        trackUsage({
          username: trackingUsername,
          url,
          method,
          success: false,
          responseTime: Date.now() - startTime,
          error: finalError instanceof Error ? finalError.message : 'Unknown error',
        }).catch(err => {
          console.warn('Failed to track usage:', err);
        });
      }
    }

    throw finalError;
  }
}

// Helper function to extract action name from URL
const extractActionFromUrl = (url: string): string | null => {
  // Core user actions
  //if (url.includes('user_profile')) return 'get_profile';
  //if (url.includes('charge_user')) return 'payment';
  //if (url.includes('upgrade_to_premium')) return 'upgrade_premium';
  if (url.includes('set_user_profile')) return 'update_profile';
  
  // Photo & content actions
  if (url.includes('upload_photo')) return 'photo_upload';
  if (url.includes('user_photos')) return 'view_user_photos';
  if (url.includes('review_photo')) return 'ai_feedback';
  //if (url.includes('get_photo_signed_url')) return 'get_photo_url';
  //if (url.includes('get_profile_upload_url')) return 'get_profile_upload_url';
  //if (url.includes('track_photo_view')) return 'photo_view';
  //if (url.includes('react_to_user_photo')) return 'photo_reaction';
  //if (url.includes('update_user_creations')) return 'update_creations';
  
  // Challenge actions
  if (url.includes('submit_challenge')) return 'challenge_submission';
  //if (url.includes('get_current_challenge')) return 'get_current_challenge';
  //if (url.includes('fetch_all_challenges')) return 'fetch_challenges';
  //if (url.includes('challenge_results')) return 'challenge_results';
  //if (url.includes('challenge_scoreboard')) return 'challenge_scoreboard';
  //if (url.includes('delete_challenge_submission')) return 'delete_challenge';
  //if (url.includes('get_high_challenge_scores')) return 'high_challenge_scores';
  
  // Scavenger hunt actions
  if (url.includes('submit-hunt-photo')) return 'scavenger_submission';
  //if (url.includes('get-user-hunt-progress')) return 'hunt_progress';
  //if (url.includes('get_scavenger_results')) return 'scavenger_results';
  //if (url.includes('list_scavenger_hunts')) return 'list_hunts';
  if (url.includes('get_high_scavenger_scores')) return 'high_scavenger_scores';
  
  // Comments & social actions
  if (url.includes('add_comment')) return 'add_comment';
  //if (url.includes('comment-list')) return 'list_comments';
  if (url.includes('delete_comment')) return 'delete_comment';
  //if (url.includes('react_to_comment')) return 'comment_reaction';
  //if (url.includes('mark_comment_as_read')) return 'mark_comment_read';
  //if (url.includes('mark_unread_comment')) return 'mark_comment_unread';
  //if (url.includes('get_unread_comment_flags')) return 'get_unread_comments';
  
  // Discovery & browsing
  //if (url.includes('list_profiles')) return 'browse_profiles';
  //if (url.includes('search_usernames')) return 'search_users';
  //if (url.includes('fetch_featured_photos')) return 'featured_photos';
  
  // Learning & tips
  if (url.includes('get_daily_tip')) return 'daily_tip';
  if (url.includes('tip_history')) return 'tip_history';
  if (url.includes('fetchPodcastFeed')) return 'podcast_feed';
  //if (url.includes('chat_with_gpt')) return 'ai_chat';
  
  // Stats & analytics
  //if (url.includes('get_user_stats')) return 'user_stats';
  //if (url.includes('update_user_stats')) return 'update_stats';
  //if (url.includes('get_feedback_usage')) return 'feedback_usage';
  
  // Feedback & support
  if (url.includes('submit_feedback')) return 'submit_feedback';
  //if (url.includes('list_feedback')) return 'list_feedback';
  
  // Admin actions
  //if (url.includes('feature_photo')) return 'admin_feature_photo';
  //if (url.includes('unfeature_photo')) return 'admin_unfeature_photo';
  //if (url.includes('list_photos')) return 'admin_list_photos';
  
  // User creation
  //if (url.includes('create_user_with_email')) return 'create_user';
  
  // Utility/testing
  //if (url.includes('test_lambda')) return 'test_lambda';
  //if (url.includes('track_usage')) return 'track_usage';
  
  // Return null for actions we don't want to track
  return null;
};

// Async tracking function
const trackUsage = async ({
  username,
  url,
  method,
  success,
  responseTime,
  accountTier,
  error
}: {
  username: string;
  url: string;
  method: string;
  success: boolean;
  responseTime: number;
  accountTier?: string;
  error?: string;
}) => {
  console.log('🔍 trackUsage called with:', { username, url, success });
  
  try {
    // Get the action - if null, don't track
    const action = extractActionFromUrl(url);
    if (!action) {
      console.log('🔍 No trackable action found for URL:', url);
      return;
    }

    // Get credentials for DynamoDB client
    const { credentials } = await fetchAuthSession();
    if (!credentials) {
      console.log('🔍 No credentials available for tracking');
      return;
    }

    console.log('🔍 Got credentials, creating DynamoDB client');

    const dynamoClient = new DynamoDBClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = now.getUTCHours().toString().padStart(2, '0');

    console.log('🔍 Preparing item:', { username, action, success });

    // Manually format DynamoDB item - action is guaranteed to be string here
    const item = {
      PK: { S: `USER#${username}` },
      SK: { S: `ACTION#${timestamp}#${action}` },
      username: { S: username },
      action: { S: action }, // Now guaranteed to be string, not null
      endpoint: { S: url },
      method: { S: method },
      timestamp: { S: timestamp },
      date: { S: date },
      hour: { S: hour },
      success: { BOOL: success },
      responseTime: { N: responseTime.toString() },
      accountTier: { S: accountTier || 'unknown' },
      DateIndex: { S: date },
      ActionIndex: { S: action },
      ...(error && { error: { S: error } }),
      metadata: {
        M: {
          userAgent: { S: typeof navigator !== 'undefined' ? navigator.userAgent : 'server' },
          platform: { S: 'web' },
        }
      }
    };

    const command = new PutItemCommand({
      TableName: USAGE_TABLE,
      Item: item,
    });

    console.log('🔍 Sending to DynamoDB...');
    await dynamoClient.send(command);
    console.log(`📊 Usage tracked: ${username} - ${action} - ${success ? 'success' : 'failed'}`);
  } catch (err) {
    console.error('Error tracking usage:', err);
    // Don't throw - tracking should be silent
  }
};

// Optional: Export the tracking function for manual use
export { trackUsage };