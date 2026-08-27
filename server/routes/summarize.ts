import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { generateAIResponse } from '../lib/ai.js';
import { z } from 'zod';

const router = Router();

const summarizeSchema = z.object({
  content: z.string().min(10).max(50000),
  title: z.string().min(1).max(200),
  sourceType: z.enum(['text', 'pdf', 'url', 'bullets', 'keypoints', 'revision']).default('text'),
});

// Generate summary
router.post('/', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content, title, sourceType } = summarizeSchema.parse(req.body);

    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: req.auth.sessionClaims?.email as string || `user-${userId}@temp.com`,
          name: req.auth.sessionClaims?.name as string,
        },
      });
    }

    // Generate summary using AI based on type
    let prompt = '';
    
    if (sourceType === 'bullets') {
      prompt = `Summarize the following content as bullet points. Create 8-12 clear, concise bullet points covering the main ideas.

Content:
${content}

Format as JSON:
{
  "summary": "• Point 1. • Point 2. • Point 3...",
  "keyPoints": []
}

Return ONLY valid JSON, no markdown.`;
    } else if (sourceType === 'keypoints') {
      prompt = `Extract the key points from the following content. Identify 5-8 most important concepts or takeaways.

Content:
${content}

Format as JSON:
{
  "summary": "Brief overview in 1-2 sentences",
  "keyPoints": ["Key point 1", "Key point 2"]
}

Return ONLY valid JSON, no markdown.`;
    } else if (sourceType === 'revision') {
      prompt = `Create comprehensive revision notes from the following content. Include main concepts, definitions, and important facts.

Content:
${content}

IMPORTANT: keyPoints must be an array of simple strings, NOT objects.

Format as JSON:
{
  "summary": "Detailed revision notes with main concepts, definitions, and important facts organized by topic",
  "keyPoints": [
    "Concept 1: explanation",
    "Concept 2: explanation",
    "Fact 1: details",
    "Definition: explanation"
  ]
}

Return ONLY valid JSON with keyPoints as string array, no nested objects, no markdown.`;
    } else {
      // Default: balanced summary with key points
      prompt = `Analyze and summarize the following content. Provide a concise summary and key points.

Content:
${content}

Format as JSON:
{
  "summary": "Your summary here",
  "keyPoints": ["Point 1", "Point 2"]
}

Return ONLY valid JSON, no markdown.`;
    }

    const aiResponse = await generateAIResponse(
      prompt,
      'You are an expert study assistant and summarizer. Output ONLY valid JSON as instructed, with no markdown or extra text. Create clear, structured summaries optimised for learning and exam preparation.',
    );
    
    // Parse AI response
    let parsedResponse: { summary: string; keyPoints: string[] };
    try {
      // Extract JSON from response - handle markdown code blocks
      let jsonStr = aiResponse;
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, use the raw response as summary
        parsedResponse = { summary: aiResponse, keyPoints: [] };
      } else {
        // Clean up common JSON issues
        const cleanJson = jsonMatch[0]
          .replace(/,\s*,/g, ',')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*\]/g, ']')
          .replace(/\.\.\./g, ''); // Remove ellipsis
        
        parsedResponse = JSON.parse(cleanJson);
        
        // Ensure keyPoints is an array of strings
        if (!Array.isArray(parsedResponse.keyPoints)) {
          parsedResponse.keyPoints = [];
        } else {
          // Convert any complex objects to strings
          parsedResponse.keyPoints = parsedResponse.keyPoints.map((item: any) => {
            if (typeof item === 'string') {
              return item;
            } else if (typeof item === 'object' && item !== null) {
              // Convert object to readable string
              if (item.topic && item.details) {
                return `${item.topic}: ${item.details}`;
              } else if (item.topic) {
                return JSON.stringify(item.topic);
              } else {
                return JSON.stringify(item);
              }
            } else {
              return String(item);
            }
          });
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: use raw response as summary
      parsedResponse = { summary: aiResponse, keyPoints: [] };
    }

    // Save to database
    const summary = await prisma.summary.create({
      data: {
        userId: user.id,
        title,
        content,
        summary: parsedResponse.summary,
        keyPoints: parsedResponse.keyPoints,
        sourceType,
      },
    });

    res.json({
      summary: {
        id: summary.id,
        title: summary.title,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        sourceType: summary.sourceType,
        createdAt: summary.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get summary history
router.get('/history', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.json({ summaries: [] });
    }

    const summaries = await prisma.summary.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        summary: true,
        keyPoints: true,
        sourceType: true,
        createdAt: true,
      },
    });

    res.json({ summaries });
  } catch (error) {
    next(error);
  }
});

// Get specific summary
router.get('/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const summary = await prisma.summary.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
    });

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

// Delete summary
router.delete('/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.summary.deleteMany({
      where: {
        id: req.params.id,
        userId: user.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
