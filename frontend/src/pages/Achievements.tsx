import React, { useState, useEffect } from "react";

const styles = `
.achievements-container {
  background-color: #fdfdf5;
  min-height: 100vh;
  padding: 40px 20px;
  text-align: center;
}

.achievements-container h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #2e7d32;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.badge-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  padding: 20px;
  font-size: 1rem;
  color: #333;
  position: relative;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.badge-card:hover {
  transform: translateY(-5px);
}

.badge-card.locked {
  opacity: 0.5;
}

.badge-card h3 {
  color:#1ABC9C;
  margin-bottom: 10px;
}

.progress-bar {
  background: #e0e0e0;
  border-radius: 8px;
  height: 10px;
  margin: 1rem 0;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #66bb6a, #43a047);
  height: 100%;
  transition: width 0.3s ease;
}

.date {
  font-size: 0.85rem;
  color: #777;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: #fff;
  padding: 20px 30px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal h3 {
  color: #1ABC9C;
  margin-bottom: 10px;
}

.modal button {
  margin-top: 15px;
  padding: 8px 14px;
  border: none;
  background: #2e7d32;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}
`;

interface AchievementData {
  id: number;
  name: string;
  desc: string;
  progress: number;
  unlocked: boolean;
  date?: string;
}

const Achievements: React.FC = () => {
  const [selected, setSelected] = useState<null | number>(null);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [loading, setLoading] = useState(true);

  // 더미 데이터
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

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    fetch(`${API_URL}/achievements/1`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("API 실패");
      })
      .then((data) => {
        setAchievements(data);
      })
      .catch(() => {
        // API 실패 시 더미 데이터 사용
        setAchievements(dummyAchievements);
      })
      .finally(() => {
        setLoading(false);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentBadge = achievements.find((b) => b.id === selected);

  if (loading) return <p>⏳ 업적 불러오는 중...</p>;

  return (
    <>
      <style>{styles}</style>
      <div className="achievements-container">
        <h2>🏆 나의 업적</h2>
        <div className="badge-grid">
          {achievements.map((b) => (
            <div
              key={b.id}
              className={`badge-card ${!b.unlocked ? "locked" : ""}`}
              onClick={() => setSelected(b.id)}
            >
              <h3>{b.name}</h3>
              <p>{b.desc}</p>

              {/* 진행률 */}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${b.progress}%` }}
                />
              </div>
              <p>{b.progress}%</p>

              {/* 달성 날짜 */}
              {b.unlocked && b.date && (
                <p className="date">획득일: {b.date}</p>
              )}
              {!b.unlocked && <p>🔒 아직 달성하지 못했습니다.</p>}
            </div>
          ))}
        </div>
      </div>

      {/* 모달 */}
      {currentBadge && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{currentBadge.name}</h3>
            <p>{currentBadge.desc}</p>
            <p>진척도: {currentBadge.progress}%</p>
            {currentBadge.unlocked ? (
              <p>✅ 이미 달성한 업적입니다!</p>
            ) : (
              <p>🔒 아직 달성하지 못했습니다.</p>
            )}
            {currentBadge.date && (
              <p>📅 달성일: {currentBadge.date}</p>
            )}
            <button onClick={() => setSelected(null)}>닫기</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Achievements;
