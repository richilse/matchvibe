import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { REGIONS_DATA } from '../constants/regions';
import { Save, AlertCircle } from 'lucide-react';

const MyTeam = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const fetchMyTeam = async () => {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setTeam(data);
                setFormData({
                    name: data.name || '',
                    contact: data.contact || '',
                    intro: data.intro || '',
                    skill_level: data.skill_level || '중',
                    pro_players: data.pro_players ?? 0,
                    has_field: data.has_field ? 'true' : 'false',
                    address: data.address || '',
                    city: data.city || '',
                    district: data.district || '',
                    dong: data.dong || '',
                    foundation_year: data.foundation_year || new Date().getFullYear(),
                    match_type: data.match_type || 'soccer',
                });
            }
            setLoading(false);
        };

        fetchMyTeam();
    }, [user, navigate]);

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
            .eq('id', team.id);

        setSaving(false);
        if (!error) {
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

    if (!team) return (
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
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card" style={{ padding: '40px', maxWidth: '850px', margin: '40px auto' }}>
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
                            {[...Array(100).keys()].map(n => <option key={n} value={n}>{n}명</option>)}
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
    );
};

export default MyTeam;
