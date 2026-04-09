import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  constructor() {}

  /**
   * Compress image and convert to base64
   * Reduces file size significantly before storing in MongoDB
   */
  async fileToBase64(file: File, quality: number = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions (max 1200px)
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      };
    }

    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `Image must be smaller than ${maxSizeInMB}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from file
   */
  getFileExtension(file: File): string {
    return file.name.split('.').pop() || 'jpg';
  }
}
