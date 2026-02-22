import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="home-hero"
            >
                <h2 className="home-title">
                    대한민국 NO.1<br />
                    <span style={{ color: 'var(--secondary)' }}>아마추어 축구매칭 플랫폼</span>
                </h2>
                <p className="home-subtitle">
                    더 이상 카페나 오픈채팅방에서 헤매지 마세요.<br />
                    <strong style={{ color: 'var(--secondary)', fontWeight: '700' }}>클릭 한 번</strong>으로 우리 팀의 <strong style={{ color: 'var(--secondary)', fontWeight: '700' }}>최적의 상대</strong>를 찾아드립니다.
                </p>

                <div className="home-ctas">
                    <button className="btn-primary" onClick={() => navigate('/register')}>
                        우리 팀 등록하기
                    </button>
                    <button className="btn-outline" onClick={() => navigate('/matches')}>
                        매칭 상대 찾기
                    </button>
                </div>
            </motion.div>

            <div className="grid-features">
                {[
                    {
                        title: '지역 맞춤 매칭',
                        icon: '📍',
                        desc: <>우리 팀 활동 반경 내<br />가장 가까운 팀 전용 매칭</>
                    },
                    {
                        title: '팀 별 밸런스 최적 매칭',
                        icon: '⚖️',
                        desc: <>실력과 선출 인원을 고려한<br />공정한 경기 보장</>
                    },
                    {
                        title: '간편한 소통',
                        icon: '💬',
                        desc: <>매칭 수락 시 자동으로 생성되는<br />전용 채팅방</>
                    },
                    {
                        title: '신뢰성 보장',
                        icon: '🛡️',
                        desc: <>3일 내 무응답 시 자동 취소로<br />빠른 매칭 순환</>
                    }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        className="glass-card feature-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 * (i + 1) }}
                    >
                        <div className="feature-icon">{item.icon}</div>
                        <h3 className="feature-title">{item.title}</h3>
                        <div className="feature-desc">{item.desc}</div>
                    </motion.div>
                ))}
            </div>
        </div >
    );
};

export default Home;
