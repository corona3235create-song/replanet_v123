import React, { useState} from 'react';
import './HowToPopup.css';

interface HowToPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPopup: React.FC<HowToPopupProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowToday, setDontShowToday] = useState(false);

  const steps = [
    {
      id: 1,
      title: "1단계: 대시보드에서 활동 기록",
      description: "일상적인 이동 활동을 기록하여 크레딧을 획득하세요",
      icon: "📊",
      details: [
        "대시보드에서 '활동 기록하기' 버튼 클릭",
        "이동 수단 선택 (대중교통, 자전거, 도보)",
        "자동으로 크레딧이 적립됩니다"
      ]
    },
    {
      id: 2,
      title: "2단계: AI 챗봇과 상담",
      description: "AI 챗봇과 대화하며 친환경 활동을 기록하세요",
      icon: "🤖",
      details: [
        "AI 챗봇 탭으로 이동",
        "환경 관련 질문이나 활동 기록 요청",
        "챗봇이 자동으로 크레딧을 지급합니다"
      ]
    },
    {
      id: 3,
      title: "3단계: 크레딧 확인",
      description: "적립된 크레딧과 탄소 절감량을 확인하세요",
      icon: "💰",
      details: [
        "Credit 탭에서 누적 크레딧 확인",
        "탄소 절감량과 상세 내역 조회",
        "활동별 크레딧 적립 현황 확인"
      ]
    },
    {
      id: 4,
      title: "4단계: 정원 꾸미기",
      description: "크레딧을 사용하여 가상 정원을 꾸며보세요",
      icon: "🌿",
      details: [
        "나만의 정원 탭으로 이동",
        "물주기로 식물 성장시키기",
        "크레딧을 소모하여 정원 레벨업"
      ]
    },
    {
      id: 5,
      title: "5단계: 챌린지 참여",
      description: "챌린지에 참여하여 추가 크레딧을 획득하세요",
      icon: "🏆",
      details: [
        "챌린지 & 업적 탭으로 이동",
        "원하는 챌린지에 참여하기",
        "목표 달성 시 업적 획득"
      ]
    }
  ];

  const handleClose = () => {
    if (dontShowToday) {
      const today = new Date().toDateString();
      localStorage.setItem('howto-dont-show-today', today);
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="howto-popup-overlay">
      <div className="howto-popup">
        <div className="popup-header">
          <h2 className="popup-title">How to Use Ecoo</h2>
          <button className="popup-close" onClick={handleClose}>×</button>
        </div>

        <div className="popup-content">
          <div className="step-indicator">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          <div className="step-content">
            <div className="step-header">
              <div className="step-icon">{steps[currentStep].icon}</div>
              <div className="step-info">
                <h3 className="step-title">{steps[currentStep].title}</h3>
                <p className="step-description">{steps[currentStep].description}</p>
              </div>
            </div>

            <div className="step-details">
              <ul className="details-list">
                {steps[currentStep].details.map((detail, index) => (
                  <li key={index} className="detail-item">
                    <span className="detail-number">{index + 1}</span>
                    <span className="detail-text">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="popup-navigation">
            <button 
              className="nav-btn prev-btn"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              ← 이전
            </button>
            <span className="step-counter">
              {currentStep + 1} / {steps.length}
            </span>
            <button 
              className="nav-btn next-btn"
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
            >
              다음 →
            </button>
          </div>
        </div>

        <div className="popup-footer">
          <label className="dont-show-today">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
            />
            <span className="checkbox-text">오늘은 보지 않기</span>
          </label>
          <button className="close-btn" onClick={handleClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToPopup;
