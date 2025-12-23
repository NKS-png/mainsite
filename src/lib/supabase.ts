import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL present:', !!supabaseUrl);
console.log('Supabase Anon Key present:', !!supabaseAnonKey);

// Client-side Supabase client
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Server-side Supabase client for Astro
export function createSupabaseServerClient(cookies: any) {
  console.log('Creating server client, URL:', !!supabaseUrl, 'Key:', !!supabaseAnonKey);
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars for server client');
    return null;
  }
  try {
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          console.log('Getting cookie:', name);
          return cookies.get(name);
        },
        set(name: string, value: string, options: any) {
          console.log('Setting cookie:', name);
          cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          console.log('Removing cookie:', name);
          cookies.delete(name, options);
        },
      },
    });
    console.log('Server client created successfully');
    return client;
  } catch (error) {
    console.error('Error creating server client:', error);
    return null;
  }
}