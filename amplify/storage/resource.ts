import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'appStorage',
  access: (allow) => ({
    'profile-pictures/{entity_id}/*': [
      allow.guest.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    'picture-submissions/*': [
      allow.authenticated.to(['read','write']),
      allow.guest.to(['read', 'write'])
    ],
    'user-creations/{identity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']) // ✅ Add list here!
    ],
  })
});