import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ynccytvbcsfutwstwmjr.supabase.co'
const supabaseAnonKey = 'sb_publishable_OY6FnEF93vIXtvS2dIfHrA_g1LU6Ix_'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)