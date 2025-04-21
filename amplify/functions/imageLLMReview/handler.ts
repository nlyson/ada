export const handler = async (event: any): Promise<string> => {
  const base64 = event.arguments.name;
  
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
            url: `data:image/jpeg;base64,${base64}`,
          },
        },
      ],
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        max_tokens: 4096,
      }),
    });

    const data = await response.json();
    //console.log('Raw Response - ', JSON.stringify(data))

    //return JSON.stringify({"Content-Type": "application/json", "data": `THIS IS THE KEYYYYYYYYYYYYYYY ${secret('OPENAI_API_KEY')}`,})
    //return JSON.stringify(data)
    return data.choices[0].message.content || "Data content was empty. Prob a bug. ;)";
  } catch (error) {
    console.error("OpenAI error:", error);
    return "Error analyzing image."
  }
};