import React, { useState, useEffect } from 'react';
import { groupAPI, GroupRanking } from '../../services/groupApi';
import './GroupRankingPage.css';

const GroupRankingPage: React.FC = () => {
  const [ranking, setRanking] = useState<GroupRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const data = await groupAPI.getGlobalRanking();
        setRanking(data);
      } catch (err: any) {
        setError(err.message || '그룹 랭킹을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) {
    return <div className="ranking-container">로딩 중...</div>;
  }

  if (error) {
    return <div className="ranking-container error-message">오류: {error}</div>;
  }

  return (
    <div className="ranking-container">
      <h2>전체 그룹 랭킹</h2>
      {ranking.length === 0 ? (
        <p>아직 랭킹 데이터가 없습니다.</p>
      ) : (
        <table className="ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>그룹명</th>
              <th>총 CO2 절감량 (g)</th>
              <th>멤버 수</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((item) => (
              <tr key={item.group_id}>
                <td>{item.rank}</td>
                <td>{item.group_name}</td>
                <td>{item.total_co2_saved.toFixed(2)}</td>
                <td>{item.member_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GroupRankingPage;
