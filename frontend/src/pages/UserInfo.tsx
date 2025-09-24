import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useCredits } from '../contexts/CreditsContext';
import PageHeader from '../components/PageHeader';
import './UserInfo.css';

const UserInfo: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, updateUser, isLoading } = useUser();
  const { creditsData } = useCredits();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(user);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [editData, setEditData] = useState(userData);

  // user 데이터가 변경될 때마다 userData 업데이트
  useEffect(() => {
    setUserData(user);
  }, [user]);

  // 컴포넌트 마운트 시 교통수단 분석 데이터 가져오기
  // useEffect(() => {
  //   fetchTransportAnalysis();
  // }, [fetchTransportAnalysis]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(userData);
  };

  const handleSave = () => {
    setUserData(editData);
    
    // AuthContext의 사용자 정보도 업데이트
    const updatedAuthUser = {
      id: '1',
      name: editData.name,
      email: editData.email,
      password: editData.password,
      phone: editData.phone,
      role: '사용자'
    };
    
    // localStorage에 업데이트된 사용자 정보 저장
    localStorage.setItem('eco-user', JSON.stringify(updatedAuthUser));
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setEditData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: checked
      }
    }));
  };

  const handleTransportClick = () => {
    // 교통수단 이용내역 페이지로 이동 (Credit 페이지의 교통수단 탭)
    navigate('/credit?tab=transport');
  };

  const handleGardenClick = () => {
    // 나만의 정원 페이지로 이동
    navigate('/mygarden');
  };

  const handleCreditsClick = () => {
    // 크레딧 페이지로 이동
    navigate('/credit');
  };

  const handleCarbonClick = () => {
    // 크레딧 페이지의 누적 절약량 탭으로 이동
    navigate('/credit?tab=points');
  };

  const handleDownloadReport = async (format: 'pdf' | 'json' = 'pdf') => {
    try {
      setDownloadLoading(true);

      let response;
      let filename;
      let mimeType;

      if (format === 'pdf') {
        response = await fetch('http://127.0.0.1:8001/api/export/activity-report/1');
        filename = `eco_activity_report_${new Date().toISOString().split('T')[0]}.pdf`;
        mimeType = 'application/pdf';
      } else {
        response = await fetch('http://127.0.0.1:8001/api/export/activity-summary/1');
        filename = `eco_activity_summary_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }
      
      if (!response.ok) {
        throw new Error('리포트 생성에 실패했습니다.');
      }

      // 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 성공 메시지
      alert(`${format.toUpperCase()} 활동 내역이 다운로드되었습니다! 📊`);
      setShowDownloadModal(false);

    } catch (error) {
      console.error('리포트 다운로드 오류:', error);
      alert('리포트 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="user-info-page">
      <PageHeader 
        title="마이페이지" 
        subtitle="나의 계정 정보와 활동 현황을 확인하고 관리하세요"
        icon="👤"
      />
      
      <div className="user-info-container">
        <div className="user-info-grid">
          {/* 기본 정보 */}
          <div className="info-card">
            <div className="card-header">
              <h3>기본 정보</h3>
              {!isEditing && (
                <button className="edit-btn" onClick={handleEdit}>
                  ✏️ 수정
                </button>
              )}
            </div>
            <div className="card-content">
              <div className="info-item">
                <label>이름</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="info-value">{userData.name}</span>
                )}
              </div>
              <div className="info-item">
                <label>이메일</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="info-value">{userData.email}</span>
                )}
              </div>
              <div className="info-item">
                <label>전화번호</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="info-value">{userData.phone || '등록되지 않음'}</span>
                )}
              </div>
              <div className="info-item">
                <label>비밀번호</label>
                {isEditing ? (
                  <input
                    type="password"
                    value={editData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="edit-input"
                    placeholder="새 비밀번호 입력"
                  />
                ) : (
                  <span className="info-value">
                    {userData.password ? '••••••••' : '등록되지 않음'}
                  </span>
                )}
              </div>
              <div className="info-item">
                <label>가입일</label>
                <span className="info-value">{userData.joinDate}</span>
              </div>
            </div>
          </div>

          {/* 활동 현황 */}
          <div className="info-card">
            <div className="card-header">
              <h3>활동 현황</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item clickable" onClick={handleGardenClick}>
                  <div className="stat-icon">🏆</div>
                  <div className="stat-info">
                    <span className="stat-label">레벨</span>
                    <span className="stat-value">Lv.{Math.floor(creditsData.totalCredits / 100) + 1}</span>
                  </div>
                  <div className="click-hint">🌿 정원 보기</div>
                </div>
                <div className="stat-item clickable" onClick={handleCreditsClick}>
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <span className="stat-label">총 크레딧</span>
                    <span className="stat-value">{creditsData.totalCredits.toLocaleString()}C</span>
                  </div>
                  <div className="click-hint">💰 크레딧 보기</div>
                </div>
                <div className="stat-item clickable" onClick={handleCarbonClick}>
                  <div className="stat-icon">🌱</div>
                  <div className="stat-info">
                    <span className="stat-label">탄소 절감량</span>
                    <span className="stat-value">{creditsData.totalCarbonReduced.toFixed(1)}kg</span>
                  </div>
                  <div className="click-hint">📊 상세 보기</div>
                </div>
                <div className="stat-item clickable" onClick={handleTransportClick}>
                  <div className="stat-icon">🚌</div>
                  <div className="stat-info">
                    <span className="stat-label">선호 교통수단</span>
                    <span className="stat-value">{userData.preferredTransport}</span>
                    {userData.transportAnalysis && (
                      <span className="stat-subtitle">
                        {userData.transportAnalysis.transport_stats[userData.preferredTransport]?.percentage}% 이용
                      </span>
                    )}
                  </div>
                  <div className="click-hint">📊 클릭하여 상세 분석 보기</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI 교통수단 분석 인사이트 */}
          {userData.transportAnalysis && userData.transportAnalysis.ai_insights && (
            <div className="info-card">
              <div className="card-header">
                <h3>🤖 AI 교통수단 분석</h3>
              </div>
              <div className="card-content">
                <div className="ai-insights">
                  {userData.transportAnalysis.ai_insights.map((insight, index) => (
                    <div key={index} className="insight-item">
                      <div className="insight-icon">💡</div>
                      <div className="insight-text">{insight}</div>
                    </div>
                  ))}
                </div>
                <div className="transport-stats-summary">
                  <h4>📊 교통수단 이용 통계</h4>
                  <div className="stats-list">
                    {Object.entries(userData.transportAnalysis.transport_stats).map(([transport, stats]) => (
                      <div key={transport} className="transport-stat">
                        <span className="transport-name">{transport}</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill" 
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                        <span className="stat-percentage">{stats.percentage}%</span>
                        <span className="stat-count">({stats.count}회)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 알림 설정 */}
          <div className="info-card">
            <div className="card-header">
              <h3>알림 설정</h3>
            </div>
            <div className="card-content">
              <div className="notification-settings">
                <div className="notification-item">
                  <label className="notification-label">
                    <input
                      type="checkbox"
                      checked={isEditing ? editData.notifications.email : userData.notifications.email}
                      onChange={(e) => handleNotificationChange('email', e.target.checked)}
                      disabled={!isEditing}
                    />
                    <span className="notification-text">이메일 알림</span>
                  </label>
                </div>
                <div className="notification-item">
                  <label className="notification-label">
                    <input
                      type="checkbox"
                      checked={isEditing ? editData.notifications.push : userData.notifications.push}
                      onChange={(e) => handleNotificationChange('push', e.target.checked)}
                      disabled={!isEditing}
                    />
                    <span className="notification-text">푸시 알림</span>
                  </label>
                </div>
                <div className="notification-item">
                  <label className="notification-label">
                    <input
                      type="checkbox"
                      checked={isEditing ? editData.notifications.sms : userData.notifications.sms}
                      onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                      disabled={!isEditing}
                    />
                    <span className="notification-text">SMS 알림</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 계정 관리 */}
          <div className="info-card">
            <div className="card-header">
              <h3>계정 관리</h3>
            </div>
            <div className="card-content">
              <div className="account-actions">
                <button className="action-btn primary">
                  🔒 비밀번호 변경
                </button>
                <button className="action-btn secondary" onClick={() => setShowDownloadModal(true)}>
                  📊 활동 내역 다운로드
                </button>
                <button className="action-btn logout" onClick={logout}>
                  🚪 로그아웃
                </button>
                <button className="action-btn danger">
                  🗑️ 계정 삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 편집 버튼들 */}
        {isEditing && (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave}>
              💾 저장
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              ❌ 취소
            </button>
          </div>
        )}
      </div>

      {/* 다운로드 모달 */}
      {showDownloadModal && (
        <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 활동 내역 다운로드</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowDownloadModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>다운로드할 파일 형식을 선택해주세요:</p>
              <div className="download-options">
                <div className="download-option">
                  <div className="option-icon">📄</div>
                  <div className="option-info">
                    <h4>PDF 리포트</h4>
                    <p>포맷된 활동 내역 리포트 (PDF)</p>
                    <ul>
                      <li>• 사용자 정보 및 통계</li>
                      <li>• 크레딧 현황</li>
                      <li>• 교통수단별 이용 현황</li>
                      <li>• 최근 활동 내역</li>
                      <li>• 요약 통계</li>
                    </ul>
                  </div>
                  <button 
                    className="download-btn primary"
                    onClick={() => handleDownloadReport('pdf')}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? '생성 중...' : 'PDF 다운로드'}
                  </button>
                </div>
                <div className="download-option">
                  <div className="option-icon">📋</div>
                  <div className="option-info">
                    <h4>JSON 데이터</h4>
                    <p>원시 데이터 (JSON)</p>
                    <ul>
                      <li>• 모든 활동 데이터</li>
                      <li>• 프로그래밍 분석용</li>
                      <li>• 다른 도구로 가공 가능</li>
                    </ul>
                  </div>
                  <button 
                    className="download-btn secondary"
                    onClick={() => handleDownloadReport('json')}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? '생성 중...' : 'JSON 다운로드'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;
