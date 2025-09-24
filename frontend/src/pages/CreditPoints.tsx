import React, { useEffect, useState } from "react";
import "./Credit.css";

type TotalPointsResponse = { total_points: number };

const CreditPoints: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(1240); // 더미 데이터
  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/credits/total/prototype_user`);
        if (res.ok) {
          const data: TotalPointsResponse = await res.json();
          setPoints(Number(data.total_points ?? 1240));
        }
      } catch (e) {
        // API 실패 시 더미 데이터 유지
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [API_URL]);

  const pointHistory = [
    { id: 1, activity: "지하철 이용 (7.5km)", points: 150, date: "2025-01-15" },
    { id: 2, activity: "버스 이용 (4.0km)", points: 80, date: "2025-01-15" },
    { id: 3, activity: "자전거 이용 (3.2km)", points: 100, date: "2025-01-14" },
    { id: 4, activity: "도보 이동 (1.5km)", points: 50, date: "2025-01-14" },
    { id: 5, activity: "챌린지 달성 보너스", points: 200, date: "2025-01-13" },
    { id: 6, activity: "업적 달성 보너스", points: 100, date: "2025-01-12" },
    { id: 7, activity: "지하철 이용 (6.3km)", points: 130, date: "2025-01-12" },
    { id: 8, activity: "자전거 이용 (4.7km)", points: 90, date: "2025-01-11" },
    { id: 9, activity: "버스 이용 (3.5km)", points: 60, date: "2025-01-11" },
    { id: 10, activity: "지하철 이용 (8.2km)", points: 160, date: "2025-01-10" },
  ];

  if (loading) {
    return (
      <div className="credit-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>포인트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credit-container">
      {/* 히어로 섹션 */}
      <section className="credit-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            💰 포인트 현황
          </h1>
        </div>
        <div className="hero-decoration">
          <div className="floating-element">💰</div>
          <div className="floating-element">📊</div>
          <div className="floating-element">🎁</div>
        </div>
      </section>

      {/* 포인트 요약 카드 */}
      <div className="user-card">
        <div className="points-summary">
          <div className="points-icon">💰</div>
          <div className="points-content">
            <h2 className="points-title">총 보유 포인트</h2>
            <div className="points-value">{points.toLocaleString()}P</div>
            <p className="points-description">
              대중교통 이용 등 친환경 활동으로 적립된 포인트입니다
            </p>
          </div>
        </div>
      </div>

      {/* 포인트 적립 내역 */}
      <div className="credit-history">
        <div className="history-header">
          <h3 className="history-title">📊 포인트 적립 내역</h3>
          <div className="history-badge">{pointHistory.length}건</div>
        </div>
        <div className="history-list">
          {pointHistory.map((item) => (
            <div key={item.id} className="credit-item positive">
              <div className="item-icon">💰</div>
              <div className="item-content">
                <div className="item-desc">{item.activity}</div>
                <div className="item-meta">
                  <span className="item-date">{item.date}</span>
                  <span className="item-co2">적립</span>
                </div>
              </div>
              <div className="item-points positive">
                +{item.points}P
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditPoints;


