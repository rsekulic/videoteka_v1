
import { createClient } from '@supabase/supabase-js';

// Using the credentials provided by the user
const supabaseUrl = 'https://kugrqowawsdcblpmoofg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z3Jxb3dhd3NkY2JscG1vb2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NjAzMDAsImV4cCI6MjA4MjQzNjMwMH0.tGMwW1VJC7XRA1KawnqDP_p9rHaVKitGbbxJzY_3bRs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
