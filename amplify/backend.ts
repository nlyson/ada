import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { imageLLMReview } from './functions/imageLLMReview/resource';
import { sayHello } from './functions/say-hello/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  imageLLMReview,
  sayHello,
});

backend.addOutput({
  storage: {
    aws_region: "us-east-1",
    bucket_name: "picture-this-storage",
  },
});

