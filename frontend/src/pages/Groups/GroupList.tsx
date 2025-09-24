import React, { useState } from 'react';
import { useGroups } from '../../contexts/GroupContext';
import CreateGroupModal from '../../components/Groups/CreateGroupModal';
import GroupCard from '../../components/Groups/GroupCard'; // Added this line
import './GroupList.css';

const GroupList: React.FC = () => {
  const { userGroups, loading, error, refreshGroups } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) {
    return (
      <div className="group-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>그룹을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group-list-container">
        <div className="error-message">
          <p>그룹을 불러오지 못했습니다: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-list-container">
      <div className="group-list-header">
        <h1>내 그룹</h1>
        <div className="group-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            그룹 만들기
          </button>
        </div>
      </div>

      {userGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>참여한 그룹이 없습니다</h3>
          <p>새로운 그룹을 만들어보세요!</p>
          <div className="empty-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              그룹 만들기
            </button>
          </div>
        </div>
      ) : (
        <div className="groups-grid">
          {userGroups.map((group) => (
            <GroupCard key={group.group_id} group={group} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={refreshGroups}
        />
      )}
    </div>
  );
};

export default GroupList;