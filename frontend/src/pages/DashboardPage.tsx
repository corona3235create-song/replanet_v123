import React, { useState, useEffect } from "react";
import { useCredits } from "../contexts/CreditsContext";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../App.css";
import "./DashboardPage.css";

// 📌 타입 정의
interface DailySaving {
  date: string;
  saved_g: number;
}

interface Challenge {
  goal: number;
  progress: number;
}

interface DashboardData {
  co2_saved_today: number; // 오늘 절약량 (g)
  eco_credits_earned: number; // 오늘 획득 크레딧
  garden_level: number; // 정원 레벨
  total_saved: number; // 누적 절약량 (kg)
  total_points: number; // 누적 크레딧
  last7days: DailySaving[];
  modeStats: { mode: string; saved_g: number }[];
  challenge: Challenge;
}

const COLORS = ["#1abc9c", "#16a085", "#f39c12", "#e74c3c"];



const DashboardPage: React.FC = () => {
  const { creditsData, addCredits } = useCredits();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // ✅ 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/dashboard`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Dashboard API fetched data:", result); // Add this line
          setData(result);
        } else {
          console.warn("Dashboard API 응답 없음. 실제 데이터가 없으면 0으로 표시됩니다.");
          setData({ // Set default empty data instead of UNIFIED_DATA
            co2_saved_today: 0,
            eco_credits_earned: 0,
            garden_level: 0,
            total_saved: 0,
            total_points: 0,
            last7days: [],
            modeStats: [],
            challenge: { goal: 0, progress: 0 },
          });
        }
      } catch (e) {
        console.warn("Dashboard API 연결 실패:", e);
        setData({ // Set default empty data instead of UNIFIED_DATA
            co2_saved_today: 0,
            eco_credits_earned: 0,
            garden_level: 0,
            total_saved: 0,
            total_points: 0,
            last7days: [],
            modeStats: [],
            challenge: { goal: 0, progress: 0 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]);

  // 크레딧 데이터가 변경될 때마다 대시보드 데이터 업데이트
  useEffect(() => {
    if (data) {
      setData(prev => prev ? {
        ...prev,
        total_points: creditsData.totalCredits,
        total_saved: parseFloat((creditsData.totalCarbonReduced / 1000).toFixed(1)),
        // 실시간으로 오늘 절약량도 업데이트
        // co2_saved_today: 1850, // 고정값으로 설정 (실제로는 오늘의 절감량이어야 함) - Remove hardcoded value
        eco_credits_earned: creditsData.totalCredits,
        // 최근 7일 데이터도 실시간으로 업데이트 (오늘 데이터만 업데이트)
        last7days: prev.last7days.map((day, index) => {
          if (index === prev.last7days.length - 1) {
            return {
              ...day,
              // saved_g: 1850 // 고정값으로 설정 (실제로는 오늘의 절감량이어야 함) - Remove hardcoded value
            };
          }
          return day;
        })
      } : null);
    }
  }, [creditsData]);

  // ✅ 챗봇으로 이동하는 함수
  const goToChat = () => {
    window.location.href = '/chat';
  };

  // ✅ 차트 데이터 다운로드 함수
  const handleDownloadChartData = (chartData: DailySaving[]) => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + chartData.map(e => `${e.date},${e.saved_g}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carbon_reduction_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ 상태 처리
  if (loading) {
    return (
      <div className="dashboard-container" style={{ padding: "2rem", textAlign: "center" }}>
        <h2>📊 내 대시보드</h2>
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>데이터를 불러오는 중...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="dashboard-container">
        <h2>📊 내 대시보드</h2>
        <p>데이터를 불러오지 못했습니다. (샘플 보기)</p>
        {/* 샘플 카드 */}
        <div className="dashboard-grid">
        <div className="card"><h4>오늘 절약한 탄소</h4><p className="metric">1.85 g</p></div>
        <div className="card"><h4>누적 절약량</h4><p className="metric">18.5 kg</p></div>
          <div className="card"><h4>에코 크레딧</h4><p className="metric">1,240 P</p></div>
          <div className="card"><h4>정원 레벨</h4><p className="metric">Lv.3 🌱</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="대시보드" 
        subtitle="나의 친환경 활동 현황을 한눈에 확인하세요"
        icon="📊"
      />
      
      {/* 요약 카드 */}
      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <Link to="/credit?tab=recent" className="card clickable-card">
          <h4>오늘 절약한 탄소</h4>
          <p className="metric">
            {data.co2_saved_today?.toFixed(2)} <span>g</span>
          </p>
        </Link>
        <Link to="/credit?tab=points" className="card clickable-card">
          <h4>누적 절약량</h4>
          <p className="metric">
            {data.total_saved} <span>kg</span>
          </p>
        </Link>
        <Link to="/credit" className="card clickable-card">
          <h4>에코 크레딧</h4>
          <p className="metric">
            {data.total_points} <span>C</span>
          </p>
        </Link>
        <Link to="/mygarden" className="card clickable-card">
          <h4>정원 레벨</h4>
          <p className="metric">Lv. {data.garden_level} 🌱</p>
        </Link>
      </div>

      {/* 📈 최근 7일 절감량 */}
      <div style={{ marginTop: "2rem" }}>
        <h4 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>📈 최근 7일 절감량 추이</h4>
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)",
          padding: "2.5rem",
          borderRadius: "20px",
          border: "1px solid rgba(26, 188, 156, 0.1)",
          boxShadow: "0 8px 25px rgba(26, 188, 156, 0.1)",
          position: "relative",
          overflow: "hidden",
          height: "300px" // Set a fixed height for ResponsiveContainer
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.last7days}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '0.8rem', fill: '#6b7280' }} />
              <YAxis
                label={{ value: '탄소 절감량 (g)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '0.9rem', fill: '#4a5568' } }}
                axisLine={false}
                tickLine={false}
                style={{ fontSize: '0.8rem', fill: '#6b7280' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(26, 188, 156, 0.1)' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #1abc9c',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  fontSize: '0.9rem',
                  color: '#333'
                }}
                labelStyle={{ color: '#1abc9c', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value}g`, '절감량']}
              />
              <Bar dataKey="saved_g" fill="#1abc9c" radius={[10, 10, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <button
            onClick={() => handleDownloadChartData(data?.last7days || [])}
            style={{
              background: "#1abc9c",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "15px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(26, 188, 156, 0.2)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#16a085";
              e.currentTarget.style.boxShadow = "0 6px 15px rgba(26, 188, 156, 0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#1abc9c";
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(26, 188, 156, 0.2)";
            }}
          >
            차트 데이터 다운로드 (CSV)
          </button>
        </div>
      </div>

      {/* 🚋 교통수단 비율 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginTop: "2rem",
        marginBottom: "1.5rem"
      }}>
        <h4 style={{ margin: 0, fontSize: "1.3rem" }}>🚋 교통수단별 절감 비율</h4>
        <Link 
          to="/credit?tab=recent" 
          style={{ 
            color: "#1abc9c", 
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(26, 188, 156, 0.1)",
            padding: "8px 12px",
            borderRadius: "20px",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(26, 188, 156, 0.2)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(26, 188, 156, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          자세히 보기 →
        </Link>
      </div>
      <div style={{ 
        background: "linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)", 
        padding: "2rem", 
        borderRadius: "20px",
        border: "1px solid rgba(26, 188, 156, 0.1)",
        boxShadow: "0 8px 25px rgba(26, 188, 156, 0.1)"
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          {data?.modeStats?.map((mode, index) => {
            const total = data.modeStats.reduce((sum, m) => sum + m.saved_g, 0);
            const percentage = total > 0 ? Math.round((mode.saved_g / total) * 100) : 0;
            return (
              <div key={index} style={{ 
                display: "flex", 
                alignItems: "center", 
                background: "rgba(255, 255, 255, 0.9)",
                padding: "1.2rem",
                borderRadius: "12px",
                border: "1px solid rgba(26, 188, 156, 0.1)",
                flex: "1",
                minWidth: "220px",
                boxShadow: "0 4px 15px rgba(26, 188, 156, 0.1)",
                transition: "all 0.3s ease"
              }}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  background: COLORS[index % COLORS.length],
                  borderRadius: "50%",
                  marginRight: "0.8rem",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", marginBottom: "0.3rem", fontSize: "1rem", color: "#2c3e50" }}>{mode.mode}</div>
                  <div style={{ fontSize: "0.95rem", color: "#6b7280", fontWeight: "500" }}>
                    {mode.saved_g}g ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ 
          textAlign: "center", 
          color: "#1abc9c", 
          margin: "1.5rem 0 0 0",
          fontSize: "1rem",
          fontWeight: "600"
        }}>
          총 절감량: {data?.modeStats ? data.modeStats.reduce((sum, mode) => sum + mode.saved_g, 0) : 0}g
        </p>
      </div>

      {/* 🌱 AI 피드백 */}
      <div
        className="ai-feedback"
        style={{
          marginTop: "2rem",
          fontSize: "1.2rem",
          background: "#f8f9fa",
          padding: "1rem",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        {data.co2_saved_today > 5
          ? "이번 주 아주 잘하고 있어요 👏"
          : "조금 더 노력해볼까요? 🌱"}
        <br />
        목표까지 200g 남았어요 💪
      </div>

      {/* 🔥 챌린지 진행 상황 */}
      <div style={{ marginTop: "2rem" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <h4 style={{ margin: 0 }}>🔥 챌린지 진행 상황</h4>
          <Link 
            to="/challenge-achievements" 
            style={{ 
              color: "#1abc9c", 
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            자세히 보기 →
          </Link>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)",
          padding: "1.5rem",
          borderRadius: "15px",
          border: "1px solid rgba(26, 188, 156, 0.1)",
          boxShadow: "0 4px 15px rgba(26, 188, 156, 0.1)",
          marginBottom: "1rem"
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <h5 style={{ 
              margin: "0 0 0.5rem 0", 
              color: "#2c3e50",
              fontSize: "1.1rem"
            }}>
              🚇 대중교통 이용 챌린지
            </h5>
            <p style={{ 
              margin: 0, 
              color: "#7f8c8d",
              fontSize: "0.9rem"
            }}>
              {data.challenge.goal}kg 절감 목표 중 {data.challenge.progress}kg 달성!
            </p>
          </div>
          
          <div style={{
            background: "#ecf0f1",
            borderRadius: "10px",
            overflow: "hidden",
            height: "25px",
            position: "relative"
          }}>
            <div
              style={{
                width: `${Math.min((data.challenge.progress / data.challenge.goal) * 100, 100)}%`,
                background: "linear-gradient(90deg, #1abc9c, #16a085)",
                height: "100%",
                textAlign: "center",
                color: "#fff",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "600",
                transition: "width 0.3s ease"
              }}
            >
              {Math.round((data.challenge.progress / data.challenge.goal) * 100)}%
            </div>
          </div>
          
          <div style={{ 
            marginTop: "0.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ 
              fontSize: "0.8rem", 
              color: "#1abc9c",
              fontWeight: "600"
            }}>
              목표까지 {data.challenge.goal - data.challenge.progress}kg 남음
            </span>
            <span style={{ 
              fontSize: "0.8rem", 
              color: "#7f8c8d"
            }}>
              챌린지&업적 탭과 연동됨
            </span>
          </div>
        </div>
      </div>

      {/* 🤖 AI 챗봇과 연결 */}
      <div style={{ marginTop: "2rem" }}>
        <h4 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>🤖 AI 챗봇과 활동 기록하기</h4>
        <div style={{ 
          background: "linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)", 
          padding: "2rem", 
          borderRadius: "20px",
          border: "1px solid rgba(26, 188, 156, 0.1)",
          boxShadow: "0 8px 25px rgba(26, 188, 156, 0.1)"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "1.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #1abc9c, #16a085)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                boxShadow: "0 4px 15px rgba(26, 188, 156, 0.3)"
              }}>
                🤖
              </div>
              <div>
                <h5 style={{ 
                  margin: "0 0 0.5rem 0", 
                  color: "#2c3e50",
                  fontSize: "1.2rem"
                }}>
                  AI 챗봇과 친환경 활동하기
                </h5>
                <p style={{ 
                  margin: 0, 
                  color: "#7f8c8d",
                  fontSize: "0.95rem"
                }}>
                  대화하며 활동을 기록하고 크레딧을 획득하세요!
                </p>
              </div>
            </div>
            <button
              onClick={goToChat}
              style={{ 
                background: "linear-gradient(135deg, #1abc9c, #16a085)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "20px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(26, 188, 156, 0.3)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(26, 188, 156, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(26, 188, 156, 0.3)";
              }}
            >
              대화 시작하기 →
            </button>
          </div>
          
          <div style={{ 
            display: "flex", 
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            <div style={{
              background: "rgba(26, 188, 156, 0.1)",
              padding: "1rem",
              borderRadius: "12px",
              flex: "1",
              minWidth: "200px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🚇</div>
              <div style={{ 
                fontSize: "0.9rem", 
                fontWeight: "600",
                color: "#2c3e50",
                marginBottom: "0.3rem"
              }}>
                대중교통 이용
              </div>
              <div style={{ 
                fontSize: "0.8rem", 
                color: "#7f8c8d"
              }}>
                +150C 획득
              </div>
            </div>
            <div style={{
              background: "rgba(26, 188, 156, 0.1)",
              padding: "1rem",
              borderRadius: "12px",
              flex: "1",
              minWidth: "200px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🚴</div>
              <div style={{ 
                fontSize: "0.9rem", 
                fontWeight: "600",
                color: "#2c3e50",
                marginBottom: "0.3rem"
              }}>
                자전거 이용
              </div>
              <div style={{ 
                fontSize: "0.8rem", 
                color: "#7f8c8d"
              }}>
                +100C 획득
              </div>
            </div>
            <div style={{
              background: "rgba(26, 188, 156, 0.1)",
              padding: "1rem",
              borderRadius: "12px",
              flex: "1",
              minWidth: "200px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🌱</div>
              <div style={{ 
                fontSize: "0.9rem", 
                fontWeight: "600",
                color: "#2c3e50",
                marginBottom: "0.3rem"
              }}>
                에너지 절약
              </div>
              <div style={{ 
                fontSize: "0.8rem", 
                color: "#7f8c8d"
              }}>
                +50C 획득
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
