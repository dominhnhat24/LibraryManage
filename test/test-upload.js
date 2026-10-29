import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// External storage smoke tests are opt-in. Unit test discovery must never upload
// placeholder bytes or contact a configured storage account implicitly.
const enabled = process.env.RUN_S3_UPLOAD_SMOKE === 'true';

test('S3 upload smoke test uses a real PDF only when explicitly enabled', { skip: !enabled }, async () => {
  const pdfPath = process.env.S3_SMOKE_PDF_PATH;
  assert.ok(pdfPath, 'Set S3_SMOKE_PDF_PATH to a real PDF to run this external smoke test');
  const fileBuffer = await readFile(pdfPath);
  assert.ok(fileBuffer.subarray(0, 5).equals(Buffer.from('%PDF-')), 'S3 smoke input must be an actual PDF');

  const required = ['SUPABASE_S3_ENDPOINT', 'SUPABASE_ACCESS_KEY_ID', 'SUPABASE_SECRET_ACCESS_KEY'];
  for (const name of required) assert.ok(process.env[name], `${name} is required for S3 smoke testing`);

  const client = new S3Client({
    region: process.env.SUPABASE_REGION || 'ap-south-1',
    endpoint: process.env.SUPABASE_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID,
      secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
  });
  const key = `smoke-tests/${randomUUID()}.pdf`;
  await client.send(new PutObjectCommand({
    Bucket: process.env.SUPABASE_BUCKET_NAME || 'books-storage',
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/pdf'
  }));
  client.destroy();
});
