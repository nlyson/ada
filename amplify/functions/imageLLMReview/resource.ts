import { defineFunction } from '@aws-amplify/backend';

export const imageLLMReview = defineFunction({
  name: "imageLLMReview",
});

/*
import { defineFunction } from '@aws-amplify/backend';

export const imageLLMReview = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'imageLLMReview',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  timeoutSeconds: 60
});
*/