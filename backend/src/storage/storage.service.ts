import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Two-mode storage service:
 *   - R2 / S3 mode  → when R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY
 *                     + R2_BUCKET + R2_PUBLIC_URL are all set (typical production)
 *   - Local mode    → otherwise, writes to ./uploads/ (development fallback)
 *
 * R2 is S3-compatible, so we use the @aws-sdk/client-s3 wrapper with a custom
 * endpoint. Cloudflare R2 has no egress fees and a 10GB free tier — ideal for
 * a thesis project. Local mode keeps dev frictionless: no signup needed.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly publicUrl =
    process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

  // R2 / S3 lazy-init — only loaded if env vars present
  private r2Client: any = null;
  private readonly r2Config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.R2_PUBLIC_URL,
  };

  private get useR2(): boolean {
    return Boolean(
      this.r2Config.accountId &&
        this.r2Config.accessKeyId &&
        this.r2Config.secretAccessKey &&
        this.r2Config.bucket &&
        this.r2Config.publicUrl,
    );
  }

  private async getR2Client() {
    if (this.r2Client) return this.r2Client;
    // Dynamic import so the dep isn't required when running in local mode
    const { S3Client } = await import('@aws-sdk/client-s3');
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.r2Config.accessKeyId!,
        secretAccessKey: this.r2Config.secretAccessKey!,
      },
    });
    return this.r2Client;
  }

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const key = `${crypto.randomUUID()}${path.extname(originalFilename)}`;

    if (this.useR2) {
      try {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const client = await this.getR2Client();
        await client.send(
          new PutObjectCommand({
            Bucket: this.r2Config.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          }),
        );
        return {
          key,
          url: `${this.r2Config.publicUrl}/${key}`,
        };
      } catch (error) {
        this.logger.error(`R2 upload failed for ${originalFilename}`, error);
        throw error;
      }
    }

    // Local fallback
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      const filePath = path.join(this.uploadsDir, key);
      await fs.writeFile(filePath, buffer);
      return {
        key,
        url: `${this.publicUrl}/uploads/${key}`,
      };
    } catch (error) {
      this.logger.error(`Local upload failed for ${originalFilename}`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useR2) {
      try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const client = await this.getR2Client();
        await client.send(
          new DeleteObjectCommand({
            Bucket: this.r2Config.bucket,
            Key: key,
          }),
        );
        return;
      } catch (error) {
        this.logger.error(`R2 delete failed for key ${key}`, error);
        throw error;
      }
    }

    // Local fallback
    try {
      const filePath = path.join(this.uploadsDir, key);
      await fs.unlink(filePath);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'ENOENT'
      ) {
        this.logger.warn(
          `File with key ${key} not found for deletion, skipping.`,
        );
        return;
      }
      this.logger.error(`Failed to delete file with key ${key}`, error);
      throw error;
    }
  }
}
