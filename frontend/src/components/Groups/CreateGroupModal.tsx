import React, { useState } from 'react';
import { groupAPI } from '../../services/groupApi';
import { useAuth } from '../../contexts/AuthContext'; // Assuming AuthContext provides user info
import './CreateGroupModal.css'; // You might need to create this CSS file

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onGroupCreated }) => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState<number>(50); // Default max members
  const [usernamesInput, setUsernamesInput] = useState(user?.name ? user.name : ''); // Pre-fill with current user
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user?.name) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }

    const usernames = usernamesInput.split(',').map((name: string) => name.trim()).filter((name: string) => name !== '');

    if (usernames.length === 0) {
      setError('Please enter at least one username, including yourself.');
      setLoading(false);
      return;
    }

    if (!usernames.includes(user.name)) {
      setError('You must include your own username in the list of members.');
      setLoading(false);
      return;
    }

    try {
      await groupAPI.createGroup({
        name: groupName,
        description,
        max_members: maxMembers,
        usernames: usernames,
      });
      onGroupCreated(); // Refresh group list
      onClose(); // Close modal
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err.message || '그룹 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>새 그룹 만들기</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="groupName">그룹 이름</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
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
            <label htmlFor="maxMembers">최대 멤버 수</label>
            <input
              type="number"
              id="maxMembers"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value) || 1)}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="usernames">멤버 사용자 이름 (쉼표로 구분)</label>
            <textarea
              id="usernames"
              value={usernamesInput}
              onChange={(e) => setUsernamesInput(e.target.value)}
              placeholder="예: user1, user2, user3"
              required
            ></textarea>
            <small>그룹에 포함할 모든 멤버의 사용자 이름을 쉼표로 구분하여 입력하세요. 본인의 사용자 이름도 포함해야 합니다.</small>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '생성 중...' : '그룹 만들기'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;