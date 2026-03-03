/// <reference types="../types" />
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { generateAIResponse } from '../lib/ai.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const explainSchema = z.object({
  message: z.string().min(1).max(5000),
  difficulty: z.enum(['simple', 'medium', 'advanced']).default('medium'),
  conversationId: z.string().nullable().optional(),
});

// Create or continue conversation
router.post('/', requireAuth(), async (req, res, next) => {
  try {
    // Check required env vars
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL environment variable is not set. Please configure it in Vercel dashboard.' });
    }
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'GROQ_API_KEY environment variable is not set. Please configure it in Vercel dashboard.' });
    }

    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, difficulty, conversationId } = explainSchema.parse(req.body);

    // Get or create user
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

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
      });
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          difficulty,
          title: message.slice(0, 50),
        },
        include: { messages: true },
      });
    }

    if (!conversation || conversation.userId !== user.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Generate AI response with context
    const systemPrompt = getDifficultySystemPrompt(difficulty);
    const contextMessages = conversation.messages.slice(-5).map((m: { role: string; content: string }) => 
      `${m.role}: ${m.content}`
    ).join('\n');
    
    const prompt = contextMessages 
      ? `${contextMessages}\nuser: ${message}`
      : message;

    const aiResponse = await generateAIResponse(prompt, systemPrompt);

    // Save AI message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    res.json({
      conversationId: conversation.id,
      userMessage: {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation history
router.get('/history', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.json({ conversations: [] });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      difficulty: conv.difficulty,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    next(error);
  }
});

// Get specific conversation
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

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

// Delete conversation
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

    await prisma.conversation.deleteMany({
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

function getDifficultySystemPrompt(difficulty: string): string {
  const prompts = {
    simple: `You are a helpful AI tutor who explains concepts in the simplest way possible. 
Use analogies, examples, and everyday language. Break down complex ideas into small, digestible parts.
Avoid jargon and technical terms unless absolutely necessary. Think ELI5 (Explain Like I'm 5).
Use emojis occasionally to make explanations engaging.`,
    
    medium: `You are a knowledgeable AI tutor providing balanced explanations.
Explain concepts clearly with appropriate examples and context.
Use some technical terms but ensure they're explained.
Provide real-world applications and connections.
Structure your explanations logically with clear sections.`,
    
    advanced: `You are an expert AI tutor providing in-depth technical explanations.
Use precise terminology and discuss nuances, edge cases, and implications.
Reference related concepts and theoretical frameworks.
Provide detailed examples and discuss current research where relevant.
Assume the learner has foundational knowledge in the subject area.`,
  };

  return prompts[difficulty as keyof typeof prompts] || prompts.medium;
}

export default router;
