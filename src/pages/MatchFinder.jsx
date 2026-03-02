import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { REGIONS_DATA } from '../constants/regions';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { sendSMS } from '../lib/solapi';

const MatchFinder = () => {
    const { user, isAdmin } = useAuth();
    const [teams, setTeams] = useState([]);
    const [filter, setFilter] = useState({
        city: '전체',
        district: '전체',
        dong: '전체',
        skill: '전체'
    });
    const [matchingRequested, setMatchingRequested] = useState(null);
    const [showLinkageToast, setShowLinkageToast] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [sending, setSending] = useState(false);

    // Load teams from Supabase on mount
    useEffect(() => {
        const fetchTeams = async () => {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching teams:', error.message);
            } else {
                setTeams(data);
            }
        };

        fetchTeams();

        const savedMyTeam = localStorage.getItem('myTeamInfo');
        if (savedMyTeam) {
            try {
                const teamInfo = JSON.parse(savedMyTeam);
                setFilter(prev => ({
                    ...prev,
                    city: teamInfo.city || '전체',
                    district: teamInfo.district || '전체',
                    dong: teamInfo.dong || '전체'
                }));
                setShowLinkageToast(true);
                setTimeout(() => setShowLinkageToast(false), 3000);
            } catch (e) {
                console.error("Failed to parse team info", e);
            }
        }
    }, []);

    const SKILL_LEVELS = ['전체', '최상', '상', '중', '하', '하하', '하하하', '하하하하', '하하하하하'];

    const filteredTeams = teams.filter(team => {
        if (filter.city !== '전체') {
            const cityShort = filter.city.slice(0, 2);
            if (!team.region.includes(cityShort)) return false;
        }

        if (filter.district !== '전체' && !team.region.includes(filter.district)) return false;
        if (filter.dong !== '전체' && !team.region.includes(filter.dong)) return false;
        if (filter.skill !== '전체' && team.skill !== filter.skill && team.skill_level !== filter.skill) return false;

        return true;
    });

    const handleMatchRequest = async (team) => {
        const savedTeam = localStorage.getItem('myTeamInfo');
        const myTeamParsed = savedTeam ? JSON.parse(savedTeam) : null;
        const myTeamName = myTeamParsed?.teamName || myTeamParsed?.name || '우리 팀';
        const myTeamRegion = myTeamParsed?.region || '';
        const myTeamContact = myTeamParsed?.contact || '';

        const confirmMsg = `[매치바이브] ${team.name} 팀에게 매칭 신청을 하시겠습니까?\n\n"${myTeamName}" 팀의 정보와 함께 상대방에게 매칭 신청 문자가 즉시 전송됩니다.`;

        if (!window.confirm(confirmMsg)) return;

        setSending(true);
        setMatchingRequested(team.id);

        try {
            // 1. Supabase에 신청 기록 저장 (B팀이 수락/거절 시 A팀에게 문자 보내기 위해)
            const { error: insertError } = await supabase.from('match_requests').insert([{
                from_team_id: user?.id || null,
                from_team_name: myTeamName,
                from_team_contact: myTeamContact,
                from_team_region: myTeamRegion,
                to_team_id: team.id,
                to_team_name: team.name,
                status: 'pending'
            }]);
            if (insertError) console.error('신청 기록 저장 오류:', insertError.message);

            // 2. B팀에게 SMS 발송
            if (team.contact) {
                const smsText = `[매치바이브] ${team.name} 팀 매니저님!\n\n"${myTeamName}"${myTeamRegion ? ` (${myTeamRegion})` : ''} 팀으로부터 매칭 신청이 들어왔습니다.\n\n매치바이브 > 내 팀에서 수락/거절하세요!\nhttps://matchvibe-soccer.vercel.app/my-team`;

                await sendSMS(team.contact, smsText);
                alert(`✅ 신청 완료!\n\n${team.name} 팀 매니저에게 문자가 전송되었습니다.`);
            } else {
                alert(`✅ 신청이 접수되었습니다.\n\n${team.name} 팀에 등록된 연락처가 없어 문자는 발송되지 않았습니다.`);
            }
        } catch (error) {
            console.error('매칭 신청 오류:', error);
            alert(`신청은 완료되었으나 문자 발송에 실패했습니다.\n직접 연락해보세요: ${team.contact || '연락처 없음'}`);
        } finally {
            setSending(false);
        }
    };



    const handleDeleteTeam = async (team) => {
        const confirmed = window.confirm(`"${team.name}" 팀을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
        if (!confirmed) return;

        const { error } = await supabase.from('teams').delete().eq('id', team.id);
        if (error) {
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        } else {
            setTeams(prev => prev.filter(t => t.id !== team.id));
            if (selectedTeam?.id === team.id) setSelectedTeam(null);
        }
    };

    const canDelete = (team) => isAdmin || (user && team.user_id === user.id);

    return (
        <div style={{ padding: '20px 0', position: 'relative' }}>
            <AnimatePresence>
                {showLinkageToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            top: '100px',
                            left: '50%',
                            background: 'var(--accent)',
                            color: 'white',
                            padding: '12px 25px',
                            borderRadius: '30px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            zIndex: 1000,
                            fontWeight: 'bold',
                            pointerEvents: 'none'
                        }}
                    >
                        📍 등록하신 팀 지역 정보로 자동 필터링 중...
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                    최고의 <span style={{ color: 'var(--accent)' }}>매칭 상대</span>를 찾아보세요
                </h2>

                <div className="glass-card" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '15px',
                    padding: '25px',
                    maxWidth: '1200px',
                    margin: '30px auto',
                    alignItems: 'end'
                }}>
                    <div>
                        <label>시/도</label>
                        <select
                            value={filter.city}
                            onChange={(e) => setFilter(prev => ({ ...prev, city: e.target.value, district: '전체', dong: '전체' }))}
                        >
                            <option value="전체">전체 시/도</option>
                            {Object.keys(REGIONS_DATA).map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>시/군/구</label>
                        <select
                            value={filter.district}
                            onChange={(e) => setFilter(prev => ({ ...prev, district: e.target.value, dong: '전체' }))}
                            disabled={filter.city === '전체'}
                        >
                            <option value="전체">전체 시/군/구</option>
                            {filter.city !== '전체' && REGIONS_DATA[filter.city] && Object.keys(REGIONS_DATA[filter.city]).map(dist => (
                                <option key={dist} value={dist}>{dist}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>읍/면/동 선택</label>
                        <select
                            value={filter.dong}
                            onChange={(e) => setFilter(prev => ({ ...prev, dong: e.target.value }))}
                            disabled={filter.district === '전체'}
                        >
                            <option value="전체">전체 읍/면/동</option>
                            {filter.district !== '전체' && REGIONS_DATA[filter.city] && REGIONS_DATA[filter.city][filter.district] && REGIONS_DATA[filter.city][filter.district].map(dong => (
                                <option key={dong} value={dong}>{dong}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>팀 실력</label>
                        <select
                            value={filter.skill}
                            onChange={(e) => setFilter(prev => ({ ...prev, skill: e.target.value }))}
                        >
                            {SKILL_LEVELS.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {(filter.city !== '전체' || filter.dong !== '전체' || filter.skill !== '전체' || filter.district !== '전체') && (
                    <button
                        onClick={() => setFilter({ city: '전체', district: '전체', dong: '전체', skill: '전체' })}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', marginTop: '10px', textDecoration: 'underline' }}
                    >
                        필터 초기화
                    </button>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: filteredTeams.length > 0 ? 'repeat(auto-fill, minmax(350px, 1fr))' : '1fr',
                gap: '25px',
                minHeight: '400px'
            }}>
                <AnimatePresence mode="popLayout">
                    {filteredTeams.length > 0 ? (
                        filteredTeams.map((team, idx) => (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-card"
                                style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}
                            >
                                {team.hasField && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '15px',
                                        right: '-30px',
                                        background: 'var(--gold-gradient)',
                                        color: 'black',
                                        padding: '5px 40px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        transform: 'rotate(45deg)'
                                    }}>
                                        구장 보유
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        {(team.photo_url && !team.photo_url.startsWith('blob:')) ? (
                                            <img
                                                src={team.photo_url}
                                                alt={team.name}
                                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                        ) : (team.profile_image && !team.profile_image.startsWith('blob:')) ? (
                                            <img
                                                src={team.profile_image}
                                                alt={team.name}
                                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '50px', height: '50px', borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.05)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                ⚽
                                            </div>
                                        )}
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '600' }}>{team.region}</span>
                                            <h3 style={{ fontSize: '1.5rem', marginTop: '5px' }}>{team.name}</h3>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            fontSize: '0.8rem'
                                        }}>
                                            실력: {team.skill_level || team.skill}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <span>선출 {team.pro_players}명</span>
                                    <span>•</span>
                                    <span>{team.hasField ? '홈 경기 가능' : '원정만 가능'}</span>
                                </div>

                                <p style={{ fontSize: '0.95rem', marginBottom: '25px', color: '#eee', lineBreak: 'anywhere' }}>
                                    "{team.intro}"
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: canDelete(team) ? '1fr 1fr auto' : '1fr 1fr', gap: '10px' }}>
                                    <button
                                        className="btn-outline"
                                        style={{ padding: '12px' }}
                                        onClick={() => setSelectedTeam(team)}
                                    >
                                        상세보기
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{ padding: '12px' }}
                                        onClick={() => handleMatchRequest(team)}
                                        disabled={matchingRequested === team.id}
                                    >
                                        {matchingRequested === team.id ? '신청 대기' : '매칭 신청'}
                                    </button>
                                    {canDelete(team) && (
                                        <button
                                            className="btn-delete"
                                            style={{ padding: '12px 14px' }}
                                            onClick={() => handleDeleteTeam(team)}
                                            title="팀 삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            key="no-results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                textAlign: 'center',
                                padding: '100px 20px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '20px',
                                border: '1px dashed rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>찾으시는 조건에 맞는 팀이 없습니다</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                                필터 조건을 변경하거나 초기화하여 다른 팀을 찾아보세요.
                            </p>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button
                                    className="btn-outline"
                                    onClick={() => setFilter({ city: '전체', district: '전체', dong: '전체', skill: '전체' })}
                                    style={{ padding: '12px 30px' }}
                                >
                                    필터 초기화
                                </button>
                                <button
                                    className="btn-outline"
                                    onClick={() => window.history.back()}
                                    style={{ padding: '12px 30px' }}
                                >
                                    이전으로 돌아가기
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedTeam && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }} onClick={() => setSelectedTeam(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card"
                            style={{
                                maxWidth: '600px',
                                width: '100%',
                                padding: '40px',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedTeam(null)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '25px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '50%',
                                    margin: '0 auto 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                }}>
                                    {(selectedTeam.photo_url && !selectedTeam.photo_url.startsWith('blob:')) ? (
                                        <img
                                            src={selectedTeam.photo_url}
                                            alt={selectedTeam.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (selectedTeam.profile_image && !selectedTeam.profile_image.startsWith('blob:')) ? (
                                        <img
                                            src={selectedTeam.profile_image}
                                            alt={selectedTeam.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '3.5rem' }}>
                                            {selectedTeam.pro_players > 5 ? '👑' : '⚽'}
                                        </span>
                                    )}
                                </div>
                                <span style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem' }}>{selectedTeam.region}</span>
                                <h2 style={{ fontSize: '2.5rem', marginTop: '10px' }}>{selectedTeam.name}</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>{selectedTeam.foundation_year}년 창단</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px', textAlign: 'center' }}>
                                <div className="glass-card" style={{ padding: '15px' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '5px' }}>실력 등급</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedTeam.skill_level || selectedTeam.skill}</div>
                                </div>
                                <div className="glass-card" style={{ padding: '15px' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '5px' }}>선출 인원</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedTeam.pro_players}명</div>
                                </div>
                                <div className="glass-card" style={{ padding: '15px' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '5px' }}>회원 수</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedTeam.memberCount || 20}명</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '35px' }}>
                                <h4 style={{ marginBottom: '10px', color: 'var(--accent)' }}>팀 소개</h4>
                                <p style={{ lineHeight: '1.6', color: '#ddd' }}>{selectedTeam.intro}</p>
                                {selectedTeam.address !== '-' && (
                                    <div style={{ marginTop: '20px' }}>
                                        <h4 style={{ marginBottom: '10px', color: 'var(--accent)' }}>전용 구장</h4>
                                        <p style={{ color: '#ddd' }}>📍 {selectedTeam.address}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn-primary"
                                style={{ width: '100%', padding: '15px' }}
                                onClick={() => {
                                    handleMatchRequest(selectedTeam);
                                    setSelectedTeam(null);
                                }}
                            >
                                지금 매칭 신청하기
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MatchFinder;
