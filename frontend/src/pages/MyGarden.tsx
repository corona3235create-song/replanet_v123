import React, { useEffect, useState } from "react";
import { useCredits } from "../contexts/CreditsContext";
import { useUser } from "../contexts/UserContext";
import PageHeader from "../components/PageHeader";
import { getAuthHeaders } from "../contexts/CreditsContext";
import "./MyGarden.css";

// 🌿 레벨별 이미지 (public/0.png ~ public/10.png)
const levelImages: string[] = Array.from({ length: 11 }, (_, i) => `/${i}.png`);

// 💧 물주기 비용
const WATER_COST = 10;

// 🌱 Garden 데이터 타입
interface GardenStatus {
  level_number: number;
  level_name: string;
  waters_count: number;
  required_waters: number;
}

// 레벨 → 텍스트
const levelNames: string[] = [
  "씨앗 단계 🌰",
  "싹 트는 단계 🌱",
  "새싹 단계 🌱",
  "어린 줄기 단계 🌿",
  "잎 전개 단계 🍃",
  "꽃봉오리 단계 🌼",
  "꽃 단계 🌸",
  "어린 나무 단계 🌳",
  "자라는 나무 단계 🌳",
  "우거진 나무 단계 🌳",
  "정원 완성 단계 🏡",
];
const getPlantStage = (level: number): string =>
  levelNames[Math.min(Math.max(level - 1, 0), levelNames.length - 1)];

const MyGarden: React.FC = () => {
  const { creditsData, waterGarden, refreshCredits } = useCredits(); // fetchCreditsData 추가
  const { user } = useUser();
  const [gardenStatus, setGardenStatus] = useState<GardenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [updateTrigger, setUpdateTrigger] = useState(0); // Dummy state to force re-render

  const fetchGardenData = async () => {
    if (!user || !user.id) {
      setStatusMessage("사용자 정보를 불러올 수 없습니다.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/credits/garden/${user.id}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch garden data');
      }
      const data = await response.json();
      setGardenStatus(data);
    } catch (error) {
      console.error("Error fetching garden data:", error);
      setStatusMessage("정원 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGardenData();
  }, [user]); // user가 변경될 때마다 다시 불러오기

  const handleWater = async () => {
    if (!gardenStatus) return;
    
    // 크레딧이 부족한지 먼저 체크
    if (creditsData.totalCredits < WATER_COST) {
      setStatusMessage("크레딧이 부족합니다!");
      return;
    }

    setAnimate(true);
    setTimeout(() => setAnimate(false), 500);

    try {
      const result = await waterGarden(WATER_COST);
      
      if (result.success) {
        setStatusMessage(`물주기 완료! -${WATER_COST}C`);
        
        // 정원 데이터와 크레딧 데이터 모두 다시 불러오기
        await Promise.all([
          fetchGardenData(),
          refreshCredits() // 크레딧 데이터 새로 불러오기
        ]);
        setUpdateTrigger(prev => prev + 1); // Force re-render
      } else {
        setStatusMessage(result.message || "물주기에 실패했습니다.");
      }
    } catch (error) {
      console.error("물주기 실패:", error);
      setStatusMessage("물주기에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="garden-card">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
          <div>불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!gardenStatus) {
    return (
      <div className="garden-card">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          정원 정보를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const { level_number, waters_count, required_waters } = gardenStatus;
  const plantStage = getPlantStage(level_number);
  const progressPercentage = (waters_count / required_waters) * 100;

  return (
    <div className="garden-card" key={creditsData.totalCredits}> {/* Add key prop */}
      <PageHeader 
        title="나만의 정원" 
        subtitle="크레딧으로 가상 정원을 꾸며보세요"
        icon="🌿"
      />

      <div className="garden-content">
        {/* 상단 요약 칩 */}
        <div className="garden-chips">
          <span className="chip chip-credits">
            C {creditsData.totalCredits.toLocaleString()}
          </span>
          <span className="chip chip-stage">{plantStage}</span>
          <span className="chip chip-level">Lv.{level_number}</span>
        </div>

        {/* 현재 단계 이미지 */}
        <div className="garden-container">
          <div className="garden-stage">
            <img
              src={levelImages[Math.min(level_number - 1, levelImages.length - 1)]}
              alt={plantStage}
              className={animate ? "plant animate" : "plant"}
            />
          </div>
          <button 
            onClick={handleWater} 
            className="water-btn" 
            disabled={creditsData.totalCredits < WATER_COST}
          >
            💧 물 주기 ({waters_count}/{required_waters}) — -{WATER_COST}C
          </button>
        </div>

        {/* 데이터 표시 */}
        <div className="garden-stats">
          총 탄소 절감량: {creditsData.totalCarbonReduced.toFixed(2)} kg
        </div>

        {statusMessage && (
          <div className={`garden-message ${statusMessage.includes('실패') || statusMessage.includes('부족') ? 'error' : 'success'}`}>
            {statusMessage}
          </div>
        )}
        
        {/* 진행상황 바 */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="progress-text">
            {waters_count}/{required_waters} 단계 진행중 ({progressPercentage.toFixed(0)}%)
          </div>
        </div>

        {/* 다음 레벨까지 남은 물주기 횟수 표시 */}
        {required_waters - waters_count > 0 && (
          <div className="next-level-info">
            다음 레벨까지 {required_waters - waters_count}번의 물주기가 필요합니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGarden;