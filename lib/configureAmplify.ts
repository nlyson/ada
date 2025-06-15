// lib/configureAmplify.ts
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';

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
