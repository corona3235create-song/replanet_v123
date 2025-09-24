import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI, Group, GroupChallenge } from '../../services/groupApi';
import { useAuth } from '../../contexts/AuthContext';
import ChallengeCard from '../../components/ChallengeCard'; // Import ChallengeCard
import './GroupDashboard.css';

const GroupDashboard: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userChallengeParticipations, setUserChallengeParticipations] = useState<Set<number>>(new Set()); // Track user participation

  const isLeader = group?.members.find(m => m.user_id === Number(user?.id))?.role === 'leader';
  const currentUserId = Number(user?.id); // Ensure currentUserId is defined

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId || !user) return; // Ensure user is available for currentUserId

      try {
        setLoading(true);
        const [groupData, challengeData] = await Promise.all([
          groupAPI.getGroup(parseInt(groupId)),
          groupAPI.getGroupChallenges(parseInt(groupId))
        ]);
        
        setGroup(groupData);
        setChallenges(challengeData);

        // Fetch user's challenge participations
        const participations = await groupAPI.getUserChallengeParticipations(parseInt(groupId), currentUserId);
        setUserChallengeParticipations(new Set(participations.map(p => p.challenge_id)));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, user, currentUserId]); // Add user and currentUserId to dependency array

  const handleCreateChallenge = () => {
    navigate(`/groups/${groupId}/create-challenge`);
  };

  const handleJoinChallenge = async (challengeId: number) => {
    if (!group || !user) return;
    try {
      await groupAPI.joinGroupChallenge(group.group_id, challengeId);
      alert('챌린지에 성공적으로 참여했습니다!');
      // Refresh challenges and participations
      const [challengeData, participations] = await Promise.all([
        groupAPI.getGroupChallenges(group.group_id),
        groupAPI.getUserChallengeParticipations(group.group_id, currentUserId)
      ]);
      setChallenges(challengeData);
      setUserChallengeParticipations(new Set(participations.map(p => p.challenge_id)));
    } catch (err: any) {
      alert(`챌린지 참여에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !window.confirm('정말 그룹을 떠나시겠습니까?')) return;

    try {
      await groupAPI.leaveGroup(group.group_id);
      navigate('/groups');
    } catch (err: any) {
      alert(`그룹 떠나기에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !window.confirm('정말 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      await groupAPI.deleteGroup(group.group_id);
      alert('그룹이 성공적으로 삭제되었습니다.');
      navigate('/groups');
    } catch (err: any) {
      alert(`그룹 삭제에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
    }
  };

  if (loading) {
    return (
      <div className="group-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>그룹 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="group-dashboard-container">
        <div className="error-message">
          <p>그룹 정보를 불러오지 못했습니다: {error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/groups')}>
            그룹 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const upcomingChallenges = challenges.filter(c => c.status === 'upcoming');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return (
    <div className="group-dashboard-container">
      {/* Header */}
      <div className="group-header">
        <div className="group-info">
          <h1>{group.name}</h1>
          <p className="group-description">{group.description || '설명이 없습니다.'}</p>
          <div className="group-meta">
            <span className="member-count">👥 {group.member_count}명</span>
          </div>
        </div>
        <div className="group-actions">
          {isLeader && (
            <button className="btn btn-primary" onClick={handleCreateChallenge}>
              챌린지 만들기
            </button>
          )}
          {isLeader && (
            <button className="btn btn-danger" onClick={handleDeleteGroup}>
              그룹 삭제
            </button>
          )}
          {!isLeader && (
            <button className="btn btn-danger" onClick={handleLeaveGroup}>
              그룹 떠나기
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate(`/groups/ranking`)}>
            랭킹 보기
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Active Challenges */}
        <section className="dashboard-section">
          <h2>진행 중인 챌린지</h2>
          {activeChallenges.length === 0 ? (
            <div className="empty-challenges">
              <p>진행 중인 챌린지가 없습니다.</p>
              {isLeader && (
                <button className="btn btn-primary" onClick={handleCreateChallenge}>
                  첫 챌린지 만들기
                </button>
              )}
            </div>
          ) : (
            <div className="challenges-grid">
              {activeChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.challenge_id} 
                  challenge={challenge} 
                  onJoinChallenge={handleJoinChallenge}
                  isParticipating={userChallengeParticipations.has(challenge.challenge_id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Challenges */}
        <section className="dashboard-section">
          <h2>예정된 챌린지</h2>
          {upcomingChallenges.length === 0 ? (
            <div className="empty-challenges">
              <p>예정된 챌린지가 없습니다.</p>
            </div>
          ) : (
            <div className="challenges-grid">
              {upcomingChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.challenge_id} 
                  challenge={challenge} 
                  onJoinChallenge={handleJoinChallenge}
                  isParticipating={userChallengeParticipations.has(challenge.challenge_id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed Challenges */}
        <section className="dashboard-section">
          <h2>완료된 챌린지</h2>
          {completedChallenges.length === 0 ? (
            <div className="empty-challenges">
              <p>완료된 챌린지가 없습니다.</p>
            </div>
          ) : (
            <div className="challenges-grid">
              {completedChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.challenge_id} 
                  challenge={challenge} 
                  isParticipating={userChallengeParticipations.has(challenge.challenge_id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Group Members */}
        <section className="dashboard-section">
          <h2>그룹 멤버</h2>
          {/* <GroupMemberList members={group.members} /> */}
          <div>
            {group.members.map(member => (
              <div key={member.user_id}>{member.user.username} ({member.role})</div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GroupDashboard;
