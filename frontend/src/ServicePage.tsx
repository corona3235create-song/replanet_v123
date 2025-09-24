import React, { useState } from 'react';
import Chat from './pages/Chat';
import MyGarden from './pages/MyGarden';
import ChallengeAchievements from './pages/ChallengeAchievements'; // 챌린저&업적
import DashboardPage from './pages/DashboardPage'; // 대시보드
import Credit from './pages/Credit'; // Credit
import MobilityTracker from './components/MobilityTracker'; // 이동 기록 측정
import './App.css'; // 스타일 재사용

const ServicePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'garden' | 'challenge' | 'dashboard' | 'credit' | 'mobility'>('chat');

  return (
    <div className="content-section">
      <div className="container">
        <h2 className="text-center">Service</h2>

        {/* 탭 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '20px',
              border: activeTab === 'chat' ? '2px solid #1abc9c' : '1px solid #ccc',
              backgroundColor: activeTab === 'chat' ? '#1abc9c' : '#fff',
              color: activeTab === 'chat' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            AI 챗봇
          </button>
          <button
            onClick={() => setActiveTab('garden')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '20px',
              border: activeTab === 'garden' ? '2px solid #1abc9c' : '1px solid #ccc',
              backgroundColor: activeTab === 'garden' ? '#1abc9c' : '#fff',
              color: activeTab === 'garden' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            나만의 정원
          </button>
          <button
            onClick={() => setActiveTab('challenge')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '20px',
              border: activeTab === 'challenge' ? '2px solid #1abc9c' : '1px solid #ccc',
              backgroundColor: activeTab === 'challenge' ? '#1abc9c' : '#fff',
              color: activeTab === 'challenge' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            챌린저&업적
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '20px',
              border: activeTab === 'dashboard' ? '2px solid #1abc9c' : '1px solid #ccc',
              backgroundColor: activeTab === 'dashboard' ? '#1abc9c' : '#fff',
              color: activeTab === 'dashboard' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '20px',
              border: activeTab === 'credit' ? '2px solid #1abc9c' : '1px solid #ccc',
              backgroundColor: activeTab === 'credit' ? '#1abc9c' : '#fff',
              color: activeTab === 'credit' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Credit
          </button>
          <button
            onClick={() => setActiveTab('mobility')}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '20px',
              border: activeTab === 'mobility' ? '2px solid #1abc9c' : '1px solid #ccc',
              backgroundColor: activeTab === 'mobility' ? '#1abc9c' : '#fff',
              color: activeTab === 'mobility' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            이동 기록 측정
          </button>
        </div>

        {/* 탭 내용 */}
        <div style={{ marginTop: '20px' }}>
          {activeTab === 'chat' && <Chat />}
          {activeTab === 'garden' && <MyGarden />}
          {activeTab === 'challenge' && <ChallengeAchievements />}
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'credit' && <Credit />}
          {activeTab === 'mobility' && <MobilityTracker />}
        </div>
      </div>
    </div>
  );
};

export default ServicePage;
