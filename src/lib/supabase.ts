import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cbmtefnzzgdseagzcfzd.supabase.co';
const supabaseAnonKey = 'sb_publishable_mlLtQ6JfyyylUHRpYmvd-g_mxjDSrwj';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // C'est CA qui rend la session persistante !
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});