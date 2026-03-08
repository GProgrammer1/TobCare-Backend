import { readFile, stat } from "node:fs/promises"
import { inject, singleton } from "tsyringe"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import type { IFileStorageService, UploadResult } from "./file-storage.service"
import { logger } from "common/lib/logger"

export const S3_BUCKET = "S3Bucket"
export const S3_REGION = "S3Region"
export const S3_URL_BASE = "S3UrlBase"

@singleton()
export class S3FileStorageService implements IFileStorageService {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly urlBase: string

  constructor(
    @inject(S3_BUCKET) bucket: string,
    @inject(S3_REGION) region: string,
    @inject(S3_URL_BASE) urlBase: string,
  ) {
    this.client = new S3Client({ region })
    this.bucket = bucket
    this.urlBase = urlBase.replace(/\/+$/, "")
  }

  async upload(localPath: string, destKey: string): Promise<UploadResult> {
    const body = await readFile(localPath)
    const mimeType = this.getMimeType(destKey)
    const normalizedKey = destKey.replace(/\\/g, "/")

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        Body: body,
        ContentType: mimeType,
      }),
    )

    logger.debug({ key: normalizedKey, size: body.length }, "File uploaded")
    return {
      key: normalizedKey,
      url: this.getUrl(normalizedKey),
      size: body.length,
      mimeType,
    }
  }

  async uploadBuffer(buffer: Buffer, destKey: string, mimeType: string): Promise<UploadResult> {
    const normalizedKey = destKey.replace(/\\/g, "/")

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        Body: buffer,
        ContentType: mimeType,
      }),
    )

    logger.debug({ key: normalizedKey, size: buffer.length }, "File uploaded")
    return {
      key: normalizedKey,
      url: this.getUrl(normalizedKey),
      size: buffer.length,
      mimeType,
    }
  }

  async delete(key: string): Promise<void> {
    const normalizedKey = key.replace(/\\/g, "/")
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
      }),
    )
  }

  async copy(srcKey: string, destKey: string): Promise<UploadResult> {
    const normalizedSrc = srcKey.replace(/\\/g, "/")
    const normalizedDest = destKey.replace(/\\/g, "/")

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${normalizedSrc}`,
        Key: normalizedDest,
      }),
    )

    const head = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: normalizedDest,
      }),
    )

    const mimeType = (head.ContentType as string) ?? this.getMimeType(destKey)

    return {
      key: normalizedDest,
      url: this.getUrl(normalizedDest),
      size: head.ContentLength ?? 0,
      mimeType,
    }
  }

  getUrl(key: string): string {
    const normalizedKey = key.replace(/\\/g, "/")
    return `${this.urlBase}/${normalizedKey}`
  }

  private getMimeType(key: string): string {
    const ext = key.split(".").pop()?.toLowerCase()
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    }
    return mimeMap[ext ?? ""] ?? "application/octet-stream"
  }
}
