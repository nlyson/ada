import type { NextApiRequest, NextApiResponse } from 'next';
import { list, getUrl } from 'aws-amplify/storage';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../../amplify_outputs.json';

Amplify.configure(amplifyConfig);

type FeaturedPhoto = {
  username: string;
  photoUrl: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // List all top-level user folders
    const { items: userFolders } = await list({ path: "user-creations/", options: { listAll: true } });

    const userMap: Record<string, boolean> = {}; // to track unique users
    const featuredPhotos: FeaturedPhoto[] = [];

    for (const item of userFolders) {
      const path = item.path;
      const match = path.match(/^user-creations\/([^/]+)\//);

      if (match) {
        const username = match[1];

        if (!userMap[username]) {
          userMap[username] = true;

          // Now list this user's images
          const { items: userImages } = await list({ path: `user-creations/${username}/` });

          if (userImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * userImages.length);
            const randomImage = userImages[randomIndex];

            const { url } = await getUrl({ path: randomImage.path });

            featuredPhotos.push({
              username,
              photoUrl: url.href,
            });
          }
        }
      }
    }

    return res.status(200).json({ featuredPhotos });
  } catch (error) {
    console.error("Error generating featured photos:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
