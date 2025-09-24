import React, { useEffect, useState } from "react";
import "./Credit.css";

type RecentMobility = { mode: string; distance_km: number; used_at?: string; co2_saved?: number };

const CreditRecent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RecentMobility[]>([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // 더미 데이터
  const dummyData: RecentMobility[] = [
    { mode: "지하철", distance_km: 7.5, used_at: "2025-01-15T09:30:00", co2_saved: 1132 },
    { mode: "버스", distance_km: 4.0, used_at: "2025-01-15T18:15:00", co2_saved: 348 },
    { mode: "자전거", distance_km: 3.2, used_at: "2025-01-14T08:45:00", co2_saved: 256 },
    { mode: "지하철", distance_km: 5.8, used_at: "2025-01-14T17:20:00", co2_saved: 870 },
    { mode: "버스", distance_km: 2.1, used_at: "2025-01-13T14:30:00", co2_saved: 183 },
    { mode: "도보", distance_km: 1.5, used_at: "2025-01-13T12:00:00", co2_saved: 120 },
    { mode: "지하철", distance_km: 6.3, used_at: "2025-01-12T09:15:00", co2_saved: 950 },
    { mode: "자전거", distance_km: 4.7, used_at: "2025-01-12T19:00:00", co2_saved: 376 },
    { mode: "버스", distance_km: 3.5, used_at: "2025-01-11T16:45:00", co2_saved: 305 },
    { mode: "지하철", distance_km: 8.2, used_at: "2025-01-11T08:00:00", co2_saved: 1236 },
  ];

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/mobility/recent/prototype_user`);
        if (res.ok) {
          const data = await res.json();
          const arr: RecentMobility[] = Array.isArray(data) ? data : [data];
          setItems(arr.map((x) => ({ 
            mode: x.mode, 
            distance_km: Number(x.distance_km || 0), 
            used_at: x.used_at,
            co2_saved: x.co2_saved || 0
          })));
        } else {
          setItems(dummyData);
        }
      } catch (e) {
        setItems(dummyData);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [API_URL]);

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "지하철": return "🚇";
      case "버스": return "🚌";
      case "자전거": return "🚴";
      case "도보": return "🚶";
      default: return "🚗";
    }
  };

  const totalDistance = items.reduce((sum, item) => sum + item.distance_km, 0);
  const totalCo2Saved = items.reduce((sum, item) => sum + (item.co2_saved || 0), 0);

  if (loading) {
    return (
      <div className="credit-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>이동 기록을 불러오는 중...</p>
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
            🚋 대중교통 이용 내역
          </h1>
        </div>
        <div className="hero-decoration">
          <div className="floating-element">🚇</div>
          <div className="floating-element">🚌</div>
          <div className="floating-element">🚴</div>
        </div>
      </section>

      {/* 통계 요약 카드 */}
      <div className="user-card">
        <div className="mobility-stats">
          <div className="stat-item">
            <div className="stat-icon">📏</div>
            <div className="stat-content">
              <div className="stat-label">총 이동거리</div>
              <div className="stat-value">{totalDistance.toFixed(1)}km</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🌍</div>
            <div className="stat-content">
              <div className="stat-label">총 절약량</div>
              <div className="stat-value">{totalCo2Saved.toLocaleString()}g</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">이용 횟수</div>
              <div className="stat-value">{items.length}회</div>
            </div>
          </div>
        </div>
      </div>

      {/* 이동 내역 */}
      <div className="credit-history">
        <div className="history-header">
          <h3 className="history-title">🚋 최근 대중교통 이용 내역</h3>
          <div className="history-badge">{items.length}건</div>
        </div>
        <div className="history-list">
          {items.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🚋</div>
              <div className="no-results-text">이용 기록이 없습니다</div>
              <div className="no-results-suggestion">대중교통을 이용해보세요!</div>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="credit-item positive">
                <div className="item-icon">{getTransportIcon(item.mode)}</div>
                <div className="item-content">
                  <div className="item-desc">
                    {item.mode} {item.distance_km}km
                  </div>
                  <div className="item-meta">
                    <span className="item-date">
                      {item.used_at ? new Date(item.used_at).toLocaleString() : "시간 미상"}
                    </span>
                    <span className="item-co2">
                      CO₂ {item.co2_saved?.toLocaleString()}g 절약
                    </span>
                  </div>
                </div>
                <div className="item-points positive">
                  +{Math.round(item.distance_km * 20)}P
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditRecent;


