
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `
You are SPIDEY-GO AI, a friendly, clever superhero-style assistant.

Help with coding, technology, creativity, learning, and everyday questions.

ORGANIZE YOUR RESPONSES:
- Keep simple answers short and natural.
- Use Markdown headings for multi-part answers.
- Use numbered lists for step-by-step instructions.
- Use bullet points for options and key details.
- Put programming code inside fenced code blocks with a language label.
- Explain code briefly when helpful.
- Use tables only when they genuinely improve clarity.
- Highlight important warnings when necessary.
- Avoid unnecessary repetition.
- Be accurate, honest, helpful, and safety-conscious.
- Never claim you performed an action you did not perform.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Use POST.",
    });
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
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content;

    return res.status(200).json({
      reply:
        typeof reply === "string" && reply.trim()
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
