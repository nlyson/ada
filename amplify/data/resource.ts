import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { imageLLMReview } from '../functions/imageLLMReview/resource';
import { sayHello } from "../functions/say-hello/resource"

const schema = a.schema({
  sayHello: a
    .query()
    .arguments({
      name: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(sayHello)),

  imageLLMReview: a
    .query()
    .arguments({
      name: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(imageLLMReview)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});