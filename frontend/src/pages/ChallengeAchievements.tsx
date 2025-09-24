import React, { useState, useEffect } from "react";
import { useCredits } from "../contexts/CreditsContext";
import PageHeader from "../components/PageHeader";

const styles = `
.challenge-achievements-page {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 100vh;
  padding: 0;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.tab-container {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  border-bottom: 2px solid #e0e0e0;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tab-button {
  padding: 16px 32px; /* 패딩 증가 */
  background: none;
  border: none;
  font-size: 1.2rem; /* 폰트 크기 증가 */
  font-weight: 600;
  color: #666;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  margin: 0 10px;
  border-radius: 8px;
}

.tab-button.active {
  color: #1ABC9C;
  border-bottom-color: #1ABC9C;
  background: rgba(26, 188, 156, 0.1);
}

.tab-button:hover {
  color: #1ABC9C;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

/* Challenge Styles */
.challenge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.challenge-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-align: left;
  border: 2px solid transparent;
}

.challenge-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-color: rgba(26, 188, 156, 0.3);
}

.challenge-card h3 {
  margin-bottom: 15px; /* 마진 증가 */
  font-size: 1.6rem; /* 폰트 크기 증가 */
  color: #2c3e50; /* 색상 통일 */
  font-weight: 600;
}

.challenge-card .desc {
  font-size: 1.1rem; /* 폰트 크기 증가 */
  color: #555;
  margin-bottom: 25px; /* 마진 증가 */
  line-height: 1.6; /* 줄 간격 증가 */
}

.progress-section {
  margin: 20px 0;
}

.progress-bar {
  background: #e8f5e8;
  border-radius: 12px;
  height: 12px;
  margin: 15px 0;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  background: linear-gradient(90deg, #66bb6a, #43a047);
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 12px;
}

.progress-text {
  font-size: 0.95rem;
  color: #555;
  font-weight: 600;
  text-align: center;
  margin-top: 8px;
}

.reward {
  font-weight: 600;
  margin: 15px 0;
  color: #1ABC9C;
  font-size: 1rem;
  background: rgba(26, 188, 156, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
}

.join-btn {
  width: 100%;
  margin-top: 15px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.join-btn:hover {
  background: linear-gradient(135deg, #1b5e20, #0d3e0d);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(46, 125, 50, 0.3);
}

.join-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.join-btn.participating {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.join-btn.completed {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
}

.challenge-card.participating {
  border-color: rgba(255, 152, 0, 0.3);
  background: linear-gradient(135deg, #ffffff, #fff8e1);
}

.challenge-card.completed {
  border-color: rgba(76, 175, 80, 0.3);
  background: linear-gradient(135deg, #ffffff, #e8f5e8);
}

.challenge-status {
  margin: 15px 0;
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-badge.completed {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-badge.participating {
  background: rgba(255, 152, 0, 0.1);
  color: #f57c00;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-badge.available {
  background: rgba(26, 188, 156, 0.1);
  color: #1ABC9C;
  border: 1px solid rgba(26, 188, 156, 0.3);
}

.progress-indicator {
  color: #ff9800;
  font-weight: 600;
  font-size: 0.9rem;
}

.challenge-dates {
  margin: 10px 0;
  text-align: center;
}

.challenge-dates small {
  display: block;
  color: #666;
  font-size: 0.85rem;
  margin: 2px 0;
}

.success-modal {
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.reward-info {
  background: rgba(26, 188, 156, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
}

.reward-info p {
  margin: 5px 0;
  font-weight: 600;
}

.achievement-modal {
  text-align: center;
  max-width: 500px;
}

.achievement-modal-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: achievementBounce 1s ease-in-out;
}

@keyframes achievementBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.achievement-modal-content {
  background: linear-gradient(135deg, #f8fff8, #e8f5e8);
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
  border: 2px solid #1ABC9C;
}

.achievement-modal-content h4 {
  color: #1ABC9C;
  margin-bottom: 10px;
  font-size: 1.3rem;
  font-weight: 700;
}

.achievement-modal-content p {
  color: #555;
  margin-bottom: 15px;
  line-height: 1.5;
}

.achievement-modal-date {
  background: rgba(26, 188, 156, 0.1);
  color: #1ABC9C;
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
}

.achievement-modal-footer {
  margin-top: 20px;
}

.achievement-modal-footer p {
  color: #666;
  margin-bottom: 15px;
  font-weight: 600;
}

.challenge-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.progress-btn {
  flex: 1;
  padding: 8px 16px;
  background: linear-gradient(135deg, #1ABC9C, #16a085);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.progress-btn:hover {
  background: linear-gradient(135deg, #16a085, #138d75);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);
}

/* Achievement Badge Styles */
.achievement-badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.achievement-badge {
  background: linear-gradient(135deg, #fff 0%, #f8fff8 100%);
  border: 3px solid #1ABC9C;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(26, 188, 156, 0.2);
  position: relative;
  overflow: hidden;
}

.achievement-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(26, 188, 156, 0.1), transparent);
  transition: left 0.5s;
}

.achievement-badge:hover::before {
  left: 100%;
}

.achievement-badge:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 35px rgba(26, 188, 156, 0.3);
  border-color: #16a085;
}

.badge-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #1ABC9C, #16a085);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(26, 188, 156, 0.3);
}

.badge-content {
  flex: 1;
  text-align: left;
}

.badge-content h4 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
}

.badge-desc {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: #666;
  line-height: 1.4;
}

.badge-date {
  font-size: 0.85rem;
  color: #1ABC9C;
  background: rgba(26, 188, 156, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.badge-status {
  font-size: 1.5rem;
  color: #4CAF50;
  flex-shrink: 0;
}

.no-achievements {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  grid-column: 1 / -1;
}

.no-achievements-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-achievements h3 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #555;
}

.no-achievements p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  padding: 30px;
  border-radius: 16px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  color: #1ABC9C;
  margin-bottom: 15px;
  font-size: 1.4rem;
}

.modal p {
  margin-bottom: 10px;
  line-height: 1.5;
}

.modal button {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  background: #2e7d32;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.modal button:hover {
  background: #1b5e20;
}

/* Responsive Design */
@media (max-width: 768px) {
  .challenge-achievements-page {
    padding: 20px 15px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .tab-button {
    padding: 10px 20px;
    font-size: 1rem;
    margin: 0 5px;
  }
  
  .challenge-grid,
  .achievement-badges {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .challenge-card {
    padding: 20px;
  }

  .achievement-badge {
    padding: 15px;
    gap: 12px;
  }

  .badge-icon {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }

  .badge-content h4 {
    font-size: 1.1rem;
  }

  .badge-desc {
    font-size: 0.9rem;
  }
}
`;

