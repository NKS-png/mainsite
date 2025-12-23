import { createSupabaseServerClient } from '../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    console.log('Supabase server client created');
    if (!supabase) {
      console.error('Supabase server client is null - check environment variables');
      return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Check for optional authentication (allow guest orders)
    const authHeader = request.headers.get('authorization');
    let user = null;

    if (authHeader) {
      console.log('Auth header present, attempting to get user');
      // Get user from token if provided
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError) {
        console.error('Auth error:', authError);
      }
      if (!authError && authUser) {
        user = authUser;
        console.log('User authenticated:', user.id);
      }
    }

    // Parse form data
    const formData = await request.formData();
    const serviceId = formData.get('service_id') as string;
    const serviceTitle = formData.get('service_title') as string;
    const servicePrice = parseFloat(formData.get('service_price') as string || '0');
    const description = formData.get('description') as string;
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const customerPhone = formData.get('customerPhone') as string;

    // Validate required fields
    if (!serviceTitle || !description || !customerName || !customerEmail) {
      return new Response(JSON.stringify({ error: 'Service title, description, name, and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Handle file uploads to Supabase Storage
    const uploadedFiles = [];
    const files = formData.getAll('files[]') as File[];

    for (const file of files) {
      if (file.size > 0) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          continue; // Skip large files
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('order-files')
          .upload(`${orderId}/${uniqueFilename}`, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          continue;
        }

        uploadedFiles.push({
          original_name: file.name,
          filename: uniqueFilename,
          path: uploadData.path,
          size: file.size,
          mime_type: file.type
        });
      }
    }

    // Create order in database
    const orderRecord: any = {
      order_id: orderId,
      service_title: serviceTitle,
      service_price: servicePrice,
      description: description,
      total: servicePrice,
      status: 'pending',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null
    };

    // Add user_id only if authenticated
    if (user) {
      orderRecord.user_id = user.id;
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save file references
    if (uploadedFiles.length > 0) {
      const fileRecords = uploadedFiles.map(file => ({
        order_id: orderData.id,
        original_name: file.original_name,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mime_type: file.mime_type
      }));

      const { error: filesError } = await supabase
        .from('order_files')
        .insert(fileRecords);

      if (filesError) {
        console.error('File records error:', filesError);
        // Don't fail the order if file records fail
      }
    }

    // Send confirmation email (placeholder - implement actual email service)
    console.log(`Order confirmation email would be sent to: ${customerEmail} for order ${orderId}`);

    return new Response(JSON.stringify({
      success: true,
      order_id: orderId,
      message: 'Order placed successfully',
      files_uploaded: uploadedFiles.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Order API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};