import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly publicUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

  async uploadFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<UploadResult> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.uploadsDir, { recursive: true });

      const key = `${crypto.randomUUID()}${path.extname(originalFilename)}`;
      const filePath = path.join(this.uploadsDir, key);

      await fs.writeFile(filePath, buffer);

      return {
        key,
        url: `${this.publicUrl}/uploads/${key}`,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${originalFilename}`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, key);
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`File with key ${key} not found for deletion, skipping.`);
        return;
      }
      this.logger.error(`Failed to delete file with key ${key}`, error);
      throw error;
    }
  }
}
