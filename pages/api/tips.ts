// pages/api/tips.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await client.send(
      new ScanCommand({
        TableName: "DailyTips",
        Limit: 20, // You can change how many tips you want to return
      })
    );

    if (!result.Items) {
      return res.status(404).json({ error: "No tips found." });
    }

    // Convert DynamoDB Items to a clean array
    const tips = result.Items.map((item) => ({
        id: item.id?.S ?? "Unknown ID",
        tip: item.tip?.S ?? "No tip available",
        timestamp: item.timestamp?.S ?? "",
      }));

    // Sort tips newest first
    tips.sort((a, b) => (a.id < b.id ? 1 : -1));

    return res.status(200).json({ tips });
  } catch (error) {
    console.error("Error fetching tips:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
