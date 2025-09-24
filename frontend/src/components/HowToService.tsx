import React, { useState } from 'react';
import PageHeader from './PageHeader';
import './HowToService.css';

interface HowToStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

const HowToService: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps: HowToStep[] = [
    {
      id: 1,
      title: "1단계: 대시보드에서 활동 기록",
      description: "일상적인 이동 활동을 기록하여 크레딧을 획득하세요",
      icon: "📊",
      details: [
        "지하철, 버스, 자전거, 도보 등 친환경 교통수단 이용",
        "이동 거리와 교통수단을 선택하여 기록",
        "이동할 때마다 자동으로 크레딧 적립",
        "실시간으로 탄소 절감량 확인 가능"
      ]
    },
    {
      id: 2,
      title: "2단계: AI 챗봇과 상호작용",
      description: "AI 챗봇과 대화하며 친환경 생활 팁을 받아보세요",
      icon: "🤖",
      details: [
        "친환경 생활에 대한 질문과 답변",
        "개인 맞춤형 탄소 절감 방법 제안",
        "실시간 환경 정보 및 뉴스 제공",
        "크레딧 적립 방법 안내"
      ]
    },
    {
      id: 3,
      title: "3단계: 나만의 정원 키우기",
      description: "적립한 크레딧으로 가상 정원을 키워보세요",
      icon: "🌱",
      details: [
        "크레딧을 사용하여 정원에 물주기",
        "정원 레벨업으로 성취감 느끼기",
        "탄소 절감량에 따라 정원 성장",
        "다양한 식물 단계별 수집"
      ]
    },
    {
      id: 4,
      title: "4단계: 챌린지 참여하기",
      description: "다양한 챌린지에 참여하여 추가 크레딧을 획득하세요",
      icon: "🏆",
      details: [
        "월간/주간 친환경 챌린지 참여",
        "챌린지 완료 시 보너스 크레딧 지급",
        "업적 시스템으로 지속적인 동기 부여",
        "다른 사용자와의 경쟁 요소"
      ]
    },
    {
      id: 5,
      title: "5단계: 크레딧 현황 확인",
      description: "적립한 크레딧과 탄소 절감 현황을 확인하세요",
      icon: "💰",
      details: [
        "총 크레딧 잔액 및 적립 내역 확인",
        "탄소 절감량 통계 및 그래프",
        "최근 활동 내역 및 포인트 적립 기록",
        "개인 성과 대시보드"
      ]
    }
  ];

  const openModal = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  return (
    <>
      <div className="howto-trigger" onClick={openModal}>
        <div className="howto-icon">❓</div>
        <div className="howto-text">
          <h3>How to Use</h3>
          <p>서비스 이용 방법</p>
        </div>
        <div className="howto-arrow">→</div>
      </div>

      {isOpen && (
        <div className="howto-modal-overlay" onClick={closeModal}>
          <div className="howto-modal" onClick={(e) => e.stopPropagation()}>
            <div className="howto-modal-header">
              <h2>🌱 Ecooo 서비스 이용 방법</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="howto-modal-content">
              <div className="step-indicator">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                    onClick={() => goToStep(index)}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                ))}
              </div>

              <div className="step-content">
                <div className="step-icon">{steps[currentStep].icon}</div>
                <h3 className="step-title">{steps[currentStep].title}</h3>
                <p className="step-description">{steps[currentStep].description}</p>
                
                <div className="step-details">
                  <h4>상세 내용:</h4>
                  <ul>
                    {steps[currentStep].details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="step-navigation">
                <button 
                  className="nav-btn prev-btn" 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  ← 이전
                </button>
                <span className="step-counter">
                  {currentStep + 1} / {steps.length}
                </span>
                <button 
                  className="nav-btn next-btn" 
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                >
                  다음 →
                </button>
              </div>

              <div className="howto-footer">
                <p>💡 <strong>팁:</strong> 모든 기능을 순서대로 체험해보세요!</p>
                <button className="start-btn" onClick={closeModal}>
                  시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HowToService;
