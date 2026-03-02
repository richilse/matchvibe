import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { REGIONS_DATA } from '../constants/regions';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        match_type: 'soccer',
        has_field: 'false',
        address: '',
        pro_players: '0',
        skill_level: '중',
        intro: '',
        contact: '',
        dong: '역삼동',
        foundation_year: new Date().getFullYear(),
        photoFile: null,
        photoPreview: null,
        email: '',
        password: '',
        passwordConfirm: ''
    });

    const currentRegion = `${formData.city} ${formData.district === '전체' ? '' : formData.district} ${formData.dong === '전체' ? '' : formData.dong}`.trim();

    const autoPhrases = [
        `저희는 ${formData.match_type === 'soccer' ? '축구' : '풋살'}을 정말 사랑하는 팀입니다! ⚽`,
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
        if (parseInt(formData.pro_players) > 0) {
            return levels.slice(0, 4);
        }
        return levels;
    };

    const handleAddPhrase = (phrase) => {
        setFormData(prev => ({
            ...prev,
            intro: prev.intro ? `${prev.intro}\n${phrase}` : phrase
        }));
    };

    const handleProPlayerChange = (e) => {
        const proCount = e.target.value;
        const availableLevels = ['최상', '상', '중', '하'];

        setFormData(prev => {
            let nextSkill = prev.skill_level;
            if (parseInt(proCount) > 0 && !availableLevels.includes(prev.skill_level)) {
                nextSkill = '하';
            }
            return { ...prev, pro_players: proCount, skill_level: nextSkill };
        });
    };

    const handleAddressSearch = () => {
        const popup = new window.daum.Postcode({
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
            },
            width: '100%',
            height: '100%',
        });

        // 모바일 환경에서는 팝업 대신 레이어 방식 사용
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            popup.embed(document.getElementById('daumPostcodeLayer'), { autoClose: true });
            document.getElementById('daumPostcodeLayer').style.display = 'block';
        } else {
            popup.open();
        }
    };

    const closeDaumLayer = () => {
        document.getElementById('daumPostcodeLayer').style.display = 'none';
    };

    const handlePhotoUpload = async (file, teamId) => {
        if (!file) return null;
        const ext = file.name.split('.').pop();
        const filePath = `team-photos/${teamId}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from('team-photos')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('team-photos')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 비밀번호 확인
        if (!user && formData.password !== formData.passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const region = `${formData.city} ${formData.district === '전체' ? '' : formData.district} ${formData.dong === '전체' ? '' : formData.dong}`.trim();

        try {
            let userId = user?.id;

            // 1. 비로그인 상태 → 회원가입 처리
            if (!user) {
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password
                });
                if (authError) {
                    if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
                        throw new Error('이미 가입된 이메일입니다. 로그인 후 팀을 등록해 주세요.');
                    }
                    throw new Error(authError.message || '계정 생성 중 오류가 발생했습니다.');
                }
                userId = authData.user?.id;
            }

            // 2. 팀 데이터 저장
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .insert([{
                    name: formData.name,
                    match_type: formData.match_type,
                    has_field: formData.has_field === 'true',
                    address: formData.address || '-',
                    city: formData.city,
                    district: formData.district,
                    dong: formData.dong,
                    region: region,
                    pro_players: parseInt(formData.pro_players),
                    skill_level: formData.skill_level,
                    intro: formData.intro,
                    contact: formData.contact,
                    foundation_year: parseInt(formData.foundation_year),
                    user_id: userId || null
                }])
                .select()
                .single();

            if (teamError) throw teamError;

            // 3. 사진 업로드 및 URL 업데이트 (사진이 있는 경우)
            if (formData.photoFile && teamData) {
                const photoUrl = await handlePhotoUpload(formData.photoFile, teamData.id);
                await supabase
                    .from('teams')
                    .update({ photo_url: photoUrl })
                    .eq('id', teamData.id);
            }

            alert(`팀 등록이 완료되었습니다!\n이제 '매칭 신청' 페이지에서 우리 팀을 확인할 수 있습니다.`);
            window.location.href = '/matches';
        } catch (error) {
            console.error('Error:', error.message);
            alert('오류가 발생했습니다: ' + error.message);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card register-card"
        >
            <h2 style={{ fontSize: '2rem', marginBottom: '30px', textAlign: 'center' }}>
                <span style={{ color: 'var(--accent)' }}>팀 등록</span>하기
            </h2>

            <form onSubmit={handleSubmit}>
                {/* 주소검색 모바일 레이어 */}
                <div
                    id="daumPostcodeLayer"
                    style={{
                        display: 'none',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)'
                    }}
                >
                    <button
                        type="button"
                        onClick={closeDaumLayer}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            zIndex: 10000
                        }}
                    >✕</button>
                </div>

                <div className="register-grid">
                    <div className="register-col-2">
                        <label style={{ marginBottom: '15px', display: 'block' }}>선호 매칭 유형 선택</label>
                        <div className="match-type-row">
                            <label className="glass-card match-type-card" style={{
                                background: formData.match_type === 'soccer' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderColor: formData.match_type === 'soccer' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                            }}>
                                <input
                                    type="radio"
                                    name="match_type"
                                    value="soccer"
                                    checked={formData.match_type === 'soccer'}
                                    onChange={(e) => setFormData({ ...formData, match_type: e.target.value })}
                                    style={{ width: 'auto' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>⚽ 축구 매칭</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>11:11 / 8:8 대형 경기 위주</div>
                                </div>
                            </label>
                            <label className="glass-card match-type-card" style={{
                                background: formData.match_type === 'futsal' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderColor: formData.match_type === 'futsal' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                            }}>
                                <input
                                    type="radio"
                                    name="match_type"
                                    value="futsal"
                                    checked={formData.match_type === 'futsal'}
                                    onChange={(e) => setFormData({ ...formData, match_type: e.target.value })}
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
                            placeholder="멋진 팀 이름을 입력하세요"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label>팀 설립 연도</label>
                        <select
                            value={formData.foundation_year}
                            onChange={(e) => setFormData({ ...formData, foundation_year: e.target.value })}
                        >
                            {Array.from({ length: 51 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}년</option>
                            ))}
                        </select>
                    </div>

                    <div className="register-col-2">
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
                                    const file = e.target.files[0];
                                    if (file) {
                                        setFormData({
                                            ...formData,
                                            photoFile: file,
                                            photoPreview: URL.createObjectURL(file)
                                        });
                                    }
                                }}
                            />
                            {formData.photoPreview ? (
                                <img src={formData.photoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }} />
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
                            value={formData.has_field}
                            onChange={(e) => setFormData({ ...formData, has_field: e.target.value })}
                        >
                            <option value="true">있음 (홈 경기 가능)</option>
                            <option value="false">없음 (떠돌이 팀)</option>
                        </select>
                    </div>

                    {formData.has_field === 'true' ? (
                        <div className="register-col-2">
                            <label>구장 위치 (주소)</label>
                            <div className="address-row">
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
                        <div className="register-col-2">
                            <div className="region-grid">
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
                        </div>
                    )}

                    <div>
                        <label>선수 출신 인원 (고교 출신 이상 포함)</label>
                        <select
                            value={formData.pro_players}
                            onChange={handleProPlayerChange}
                        >
                            {[...Array(21).keys()].map(num => (
                                <option key={num} value={num}>{num}명</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>팀 실력 등급</label>
                        <select
                            value={formData.skill_level}
                            onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                        >
                            {getAvailableSkillLevels().map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>

                    <div className="register-col-2">
                        <label>연락처 (대표번호)</label>
                        <input
                            type="tel"
                            placeholder="010-0000-0000"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            required
                        />
                    </div>

                    <div className="register-col-2">
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
                        <div style={{ gridColumn: 'span 2' }}>
                            <label>팀 소개 및 공지 (직접 입력)</label>
                            <textarea
                                rows="8"
                                placeholder="우리 팀에 대해 자유롭게 소개해 주세요! (예: 주로 활동하는 시간대, 지향하는 매너, 선출 유무 등)"
                                value={formData.intro}
                                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* 계정 생성 섹션 (비로그인 상태일 때만 표시) */}
                    {!user && (
                        <div className="register-col-2">
                            <div style={{
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                paddingTop: '30px',
                                marginTop: '10px'
                            }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '5px', color: 'var(--accent)' }}>
                                    🔐 계정 만들기
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                    팀 등록과 함께 계정을 생성합니다. 이후 로그인하여 내 팀을 관리할 수 있습니다.
                                </p>
                                <div className="register-grid">
                                    <div className="register-col-2">
                                        <label>이메일 (아이디)</label>
                                        <input
                                            type="email"
                                            placeholder="example@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                    <div>
                                        <label>비밀번호</label>
                                        <input
                                            type="password"
                                            placeholder="8자 이상 입력"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <div>
                                        <label>비밀번호 확인</label>
                                        <input
                                            type="password"
                                            placeholder="비밀번호 재입력"
                                            value={formData.passwordConfirm}
                                            onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            style={{
                                                borderColor: formData.passwordConfirm && formData.password !== formData.passwordConfirm
                                                    ? 'rgba(255,80,80,0.6)'
                                                    : undefined
                                            }}
                                        />
                                        {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                                            <p style={{ fontSize: '0.8rem', color: '#ff8080', marginTop: '5px' }}>
                                                비밀번호가 일치하지 않습니다.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '30px', padding: '18px', fontSize: '1.1rem' }}
                >
                    {user ? '팀 등록 완료' : '팀 등록 & 계정 생성'}
                </button>
            </form>
        </motion.div>
    );
};

export default Register;
