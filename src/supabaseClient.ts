import { createClient } from '@supabase/supabase-js';

// Prioritize dynamic environment variables configured in AI Studio Build "Secrets/Environment" settings,
// and fallback gracefully to hardcoded developer values.
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "https://egfqkzytnaschaduzrsd.supabase.co";
const SUPABASE_PUBLIC_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Jbs2bkse3d1ZebEIszq-6Q_psa3mFWm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

