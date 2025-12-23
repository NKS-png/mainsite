import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const projectTitle = formData.get('projectTitle') as string;
    const projectDescription = formData.get('projectDescription') as string;
    const customerName = formData.get('customerName') as string;
    const contactEmail = formData.get('contactEmail') as string;
    const service = formData.get('service') as string;
    const files = formData.getAll('projectFiles') as File[];

    // Validate required fields
    if (!projectTitle || !projectDescription || !customerName || !contactEmail) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Generate order ID for requirements
    const orderId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Handle file uploads to Supabase Storage
    const uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size > 0 && file.size <= 10 * 1024 * 1024) { // 10MB limit
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
    }

    // Create order record for admin review
    const orderRecord = {
      order_id: orderId,
      service_title: projectTitle,
      service_name: service || 'Custom Project',
      description: projectDescription,
      customer_name: customerName,
      customer_email: contactEmail,
      status: 'pending_approval',
      total: 0 // Will be set by admin later
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to submit requirements' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save file references if any files were uploaded
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
        // Don't fail the submission if file records fail
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Requirements submitted successfully! Our team will review your project and get back to you soon.',
      files_uploaded: uploadedFiles.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Project requirements submission error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to submit requirements. Please try again or contact us directly.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};