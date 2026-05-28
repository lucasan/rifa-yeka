'use client';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowser = createClient<Database>(url, anon);
