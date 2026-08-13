/**
 * @file lib/utils/imageCompression.ts
 * @description Client-side image compression utility using HTML Canvas.
 * Resizes images to max 400x400px (maintains aspect ratio, no upscaling of smaller images),
 * and encodes as JPEG at ~0.8 quality.
 */

export interface CompressionResult {
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Compresses an image file client-side using HTML Canvas.
 *
 * @param file - Selected File object (JPEG, PNG, WEBP).
 * @param maxDimension - Maximum width or height allowed (default 400px).
 * @param quality - JPEG encoding quality (default 0.8).
 * @returns Promise resolving to CompressionResult with Blob, preview URL, and size stats.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 400,
  quality: number = 0.8
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return reject(
        new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
      );
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserved dimensions (do not upscale if smaller than maxDimension)
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Draw onto HTML Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to create canvas rendering context.'));
        }

        // Fill background with white in case of transparent PNG/WebP converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG at specified quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas image compression failed.'));
            }

            const previewUrl = URL.createObjectURL(blob);
            resolve({
              blob,
              previewUrl,
              originalSize,
              compressedSize: blob.size,
              width,
              height,
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image file for compression.'));
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read selected image file.'));
    };

    reader.readAsDataURL(file);
  });
}
