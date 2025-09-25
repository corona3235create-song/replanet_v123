import React, { useState } from 'react';

// GardenObject 타입 정의 (기존 types/garden.ts 대체)
export interface GardenObject {
  id: number;
  type: string; // 'tree' | 'flower' | 'bench' 등
  x: number;
  y: number;
}

// 크레딧 + 정원 관리
function GardenPage() {
  const [credits, setCredits] = useState(100); // 초기 크레딧
  const [garden, setGarden] = useState<GardenObject[]>([]);

  // 크레딧 관리 로직 (기존 CreditManager 대체)
  const addCredits = (amount: number) => setCredits((prev) => prev + amount);
  const spendCredits = (amount: number) => {
    if (credits >= amount) {
      setCredits((prev) => prev - amount);
      return true;
    }
    alert("크레딧이 부족합니다!");
    return false;
  };

  // 정원 아이템 추가 (기존 GardenEditor 대체)
  const addObject = (type: string) => {
    if (!spendCredits(10)) return; // 예: 아이템 추가 시 10 크레딧 차감
    const newObject: GardenObject = {
      id: Date.now(),
      type,
      x: Math.random() * 300, // 랜덤 위치 예시
      y: Math.random() * 300,
    };
    setGarden((prev) => [...prev, newObject]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '2rem' }}>
      {/* 크레딧 매니저 (기존 CreditManager 역할) */}
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '1.5rem', border: '1px solid #dcfce7' }}>
        <h2>보유 크레딧: {credits}</h2>
        <button onClick={() => addCredits(10)}>+10 크레딧</button>
      </div>

      {/* 정원 에디터 (기존 GardenEditor 역할) */}
      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '1.5rem', border: '1px solid #dcfce7' }}>
        <h2>나만의 정원</h2>
        <button onClick={() => addObject("tree")}>🌳 나무 추가</button>
        <button onClick={() => addObject("flower")}>🌸 꽃 추가</button>

        <div style={{ marginTop: "1rem", position: "relative", width: "400px", height: "400px", border: "1px solid #ddd" }}>
          {garden.map((obj) => (
            <div
              key={obj.id}
              style={{
                position: "absolute",
                left: obj.x,
                top: obj.y,
                fontSize: "24px",
              }}
            >
              {obj.type === "tree" ? "🌳" : "🌸"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GardenPage;
