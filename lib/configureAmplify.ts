// lib/configureAmplify.ts
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';

console.log('🔥 BEFORE in function:', typeof Amplify !== 'undefined' ? Amplify.getConfig() : 'Amplify not loaded');

Amplify.configure({
  ...amplifyConfig,
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_vin6qLM49',      // Your existing pool ID
      userPoolClientId: 'bhkb9c7knji0t123viqjompep',          // Your existing client ID
    }
  },
  Storage: {
    S3: {
      bucket: "picture-this-storage",
      region: "us-east-1",
    }
  }
});

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_vin6qLM49',      // Your existing pool ID
      userPoolClientId: 'bhkb9c7knji0t123viqjompep',          // Your existing client ID
    }
  },
  Storage: {
    S3: {
      bucket: "picture-this-storage",
      region: "us-east-1",
    }
  }
});

console.log('🔥 AFTER in function:', typeof Amplify !== 'undefined' ? Amplify.getConfig() : 'Amplify not loaded');
