import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

// Create service role client for admin operations
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE;

console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('Service Role Key:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Upload functionality will not work.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// GET /api/uploads - List all uploaded files
export const GET: APIRoute = async () => {
  try {
    const { data: uploads, error } = await supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch uploads' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(uploads || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/uploads - Upload files to Supabase storage
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const bucket = formData.get('bucket') as string;
    const files = formData.getAll('files') as File[];

    if (!bucket || !files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'Bucket and files are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate bucket
    const validBuckets = ['animation', 'artwork', 'video_editing'];
    if (!validBuckets.includes(bucket)) {
      return new Response(JSON.stringify({ error: 'Invalid bucket' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file sizes (50MB limit for Supabase free tier)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({
          error: `File "${file.name}" is too large. Maximum file size is 50MB.`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const filename = `${timestamp}_${randomId}.${fileExtension}`;

        // Check if bucket exists, if not create it
        console.log(`Checking bucket ${bucket}...`);
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === bucket);

        if (!bucketExists) {
          console.log(`Creating bucket ${bucket}...`);
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true,
            allowedMimeTypes: ['image/*', 'video/*'],
            fileSizeLimit: 52428800 // 50MB
          });

          if (createError) {
            console.error('Bucket creation error:', createError);
            continue;
          }
        }

        // Upload to Supabase storage
        console.log(`Uploading file ${file.name} to bucket ${bucket}...`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          console.error('Upload error details:', {
            bucket,
            filename,
            fileSize: file.size,
            fileType: file.type,
            serviceKey: supabaseServiceKey ? 'Present' : 'Missing'
          });
          continue; // Skip this file but continue with others
        }

        console.log('Upload successful:', uploadData);

        // Insert record into uploads table
        console.log('Inserting into database...');
        const { data: dbData, error: dbError } = await supabase
          .from('uploads')
          .insert({
            bucket: bucket,
            path: filename,
            filename: file.name,
            mime: file.type || 'application/octet-stream',
            size: file.size,
            public: true
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          console.error('Database error details:', {
            bucket,
            filename,
            mime: file.type,
            size: file.size
          });
          // Try to delete the uploaded file since DB insert failed
          try {
            await supabase.storage.from(bucket).remove([filename]);
            console.log('Cleaned up uploaded file due to DB error');
          } catch (cleanupError) {
            console.error('Failed to cleanup uploaded file:', cleanupError);
          }
          continue;
        }

        console.log('Database insert successful:', dbData);

        uploadedFiles.push(dbData);
      } catch (fileError) {
        console.error('File processing error:', fileError);
        continue;
      }
    }

    if (uploadedFiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No files were uploaded successfully' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
