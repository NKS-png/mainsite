import { createSignal, onMount, onCleanup } from 'solid-js';
import { createClient } from '@supabase/supabase-js';

interface Upload {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  mime: string;
}

interface PortfolioGalleryProps {
  bucket: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PortfolioGallery(props: PortfolioGalleryProps) {
  const [uploads, setUploads] = createSignal<Upload[]>([]);

  // Function to fetch all uploads from a specific bucket
  const listFiles = async (bucket: string) => {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('bucket', bucket)
      .eq('public', true);

    if (error) {
      console.error('Error fetching uploads:', error);
      return [];
    }
    console.log('Fetched uploads for', bucket, data);
    return data || [];
  };

  // Function to get public URL for a file
  const getPublicUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  // Function to add a new upload to the list
  const addUpload = (newUpload: Upload) => {
    setUploads(prev => [...prev, newUpload]);
  };

  onMount(async () => {
    // Load initial uploads on page load
    const initialUploads = await listFiles(props.bucket);
    setUploads(initialUploads);

    // Subscribe to realtime changes on the uploads table
    const channel = supabase
      .channel('public:uploads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'uploads',
          filter: `bucket=eq.${props.bucket}`,
        },
        (payload) => {
          console.log('Realtime: New upload detected:', payload.new);
          // Add the new upload to the list instantly
          addUpload(payload.new as Upload);
        }
      )
      .subscribe();

    // Cleanup on component unmount
    onCleanup(() => {
      supabase.removeChannel(channel);
    });
  });

  return (
    <div id="gallery" class="gallery">
      {uploads().map((upload) => (
        <div class="item">
          {upload.mime.startsWith('video/') ? (
            <video controls preload="metadata" onerror={() => console.log('Video failed to load:', upload.filename)}>
              <source src={getPublicUrl(upload.bucket, upload.path)} type={upload.mime} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img src={getPublicUrl(upload.bucket, upload.path)} alt={upload.filename} onerror={() => console.log('Image failed to load:', upload.filename)} />
          )}
          <p>{upload.filename}</p>
        </div>
      ))}
    </div>
  );
}