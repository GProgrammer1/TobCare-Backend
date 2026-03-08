export interface UploadResult {
    key: string        // storage path/key
    url: string        // accessible URL
    size: number
    mimeType: string
  }
  
  export interface IFileStorageService {
    upload(localPath: string, destKey: string): Promise<UploadResult>
    uploadBuffer(buffer: Buffer, destKey: string, mimeType: string): Promise<UploadResult>
    delete(key: string): Promise<void>
    copy(srcKey: string, destKey: string): Promise<UploadResult>
    getUrl(key: string): string
  }