import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAuthHeaders } from "../contexts/CreditsContext";
import PageHeader from "../components/PageHeader";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./CarbonFootprintPage.css"; // CSS 파일 임포트

// 스키마 정의 (백엔드 PersonalCarbonFootprint 스키마와 일치)
interface ModeStat {
  mode: string;
  saved_g: number;
}

interface DailyStats {
  date: string;
  co2_saved: number; // kg
  points_earned: number;
  activities_count: number;
}

interface PersonalCarbonFootprint {
  user_id: number;
  total_carbon_reduced_kg: number;
  daily_average_kg: number;
  weekly_average_kg: number;
  monthly_average_kg: number;
  breakdown_by_mode: ModeStat[];
  historical_daily_data: DailyStats[];
  comparison_to_national_average_kg?: number;
  projection_annual_kg?: number;
  last_updated: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'];

const CarbonFootprintPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [footprintData, setFootprintData] = useState<PersonalCarbonFootprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (!currentUserId) {
      setError("사용자 정보를 불러올 수 없습니다.");
      setLoading(false);
      return;
    }

    const fetchFootprintData = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_URL}/api/statistics/carbon-footprint`, {
          method: "GET",
          headers: headers,
        });

        if (response.ok) {
          const result = await response.json();
          setFootprintData(result);
        } else {
          const errorText = await response.text();
          setError(`데이터를 불러오는 데 실패했습니다: ${response.status} - ${errorText}`);
        }
      } catch (e) {
        setError(`데이터를 불러오는 중 오류 발생: ${e}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFootprintData();
  }, [currentUserId, API_URL]);

  if (loading) {
    return (
      <div className="carbon-footprint-container">
        <PageHeader title="개인 탄소 발자국" subtitle="나의 탄소 절감 현황을 상세하게 분석합니다" icon="👣" />
        <p className="loading-text">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="carbon-footprint-container">
        <PageHeader title="개인 탄소 발자국" subtitle="나의 탄소 절감 현황을 상세하게 분석합니다" icon="👣" />
        <p className="error-text">오류: {error}</p>
      </div>
    );
  }

  if (!footprintData) {
    return (
      <div className="carbon-footprint-container">
        <PageHeader title="개인 탄소 발자국" subtitle="나의 탄소 절감 현황을 상세하게 분석합니다" icon="👣" />
        <p className="no-data-text">탄소 발자국 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // PieChart를 위한 데이터 변환
  const pieChartData = footprintData.breakdown_by_mode.map(item => ({
    name: item.mode,
    value: item.saved_g
  }));

  return (
    <div className="carbon-footprint-container">
      <PageHeader title="개인 탄소 발자국" subtitle="나의 탄소 절감 현황을 상세하게 분석합니다" icon="👣" />

      <div className="summary-cards">
        <div className="card">
          <h4>총 탄소 절감량</h4>
          <p className="metric">{footprintData.total_carbon_reduced_kg} kg</p>
        </div>
        <div className="card">
          <h4>일일 평균 절감량</h4>
          <p className="metric">{footprintData.daily_average_kg} kg</p>
        </div>
        <div className="card">
          <h4>주간 평균 절감량</h4>
          <p className="metric">{footprintData.weekly_average_kg} kg</p>
        </div>
        <div className="card">
          <h4>월간 평균 절감량</h4>
          <p className="metric">{footprintData.monthly_average_kg} kg</p>
        </div>
        <div className="card">
          <h4>연간 예상 절감량</h4>
          <p className="metric">{footprintData.projection_annual_kg} kg</p>
        </div>
        <div className="card">
          <h4>전국 평균 대비</h4>
          <p className="metric">
            {footprintData.comparison_to_national_average_kg !== undefined
              ? `${(footprintData.total_carbon_reduced_kg - (footprintData.comparison_to_national_average_kg || 0)).toFixed(2)} kg ${footprintData.total_carbon_reduced_kg > (footprintData.comparison_to_national_average_kg || 0) ? '더 절감' : '덜 절감'}`
              : '데이터 없음'}
          </p>
        </div>
      </div>

      <div className="chart-section">
        <h3>교통수단별 탄소 절감 기여도</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${(value / 1000).toFixed(2)} kg`, '절감량']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3>최근 30일 일별 탄소 절감량 (kg)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={footprintData.historical_daily_data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'CO2 절감량 (kg)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value: number) => [`${value} kg`, '절감량']} />
            <Legend />
            <Bar dataKey="co2_saved" fill="#1abc9c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CarbonFootprintPage;
