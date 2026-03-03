/// <reference types="../types" />
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { generateAIResponse } from '../lib/ai.js';
import { z } from 'zod';

const router = Router();

const quizSchema = z.object({
  topic: z.string().min(1).max(500),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionCount: z.number().min(3).max(20).default(5),
});

const submitAnswersSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.string()),
});

// Generate quiz
router.post('/generate', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topic, difficulty, questionCount } = quizSchema.parse(req.body);

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

    // Generate questions using AI
    const prompt = `Generate ${questionCount} Multiple Choice Questions (MCQ) about "${topic}" at ${difficulty} difficulty level.

IMPORTANT: Return ONLY Multiple Choice Questions (MCQ). Each question must have exactly 4 options.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "type": "mcq",
    "question": "Question text here?",
    "options": ["First option", "Second option", "Third option", "Fourth option"],
    "correctAnswer": "First option",
    "explanation": "Brief explanation why this is correct"
  }
]

CRITICAL RULES:
- Return ONLY MCQ type questions
- correctAnswer MUST be the EXACT TEXT of one of the options, NOT a letter like "A" or "B"
- Always provide exactly 4 options
- Return ONLY valid JSON, no markdown, no extra text
- ${difficulty} difficulty for ${topic}`;

    const aiResponse = await generateAIResponse(prompt);

    // Parse AI response
    let questions;
    try {
      // Extract JSON from response - handle markdown code blocks
      let jsonStr = aiResponse;

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      // Extract JSON array
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      // Clean up common JSON issues
      let cleanJson = jsonMatch[0]
        .replace(/,\s*,/g, ',')  // Remove double commas
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/,\s*\]/g, ']'); // Remove trailing commas in arrays

      questions = JSON.parse(cleanJson);

      // Validate and fix correctAnswer for MCQ questions
      questions = questions.map((q: any) => {
        if (q.type === 'mcq' && q.options && q.options.length > 0) {
          // If correctAnswer is a letter like "A", "B", "C", "D", convert to actual text
          const letterMatch = q.correctAnswer.match(/^([A-D])\.?$/i);
          if (letterMatch) {
            const index = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
            if (index >= 0 && index < q.options.length) {
              q.correctAnswer = q.options[index];
            }
          }
        }
        return q;
      });

    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse quiz questions from AI');
    }

    // Create quiz in database
    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        topic,
        difficulty,
        totalQuestions: questions.length,
        questions: {
          create: questions.map((q: { type: string; question: string; options?: string[]; correctAnswer: string; explanation: string }) => ({
            type: q.type,
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        },
      },
      include: {
        questions: {
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            correctAnswer: true,
            explanation: true,
          },
        },
      },
    });

    res.json({
      quiz: {
        id: quiz.id,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        totalQuestions: quiz.totalQuestions,
        questions: quiz.questions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Submit quiz answers
router.post('/submit', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { quizId, answers } = submitAnswersSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: user.id,
      },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.completed) {
      return res.status(400).json({ error: 'Quiz already submitted' });
    }

    // Grade answers
    let correctCount = 0;
    const gradedQuestions = await Promise.all(
      quiz.questions.map(async (question: { id: string; question: string; correctAnswer: string; explanation: string }) => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer?.toLowerCase().trim() ===
          question.correctAnswer.toLowerCase().trim();

        if (isCorrect) correctCount++;

        await prisma.question.update({
          where: { id: question.id },
          data: {
            userAnswer,
            isCorrect,
          },
        });

        return {
          id: question.id,
          question: question.question,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
        };
      })
    );

    // Update quiz with score
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        score: correctCount,
        completed: true,
      },
    });

    res.json({
      quizId,
      score: correctCount,
      totalQuestions: quiz.questions.length,
      percentage: Math.round((correctCount / quiz.questions.length) * 100),
      questions: gradedQuestions,
    });
  } catch (error) {
    next(error);
  }
});

// Get quiz history
router.get('/history', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return res.json({ quizzes: [] });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        topic: true,
        difficulty: true,
        score: true,
        totalQuestions: true,
        completed: true,
        createdAt: true,
      },
    });

    res.json({ quizzes });
  } catch (error) {
    next(error);
  }
});

// Get specific quiz with results
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

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ quiz });
  } catch (error) {
    next(error);
  }
});

// Delete quiz
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

    await prisma.quiz.deleteMany({
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
