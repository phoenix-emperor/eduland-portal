/**
 * @file lib/utils/exportPdf.ts
 * @description Reusable client-side PDF export utility function.
 * Uses html2canvas to capture a target HTML container and jsPDF to compile a high-DPI A4 PDF document.
 * Includes base64 image preloading to guarantee CORS compatibility with signed Supabase Storage URLs.
 */

import html2canvas from 'html2canvas';
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
 * Handles high-DPI scaling, CORS signed passport URLs, multi-page layout, and filesystem filename sanitization.
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

  // Pre-load img elements to base64 data URLs to prevent canvas tainting on cross-origin image URLs
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
    // Generate high-DPI canvas with lab/oklab color sanitizer in onclone
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for crisp high-DPI rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      onclone: (clonedDoc) => {
        // Sanitize any computed lab() or oklab() color values in cloned DOM nodes to prevent html2canvas color parser warnings
        const allNodes = clonedDoc.querySelectorAll('*');
        allNodes.forEach((node) => {
          const el = node as HTMLElement;
          if (!el.style) return;
          const cssText = el.style.cssText;
          if (cssText && (cssText.includes('lab(') || cssText.includes('oklab(') || cssText.includes('lch('))) {
            // Strip out modern lab/oklab declarations to let browser fall back to standard RGB values
            el.style.cssText = cssText
              .replace(/(?:color|background-color|border-color):\s*(?:ok)?lab\([^)]+\);?/gi, '')
              .replace(/(?:color|background-color|border-color):\s*lch\([^)]+\);?/gi, '');
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

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
      .replace(/[/\\?%*:|"<>]/g, '-') // Replace unsafe path characters with dashes
      .replace(/\s+/g, ' ') // Collapse multiple spaces
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
