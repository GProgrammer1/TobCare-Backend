import { mkdir, copyFile, unlink, stat, writeFile } from "node:fs/promises"
import { join, dirname } from "node:path"
import { inject, singleton } from "tsyringe"
import type { IFileStorageService, UploadResult } from "./file-storage.service"
import { logger } from "common/lib/logger"

export const FILE_STORAGE_BASE_PATH = "FileStorageBasePath"
export const FILE_STORAGE_URL_BASE = "FileStorageUrlBase"

@singleton()
export class LocalFileStorageService implements IFileStorageService {
  private readonly basePath: string
  private readonly urlBase: string

  constructor(
    @inject(FILE_STORAGE_BASE_PATH) basePath: string,
    @inject(FILE_STORAGE_URL_BASE) urlBase: string,
  ) {
    this.basePath = join(process.cwd(), basePath)
    this.urlBase = urlBase.replace(/\/+$/, "") // trim trailing slash
  }

  private resolveKey(key: string): string {
    return join(this.basePath, key)
  }

  async upload(localPath: string, destKey: string): Promise<UploadResult> {
    const destPath = this.resolveKey(destKey)
    await mkdir(dirname(destPath), { recursive: true })
    await copyFile(localPath, destPath)
    const stats = await stat(destPath)
    const mimeType = this.getMimeType(destKey)
    logger.debug({ key: destKey, size: stats.size }, "File uploaded")
    return {
      key: destKey,
      url: this.getUrl(destKey),
      size: stats.size,
      mimeType,
    }
  }

  async uploadBuffer(buffer: Buffer, destKey: string, mimeType: string): Promise<UploadResult> {
    const destPath = this.resolveKey(destKey)
    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, buffer)
    logger.debug({ key: destKey, size: buffer.length }, "File uploaded")
    return {
      key: destKey,
      url: this.getUrl(destKey),
      size: buffer.length,
      mimeType,
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveKey(key)
    await unlink(filePath)
  }

  async copy(srcKey: string, destKey: string): Promise<UploadResult> {
    const srcPath = this.resolveKey(srcKey)
    const destPath = this.resolveKey(destKey)
    await mkdir(dirname(destPath), { recursive: true })
    await copyFile(srcPath, destPath)
    const stats = await stat(destPath)
    const mimeType = this.getMimeType(destKey)
    return {
      key: destKey,
      url: this.getUrl(destKey),
      size: stats.size,
      mimeType,
    }
  }

  getUrl(key: string): string {
    return `${this.urlBase}/${key.replace(/\\/g, "/")}`
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
