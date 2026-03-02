import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://tbgruhhdnxjdtbwyqtcq.supabase.co', 'sb_publishable_-RQ206srJKzBT81vTzy61g_-FaCIfnB');

async function checkSchema() {
    // 꼼수: 한 행을 가져와서 키값들을 확인
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data[0]) {
        console.log('Columns in "teams" table:', Object.keys(data[0]));
    } else {
        console.log('No data in "teams" table to check schema.');
    }
}

checkSchema();
