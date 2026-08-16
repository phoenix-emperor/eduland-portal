/**
 * @file lib/utils/exportPdf.ts
 * @description Reusable client-side PDF export utility function.
 * Uses html-to-image (native browser foreignObject SVG rendering) to capture target HTML containers
 * and jsPDF to compile high-DPI A4 PDF documents.
 * Native SVG rendering guarantees 100% compatibility with Tailwind CSS v4 modern lab()/oklab() color functions.
 * Includes base64 image preloading to guarantee CORS compatibility with signed Supabase Storage URLs.
 */

import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

export interface PdfExportOptions {
  /** ID of the HTML element container to capture */
  elementId: string;
  /** Desired output filename (without extension, will be sanitized) */
  filename: string;
}

/**
 * Helper to convert an image URL (including cross-origin signed Supabase URLs) to base64 Data URL.
 */
async function toBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to pre-convert image URL to base64, falling back to direct URL:', err);
    return url;
  }
}

/**
 * Captures an HTML element container by ID and exports it as a clean A4 PDF file.
 * Uses html-to-image for native browser rendering (bypassing outdated CSS color parsers)
 * and jsPDF to construct multi-page A4 documents.
 *
 * @param options - Object containing target elementId and output filename.
 */
export async function exportReportAsPdf({
  elementId,
  filename,
}: PdfExportOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Report container #${elementId} not found.`);
  }

  // Pre-load img elements to base64 data URLs to prevent CORS image rendering issues
  const imgElements = Array.from(element.querySelectorAll('img'));
  const originalSrcs: { img: HTMLImageElement; originalSrc: string }[] = [];

  for (const img of imgElements) {
    if (img.src && !img.src.startsWith('data:')) {
      originalSrcs.push({ img, originalSrc: img.src });
      try {
        const b64 = await toBase64(img.src);
        img.src = b64;
      } catch (e) {
        console.warn('Could not convert image src to base64:', img.src);
      }
    }
  }

  try {
    // Render HTML container using html-to-image (native browser foreignObject rendering)
    // This natively supports Tailwind v4 lab()/oklab() color functions without CSS parsing errors.
    const imgData = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#FFFFFF',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4

    const elementWidth = element.offsetWidth || 800;
    const elementHeight = element.offsetHeight || 1000;

    const imgWidth = pdfWidth;
    const imgHeight = (elementHeight * pdfWidth) / elementWidth;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Sanitize filename for filesystem safety
    const safeFilename = filename
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .concat('.pdf');

    pdf.save(safeFilename);
  } finally {
    // Restore original img src attributes
    originalSrcs.forEach(({ img, originalSrc }) => {
      img.src = originalSrc;
    });
  }
}
