import React, { useState, useEffect } from "react";
import { useCredits } from "../contexts/CreditsContext";
import { useUser } from "../contexts/UserContext";
import "./PreviewComponents.css";

// AI 챗봇 미리보기
export const ChatPreview: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '안녕하세요! 환경 친화적인 생활을 도와드리는 에코 AI입니다. 어떤 도움이 필요하신가요?',
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'user',
      content: '대중교통 이용 크레딧은 어떻게 받나요?',
      timestamp: new Date()
    },
    {
      id: 3,
      type: 'bot',
      content: '지하철, 버스 등 대중교통 이용 시 자동으로 크레딧이 적립됩니다! 하루 최대 300C까지 받을 수 있어요.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const { completeActivity } = useCredits();

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    // 간단한 봇 응답 로직
    let botResponse = '';
    if (inputMessage.includes('대중교통') || inputMessage.includes('지하철') || inputMessage.includes('버스')) {
      botResponse = '대중교통을 이용하셨군요! +150C가 적립되었습니다. 🌟';
      // 실제 크레딧 추가
      await completeActivity('대중교통', 10, 0.5, 150, '강남역 → 홍대입구역');
    } else if (inputMessage.includes('자전거')) {
      botResponse = '자전거를 이용하셨군요! +80C가 적립되었습니다. 🚲';
      await completeActivity('자전거', 5, 0.3, 80, '집 → 학교');
    } else if (inputMessage.includes('도보') || inputMessage.includes('걸어서')) {
      botResponse = '도보로 이동하셨군요! +50C가 적립되었습니다. 🚶‍♂️';
      await completeActivity('도보', 2, 0.1, 50, '집 → 편의점');
    } else {
      botResponse = '환경 친화적인 활동을 응원합니다! 더 자세한 정보가 필요하시면 언제든 말씀해주세요. 🌱';
    }

    const newBotMessage = {
      id: Date.now() + 1,
      type: 'bot' as const,
      content: botResponse,
      timestamp: new Date()
    };

    setTimeout(() => {
      setMessages(prev => [...prev, newBotMessage]);
    }, 1000);

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-preview">
      <div className="preview-header">
        <h4>🤖 AI 챗봇</h4>
        <div className="status-indicator online">온라인</div>
      </div>
      <div className="preview-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}-message`}>
            {message.type === 'bot' ? (
              <>
                <div className="message-avatar">🤖</div>
                <div className="message-content">{message.content}</div>
              </>
            ) : (
              <>
                <div className="message-content">{message.content}</div>
                <div className="message-avatar">👤</div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="preview-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          className="message-input"
        />
        <button className="send-btn" onClick={handleSendMessage}>📤</button>
      </div>
    </div>
  );
};

// 크레딧 현황 미리보기
export const CreditPreview: React.FC = () => {
  const { creditsData } = useCredits();
  const { user } = useUser();
  const [recentActivities, setRecentActivities] = useState([
    { icon: '🚌', text: '지하철 이용 +150C', time: '2시간 전' },
    { icon: '🚲', text: '자전거 이용 +80C', time: '5시간 전' }
  ]);

  // 크레딧 데이터가 변경될 때 최근 활동 업데이트
  useEffect(() => {
    // localStorage에서 최근 크레딧 내역 가져오기
    const storedHistory = localStorage.getItem('credits_history');
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        const recent = history.slice(0, 2).map((item: any) => ({
          icon: item.reason?.includes('지하철') ? '🚌' : 
                item.reason?.includes('자전거') ? '🚲' : 
                item.reason?.includes('도보') ? '🚶‍♂️' : '🌱',
          text: `${item.reason} +${item.points}C`,
          time: new Date(item.created_at).toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));
        setRecentActivities(recent);
      } catch (error) {
        console.error('Error parsing credits history:', error);
      }
    }
  }, [creditsData.totalCredits, creditsData.lastUpdated]);

  return (
    <div className="credit-preview">
      <div className="preview-header">
        <h4>💰 크레딧 현황</h4>
      </div>
      <div className="user-info-card">
        <div className="user-avatar">🌱</div>
        <div className="user-details">
          <h5>{user.name} 님</h5>
          <p>동국대학교</p>
        </div>
      </div>
      <div className="credit-stats">
        <div className="stat-item">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-label">누적 크레딧</span>
            <span className="stat-value">{creditsData.totalCredits.toLocaleString()}C</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🌍</div>
          <div className="stat-info">
            <span className="stat-label">탄소 절감량</span>
            <span className="stat-value">{creditsData.totalCarbonReduced.toFixed(1)}kg CO₂</span>
          </div>
        </div>
      </div>
      <div className="recent-activities">
        <h6>최근 활동</h6>
        {recentActivities.map((activity, index) => (
          <div key={index} className="activity-item">
            <span className="activity-icon">{activity.icon}</span>
            <span className="activity-text">{activity.text}</span>
            <span className="activity-time">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 나만의 정원 미리보기
export const GardenPreview: React.FC = () => {
  const { creditsData, waterGarden } = useCredits();
  const { user } = useUser();
  const [waterCount, setWaterCount] = useState(0);
  const [isWatering, setIsWatering] = useState(false);

  // 크레딧에 따른 레벨 계산
  const gardenLevel = Math.floor(creditsData.totalCredits / 100) + 1;
  
  // 레벨별 식물 이미지와 단계
  const getPlantInfo = (level: number) => {
    const levelImages = ['🌰', '🌱', '🌿', '🍃', '🌼', '🌸', '🌳', '🌳', '🌳', '🌳', '🏡'];
    const levelNames = [
      '씨앗 단계', '싹 트는 단계', '새싹 단계', '어린 줄기 단계', '잎 전개 단계',
      '꽃봉오리 단계', '꽃 단계', '어린 나무 단계', '자라는 나무 단계', '우거진 나무 단계', '정원 완성 단계'
    ];
    
    return {
      image: levelImages[Math.min(level - 1, levelImages.length - 1)],
      stage: levelNames[Math.min(level - 1, levelNames.length - 1)]
    };
  };

  const plantInfo = getPlantInfo(gardenLevel);
  const progressPercentage = (waterCount / 10) * 100;

  const handleWater = async () => {
    if (isWatering) return;
    
    setIsWatering(true);
    try {
      const result = await waterGarden(10);
      if (result.success) {
        setWaterCount(prev => Math.min(prev + 1, 10));
      }
    } catch (error) {
      console.error('물주기 실패:', error);
    } finally {
      setIsWatering(false);
    }
  };

  return (
    <div className="garden-preview">
      <div className="preview-header">
        <h4>🌿 나만의 정원</h4>
        <div className="level-badge">Lv.{gardenLevel}</div>
      </div>
      <div className="garden-display">
        <div className="plant-container">
          <div className="plant-image">{plantInfo.image}</div>
          <div className="plant-stage">{plantInfo.stage}</div>
        </div>
        <div className="garden-stats">
          <div className="stat-chip">
            <span className="chip-icon">💰</span>
            <span className="chip-text">{creditsData.totalCredits.toLocaleString()}C</span>
          </div>
          <div className="stat-chip">
            <span className="chip-icon">🌱</span>
            <span className="chip-text">성장 중</span>
          </div>
        </div>
      </div>
      <div className="garden-actions">
        <div className="water-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="progress-text">물주기 {waterCount}/10</span>
        </div>
        <button 
          className="water-btn" 
          onClick={handleWater}
          disabled={isWatering || creditsData.totalCredits < 10}
        >
          {isWatering ? '💧 물주는 중...' : '💧 물 주기 (-10C)'}
        </button>
      </div>
      <div className="garden-info">
        <p className="carbon-info">🌍 탄소 절감: {creditsData.totalCarbonReduced.toFixed(1)}kg CO₂</p>
      </div>
    </div>
  );
};
