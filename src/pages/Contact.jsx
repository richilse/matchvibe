import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle } from 'lucide-react';

const ADMIN_EMAIL = 'seilcheon@naver.com';

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');

        try {
            // EmailJS를 사용하지 않고 Formspree API 사용 (설정 불필요)
            const res = await fetch('https://formspree.io/f/mreaqoqz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    subject: `[매치바이브 문의] ${form.subject}`,
                    message: form.message,
                    _replyto: form.email,
                })
            });

            if (res.ok) {
                setSent(true);
            } else {
                throw new Error('전송 실패');
            }
        } catch {
            setError('전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        setSending(false);
    };

    if (sent) return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center' }}>
            <div className="glass-card" style={{ padding: '60px 40px' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                    <CheckCircle size={64} style={{ color: '#00f296', marginBottom: '20px' }} />
                </motion.div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>문의가 접수됐습니다!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <strong style={{ color: 'var(--secondary)' }}>{ADMIN_EMAIL}</strong> 으로 전달되었습니다.
                </p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '0.9rem' }}>
                    빠른 시일 내에 답변드리겠습니다.
                </p>
                <button className="btn-outline" style={{ padding: '12px 30px' }}
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                    새 문의 작성
                </button>
            </div>
        </motion.div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '650px', margin: '40px auto' }}>
            <div className="glass-card" style={{ padding: '50px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'rgba(0,242,255,0.1)', border: '1px solid rgba(0,242,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                    }}>
                        <Mail size={28} style={{ color: 'var(--accent)' }} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>
                        <span style={{ color: 'var(--accent)' }}>문의하기</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                        궁금한 점이 있으시면 언제든 문의해주세요. 빠르게 답변드립니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                        <div>
                            <label>이름</label>
                            <input type="text" placeholder="홍길동" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label>이메일 (답장 받을 주소)</label>
                            <input type="email" placeholder="example@email.com" value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                    </div>

                    <div>
                        <label>제목</label>
                        <input type="text" placeholder="문의 제목을 입력해주세요" value={form.subject}
                            onChange={e => setForm({ ...form, subject: e.target.value })} required />
                    </div>

                    <div>
                        <label>내용</label>
                        <textarea rows="7" placeholder="문의 내용을 자세히 작성해주세요." value={form.message}
                            onChange={e => setForm({ ...form, message: e.target.value })} required />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)',
                            borderRadius: '10px', padding: '12px', color: '#ff8080', textAlign: 'center', fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary"
                        style={{
                            width: '100%', padding: '16px', fontSize: '1rem', marginTop: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                        disabled={sending}>
                        <Send size={18} />
                        {sending ? '전송 중...' : '문의 전송'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        📮 {ADMIN_EMAIL} 으로 전달됩니다
                    </p>
                </form>
            </div>
        </motion.div>
    );
};

export default Contact;
