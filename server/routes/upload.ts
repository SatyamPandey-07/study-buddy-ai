/// <reference types="../types" />
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { z } from 'zod';
import { createRequire } from 'module';

// PDF parse function type
type PDFParseResult = { text: string; numpages: number; info: Record<string, unknown> };

// Cache the pdf-parse module
let pdfParseModule: ((dataBuffer: Buffer) => Promise<PDFParseResult>) | null = null;

// Use createRequire for CommonJS module in ESM context
const getPdfParse = async (): Promise<(dataBuffer: Buffer) => Promise<PDFParseResult>> => {
  if (pdfParseModule) return pdfParseModule;
  
  // Create require function for ESM context
  const require = createRequire(import.meta.url);
  const pdfParseLib = require('pdf-parse');
  
  // pdf-parse 2.x exports PDFParse class with VerbosityLevel
  if (pdfParseLib.PDFParse && pdfParseLib.VerbosityLevel) {
    pdfParseModule = async (buffer: Buffer) => {
      const parser = new pdfParseLib.PDFParse({ 
        data: buffer,
        verbosity: pdfParseLib.VerbosityLevel.ERRORS 
      });
      await parser.load();
      const textResult = await parser.getText();
      const info = await parser.getInfo();
      // getText() returns object with text property or string directly
      const text = typeof textResult === 'string' ? textResult : (textResult?.text || '');
      return {
        text,
        numpages: info?.numPages || info?.total || 1,
        info: info || {}
      };
    };
  } else if (typeof pdfParseLib === 'function') {
    // pdf-parse 1.x exports a function directly
    pdfParseModule = pdfParseLib;
  } else if (typeof pdfParseLib.default === 'function') {
    pdfParseModule = pdfParseLib.default;
  } else {
    throw new Error('Could not find pdf-parse function');
  }
  
  return pdfParseModule;
};

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Upload and parse PDF
router.post('/pdf', requireAuth(), upload.single('file'), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse PDF
    const pdfParse = await getPdfParse();
    const data = await pdfParse(req.file.buffer);
    
    const result = {
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    };

    res.json(result);
  } catch (error) {
    console.error('PDF parsing error:', error);
    next(error);
  }
});

// Extract text from multiple pages with page numbers
router.post('/pdf/extract', requireAuth(), upload.single('file'), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfParse = await getPdfParse();
    const data = await pdfParse(req.file.buffer);
    
    // Split text by page breaks (this is approximate)
    const textLines = data.text.split('\n');
    const estimatedLinesPerPage = Math.ceil(textLines.length / data.numpages);
    
    const pages = [];
    for (let i = 0; i < data.numpages; i++) {
      const start = i * estimatedLinesPerPage;
      const end = Math.min((i + 1) * estimatedLinesPerPage, textLines.length);
      const pageText = textLines.slice(start, end).join('\n');
      
      pages.push({
        pageNumber: i + 1,
        text: pageText,
        charCount: pageText.length,
      });
    }

    res.json({
      totalPages: data.numpages,
      totalText: data.text,
      pages,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        title: data.info?.Title || req.file.originalname,
        author: data.info?.Author,
        subject: data.info?.Subject,
      },
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    next(error);
  }
});

// Error handler for multer
router.use((error: Error & { code?: string }, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Max 10MB allowed.' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

export default router;
