import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { REGIONS_DATA } from '../constants/regions';
import { supabase } from '../lib/supabaseClient';

const Register = () => {
    const [formData, setFormData] = useState({
        teamName: '',
        matchType: 'soccer', // 'soccer' or 'futsal'
        hasField: 'false',
        address: '',
        proPlayers: '0',
        skillLevel: '중',
        introduction: '',
        contact: '',
        dong: '역삼동',
        foundationYear: new Date().getFullYear(),
        profileImage: null
    });

    const currentRegion = `${formData.city} ${formData.district === '전체' ? '' : formData.district} ${formData.dong === '전체' ? '' : formData.dong}`.trim();

    const autoPhrases = [
        `저희는 ${formData.matchType === 'soccer' ? '축구' : '풋살'}을 정말 사랑하는 팀입니다! ⚽`,
        "매너가 매우 좋습니다! 서로 존중하며 즐거운 경기 하고 싶어요. 😊",
        "실력이 낮은 편이라 정말 순수하게 즐기실 팀들만 신청 부탁드려요.",
        "선출들이 조금 포함된 팀이라 어느 정도 수준이 맞는 팀과 경기하고 싶습니다.",
        "2030 위주의 젊은 팀입니다. 공 차는 거 좋아하고 매너 최우선으로 합니다!",
        "저희는 중장년층이 섞여 있는 팀이라 너무 거친 팀은 정중히 거절합니다.",
        "분위기 좋게 운동하실 팀 찾습니다. 경기 종료 후 뒤풀이도 환영해요!",
        `주로 활동하는 지역은 ${currentRegion} 입니다. 근처 팀들 환영해요!`
    ];

    const getAvailableSkillLevels = () => {
        const levels = ['최상', '상', '중', '하', '하하', '하하하', '하하하하', '하하하하하'];
        if (parseInt(formData.proPlayers) > 0) {
            return levels.slice(0, 4);
        }
        return levels;
    };

    const handleAddPhrase = (phrase) => {
        setFormData(prev => ({
            ...prev,
            introduction: prev.introduction ? `${prev.introduction}\n${phrase}` : phrase
        }));
    };

    const handleProPlayerChange = (e) => {
        const proCount = e.target.value;
        const availableLevels = ['최상', '상', '중', '하'];

        setFormData(prev => {
            let nextSkill = prev.skillLevel;
            if (parseInt(proCount) > 0 && !availableLevels.includes(prev.skillLevel)) {
                nextSkill = '하';
            }
            return { ...prev, proPlayers: proCount, skillLevel: nextSkill };
        });
    };

    const handleAddressSearch = () => {
        new window.daum.Postcode({
            oncomplete: function (data) {
                let fullAddress = data.address;
                let extraAddress = '';

                if (data.addressType === 'R') {
                    if (data.bname !== '') extraAddress += data.bname;
                    if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
                    fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
                }

                setFormData(prev => ({
                    ...prev,
                    address: fullAddress,
                    city: data.sido,
                    district: data.sigungu,
                    dong: data.bname || data.bname1 || data.bname2
                }));
            }
        }).open();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const region = `${formData.city} ${formData.district === '전체' ? '' : formData.district} ${formData.dong === '전체' ? '' : formData.dong}`.trim();

        // 1. Prepare team data for Supabase
        const newTeam = {
            name: formData.teamName,
            match_type: formData.matchType,
            has_field: formData.hasField === 'true',
            address: formData.address || '-',
            city: formData.city,
            district: formData.district,
            dong: formData.dong,
            pro_players: parseInt(formData.proPlayers),
            skill_level: formData.skillLevel,
            intro: formData.introduction,
            contact: formData.contact,
            foundation_year: parseInt(formData.foundationYear),
            profile_image: formData.profileImage,
            region: region,
            member_count: 20
        };

        try {
            // 2. Save to Supabase
            const { error } = await supabase
                .from('teams')
                .insert([newTeam]);

            if (error) throw error;

            // 3. Save individual team info for "My Team" linkage (keep local for UX)
            localStorage.setItem('myTeamInfo', JSON.stringify({ ...newTeam, id: Date.now() }));

            alert(`팀 등록이 완료되었습니다!\n이제 '매칭 신청' 페이지에서 우리 팀을 확인할 수 있습니다.`);

            // Redirect to matches page
            window.location.href = '/matches';
        } catch (error) {
            console.error('Error registering team:', error.message);
            alert('팀 등록 중 오류가 발생했습니다: ' + error.message);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card"
            style={{ padding: '40px', maxWidth: '850px', margin: '40px auto' }}
        >
            <h2 style={{ fontSize: '2rem', marginBottom: '30px', textAlign: 'center' }}>
                <span style={{ color: 'var(--accent)' }}>팀 등록</span>하기
            </h2>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ marginBottom: '15px', display: 'block' }}>선호 매칭 유형 선택</label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <label className="glass-card" style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '15px',
                                cursor: 'pointer',
                                background: formData.matchType === 'soccer' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderColor: formData.matchType === 'soccer' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease'
                            }}>
                                <input
                                    type="radio"
                                    name="matchType"
                                    value="soccer"
                                    checked={formData.matchType === 'soccer'}
                                    onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                                    style={{ width: 'auto' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>⚽ 축구 매칭</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>11:11 / 8:8 대형 경기 위주</div>
                                </div>
                            </label>
                            <label className="glass-card" style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '15px',
                                cursor: 'pointer',
                                background: formData.matchType === 'futsal' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderColor: formData.matchType === 'futsal' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease'
                            }}>
                                <input
                                    type="radio"
                                    name="matchType"
                                    value="futsal"
                                    checked={formData.matchType === 'futsal'}
                                    onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                                    style={{ width: 'auto' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>🏃 풋살 매칭</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5:5 / 6:6 소규모 경기 위주</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label>팀 명</label>
                        <input
                            type="text"
                            placeholder="우리 팀 이름을 입력하세요"
                            value={formData.teamName}
                            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label>팀 설립연도</label>
                        <select
                            value={formData.foundationYear}
                            onChange={(e) => setFormData({ ...formData, foundationYear: e.target.value })}
                        >
                            {Array.from({ length: 51 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}년</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>팀 대표 사진 (선택사항)</label>
                        <div
                            className="glass-card"
                            style={{
                                padding: '20px',
                                textAlign: 'center',
                                border: '2px dashed rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => document.getElementById('imageUpload').click()}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        >
                            <input
                                id="imageUpload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        setFormData({ ...formData, profileImage: URL.createObjectURL(e.target.files[0]) });
                                    }
                                }}
                            />
                            {formData.profileImage ? (
                                <img src={formData.profileImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }} />
                            ) : (
                                <div style={{ color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</div>
                                    <p>클릭하여 팀 로고나 프로필 사진을 업로드하세요</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label>정기 구장 보유 여부</label>
                        <select
                            value={formData.hasField}
                            onChange={(e) => setFormData({ ...formData, hasField: e.target.value })}
                        >
                            <option value="true">정기 구장 있음</option>
                            <option value="false">구장 없음 (떠돌이 팀)</option>
                        </select>
                    </div>

                    {formData.hasField === 'true' ? (
                        <div style={{ gridColumn: 'span 2' }}>
                            <label>구장 위치 (주소)</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="주소 검색 버튼을 눌러주세요"
                                    value={formData.address}
                                    readOnly
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn-outline"
                                    style={{ whiteSpace: 'nowrap' }}
                                    onClick={handleAddressSearch}
                                >
                                    주소 검색
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                * 주소를 검색하면 시/군/구 정보가 자동으로 입력됩니다.
                            </p>
                        </div>
                    ) : (
                        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            <div style={{ gridColumn: 'span 3' }}>
                                <label>주 활동 지역 (시/군/구/동)</label>
                            </div>
                            <div>
                                <select
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value, district: '전체', dong: '전체' }))}
                                >
                                    {Object.keys(REGIONS_DATA).map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    value={formData.district}
                                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value, dong: '전체' }))}
                                >
                                    <option value="전체">전체 시/군/구</option>
                                    {REGIONS_DATA[formData.city] && Object.keys(REGIONS_DATA[formData.city]).map(dist => (
                                        <option key={dist} value={dist}>{dist}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    value={formData.dong}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dong: e.target.value }))}
                                >
                                    <option value="전체">전체 읍/면/동</option>
                                    {REGIONS_DATA[formData.city] && REGIONS_DATA[formData.city][formData.district] && REGIONS_DATA[formData.city][formData.district].map(dong => (
                                        <option key={dong} value={dong}>{dong}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label>선수 출신 인원 (고교 출신 이상 포함)</label>
                        <select
                            value={formData.proPlayers}
                            onChange={handleProPlayerChange}
                        >
                            {[...Array(100).keys()].map(num => (
                                <option key={num} value={num}>{num}명</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>팀 실력</label>
                        <select
                            value={formData.skillLevel}
                            onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                        >
                            {getAvailableSkillLevels().map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>연락처 (대표번호)</label>
                        <input
                            type="tel"
                            placeholder="010-0000-0000"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>팀 소개</label>
                        <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {autoPhrases.map((phrase, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="btn-outline"
                                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                                    onClick={() => handleAddPhrase(phrase)}
                                >
                                    + {phrase.slice(0, 15)}...
                                </button>
                            ))}
                        </div>
                        <textarea
                            rows="5"
                            placeholder="우리 팀을 자유롭게 소개해 주세요."
                            value={formData.introduction}
                            onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                            required
                        ></textarea>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '30px', padding: '18px', fontSize: '1.1rem' }}
                >
                    등록 완료
                </button>
            </form>
        </motion.div>
    );
};

export default Register;
