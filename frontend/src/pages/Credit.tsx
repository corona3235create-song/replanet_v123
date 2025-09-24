import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCredits } from '../contexts/CreditsContext';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import "./Credit.css";

// 1. 데이터 타입을 위한 interface 정의
interface TransportHistoryItem {
  log_id: number;
  mode: 'SUBWAY' | 'BUS' | 'BIKE' | 'WALK' | 'CAR';
  description: string | null;
  start_point: string | null;
  end_point: string | null;
  started_at: string; // ISO date string
  distance_km: number;
  co2_saved_g: number;
  eco_credits_earned: number;
}

interface CreditHistoryItem {
  entry_id: number;
  points: number;
  reason: string;
  created_at: string; // ISO date string
}


const Credit: React.FC = () => {
  const location = useLocation();
  const isPreview = new URLSearchParams(location.search).get("preview") === "1";
  const tabParam = new URLSearchParams(location.search).get("tab");
  const { creditsData, getCreditsHistory } = useCredits();

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const { user } = useAuth();

  // 2. useState 타입 수정
  const [activeTab, setActiveTab] = useState<string>("recent");
  const [creditsHistory, setCreditsHistory] = useState<CreditHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [transportHistory, setTransportHistory] = useState<TransportHistoryItem[]>([]);
  const [transportLoading, setTransportLoading] = useState(false);

  const todayTotalSavings = useMemo(() => {
    if (!transportHistory || transportHistory.length === 0) {
      return 0;
    }
    return transportHistory.reduce((total, trip) => total + (trip.co2_saved_g || 0), 0);
  }, [transportHistory]);
  
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'recent') {
      const storedHistory = loadCreditsHistoryFromStorage();
      if (storedHistory) {
        setCreditsHistory(storedHistory);
      } else {
        loadCreditsHistory();
      }
    }
  }, [creditsData.totalCredits, creditsData.lastUpdated, activeTab]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'credits_history' && e.newValue) {
        try {
          const newHistory = JSON.parse(e.newValue);
          setCreditsHistory(newHistory);
        } catch (error) {
          console.error('Error parsing updated credits history:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadCreditsHistory = async () => {
    setHistoryLoading(true);
    try {
      const history = await getCreditsHistory();
      setCreditsHistory(history);
      saveCreditsHistoryToStorage(history);
    } catch (error) {
      console.error('Failed to load credits history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadCreditsHistoryFromStorage = () => {
    const stored = localStorage.getItem('credits_history');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored credits history:', error);
      }
    }
    return null;
  };

  const saveCreditsHistoryToStorage = (history: CreditHistoryItem[]) => {
    localStorage.setItem('credits_history', JSON.stringify(history));
  };

  const loadTransportHistory = async (userId: number | undefined) => {
    setTransportLoading(true);
    if (!userId) {
      console.warn("User ID is not available. Cannot load transport history.");
      setTransportLoading(false);
      return;
    }
    try {
      console.log(`Fetching transport history for user ID: ${userId}`);
      const response = await fetch(`${API_URL}/api/credits/mobility/${userId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const history = await response.json();
        setTransportHistory(history);
      } else {
        console.error(`Failed to load transport history: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading transport history:', error);
    } finally {
      setTransportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recent') {
      loadTransportHistory(user?.id ? Number(user.id) : undefined);
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab === 'transport') {
      loadTransportHistory(user?.id ? Number(user.id) : undefined);
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadCreditsHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadTransportHistory(user?.id ? Number(user.id) : undefined);
    }
  }, [activeTab, user?.id]);

  const userInfo = {
    name: user?.name || "김에코",
    group: "동국대학교", // This might come from user context later
    totalCredits: creditsData.totalCredits,
    totalSaving: `${(creditsData.totalCarbonReduced / 1000).toFixed(1)}kg CO₂`,
  };

  if (isPreview) {
    return (
      <div className="credit-preview">
        {/* Preview JSX remains the same */}
      </div>
    );
  }

  return (
    <div className="credit-container">
      <PageHeader 
        title="Credit" 
        subtitle="나의 크레딧 현황과 탄소 절감 활동을 확인하세요"
        icon="💰"
      />
      <div className="credit-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 전체 현황
        </button>
        <button 
          className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          📅 오늘 절약한 탄소
        </button>
        <button 
          className={`tab-button ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          📈 누적 절약량
        </button>
        <button 
          className={`tab-button ${activeTab === 'transport' ? 'active' : ''}`}
          onClick={() => setActiveTab('transport')}
        >
          🚌 교통수단 이용내역
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 최근 크레딧 내역
        </button>
        </div>
      <div className="user-summary-card">
        <div className="user-info-simple">
          <div className="user-avatar-simple">🌱</div>
          <div className="user-details">
            <h2 className="user-name-simple">{userInfo.name} 님</h2>
            <p className="user-group-simple">{userInfo.group}</p>
          </div>
        </div>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-label-simple">누적 크레딧</span>
            <span className="stat-value-simple">{userInfo.totalCredits}C</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label-simple">누적 절감량</span>
            <span className="stat-value-simple">{userInfo.totalSaving}</span>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
         <>
          {/* Overview JSX remains the same */}
        </>
      )}

      {activeTab === 'recent' && (
        <div className="tab-content">
          <h3>📅 오늘 절약한 탄소</h3>
          <div className="carbon-savings">
            <div className="savings-card">
              <div className="savings-icon">🌱</div>
              <div className="savings-content">
                <div className="savings-amount">{todayTotalSavings.toFixed(0)}g</div>
                <div className="savings-label">오늘 절약한 탄소량</div>
              </div>
            </div>
            <div className="savings-breakdown">
              <h4>활동별 절약량</h4>
              <div className="breakdown-list">
                {transportHistory.length > 0 ? (
                  transportHistory.slice(0, 5).map((trip, index) => (
                    <div key={index} className="breakdown-item">
                      <span className="breakdown-icon">
                        {trip.mode === "SUBWAY" ? "🚇" : 
                         trip.mode === "BUS" ? "🚌" : 
                         trip.mode === "BIKE" ? "🚴" : 
                         trip.mode === "WALK" ? "🚶" : "🚗"}
                      </span>
                      <span className="breakdown-text">{trip.mode} 이용</span>
                      <span className="breakdown-amount">{Math.round(trip.co2_saved_g)}g</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-message">오늘의 교통수단 이용내역이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'points' && (
        <div className="tab-content">
          <h3>📈 누적 절약량</h3>
          <div className="total-savings">
            <div className="savings-card">
                {/* ... */}
            </div>
            <div className="savings-timeline">
              <h4>교통수단별 절약량</h4>
              <div className="timeline-chart">
                {transportHistory.length > 0 ? (
                  (() => {
                    // 3. reduce 함수 내 trip 파라미터 타입 명시
                    const modeData = transportHistory.reduce((acc, trip: TransportHistoryItem) => {
                      const mode = trip.mode;
                      if (!acc[mode]) {
                        acc[mode] = { total: 0, count: 0 };
                      }
                      acc[mode].total += (trip.co2_saved_g / 1000);
                      acc[mode].count += 1;
                      return acc;
                    }, {} as Record<string, { total: number; count: number }>);

                    const values = Object.values(modeData).map(item => item.total);
                    const maxValue = values.length > 0 ? Math.max(...values) : 0;

                    return Object.entries(modeData).map(([mode, data], index) => {
                      const height = maxValue > 0 ? (data.total / maxValue) * 100 : 0;
                      return (
                        <div key={index} className="timeline-bar" style={{ height: `${height}%` }}>
                          <span className="timeline-label">{mode}</span>
                          <span className="timeline-value">{data.total.toFixed(1)}kg</span>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="empty-message">교통수단 이용내역이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transport' && (
        <div className="tab-content">
          <h3>🚌 교통수단 이용내역</h3>
          <div className="transport-history">
            {transportLoading ? (
              <div className="loading-message">교통수단 이용내역을 불러오는 중...</div>
            ) : transportHistory.length > 0 ? (
              <div className="transport-list">
                {transportHistory.map((trip) => (
                  <div key={trip.log_id} className="transport-item">
                    <div className="transport-icon">
                      {trip.mode === "SUBWAY" ? "🚇" : 
                       trip.mode === "BUS" ? "🚌" : 
                       trip.mode === "BIKE" ? "🚴" : 
                       trip.mode === "WALK" ? "🚶" : "🚗"}
                    </div>
                    <div className="transport-content">
                      <div className="transport-mode">{trip.mode}</div>
                      <div className="transport-route">{trip.description || `${trip.start_point} -> ${trip.end_point}`}</div>
                      <div className="transport-meta">
                        <span className="transport-date">{new Date(trip.started_at).toLocaleDateString()}</span>
                        <span className="transport-distance">{trip.distance_km}km</span>
                      </div>
                    </div>
                    <div className="transport-stats">
                      <div className="carbon-saved">{(trip.co2_saved_g / 1000).toFixed(2)}kg</div>
                      <div className="points-earned">+{trip.eco_credits_earned || 0}C</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-message">교통수단 이용내역이 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="tab-content">
          <h3>📋 최근 크레딧 내역</h3>
          <div className="credit-history">
            <div className="history-header">
              <div className="history-stats">
                <div className="stat-item">
                  <span className="stat-label">총 크레딧</span>
                  <span className="stat-value">{creditsData.totalCredits}C</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">총 내역</span>
                  <span className="stat-value">{creditsHistory.length}건</span>
                </div>
              </div>
              <button 
                className="refresh-btn"
                onClick={loadCreditsHistory}
                disabled={historyLoading}
              >
                {historyLoading ? "새로고침 중..." : "🔄 새로고침"}
              </button>
            </div>
            <div className="history-list">
              {historyLoading ? (
                <div className="loading-message">크레딧 내역을 불러오는 중...</div>
              ) : creditsHistory.length > 0 ? (
                creditsHistory.map((item) => (
                  <div key={item.entry_id} className={`credit-item ${item.points > 0 ? "positive" : "negative"}`}>
                    <div className="item-icon">
                      {item.reason.includes("지하철") || item.reason.includes("SUBWAY") ? "🚇" : 
                       item.reason.includes("버스") || item.reason.includes("BUS") ? "🚌" : 
                       item.reason.includes("자전거") || item.reason.includes("BIKE") ? "🚴" : 
                       item.reason.includes("도보") || item.reason.includes("WALK") ? "🚶" : 
                       item.reason.includes("보너스") ? "🎁" : 
                       item.reason.includes("물주기") || item.reason.includes("GARDEN") ? "💧" : 
                       item.reason.includes("챌린지") ? "🏆" : "📝"}
                    </div>
                    <div className="item-content">
                      <div className="item-desc">{item.reason}</div>
                      <div className="item-meta">
                        <span className="item-date">{new Date(item.created_at).toLocaleDateString()}</span>
                        <span className="item-time">{new Date(item.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className={`item-credits ${item.points > 0 ? "positive" : "negative"}`}>
                      {item.points > 0 ? `+${item.points}` : `${item.points}`}C
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-message">크레딧 내역이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credit;