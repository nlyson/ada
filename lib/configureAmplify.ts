// lib/configureAmplify.ts
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplify_outputs.json';

Amplify.configure({
  ...amplifyConfig,
  Storage: {
    S3: {
      bucket: "picture-this-storage",
      region: "us-east-1",
    }
  }
});
