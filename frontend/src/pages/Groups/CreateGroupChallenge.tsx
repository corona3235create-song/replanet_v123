import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI } from '../../services/groupApi';
import { useAuth } from '../../contexts/AuthContext';
import './CreateGroupChallenge.css'; // You might need to create this CSS file

const CreateGroupChallenge: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<'co2_reduction' | 'activity_count'>('co2_reduction');
  const [goalValue, setGoalValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!groupId || !user) {
      setError('Group ID or user not found.');
      setLoading(false);
      return;
    }

    try {
      await groupAPI.createChallenge(parseInt(groupId), {
        title,
        description,
        goal_type: goalType,
        goal_value: goalValue,
        start_date: `${startDate}T00:00:00`,
        end_date: `${endDate}T00:00:00`,
      });
      alert('챌린지가 성공적으로 생성되었습니다!');
      navigate(`/groups/${groupId}`); // Navigate back to group dashboard
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      setError(err.message || '챌린지 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-challenge-container">
      <h2>새 그룹 챌린지 만들기</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">챌린지 제목</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">설명 (선택 사항)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="goalType">목표 유형</label>
          <select
            id="goalType"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as 'co2_reduction' | 'activity_count')}
          >
            <option value="co2_reduction">CO2 절감</option>
            <option value="activity_count">활동 횟수</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="goalValue">목표 값</label>
          <input
            type="number"
            id="goalValue"
            value={goalValue}
            onChange={(e) => setGoalValue(parseFloat(e.target.value) || 0)}
            required
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="startDate">시작일</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">종료일</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '생성 중...' : '챌린지 만들기'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupChallenge;
