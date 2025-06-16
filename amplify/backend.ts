import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  // Empty - using only existing external resources
});

backend.addOutput({
  storage: {
    bucket_name: "picture-this-storage",
  },
  auth: {
    user_pool_id: "us-east-1_vin6qLM49",
    user_pool_client_id: "bhkb9c7knji0t123viqjompep",
    aws_region: "us-east-1",
  },
});