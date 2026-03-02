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
                <h1 className="home-title">
                    대한민국 NO.1<br />
                    <span style={{ color: 'var(--secondary)' }}>조기축구 풋살 매칭 플랫폼</span>
                </h1>
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

            {/* SEO 키워드 섹션 - 검색엔진 최적화용 */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="seo-section"
                aria-label="서비스 안내"
            >
                <div className="seo-grid">
                    <div className="seo-block">
                        <h2>조기축구 매칭, 이제 MATCHVIBE로</h2>
                        <p>
                            조기축구팀을 운영 중이신가요? <strong>조기축구 상대팀 구하기</strong>가 어렵다면
                            매치바이브(MATCHVIBE)를 이용해보세요. 서울, 경기, 인천, 부산, 대구 등 전국 어디서나
                            <strong> 조기축구 매칭</strong>이 가능합니다. 실력별(하하하하 ~ 최상) 필터로
                            비슷한 수준의 팀과만 매칭됩니다.
                        </p>
                    </div>
                    <div className="seo-block">
                        <h2>풋살팀 매칭도 한번에</h2>
                        <p>
                            5:5, 6:6 <strong>풋살 매칭</strong>을 찾고 계신가요?
                            MATCHVIBE에서 우리 <strong>풋살팀을 등록</strong>하고 지역 내
                            풋살팀과 바로 연결되세요. 풋살 동호회, 풋살 소모임 등
                            다양한 <strong>풋살 상대팀</strong>이 기다리고 있습니다.
                        </p>
                    </div>
                    <div className="seo-block">
                        <h2>무료 축구팀 등록 플랫폼</h2>
                        <p>
                            <strong>축구팀 등록</strong>부터 <strong>축구 시합 상대 구하기</strong>까지
                            모든 서비스가 <strong>무료</strong>입니다. 정기 구장이 있는 팀도,
                            떠돌이 팀도 모두 환영합니다. 지금 바로 우리 팀을 등록하고
                            첫 번째 <strong>조기축구 매칭</strong>을 시작하세요!
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* 지역별 서비스 섹션 */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="seo-section"
                aria-label="지역별 조기축구 매칭 서비스"
            >
                <div className="seo-block-full">
                    <h2>전국 지역별 조기축구·풋살 매칭 서비스</h2>
                    <p>
                        <strong>서울 조기축구 매칭</strong> (강남구, 서초구, 송파구, 마포구, 영등포구 등),&nbsp;
                        <strong>경기 조기축구 매칭</strong> (수원, 성남, 고양, 용인, 부천, 화성 등),&nbsp;
                        <strong>인천 풋살 매칭</strong>,&nbsp;<strong>부산 조기축구</strong>,&nbsp;<strong>대구 풋살</strong>,&nbsp;
                        <strong>대전 축구팀 구하기</strong>,&nbsp;<strong>광주 조기축구</strong> 등
                        전국 모든 지역에서 <strong>매치바이브(MATCHVIBE)</strong>를 통해 조기축구 풋살 매칭이 가능합니다.
                        지역 내 실력이 비슷한 <strong>아마추어 축구팀</strong>과 <strong>풋살팀</strong>을 연결해드립니다.
                    </p>
                </div>
            </motion.section>

            {/* FAQ 섹션 */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
                className="seo-section"
                aria-label="자주 묻는 질문"
            >
                <h2 className="seo-faq-title">자주 묻는 질문 (FAQ)</h2>
                <div className="seo-grid">
                    <div className="seo-block">
                        <h2>Q. 매치바이브(MATCHVIBE)란?</h2>
                        <p>
                            <strong>매치바이브</strong>는 대한민국 No.1 <strong>조기축구 매칭</strong> 및
                            <strong>풋살 매칭 플랫폼</strong>입니다. 카페나 오픈채팅방 없이
                            클릭 한 번으로 지역 내 <strong>축구 상대팀</strong>을 찾을 수 있습니다.
                        </p>
                    </div>
                    <div className="seo-block">
                        <h2>Q. 조기축구 상대팀은 어떻게 구하나요?</h2>
                        <p>
                            MATCHVIBE에 팀을 등록하고 <strong>매칭 상대 찾기</strong>에서
                            지역과 실력을 선택하면 조건에 맞는 <strong>조기축구팀</strong>이 바로 보입니다.
                            <strong>매칭 신청</strong> 버튼을 누르면 상대 팀 매니저에게 즉시 연락이 갑니다.
                        </p>
                    </div>
                    <div className="seo-block">
                        <h2>Q. 이용 비용이 있나요?</h2>
                        <p>
                            매치바이브의 <strong>축구팀 등록</strong>과 <strong>매칭 신청</strong>은
                            모두 <strong>완전 무료</strong>입니다. 숨겨진 비용 없이 무제한으로
                            <strong>조기축구 매칭</strong>과 <strong>풋살 매칭</strong>을 이용하실 수 있습니다.
                        </p>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default Home;

