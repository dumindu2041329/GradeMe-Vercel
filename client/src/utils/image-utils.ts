/**
 * Image utility functions for profile picture processing
 */

export interface ImageResizeOptions {
  width: number;
  height: number;
  quality?: number;
  cropToCircle?: boolean;
}

/**
 * Resizes and crops an image file to specified dimensions
 * Optimized for circular profile pictures
 */
export function resizeImageForProfile(
  file: File,
  options: ImageResizeOptions = { width: 200, height: 200, quality: 0.8, cropToCircle: true }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      const { width, height, quality = 0.8, cropToCircle = true } = options;
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Calculate crop dimensions for square aspect ratio
      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;

      if (cropToCircle) {
        // Create circular clipping path
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      // Draw the image (cropped to square, then scaled to fit canvas)
      ctx.drawImage(
        img,
        offsetX, offsetY, size, size, // Source rectangle (square crop)
        0, 0, width, height // Destination rectangle
      );

      if (cropToCircle) {
        ctx.restore();
      }

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        'image/jpeg',
        quality
      );
      
      // Clean up object URL
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    // Create object URL and load image
    const url = URL.createObjectURL(file);
    img.src = url;
  });
}

/**
 * Converts a blob to base64 data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Validates image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image must be smaller than 5MB'
    };
  }

  return { valid: true };
}