interface ChallengeData {
  id: number;
  title: string;
  description: string;
  progress: number;
  reward: string;
  isParticipating: boolean;
  isCompleted: boolean;
  startDate: string; // Backend sends start_at
  endDate: string;   // Backend sends end_at
}

interface AchievementData {
  id: number;
  name: string;
  desc: string;
  progress: number;
  unlocked: boolean;
  date?: string;
}

const ChallengeAchievements: React.FC = () => {
  const { addCredits } = useCredits();
  const [activeTab, setActiveTab] = useState<'challenges' | 'achievements'>('challenges');
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<ChallengeData | null>(null);
  const [newAchievement, setNewAchievement] = useState<AchievementData | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // 더미 데이터
  const dummyChallenges: ChallengeData[] = [
    {
      id: 1,
      title: "9월 대중교통 챌린지",
      description: "이번 달 대중교통으로 10kg CO₂ 절감하기",
      progress: 65,
      reward: "에코 크레딧 200C + 뱃지",
      isParticipating: false,
      isCompleted: false,
      startDate: "2025-01-01",
      endDate: "2025-01-31"
    },
    {
      id: 2,
      title: "자전거 출퇴근 챌린지",
      description: "한 달간 자전거로 출퇴근하여 5kg CO₂ 절감",
      progress: 40,
      reward: "에코 크레딧 150C + 뱃지",
      isParticipating: true,
      isCompleted: false,
      startDate: "2025-01-15",
      endDate: "2025-02-15"
    },
    {
      id: 3,
      title: "도보 생활 챌린지",
      description: "일주일간 1km 이내는 도보로 이동하기",
      progress: 80,
      reward: "에코 크레딧 100C",
      isParticipating: true,
      isCompleted: false,
      startDate: "2025-01-20",
      endDate: "2025-01-27"
    },
    {
      id: 4,
      title: "친환경 이동 30일",
      description: "30일 연속 친환경 교통수단 이용하기",
      progress: 25,
      reward: "에코 크레딧 300C + 특별 뱃지",
      isParticipating: false,
      isCompleted: false,
      startDate: "2025-02-01",
      endDate: "2025-03-02"
    }
  ];

  const dummyAchievements: AchievementData[] = [
    {
      id: 1,
      name: "첫 친환경 이동",
      desc: "첫 번째 친환경 교통수단 이용",
      progress: 100,
      unlocked: true,
      date: "2025-01-10"
    },
    {
      id: 2,
      name: "탄소 절약 마스터",
      desc: "총 10kg CO₂ 절약 달성",
      progress: 100,
      unlocked: true,
      date: "2025-01-12"
    },
    {
      id: 3,
      name: "지하철 애호가",
      desc: "지하철 20회 이용",
      progress: 80,
      unlocked: false
    },
    {
      id: 4,
      name: "자전거 라이더",
      desc: "자전거 50km 주행",
      progress: 60,
      unlocked: false
    },
    {
      id: 5,
      name: "도보의 달인",
      desc: "도보 100km 이동",
      progress: 30,
      unlocked: false
    },
    {
      id: 6,
      name: "연속 출석왕",
      desc: "30일 연속 친환경 이동",
      progress: 25,
      unlocked: false
    },
    {
      id: 7,
      name: "에코 크레딧 수집가",
      desc: "1000P 이상 적립",
      progress: 100,
      unlocked: true,
      date: "2025-01-14"
    },
    {
      id: 8,
      name: "환경 보호자",
      desc: "총 50kg CO₂ 절약 달성",
      progress: 37,
      unlocked: false
    }
  ];

  // 챌린지 참여하기 함수
  const handleJoinChallenge = async (challengeId: number) => {
    // 백엔드 API 호출
    const token = localStorage.getItem('access_token');
    if (!token) { alert("로그인이 필요합니다."); return; }

    try {
      const response = await fetch(`${API_URL}/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}), // user_id는 백엔드에서 JWT로 추출
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '챌린지 참여 실패');
      }

      // 성공 시 프론트엔드 상태 업데이트
      setChallenges(prev => prev.map(challenge => {
        if (challenge.id === challengeId) {
          return {
            ...challenge,
            isParticipating: true,
            startDate: new Date().toISOString().split('T')[0]
          };
        }
        return challenge;
      }));

      // 참여 보너스 크레딧 지급
      await addCredits(10, `챌린지 참여 보너스`);
      
      alert("챌린지에 참여했습니다! +10C 보너스가 지급되었습니다.");
    } catch (error) {
      console.error('챌린지 참여 오류:', error);
      alert(`챌린지 참여 실패: ${(error as Error).message}`);
    }
  };

  // 챌린지 완료 시 업적 생성 함수
  const createAchievementFromChallenge = (challenge: ChallengeData): AchievementData => {
    const achievementId = 100 + challenge.id; // 챌린지 기반 업적 ID
    const today = new Date().toISOString().split('T')[0];
    
    return {
      id: achievementId,
      name: `${challenge.title} 완료`,
      desc: `"${challenge.title}" 챌린지를 성공적으로 완료했습니다!`,
      progress: 100,
      unlocked: true,
      date: today
    };
  };

  // 챌린지 진행도 업데이트 함수
  const updateChallengeProgress = (challengeId: number, newProgress: number) => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.id === challengeId) {
        const updatedChallenge = {
          ...challenge,
          progress: Math.min(newProgress, 100)
        };

        // 100% 달성 시 완료 처리
        if (newProgress >= 100 && !challenge.isCompleted) {
          updatedChallenge.isCompleted = true;
          setCompletedChallenge(updatedChallenge);
          setShowSuccessModal(true);
          
          // 완료 보상 지급
          const rewardMatch = challenge.reward.match(/(\d+)C/);
          if (rewardMatch) {
            const rewardAmount = parseInt(rewardMatch[1]);
            addCredits(rewardAmount, `${challenge.title} 완료 보상`);
          }

          // 업적 생성 및 추가
          const newAchievement = createAchievementFromChallenge(updatedChallenge);
          setAchievements(prev => {
            // 이미 존재하는 업적인지 확인
            const existingAchievement = prev.find(ach => ach.id === newAchievement.id);
            if (existingAchievement) {
              return prev; // 이미 존재하면 추가하지 않음
            }
            
            // 새 업적 추가
            const updatedAchievements = [...prev, newAchievement];
            setNewAchievement(newAchievement);
            setShowAchievementModal(true);
            
            // 2초 후 업적 탭으로 자동 전환
            setTimeout(() => {
              setActiveTab('achievements');
              setShowAchievementModal(false);
            }, 2000);
            
            return updatedAchievements;
          });

          // 3초 후 챌린지에서 완료된 항목 제거
          setTimeout(() => {
            setChallenges(prev => prev.filter(c => c.id !== challengeId));
          }, 3000);
        }

        return updatedChallenge;
      }
      return challenge;
    }));
  };

  

  useEffect(() => {
    // 챌린지 데이터 로드
    fetch(`${API_URL}/api/challenges`, { headers: getAuthHeaders() })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("API 실패");
      })
      .then(async (data) => {
        const mappedChallenges = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          progress: c.progress,
          reward: c.reward,
          isParticipating: c.is_joined,
          isCompleted: c.is_completed || false,
          startDate: c.start_at,
          endDate: c.end_at
        }));

        // Fetch real-time progress for participating challenges
        const progressPromises = mappedChallenges.map((challenge: ChallengeData) => {
          if (challenge.isParticipating && !challenge.isCompleted) {
            return fetch(`${API_URL}/api/challenges/${challenge.id}/progress`, { headers: getAuthHeaders() })
              .then(res => res.ok ? res.json() : Promise.resolve({ progress: challenge.progress }))
              .then(progressData => ({ ...challenge, progress: progressData.progress }))
              .catch(() => challenge); // On error, keep original challenge data
          }
          return Promise.resolve(challenge);
        });

        const challengesWithRealProgress = await Promise.all(progressPromises);
        setChallenges(challengesWithRealProgress);
      })
      .catch((error) => {
        console.error("챌린지 데이터 로드 실패:", error);
        setChallenges(dummyChallenges);
      });

    // 업적 데이터 로드
    fetch(`${API_URL}/api/achievements`, { headers: getAuthHeaders() })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("API 실패");
      })
      .then((data) => {
        setAchievements(data);
      })
      .catch(() => {
        setAchievements(dummyAchievements);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
        ⏳ 로딩 중...
      </div>
    );
  }

  const selectedAchievementData = achievements.find(a => a.id === selectedAchievement);

  return (
    <>
      <style>{styles}</style>
      <div className="challenge-achievements-page">
        <PageHeader 
          title="챌린지 & 업적" 
          subtitle="목표를 달성하고 업적을 쌓아가며 친환경 생활을 완성해보세요!"
          icon="🏆"
        />

        <div className="content-container">
          <div className="tab-container">
          <button
            className={`tab-button ${activeTab === 'challenges' ? 'active' : ''}`}
            onClick={() => setActiveTab('challenges')}
          >
            🔥 챌린지
          </button>
          <button
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🏆 업적
          </button>
        </div>

        {/* 챌린지 탭 */}
        <div className={`tab-content ${activeTab === 'challenges' ? 'active' : ''}`}>
          <div className="challenge-grid">
            {challenges.map((challenge) => (
              <div key={challenge.id} className={`challenge-card ${challenge.isParticipating ? 'participating' : ''} ${challenge.isCompleted ? 'completed' : ''}`}>
                <h3>{challenge.title}</h3>
                <p className="desc">{challenge.description}</p>

                {/* 상태 표시 */}
                <div className="challenge-status">
                  {challenge.isCompleted ? (
                    <span className="status-badge completed">✅ 완료</span>
                  ) : challenge.isParticipating ? (
                    <span className="status-badge participating">🔥 참여 중</span>
                  ) : (
                    <span className="status-badge available">📅 참여 가능</span>
                  )}
                </div>

                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(challenge.progress, 100)}%` }}
                    />
                  </div>
                  <p className="progress-text">
                    {challenge.progress.toFixed(1)}% 달성
                    {challenge.isParticipating && !challenge.isCompleted && (
                      <span className="progress-indicator"> (진행 중...)</span>
                    )}
                  </p>
                </div>

                <div className="reward">🎁 {challenge.reward}</div>
                
                {/* 날짜 정보 */}
                {challenge.startDate && (
                  <div className="challenge-dates">
                    <small>시작: {challenge.startDate}</small>
                    {challenge.endDate && <small>종료: {challenge.endDate}</small>}
                  </div>
                )}

                <div className="challenge-actions">
                  {challenge.progress < 100 && !challenge.isCompleted && (
                    <button 
                      className={`join-btn ${challenge.isParticipating ? 'participating' : ''}`}
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={challenge.isParticipating}
                    >
                      {challenge.isParticipating ? '참여 중...' : '참여하기'}
                    </button>
                  )}
                  {challenge.progress >= 100 && !challenge.isCompleted && (
                    <button 
                      className="join-btn completed" 
                      onClick={() => updateChallengeProgress(challenge.id, challenge.progress)}
                    >
                      완료!
                    </button>
                  )}
                  {challenge.isCompleted && (
                     <button className="join-btn completed" disabled>완료됨</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 업적 탭 */}
        <div className={`tab-content ${activeTab === 'achievements' ? 'active' : ''}`}>
          <div className="achievement-badges">
            {achievements
              .filter(achievement => achievement.unlocked && achievement.progress === 100)
              .map((achievement) => (
                <div
                  key={achievement.id}
                  className="achievement-badge"
                  onClick={() => setSelectedAchievement(achievement.id)}
                >
                  <div className="badge-icon">🏆</div>
                  <div className="badge-content">
                    <h4>{achievement.name}</h4>
                    <p className="badge-desc">{achievement.desc}</p>
                    {achievement.date && (
                      <span className="badge-date">{achievement.date}</span>
                    )}
                  </div>
                  <div className="badge-status">✅</div>
                </div>
              ))}
            
            {achievements.filter(achievement => achievement.unlocked && achievement.progress === 100).length === 0 && (
              <div className="no-achievements">
                <div className="no-achievements-icon">🏆</div>
                <h3>아직 획득한 업적이 없습니다</h3>
                <p>챌린지를 완료하여 첫 번째 업적을 획득해보세요!</p>
              </div>
            )}
          </div>
        </div>

        {/* 챌린지 완료 성공 모달 */}
        {showSuccessModal && completedChallenge && (
          <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
            <div className="modal success-modal" onClick={(e) => e.stopPropagation()}>
              <div className="success-icon">🎉</div>
              <h3>챌린지 완료!</h3>
              <p><strong>{completedChallenge.title}</strong></p>
              <p>축하합니다! 챌린지를 성공적으로 완료했습니다.</p>
              <div className="reward-info">
                <p>🎁 보상: {completedChallenge.reward}</p>
                <p>✅ 크레딧이 자동으로 지급되었습니다!</p>
                <p>🏆 업적으로 이동되었습니다!</p>
                <p>⏰ 3초 후 챌린지 목록에서 제거됩니다.</p>
              </div>
              <button onClick={() => setShowSuccessModal(false)}>확인</button>
            </div>
          </div>
        )}

        {/* 새 업적 획득 모달 */}
        {showAchievementModal && newAchievement && (
          <div className="modal-overlay" onClick={() => setShowAchievementModal(false)}>
            <div className="modal achievement-modal" onClick={(e) => e.stopPropagation()}>
              <div className="achievement-modal-icon">🏆</div>
              <h3>새 업적 획득!</h3>
              <div className="achievement-modal-content">
                <h4>{newAchievement.name}</h4>
                <p>{newAchievement.desc}</p>
                <div className="achievement-modal-date">
                  📅 획득일: {newAchievement.date}
                </div>
              </div>
              <div className="achievement-modal-footer">
                <p>🎉 축하합니다! 업적 탭에서 확인하세요.</p>
                <button onClick={() => setShowAchievementModal(false)}>
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 업적 상세 모달 */}
        {selectedAchievementData && (
          <div className="modal-overlay" onClick={() => setSelectedAchievement(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{selectedAchievementData.name}</h3>
              <p>{selectedAchievementData.desc}</p>
              <p>진척도: {selectedAchievementData.progress}%</p>
              {selectedAchievementData.unlocked ? (
                <p>✅ 이미 달성한 업적입니다!</p>
              ) : (
                <p>🔒 아직 달성하지 못했습니다.</p>
              )}
              {selectedAchievementData.date && (
                <p>📅 달성일: {selectedAchievementData.date}</p>
              )}
              <button onClick={() => setSelectedAchievement(null)}>닫기</button>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default ChallengeAchievements;
