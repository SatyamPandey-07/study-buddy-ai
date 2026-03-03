import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import multer from 'multer';

const db = prisma as any;

const router = Router();

// Configure multer for resource file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for resources
  },
});

const resourceSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(['pdf', 'arxiv', 'article', 'ebook', 'video', 'other']),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  metadata: z.any().optional(),
  linkedTo: z.string().optional(),
});

// Create a new resource
router.post('/', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const data = resourceSchema.parse(req.body);

    // If arxiv URL, fetch metadata
    let metadata = data.metadata;
    if (data.type === 'arxiv' && data.url) {
      metadata = await fetchArxivMetadata(data.url);
    }

    const resource = await db.resource.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        type: data.type,
        url: data.url,
        tags: data.tags || [],
        category: data.category,
        metadata: metadata || undefined,
        linkedTo: data.linkedTo,
      },
    });

    res.json({ resource });
  } catch (error) {
    next(error);
  }
});

// Upload a resource file (PDF, ebook, etc.)
router.post('/upload', requireAuth(), upload.single('file'), async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, type, category, tags } = req.body;

    // In production, you'd upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll store the file info
    const resource = await db.resource.create({
      data: {
        userId,
        title: title || req.file.originalname,
        description,
        type: type || 'pdf',
        filePath: req.file.originalname, // Would be cloud URL in production
        fileSize: req.file.size,
        category,
        tags: tags ? JSON.parse(tags) : [],
      },
    });

    res.json({ resource, fileData: req.file.buffer.toString('base64') });
  } catch (error) {
    next(error);
  }
});

// Get all resources
router.get('/', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { type, category, search } = req.query;

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const resources = await db.resource.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ resources });
  } catch (error) {
    next(error);
  }
});

// Get a single resource
router.get('/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const resource = await db.resource.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ resource });
  } catch (error) {
    next(error);
  }
});

// Update a resource
router.patch('/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const resource = await db.resource.findFirst({
      where: { id, userId },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updateData: any = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.tags) updateData.tags = req.body.tags;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.favorite !== undefined) updateData.favorite = req.body.favorite;

    const updated = await db.resource.update({
      where: { id },
      data: updateData,
    });

    res.json({ resource: updated });
  } catch (error) {
    next(error);
  }
});

// Delete a resource
router.delete('/:id', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const resource = await db.resource.findFirst({
      where: { id, userId },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await db.resource.delete({
      where: { id },
    });

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get resource statistics
router.get('/stats/overview', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const [total, byType, byCategory, favorites] = await Promise.all([
      db.resource.count({ where: { userId } }),
      db.resource.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
      db.resource.groupBy({
        by: ['category'],
        where: { userId, category: { not: null } },
        _count: true,
      }),
      db.resource.count({ where: { userId, favorite: true } }),
    ]);

    const typeBreakdown = byType.reduce((acc: any, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {});

    const categoryBreakdown = byCategory.reduce((acc: any, item) => {
      if (item.category) {
        acc[item.category] = item._count;
      }
      return acc;
    }, {});

    res.json({
      total,
      favorites,
      typeBreakdown,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to fetch arXiv metadata
async function fetchArxivMetadata(url: string): Promise<any> {
  try {
    // Extract arXiv ID from URL
    const arxivIdMatch = url.match(/(\d+\.\d+)/);
    if (!arxivIdMatch) {
      return null;
    }

    const arxivId = arxivIdMatch[1];
    const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;

    const response = await fetch(apiUrl);
    const xml = await response.text();

    // Basic XML parsing (in production, use a proper XML parser)
    const titleMatch = xml.match(/<title>(.*?)<\/title>/s);
    const summaryMatch = xml.match(/<summary>(.*?)<\/summary>/s);
    const authorsMatch = xml.match(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/gs);

    const authors = authorsMatch?.map((match) => {
      const nameMatch = match.match(/<name>(.*?)<\/name>/);
      return nameMatch ? nameMatch[1].trim() : '';
    });

    return {
      arxivId,
      title: titleMatch?.[1]?.trim(),
      abstract: summaryMatch?.[1]?.trim(),
      authors: authors || [],
    };
  } catch (error) {
    console.error('Error fetching arXiv metadata:', error);
    return null;
  }
}

export default router;
