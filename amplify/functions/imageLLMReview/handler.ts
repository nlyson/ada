import { APIGatewayProxyHandler } from "aws-lambda";
import fetch from "node-fetch";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const imageUrl = body.imageUrl;

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing 'imageUrl' in request body." }),
      };
    }

    const messages = [
      {
        role: "system",
        content: "You are an expert photographer. Analyze the uploaded photo for composition, lighting, subject, focus, and artistic quality. Give actionable advice, as if critiquing for improvement.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Please review this photo." },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        max_tokens: 1000,
      }),
    });

    const data = await response.json() as any;

    if (data.error) {
      console.error("OpenAI Error:", data.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result: data.choices[0].message.content }),
    };
  } catch (err) {
    console.error("Lambda error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};