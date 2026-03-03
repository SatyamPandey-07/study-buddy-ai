// Groq AI Service (OpenAI-compatible API)

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateAIResponse(prompt: string, systemPrompt?: string): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please add it in your Vercel dashboard.');
  }
  try {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    return text;
  } catch (error) {
    // Re-throw env var errors directly so they surface clearly
    if (error instanceof Error && error.message.includes('GROQ_API_KEY')) {
      throw error;
    }
    console.error('AI generation error:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateAIStreamResponse(
  prompt: string,
  systemPrompt?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // For now, use non-streaming version
  return generateAIResponse(prompt, systemPrompt);
}

export default {
  generateAIResponse,
  generateAIStreamResponse,
};
