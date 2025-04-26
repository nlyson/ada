// pages/api/get_today_tip.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" }); // adjust if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const today = new Date().toISOString().slice(0, 10); // '2025-04-26'

  try {
    const getResult = await client.send(
      new GetItemCommand({
        TableName: "DailyTips",
        Key: { id: { S: today } },
      })
    );

    if (!getResult.Item) {
      return res.status(404).json({ error: "No tip found for today." });
    }

    const tip = getResult.Item.tip.S;

    return res.status(200).json({ tip });
  } catch (error) {
    console.error("Error fetching today's tip:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
