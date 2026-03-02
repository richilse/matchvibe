/**
 * Solapi SMS 발송 유틸리티
 * API 문서: https://docs.solapi.com/
 */

const API_KEY = import.meta.env.VITE_SOLAPI_API_KEY;
const API_SECRET = import.meta.env.VITE_SOLAPI_API_SECRET;
const SENDER = import.meta.env.VITE_SOLAPI_SENDER;

/**
 * HMAC-SHA256 서명 생성 (브라우저 내장 SubtleCrypto 사용)
 */
async function createSignature(date, salt) {
    const message = date + salt;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(API_SECRET);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Solapi로 SMS 발송
 * @param {string} to - 수신자 번호 (010-xxxx-xxxx 또는 01012345678)
 * @param {string} text - 문자 내용
 */
export async function sendSMS(to, text) {
    const toNumber = to.replace(/-/g, '');

    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 12);
    const signature = await createSignature(date, salt);

    const authHeader = `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;

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
        throw new Error(result.message || '문자 발송에 실패했습니다.');
    }

    return result;
}
