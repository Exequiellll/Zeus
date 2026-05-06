import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://uvhewvmuyuzulyxivcnq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q28qNy1Gcqd0v7qAxisVgA_bmLIYvsm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
