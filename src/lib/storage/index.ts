// Storage abstraction. Two backends:
//   - "local" : ./storage-local (dev only)
//   - "s3"    : Hetzner Storage Box / any S3-compatible endpoint
//
// Three buckets: drawings (floor plans), photos (snag evidence + closure),
// audio (voice notes). All callers go through `getStorage()`.

import { env } from "@/lib/env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";

export type BucketName = "drawings" | "photos" | "audio";

export interface StorageService {
  put(opts: PutOptions): Promise<PutResult>;
  get(key: string, bucket: BucketName): Promise<Buffer>;
  signedUrl(key: string, bucket: BucketName, expiresSeconds?: number): Promise<string>;
  delete(key: string, bucket: BucketName): Promise<void>;
}

export interface PutOptions {
  bucket: BucketName;
  key: string;
  body: Buffer;
  contentType: string;
}

export interface PutResult {
  key: string;
  bucket: BucketName;
  size: number;
}

let _storage: StorageService | null = null;

export function getStorage(): StorageService {
  if (_storage) return _storage;
  const provider = env.storage.provider();
  if (provider === "s3") {
    _storage = new S3Storage();
  } else {
    _storage = new LocalStorage();
  }
  return _storage;
}

// Standard key helpers — keep paths predictable and tenant-scoped.

export function drawingKey(opts: {
  tenantId: string;
  projectId: string;
  drawingId: string;
  fileName: string;
}) {
  return `${opts.tenantId}/${opts.projectId}/${opts.drawingId}/${opts.fileName}`;
}

export function photoKey(opts: {
  tenantId: string;
  projectId: string;
  snagId: string;
  fileName: string;
}) {
  return `${opts.tenantId}/${opts.projectId}/${opts.snagId}/${opts.fileName}`;
}

export function audioKey(opts: {
  tenantId: string;
  projectId: string;
  snagId: string;
  fileName: string;
}) {
  return `${opts.tenantId}/${opts.projectId}/${opts.snagId}/${opts.fileName}`;
}

export function bucketSlug(bucket: BucketName): string {
  return bucket; // already a clean slug
}
