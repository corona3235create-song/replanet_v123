import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Group } from '../../services/groupApi';
import './GroupCard.css'; // You might need to create this CSS file

interface GroupCardProps {
  group: Group;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group.group_id}`);
  };

  return (
    <div className="group-card" onClick={handleClick}>
      <h3>{group.name}</h3>
      <p>{group.description || '설명이 없습니다.'}</p>
      <div className="group-card-meta">
        <span>👥 {group.member_count}명</span>
        {/* You can add more meta info here if needed */}
      </div>
    </div>
  );
};

export default GroupCard;
