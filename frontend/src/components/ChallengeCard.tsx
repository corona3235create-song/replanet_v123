import React from 'react';
import { GroupChallenge } from '../services/groupApi';
import './ChallengeCard.css';

interface ChallengeCardProps {
  challenge: GroupChallenge;
  onJoinChallenge?: (challengeId: number) => void; // Optional prop for join action
  isParticipating?: boolean; // Optional prop to indicate if user is already participating
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onJoinChallenge, isParticipating }) => {
  const startDate = new Date(challenge.start_date).toLocaleDateString();
  const endDate = new Date(challenge.end_date).toLocaleDateString();

  const isUpcoming = challenge.status === 'upcoming';
  const isActive = challenge.status === 'active';
  const isCompleted = challenge.status === 'completed';

  return (
    <div className={`challenge-card ${challenge.status}`}>
      <h3>{challenge.title}</h3>
      <p className="challenge-description">{challenge.description || '설명이 없습니다.'}</p>
      <div className="challenge-meta">
        <span>기간: {startDate} ~ {endDate}</span>
        <span>목표: {challenge.goal_value} {challenge.goal_type === 'co2_reduction' ? 'g CO2' : '회'}</span>
      </div>
      <div className="challenge-progress">
        <div className="progress-bar-container">
          <div 
            className="progress-bar"
            style={{ width: `${challenge.completion_percentage}%` }}
          ></div>
        </div>
        <span className="progress-text">{challenge.completion_percentage.toFixed(1)}% 완료</span>
      </div>
      <div className="challenge-status">
        상태: {isUpcoming && '예정'}
        {isActive && '진행 중'}
        {isCompleted && '완료'}
      </div>
      
      {/* Join Button Logic */}
      {onJoinChallenge && !isParticipating && (isUpcoming || isActive) && (
        <button 
          className="btn btn-primary join-challenge-btn"
          onClick={() => onJoinChallenge(challenge.challenge_id)}
        >
          챌린지 참여하기
        </button>
      )}
      {isParticipating && (isUpcoming || isActive) && (
        <span className="participating-text">참여 중</span>
      )}
    </div>
  );
};

export default ChallengeCard;
