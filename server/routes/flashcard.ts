/// <reference types="../types" />
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { generateAIResponse } from '../lib/ai.js';
import { z } from 'zod';

const router = Router();

const flashcardSchema = z.object({
  topic: z.string().min(1).max(500),
  count: z.coerce.number().min(1).max(30).default(10),
  content: z.string().optional(),
});

const updateFlashcardSchema = z.object({
  mastered: z.boolean(),
});

// Generate flashcard set
router.post('/generate', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topic, count, content } = flashcardSchema.parse(req.body);

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

    // Generate flashcards using AI
    const prompt = content 
      ? `Generate ${count} flashcards based on this content about "${topic}":

${content}

Create flashcards as a JSON array:
[
  {
    "front": "Question or term",
    "back": "Answer or definition"
  }
]

Make the flashcards clear, concise, and educational. Return ONLY the JSON array.`
      : `Generate ${count} educational flashcards about "${topic}".

Create flashcards as a JSON array:
[
  {
    "front": "Question or term",
    "back": "Answer or definition"
  }
]

Cover key concepts, definitions, and important facts. Return ONLY the JSON array.`;

    const aiResponse = await generateAIResponse(prompt);
    
    // Parse AI response
    let flashcards;
    try {
      // Extract JSON from response - handle markdown code blocks
      let jsonStr = aiResponse;
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in AI response');
        throw new Error('No JSON found in AI response');
      }
      
      // Clean up common JSON issues
      let cleanJson = jsonMatch[0]
        .replace(/,\s*,/g, ',')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']');
      
      flashcards = JSON.parse(cleanJson);
    } catch (parseError: any) {
      console.error('Failed to parse AI response:', aiResponse);
      console.error('Parse error:', parseError.message);
      throw new Error('Failed to parse flashcards from AI');
    }

    // Create flashcard set in database
    const flashcardSet = await prisma.flashcardSet.create({
      data: {
        userId: user.id,
        topic,
        description: content ? 'Generated from custom content' : undefined,
        flashcards: {
          create: flashcards.map((card: { front: string; back: string }) => ({
            front: card.front,
            back: card.back,
          })),
        },
      },
      include: {
        flashcards: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({
      set: {
        id: flashcardSet.id,
        topic: flashcardSet.topic,
        flashcards: flashcardSet.flashcards,
        createdAt: flashcardSet.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get flashcard sets
router.get('/sets', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.json({ sets: [] });
    }

    const sets = await prisma.flashcardSet.findMany({
      where: { userId: user.id },
      include: {
        flashcards: {
          select: {
            id: true,
            mastered: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const setsWithStats = sets.map((set: { id: string; topic: string; description: string | null; flashcards: { id: string; mastered: boolean }[]; createdAt: Date }) => ({
      id: set.id,
      topic: set.topic,
      description: set.description,
      totalCards: set.flashcards.length,
      masteredCards: set.flashcards.filter((c: { mastered: boolean }) => c.mastered).length,
      createdAt: set.createdAt,
    }));

    res.json({ sets: setsWithStats });
  } catch (error) {
    next(error);
  }
});

// Get specific flashcard set
router.get('/sets/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const set = await prisma.flashcardSet.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      include: {
        flashcards: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!set) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    res.json({ set });
  } catch (error) {
    next(error);
  }
});

// Update flashcard (mark as mastered)
router.patch('/cards/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { mastered } = updateFlashcardSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify ownership
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id: req.params.id,
        flashcardSet: {
          userId: user.id,
        },
      },
    });

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const updated = await prisma.flashcard.update({
      where: { id: req.params.id },
      data: {
        mastered,
        reviewCount: { increment: 1 },
        lastReviewedAt: new Date(),
      },
    });

    res.json({ flashcard: updated });
  } catch (error) {
    next(error);
  }
});

// Delete flashcard set
router.delete('/sets/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.flashcardSet.deleteMany({
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
