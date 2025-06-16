// lib/configureAmplify.ts
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

// Configure once with the merged config
Amplify.configure(outputs);

console.log('🔍 outputs:', outputs);
