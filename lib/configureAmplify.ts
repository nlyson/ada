// lib/configureAmplify.ts
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';
import outputs from '@/amplify_outputs.json';

// Merge everything into one config object
const finalConfig = {
  ...outputs,          // ← This should come FIRST (has Auth, etc.)
  ...amplifyConfig,    // ← Then your custom config
  Storage: {
    ...outputs.storage,  // ← Keep existing storage config
    S3: {
      bucket: "picture-this-storage",
      region: "us-east-1"
    }
  }
};


// Configure once with the merged config
Amplify.configure(finalConfig);

console.log(' final config: ', finalConfig);
console.log('🔍 amplifyConfig:', amplifyConfig);
console.log('🔍 outputs:', outputs);
