import { generateStorageClient } from '@aws-amplify/codegen/storage';
import { storage } from './amplify/storage/resource'; // Your Gen 2 storage resource

generateStorageClient({
  storage,
  outputPath: './src/amplify/storage.ts', // or just './amplify/storage.ts'
});
