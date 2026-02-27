import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError('오류가 발생했습니다. 이메일 주소를 다시 확인해 주세요.');
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '460px', margin: '60px auto', padding: '0 16px' }}
        >
            <div className="glass-card" style={{ padding: '50px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔑</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>
                        <span style={{ color: 'var(--accent)' }}>비밀번호 찾기</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                        가입 시 사용한 이메일을 입력하세요
                    </p>
                </div>

                {sent ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📧</div>
                        <h3 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.2rem' }}>
                            이메일을 발송했습니다!
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '10px' }}>
                            <strong style={{ color: 'white' }}>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                            이메일이 도착하지 않으면 스팸함을 확인하거나, 아래에서 다시 시도해 주세요.
                        </p>
                        <button
                            className="btn-outline"
                            style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '0.9rem' }}
                            onClick={() => { setSent(false); setEmail(''); }}
                        >
                            다시 시도하기
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label>가입한 이메일 (아이디)</label>
                            <input
                                type="email"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(255, 80, 80, 0.15)',
                                border: '1px solid rgba(255, 80, 80, 0.3)',
                                borderRadius: '10px',
                                padding: '12px',
                                color: '#ff8080',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ width: '100%', padding: '16px', marginTop: '8px', fontSize: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? '발송 중...' : '재설정 링크 발송'}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '25px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                        ← 로그인으로 돌아가기
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default ForgotPassword;
