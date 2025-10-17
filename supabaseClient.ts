import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyfrxoujvihmohtibyrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZnJ4b3VqdmlobW9odGlieXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDg2ODcsImV4cCI6MjA3NjI4NDY4N30.1Ye8s9w7-REPeajn3alMXJPgSK3EHYqlYsi_so5KzNE';

export const supabase = createClient(supabaseUrl, supabaseKey);