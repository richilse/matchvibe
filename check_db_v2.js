import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://tbgruhhdnxjdtbwyqtcq.supabase.co', 'sb_publishable_-RQ206srJKzBT81vTzy61g_-FaCIfnB');

async function checkAllTeams() {
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Latest 5 Teams:', JSON.stringify(data, null, 2));
    }
}

checkAllTeams();
