import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import './HowTo.css';

interface HowToStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

const HowTo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: HowToStep[] = [
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

  return (
    <div className="howto-page">
      <PageHeader 
        title="How to Use" 
        subtitle="Ecoo 서비스 이용 방법을 단계별로 알아보세요"
        icon="❓"
      />
      
      <div className="howto-container">
        <div className="howto-navigation">
          {steps.map((step, index) => (
            <button
              key={step.id}
              className={`nav-step ${currentStep === index ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
            >
              <span className="nav-step-icon">{step.icon}</span>
              <span className="nav-step-title">{step.title}</span>
            </button>
          ))}
        </div>

        <div className="howto-content">
          <div className="step-header">
            <div className="step-icon">{steps[currentStep].icon}</div>
            <div className="step-info">
              <h2 className="step-title">{steps[currentStep].title}</h2>
              <p className="step-description">{steps[currentStep].description}</p>
            </div>
          </div>

          <div className="step-details">
            <h3>상세 방법</h3>
            <ul className="details-list">
              {steps[currentStep].details.map((detail, index) => (
                <li key={index} className="detail-item">
                  <span className="detail-number">{index + 1}</span>
                  <span className="detail-text">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="step-navigation">
            <button 
              className="nav-btn prev-btn"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              ← 이전
            </button>
            <span className="step-counter">
              {currentStep + 1} / {steps.length}
            </span>
            <button 
              className="nav-btn next-btn"
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              다음 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowTo;
