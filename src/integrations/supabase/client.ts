import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xaqnwuhtoeyqnkgmwkaq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcW53dWh0b2V5cW5rZ213a2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzOTYzNDYsImV4cCI6MjA1MTk3MjM0Nn0.EpE2LaOnh59OMmuqRDDO0rrwV9PRMzXRS2MqaIrK6vA";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    },
  }
);