import outputs from '@/amplify_outputs.json';
import { Amplify } from 'aws-amplify';

// Configure with full outputs FIRST
Amplify.configure(outputs);

// THEN override just the storage bucket
Amplify.configure({
  Storage: {
    S3: {
      bucket: "picture-this-storage",
      region: "us-east-1",
    }
  }
}, { ssr: true });