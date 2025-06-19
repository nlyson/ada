// lib/configureAmplify.ts
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';


const amplifyConfig = {
  ...outputs,
  Storage: {
    S3: {
      bucket: 'picture-this-storage',
      region: 'us-east-1',
      // Merge any existing storage config
      ...outputs.storage
    }
  }
};
// Configure once with the merged config
Amplify.configure(amplifyConfig);

console.log('🔍 outputs:', outputs);
