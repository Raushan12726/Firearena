import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bxsspopywjoumugfxnpd.supabase.co'
const supabaseAnonKey = 'sb_publishable_94nzQiUrU141SCvMs9EYog_CNQwDEoE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)