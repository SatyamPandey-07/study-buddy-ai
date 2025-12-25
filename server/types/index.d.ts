import { Request } from 'express';

declare module 'express' {
  export interface Request {
    auth: {
      userId: string;
      sessionClaims?: {
        email?: string;
        name?: string;
        [key: string]: unknown;
      };
    };
  }
}

declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    [key: string]: unknown;
  }

  interface PDFMetadata {
    [key: string]: unknown;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata | null;
    text: string;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: unknown): Promise<PDFData>;
  
  export = pdfParse;
}
