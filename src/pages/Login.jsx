import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '460px', margin: '60px auto' }}
        >
            <div className="glass-card" style={{ padding: '50px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔐</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>
                        <span style={{ color: 'var(--accent)' }}>로그인</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                        팀을 등록한 계정으로 로그인하세요
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label>이메일</label>
                        <input
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label>비밀번호</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
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
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.9rem' }}>
                    <Link to="/forgot-password" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                        비밀번호를 잊으셨나요?
                    </Link>
                </div>

                <div style={{ textAlign: 'center', marginTop: '14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    아직 계정이 없으신가요?{' '}
                    <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                        팀 등록하기 →
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;
