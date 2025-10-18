import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://naqpwzcyopcsyqeauuev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcXB3emN5b3Bjc3lxZWF1dWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDcwNjEsImV4cCI6MjA3NjMyMzA2MX0.lbab7CLkC8xGh4lfs8Jhf8-OR2Av5c2ihDJIPKPOy_c';

export const supabase = createClient(supabaseUrl, supabaseKey);