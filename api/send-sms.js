import crypto from 'crypto';

export default async function handler(req, res) {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', 'https://matchvibe-soccer.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, text } = req.body;

    if (!to || !text) {
        return res.status(400).json({ error: 'to and text are required' });
    }

    const API_KEY = process.env.VITE_SOLAPI_API_KEY;
    const API_SECRET = process.env.VITE_SOLAPI_API_SECRET;
    const SENDER = process.env.VITE_SOLAPI_SENDER;

    if (!API_KEY || !API_SECRET || !SENDER) {
        return res.status(500).json({ error: 'SMS 설정이 올바르지 않습니다.' });
    }

    const toNumber = to.replace(/-/g, '');
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 12);
    const signature = crypto
        .createHmac('sha256', API_SECRET)
        .update(date + salt)
        .digest('hex');

    const authHeader = `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;

    try {
        const response = await fetch('https://api.solapi.com/messages/v4/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                message: {
                    to: toNumber,
                    from: SENDER,
                    text: text,
                }
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Solapi 오류:', result);
            return res.status(400).json({ error: result.message || 'SMS 발송 실패' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('SMS 발송 오류:', error);
        return res.status(500).json({ error: '서버 오류' });
    }
}
