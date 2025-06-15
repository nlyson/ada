// lib/configureAmplify.ts
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';
import outputs from '@/amplify_outputs.json';

// Merge everything into one config object
const finalConfig = {
  ...amplifyConfig,
  ...outputs,
  Storage: {
    S3: {
      bucket: "picture-this-storage",
      region: "us-east-1"
    }
  }
};

// Configure once with the merged config
Amplify.configure(finalConfig);

