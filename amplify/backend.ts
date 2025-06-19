import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  // Empty - using only existing external resources
});

backend.addOutput({
  storage: {
    bucket_name: "picture-this-storage",
    aws_region: 'us-east-1'
  },
  auth: {
    user_pool_id: "us-east-1_vin6qLM49",
    user_pool_client_id: "bhkb9c7knji0t123viqjompep",
    aws_region: "us-east-1",
    identity_pool_id: "us-east-1:3cecf3e8-aec0-43e8-b35f-3bf181b6a540",
  },
});