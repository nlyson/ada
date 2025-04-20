import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { imageLLMReview } from './functions/imageLLMReview/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  imageLLMReview
});

const { cfnUserPool } = backend.auth.resources.cfnResources
// an empty array denotes "email" and "phone_number" cannot be used as a username
cfnUserPool.usernameAttributes = []