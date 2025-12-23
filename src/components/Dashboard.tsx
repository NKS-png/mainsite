import { createSignal, onMount } from 'solid-js';
import { supabase } from '../lib/supabase';

interface Upload {
  id: string;
  bucket: string;
  path: string;
  filename: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function Dashboard() {
  const [uploads, setUploads] = createSignal<Upload[]>([]);
  const [products, setProducts] = createSignal<Product[]>([]);
  const [selectedBucket, setSelectedBucket] = createSignal('animation');

  onMount(async () => {
    loadUploads();
    loadProducts();
  });

  const loadUploads = async () => {
    const { data } = await supabase.from('uploads').select('*');
    setUploads(data || []);
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
  };

  const handleUpload = async (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Not logged in');

    const { data, error } = await supabase.storage
      .from(selectedBucket())
      .upload(`${Date.now()}-${file.name}`, file);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from('uploads').insert({
      user_id: user.id,
      bucket: selectedBucket(),
      path: data.path,
      filename: file.name,
      mime: file.type,
      size: file.size,
    });

    loadUploads();
  };

  const handleDelete = async (id: string, path: string, bucket: string) => {
    await supabase.storage.from(bucket).remove([path]);
    await supabase.from('uploads').delete().eq('id', id);
    loadUploads();
  };

  const handleProductSubmit = async (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const price = parseFloat((form.elements.namedItem('price') as HTMLInputElement).value);
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value;

    await supabase.from('products').insert({ name, price, description, category });
    loadProducts();
    form.reset();
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <section>
        <h3>Upload Files</h3>
        <form onSubmit={handleUpload}>
          <select value={selectedBucket()} onChange={(e) => setSelectedBucket(e.target.value)}>
            <option value="animation">Animation</option>
            <option value="artwork">Artwork</option>
            <option value="video_editing">Video Editing</option>
          </select>
          <input type="file" name="file" required />
          <button type="submit">Upload</button>
        </form>
      </section>
      <section>
        <h3>Uploaded Files</h3>
        <ul>
          {uploads().map((upload: any) => (
            <li>
              {upload.filename} ({upload.bucket})
              <button onClick={() => handleDelete(upload.id, upload.path, upload.bucket)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Manage Products</h3>
        <form onSubmit={handleProductSubmit}>
          <input name="name" placeholder="Name" required />
          <input name="price" type="number" step="0.01" placeholder="Price" required />
          <textarea name="description" placeholder="Description" required></textarea>
          <select name="category">
            <option value="animation">Animation</option>
            <option value="artwork">Artwork</option>
            <option value="video_editing">Video Editing</option>
          </select>
          <button type="submit">Add Product</button>
        </form>
        <ul>
          {products().map((product: any) => (
            <li>{product.name} - ${product.price}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}