import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://ynccytvbcsfutwstwmjr.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OY6FnEF93vIXtvS2dIfHrA_g1LU6Ix_'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)