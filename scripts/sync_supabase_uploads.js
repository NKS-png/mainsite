#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync_supabase_uploads.js [bucket1,bucket2]

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Set them in your shell or in a .env file before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const DEFAULT_BUCKETS = ['animation', 'artwork', 'video_editing'];

async function listAllObjects(bucket) {
  let objects = [];
  let page = 0;
  const pageSize = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list('', { limit: pageSize, offset: page * pageSize, sortBy: { column: 'name', order: 'asc' } });
    if (error) {
      throw error;
    }

    if (!data || data.length === 0) break;

    objects = objects.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  return objects;
}

function filenameFromPath(path) {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
}

async function upsertUploadRow(bucket, obj) {
  const path = obj.name || obj.path || '';
  const filename = filenameFromPath(path) || obj.name;

  // Try to read metadata for size and mime type (best-effort)
  const size = obj.metadata?.size ?? null;
  const mime = obj.metadata?.mimetype ?? obj.metadata?.contentType ?? (filename.includes('.') ? require('mime-types').lookup(filename) || 'application/octet-stream' : 'application/octet-stream');

  // Check if exists
  const { data: existing, error: selErr } = await supabase.from('uploads').select('id').eq('bucket', bucket).eq('path', path).limit(1);
  if (selErr) throw selErr;
  if (existing && existing.length > 0) {
    console.log(`Skipping (exists): ${bucket}/${path}`);
    return;
  }

  const row = {
    bucket,
    path,
    filename,
    mime: mime || 'application/octet-stream',
    size: size ?? 0,
    public: true
  };

  const { data, error } = await supabase.from('uploads').insert(row);
  if (error) {
    console.error(`Failed to insert ${bucket}/${path}:`, error.message || error);
  } else {
    console.log(`Inserted: ${bucket}/${path}`);
  }
}

async function main() {
  const arg = process.argv[2];
  const buckets = arg ? arg.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_BUCKETS;

  for (const bucket of buckets) {
    console.log(`Listing bucket: ${bucket}`);
    try {
      const objects = await listAllObjects(bucket);
      console.log(`Found ${objects.length} objects in ${bucket}`);
      for (const obj of objects) {
        await upsertUploadRow(bucket, obj);
      }
    } catch (err) {
      console.error(`Error processing bucket ${bucket}:`, err.message || err);
    }
  }

  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
