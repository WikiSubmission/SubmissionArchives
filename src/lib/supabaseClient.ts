
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxirypbshphzbdvzrqid.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aXJ5cGJzaHBoemJkdnpycWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODIzNTEsImV4cCI6MjA4MTI1ODM1MX0.LUY7ja4LERG6wqPPMURrXWuyB0u4f2pRMTnU07hn8WM'

export const supabase = createClient(supabaseUrl, supabaseKey)
