import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';

const StatisticsPage: React.FC = () => {
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/stats/trends');
        const data = await response.json();
        setTrends(data);
      } catch (error) {
        console.error('Error fetching trends:', error);
      }
    };
    fetchTrends();
  }, []);

  return (
    <div className="statistics-page">
      <PageHeader 
        title="통계"
        subtitle="나의 탄소 절감 트렌드를 확인해보세요"
        icon="📈"
      />
      <div className="charts-container">
        <div className="chart">
          <h3>주간 탄소 절감량</h3>
          <div className="bar-chart">
            {trends?.weekly.map((item: any, index: number) => (
              <div key={index} className="bar" style={{ height: `${item.total_co2_saved_g / 10}px` }}>
                <span>{item.week}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart">
          <h3>월간 탄소 절감량</h3>
          <div className="bar-chart">
            {trends?.monthly.map((item: any, index: number) => (
              <div key={index} className="bar" style={{ height: `${item.total_co2_saved_g / 100}px` }}>
                <span>{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
