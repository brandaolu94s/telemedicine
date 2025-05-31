import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scdraumllgzpdbyvbpei.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZHJhdW1sbGd6cGRieXZicGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2Mjk0MzIsImV4cCI6MjA2NDIwNTQzMn0.E6p47JqrxtywDZlCy3uXvl0QQIY5IcIjAIMUrHyj55I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)