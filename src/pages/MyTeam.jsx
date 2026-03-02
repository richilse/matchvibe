import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { REGIONS_DATA } from '../constants/regions';
import { Save, AlertCircle, Check, X, Camera, Upload } from 'lucide-react';
import { sendSMS } from '../lib/solapi';

const MyTeam = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({});
    const [matchRequests, setMatchRequests] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoSaved, setPhotoSaved] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchMyTeam = async () => {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('user_id', user.id);

            if (data && data.length > 0) {
                setTeams(data);
                // 첫 번째 팀을 기본 선택
                const currentTeam = data[0];
                setSelectedTeamId(currentTeam.id);
                setFormData({
                    name: currentTeam.name || '',
                    contact: currentTeam.contact || '',
                    intro: currentTeam.intro || '',
                    skill_level: currentTeam.skill_level || '중',
                    pro_players: currentTeam.pro_players ?? 0,
                    has_field: currentTeam.has_field ? 'true' : 'false',
                    address: currentTeam.address || '',
                    city: currentTeam.city || '',
                    district: currentTeam.district || '',
                    dong: currentTeam.dong || '',
                    foundation_year: currentTeam.foundation_year || new Date().getFullYear(),
                    match_type: currentTeam.match_type || 'soccer',
                });

                // 받은 매칭 신청 조회 (모든 팀에 대해 또는 현재 팀에 대해)
                const { data: requests } = await supabase
                    .from('match_requests')
                    .select('*')
                    .in('to_team_id', data.map(t => t.id))
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (requests) setMatchRequests(requests);
            }
            setLoading(false);
        };

        fetchMyTeam();
    }, [user, navigate]);

    // 선택된 팀 정보 가져오기 전용 함수
    const currentTeam = teams.find(t => t.id === selectedTeamId);

    const handleTeamSelect = (id) => {
        const team = teams.find(t => t.id === id);
        if (!team) return;
        setSelectedTeamId(id);
        setFormData({
            name: team.name || '',
            contact: team.contact || '',
            intro: team.intro || '',
            skill_level: team.skill_level || '중',
            pro_players: team.pro_players ?? 0,
            has_field: team.has_field ? 'true' : 'false',
            address: team.address || '',
            city: team.city || '',
            district: team.district || '',
            dong: team.dong || '',
            foundation_year: team.foundation_year || new Date().getFullYear(),
            match_type: team.match_type || 'soccer',
        });
        setPhotoPreview(null);
        setPhotoFile(null);
    };


    const handleAcceptReject = async (request, action) => {
        setProcessingId(request.id);
        try {
            // 1. Supabase status 업데이트
            await supabase
                .from('match_requests')
                .update({ status: action })
                .eq('id', request.id);

            // 2. A팀에게 결과 문자 발송
            if (request.from_team_contact) {
                const isAccept = action === 'accepted';
                const teamName = teams.find(t => t.id === request.to_team_id)?.name || '우리 팀';
                const teamContact = teams.find(t => t.id === request.to_team_id)?.contact || '';

                const smsText = isAccept
                    ? `[매치바이브] ${request.from_team_name} 팀 매니저님!\n\n"${teamName}" 팀이 매칭 신청을 ✅ 수락했습니다!\n\n📞 ${teamName} 연락처: ${teamContact || '확인 불가'}\n\n직접 연락해서 일정 조율 하세요 🔥`
                    : `[매치바이브] ${request.from_team_name} 팀 매니저님,\n\n"${teamName}" 팀이 아쉽게도 이번 매칭 신청을 거절했습니다.\n\n다른 팀을 찾아보세요!\nhttps://matchvibe-soccer.vercel.app/matches`;

                await sendSMS(request.from_team_contact, smsText);

                // 수락 시 나에게도 발송
                if (action === 'accepted' && teamContact) {
                    const myAlertText = `[매치바이브] 매칭 수락 완료!\n\n📞 ${request.from_team_name} 연락처: ${request.from_team_contact}\n\n직접 연락해서 일정 조율 하세요 🔥`;
                    await sendSMS(teamContact, myAlertText);
                }
            }

            // 3. 목록에서 제거
            setMatchRequests(prev => prev.filter(r => r.id !== request.id));
            alert(action === 'accepted'
                ? `✅ 수락 완료!\n${request.from_team_name} 팀에게 수락 문자가 발송되었습니다.`
                : `❌ 거절 완료!\n${request.from_team_name} 팀에게 거절 문자가 발송되었습니다.`
            );
        } catch (error) {
            console.error('처리 오류:', error);
            alert('처리 중 오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB 이하여야 합니다.');
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handlePhotoUpload = async () => {
        if (!photoFile || !currentTeam) return;
        setUploadingPhoto(true);
        try {
            const ext = photoFile.name.split('.').pop();
            const filePath = `team-photos/${currentTeam.id}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('team-photos')
                .upload(filePath, photoFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('team-photos')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('teams')
                .update({ photo_url: publicUrl })
                .eq('id', currentTeam.id);

            if (dbError) throw dbError;

            setTeams(prev => prev.map(t => t.id === selectedTeamId ? { ...t, photo_url: publicUrl } : t));
            setPhotoFile(null);
            setPhotoSaved(true);
            setTimeout(() => setPhotoSaved(false), 3000);
        } catch (err) {
            console.error(err);
            alert('사진 업로드 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        const region = `${formData.city} ${formData.district === '전체' ? '' : formData.district} ${formData.dong === '전체' ? '' : formData.dong}`.trim();

        const { error } = await supabase
            .from('teams')
            .update({
                name: formData.name,
                contact: formData.contact,
                intro: formData.intro,
                skill_level: formData.skill_level,
                pro_players: parseInt(formData.pro_players),
                has_field: formData.has_field === 'true',
                address: formData.address || '-',
                city: formData.city,
                district: formData.district,
                dong: formData.dong,
                region: region,
                foundation_year: parseInt(formData.foundation_year),
                match_type: formData.match_type,
            })
            .eq('id', selectedTeamId);

        setSaving(false);
        if (!error) {
            setTeams(prev => prev.map(t => t.id === selectedTeamId ? { ...t, ...formData } : t));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            alert('저장 중 오류: ' + error.message);
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
            <p>불러오는 중...</p>
        </div>
    );

    if (teams.length === 0) return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center' }}>
            <div className="glass-card" style={{ padding: '50px 40px' }}>
                <AlertCircle size={48} style={{ color: 'var(--accent)', marginBottom: '20px' }} />
                <h2 style={{ marginBottom: '15px' }}>등록된 팀이 없습니다</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                    아직 팀을 등록하지 않으셨거나, 다른 계정으로 등록하셨습니다.
                </p>
                <button className="btn-primary" style={{ padding: '14px 32px' }} onClick={() => navigate('/register')}>
                    팀 등록하기
                </button>
            </div>
        </motion.div>
    );

    const SKILL_LEVELS = ['최상', '상', '중', '하', '하하', '하하하', '하하하하', '하하하하하'];

    return (
        <div style={{ maxWidth: '850px', margin: '40px auto' }}>

            {/* 받은 매칭 신청 섹션 */}
            {matchRequests.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{
                        padding: '30px 40px',
                        marginBottom: '24px',
                        border: '1px solid rgba(0, 242, 150, 0.25)'
                    }}
                >
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>
                        <span style={{ color: '#00f296' }}>📬 받은 매칭 신청</span>
                        <span style={{
                            marginLeft: '12px',
                            background: 'rgba(0,242,150,0.15)',
                            border: '1px solid rgba(0,242,150,0.4)',
                            borderRadius: '20px',
                            padding: '2px 12px',
                            fontSize: '0.9rem',
                            color: '#00f296'
                        }}>
                            {matchRequests.length}건
                        </span>
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {matchRequests.map(req => (
                            <div key={req.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>
                                        ⚽ {req.from_team_name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {req.from_team_region && `📍 ${req.from_team_region} · `}
                                        {new Date(req.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleAcceptReject(req, 'accepted')}
                                        disabled={processingId === req.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            background: 'rgba(0,242,150,0.15)',
                                            border: '1px solid rgba(0,242,150,0.5)',
                                            color: '#00f296', borderRadius: '8px',
                                            padding: '8px 18px', cursor: 'pointer',
                                            fontWeight: '600', fontSize: '0.9rem'
                                        }}
                                    >
                                        <Check size={16} /> {processingId === req.id ? '처리중...' : '수락'}
                                    </button>
                                    <button
                                        onClick={() => handleAcceptReject(req, 'rejected')}
                                        disabled={processingId === req.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            background: 'rgba(255,80,80,0.12)',
                                            border: '1px solid rgba(255,80,80,0.4)',
                                            color: '#ff6b6b', borderRadius: '8px',
                                            padding: '8px 18px', cursor: 'pointer',
                                            fontWeight: '600', fontSize: '0.9rem'
                                        }}
                                    >
                                        <X size={16} /> 거절
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-card" style={{ padding: '40px' }}>

                {/* 팀 선택 탭 (복수 팀일 때만 표시) */}
                {teams.length > 1 && (
                    <div style={{
                        display: 'flex', gap: '8px', marginBottom: '35px',
                        padding: '6px', background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px', overflowX: 'auto'
                    }}>
                        {teams.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleTeamSelect(t.id)}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                                    background: selectedTeamId === t.id ? 'var(--accent)' : 'transparent',
                                    color: selectedTeamId === t.id ? '#000' : 'var(--text-muted)',
                                    fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                                    whiteSpace: 'nowrap', transition: 'all 0.2s'
                                }}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '2rem' }}>
                        <span style={{ color: 'var(--accent)' }}>내 팀</span> 정보 수정
                    </h2>
                    {saved && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'rgba(0, 242, 150, 0.15)', border: '1px solid rgba(0,242,150,0.4)',
                                borderRadius: '10px', padding: '8px 18px', color: '#00f296', fontWeight: '600', fontSize: '0.9rem'
                            }}>
                            ✓ 저장 완료!
                        </motion.div>
                    )}
                </div>

                {/* 팀 사진 변경 섹션 */}
                <div style={{
                    marginBottom: '32px',
                    padding: '28px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={18} style={{ color: 'var(--accent)' }} />
                        팀 사진
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                        {/* 현재 사진 */}
                        <div style={{
                            width: '110px', height: '110px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                            border: '2px solid rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', flexShrink: 0,
                        }}>
                            {(photoPreview || (currentTeam?.photo_url && !currentTeam.photo_url.startsWith('blob:'))) ? (
                                <img
                                    src={photoPreview || currentTeam.photo_url}
                                    alt="팀 사진"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Camera size={36} style={{ color: 'rgba(255,255,255,0.25)' }} />
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                                JPG, PNG, WEBP · 최대 5MB
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '10px', padding: '9px 18px',
                                    cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem',
                                    transition: 'all 0.2s',
                                }}>
                                    <Upload size={15} />
                                    사진 선택
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        style={{ display: 'none' }}
                                        onChange={handlePhotoChange}
                                    />
                                </label>

                                {photoFile && (
                                    <button
                                        type="button"
                                        onClick={handlePhotoUpload}
                                        disabled={uploadingPhoto}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '7px',
                                            background: 'linear-gradient(135deg, var(--accent), #00c9ff)',
                                            border: 'none', borderRadius: '10px',
                                            padding: '9px 20px', cursor: 'pointer',
                                            color: '#000', fontWeight: '700', fontSize: '0.88rem',
                                        }}
                                    >
                                        <Save size={14} />
                                        {uploadingPhoto ? '업로드 중...' : '저장하기'}
                                    </button>
                                )}

                                {photoSaved && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        color: '#00f296', fontWeight: '600', fontSize: '0.88rem',
                                    }}>
                                        <Check size={14} /> 사진 저장 완료!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                        {/* 팀명 */}
                        <div>
                            <label>팀 명</label>
                            <input type="text" value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>

                        {/* 창단년도 */}
                        <div>
                            <label>팀 설립연도</label>
                            <select value={formData.foundation_year}
                                onChange={e => setFormData({ ...formData, foundation_year: e.target.value })}>
                                {Array.from({ length: 51 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}년</option>
                                ))}
                            </select>
                        </div>

                        {/* 매칭 유형 */}
                        <div>
                            <label>선호 매칭 유형</label>
                            <select value={formData.match_type}
                                onChange={e => setFormData({ ...formData, match_type: e.target.value })}>
                                <option value="soccer">⚽ 축구 매칭</option>
                                <option value="futsal">🏃 풋살 매칭</option>
                            </select>
                        </div>

                        {/* 실력 */}
                        <div>
                            <label>팀 실력</label>
                            <select value={formData.skill_level}
                                onChange={e => setFormData({ ...formData, skill_level: e.target.value })}>
                                {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        {/* 선출 */}
                        <div>
                            <label>선수 출신 인원</label>
                            <select value={formData.pro_players}
                                onChange={e => setFormData({ ...formData, pro_players: e.target.value })}>
                                {[...Array(21).keys()].map(n => <option key={n} value={n}>{n}명</option>)}
                            </select>
                        </div>

                        {/* 구장 */}
                        <div>
                            <label>정기 구장 보유 여부</label>
                            <select value={formData.has_field}
                                onChange={e => setFormData({ ...formData, has_field: e.target.value })}>
                                <option value="true">정기 구장 있음</option>
                                <option value="false">구장 없음 (떠돌이 팀)</option>
                            </select>
                        </div>

                        {/* 연락처 */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <label>연락처 (대표번호)</label>
                            <input type="tel" placeholder="010-0000-0000" value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })} required />
                        </div>

                        {/* 지역 */}
                        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '15px' }}>
                            <label style={{ gridColumn: 'span 3' }}>주 활동 지역</label>
                            <select value={formData.city}
                                onChange={e => setFormData(p => ({ ...p, city: e.target.value, district: '전체', dong: '전체' }))}>
                                {Object.keys(REGIONS_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={formData.district}
                                onChange={e => setFormData(p => ({ ...p, district: e.target.value, dong: '전체' }))}>
                                <option value="전체">전체 시/군/구</option>
                                {REGIONS_DATA[formData.city] && Object.keys(REGIONS_DATA[formData.city]).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <select value={formData.dong}
                                onChange={e => setFormData(p => ({ ...p, dong: e.target.value }))}>
                                <option value="전체">전체 읍/면/동</option>
                                {REGIONS_DATA[formData.city]?.[formData.district]?.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        {/* 팀 소개 */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <label>팀 소개</label>
                            <textarea rows="5" value={formData.intro}
                                onChange={e => setFormData({ ...formData, intro: e.target.value })} required />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary"
                        style={{ width: '100%', marginTop: '30px', padding: '18px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        disabled={saving}>
                        <Save size={18} />
                        {saving ? '저장 중...' : '변경사항 저장'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default MyTeam;
