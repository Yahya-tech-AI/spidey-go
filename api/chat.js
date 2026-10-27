import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "AI service is not configured.",
    });
  }

  try {
    const { message } = req.body ?? {};

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000
    ) {
      return res.status(400).json({
        error: "Enter a message up to 2,000 characters.",
      });
    }

    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [
        {
          role: "system",
          content:
            "You are SPIDEY-GO AI, a friendly, clever superhero assistant. Help with coding, technology, creativity, and everyday questions. Be honest, concise, and safety-conscious.",
        },
        { role: "user", content: message.trim() },
      ],
      max_tokens: 500,
    });

    const reply =
      completion.choices[0]?.message?.content;

    return res.status(200).json({
      reply: typeof reply === "string"
        ? reply
        : "I couldn't generate a response. Try again!",
    });
  } catch (error) {
    console.error("[SPIDEY-GO AI]", error.message);

    return res.status(502).json({
      error: "The AI couldn't respond. Please try again.",
    });
  }
}
