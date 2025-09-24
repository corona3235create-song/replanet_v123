import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext'; // Import useUser

interface CreditsData {
  totalCredits: number;
  totalCarbonReduced: number;
  recentEarned: number;
  lastUpdated: string;
}

interface CreditsContextType {
  creditsData: CreditsData;
  updateCredits: (newCredits: number) => Promise<void>;
  addCredits: (credits: number, reason: string) => Promise<void>;
  refreshCredits: () => Promise<void>;
  updateChallengeProgress: (activity: string) => Promise<void>;
  waterGarden: (pointsSpent: number) => Promise<{ success: boolean; message: string }>;
  getCreditsHistory: () => Promise<any[]>;
  completeChallenge: (challengeId: string, challengeType: string, points: number, challengeName: string) => Promise<void>;
  completeActivity: (activityType: string, distance: number, carbonSaved: number, points: number, route: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const CreditsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser(); // Get user from UserContext
  const [creditsData, setCreditsData] = useState<CreditsData>({
    totalCredits: 1240, // 기본값
    totalCarbonReduced: 12.4, // 기본값
    recentEarned: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 크레딧 데이터 가져오기
  const fetchCreditsData = async () => {
    if (!user || !user.id) { // Ensure user and user_id exist
      console.warn("User not logged in or user_id not available. Skipping credits data fetch.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      // localStorage에서 최근 업데이트된 값 확인
      const storedTotal = localStorage.getItem('credits_total');
      const storedUpdate = localStorage.getItem('credits_last_update');
      
      // 크레딧 잔액 가져오기
      const creditsResponse = await fetch(`${API_URL}/api/credits/balance`, { headers: getAuthHeaders() });
      if (!creditsResponse.ok) throw new Error('Failed to fetch credits');
      const creditsDataFromBalance = await creditsResponse.json();

      // 정원 상태 가져오기
      const gardenResponse = await fetch(`${API_URL}/api/credits/garden/${user.id}`, { headers: getAuthHeaders() });
      let gardenData = { total_carbon_reduced: 0 };
      if (gardenResponse.ok) {
        gardenData = await gardenResponse.json();
      }

      // 최근 모빌리티 활동 가져오기
      const mobilityResponse = await fetch(`${API_URL}/api/credits/mobility/${user.id}?limit=1`, { headers: getAuthHeaders() });
      let recentEarned = 0;
      if (mobilityResponse.ok) {
        const mobilityData = await mobilityResponse.json();
        if (mobilityData.length > 0) {
          recentEarned = mobilityData[0].points_earned || 0;
        }
      }

      // 항상 백엔드에서 가져온 최신 값을 사용
      let finalCredits = creditsDataFromBalance.total_points || 0; // Use data from backend API call directly
      let finalCarbonReduced = creditsDataFromBalance.total_carbon_reduced_g || 0; // Use data from balance endpoint

      const newCreditsData = {
        totalCredits: finalCredits,
        totalCarbonReduced: finalCarbonReduced, // Use the correct value
        recentEarned,
        lastUpdated: new Date().toISOString(),
      };
      console.log("CreditsContext: newCreditsData before setCreditsData:", newCreditsData); // Debug log
      setCreditsData(newCreditsData);
      
      // localStorage에 저장하여 다른 컴포넌트에서 사용할 수 있도록 함
      localStorage.setItem('credits_total', newCreditsData.totalCredits.toString());
      localStorage.setItem('credits_carbon', newCreditsData.totalCarbonReduced.toString());
      localStorage.setItem('credits_last_update', new Date().toISOString());
    } catch (err) {
      console.error('Error fetching credits data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // 오류 시 기본값 사용
      setCreditsData(prev => ({
        ...prev,
        lastUpdated: new Date().toISOString(),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 크레딧 업데이트
  const updateCredits = async (newCredits: number) => {
    if (!user || !user.id) return; // User not logged in
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/credits/update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          total_points: newCredits,
        }),
      });

      if (!response.ok) throw new Error('Failed to update credits');

      setCreditsData(prev => ({
        ...prev,
        totalCredits: newCredits,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Error updating credits:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // 크레딧 추가/차감 (양수: 추가, 음수: 차감)
  const addCredits = async (credits: number, reason: string) => {
    if (!user || !user.id) return; // User not logged in
    try {
      setIsLoading(true);
      setError(null);

      // 음수 크레딧인 경우 잔액 확인
      if (credits < 0 && creditsData.totalCredits + credits < 0) {
        throw new Error('크레딧이 부족합니다.');
      }

      const response = await fetch(`${API_URL}/api/credits/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: user.id,
          points: credits,
          reason: reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add credits');
      }

      const result = await response.json();
      
      // 성공 시 즉시 로컬 상태 업데이트
      const newTotal = creditsData.totalCredits + credits;
      setCreditsData(prev => ({
        ...prev,
        totalCredits: newTotal,
        recentEarned: credits,
        lastUpdated: new Date().toISOString(),
      }));

      // 다른 탭에서도 동기화되도록 localStorage에 저장
      localStorage.setItem('credits_last_update', new Date().toISOString());
      localStorage.setItem('credits_total', newTotal.toString());
      
      return result;
    } catch (err) {
      console.error('Error adding credits:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 크레딧 새로고침
  const refreshCredits = async () => {
    await fetchCreditsData();
  };

  // 정원 물주기
  const waterGarden = async (pointsSpent: number) => {
    if (!user || !user.id) return { success: false, message: "User not logged in" }; // User not logged in
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/credits/garden/water`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: user.id,
          points_spent: pointsSpent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to water garden');
      }

      const result = await response.json();
      
      // 성공 후 서버에서 최신 크레딧 데이터를 다시 가져와 동기화합니다.
      console.log("CreditsContext: waterGarden API call successful, fetching new credits data..."); // Debug log
      await new Promise(resolve => setTimeout(resolve, 100)); // Add a small delay
      await fetchCreditsData();
      console.log("CreditsContext: fetchCreditsData completed after watering."); // Debug log
      
      return { success: true, message: result.message || '정원에 물을 주었습니다!' };
    } catch (err) {
      console.error('Error watering garden:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // 크레딧 내역 조회
  const getCreditsHistory = async () => {
    if (!user || !user.id) return []; // User not logged in
    try {
      const response = await fetch(`${API_URL}/api/credits/history/${user.id}?limit=50`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch credits history');
      
      const history = await response.json();
      
      // localStorage에 저장하여 다른 탭과 동기화
      localStorage.setItem('credits_history', JSON.stringify(history));
      
      return history;
    } catch (err) {
      console.error('Error fetching credits history:', err);
      return [];
    }
  };

  // 챌린지 완료 시 크레딧 추가
  const completeChallenge = async (
    challengeId: string, 
    challengeType: string, 
    points: number, 
    challengeName: string
  ): Promise<void> => {
    if (!user || !user.id) return; // User not logged in
    try {
      const response = await fetch(`${API_URL}/api/credits/challenge/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          challenge_id: challengeId,
          challenge_type: challengeType,
          points: points,
          challenge_name: challengeName,
        }),
      });

      if (!response.ok) throw new Error('Failed to complete challenge');

      const result = await response.json();
      console.log('Challenge completed:', result);
      
      // 크레딧 데이터 새로고침 (즉시 호출하지 않고 localStorage 기반 동기화)
      // await fetchCreditsData(); // 제거하여 초기화 문제 방지
    } catch (error) {
      console.error('Error completing challenge:', error);
      setError('챌린지 완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 탄소 절감 활동 완료 시 크레딧 추가
  const completeActivity = async (
    activityType: string,
    distance: number,
    carbonSaved: number,
    points: number,
    route: string
  ): Promise<void> => {
    if (!user || !user.id) return; // User not logged in
    try {
      const response = await fetch(`${API_URL}/api/credits/activity/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          activity_type: activityType,
          distance: distance,
          carbon_saved: carbonSaved,
          points: points,
          route: route,
        }),
      });

      if (!response.ok) throw new Error('Failed to complete activity');

      const result = await response.json();
      console.log('Activity completed:', result);
      
      // 크레딧 데이터 새로고침 (즉시 호출하지 않고 localStorage 기반 동기화)
      // await fetchCreditsData(); // 제거하여 초기화 문제 방지
    } catch (error) {
      console.error('Error completing activity:', error);
      setError('활동 완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 챌린지 진행상황 업데이트
  const updateChallengeProgress = async (activity: string) => {
    if (!user || !user.id) return; // User not logged in
    try {
      // 활동에 따른 탄소 절감량 계산 (kg 단위)
      let carbonReduced = 0;
      let reason = '';

      switch (activity) {
        case '대중교통':
          carbonReduced = 0.5; // kg
          reason = '대중교통 이용';
          break;
        case '자전거':
          carbonReduced = 0.3; // kg
          reason = '자전거 이용';
          break;
        case '도보':
          carbonReduced = 0.1; // kg
          reason = '도보 이동';
          break;
        case '에너지절약':
          carbonReduced = 0.2; // kg
          reason = '에너지 절약';
          break;
        case '친환경활동':
          carbonReduced = 0.4; // kg
          reason = '친환경 활동';
          break;
        default:
          carbonReduced = 0.05; // kg
          reason = '환경 친화적 활동';
      }

      // 탄소 절감량 기반 크레딧 계산 (10g당 1크레딧)
      const creditsEarned = Math.floor(carbonReduced * 100); // kg을 g으로 변환 후 10으로 나누기

      // 크레딧 추가
      await addCredits(creditsEarned, reason);

      // 탄소 절감량 업데이트
      const newCarbonReduced = creditsData.totalCarbonReduced + carbonReduced;
      setCreditsData(prev => ({
        ...prev,
        totalCarbonReduced: newCarbonReduced,
        lastUpdated: new Date().toISOString(),
      }));

      console.log(`챌린지 진행상황 업데이트: ${activity} - ${creditsEarned}크레딧, ${carbonReduced}kg 탄소 절감`);
    } catch (err) {
      console.error('Error updating challenge progress:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchCreditsData();
  }, [user?.id]); // user.id가 변경될 때마다 데이터 다시 가져오기

  // localStorage 변경 감지 (다른 탭에서의 크레딧 변경)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'credits_total' && e.newValue) {
        const newTotal = parseInt(e.newValue);
        setCreditsData(prev => ({
          ...prev,
          totalCredits: newTotal,
          lastUpdated: new Date().toISOString(),
        }));
        // 즉시 모든 데이터 새로고침
        fetchCreditsData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.id]); // user.id가 변경될 때마다 리스너 재등록

  // 주기적으로 데이터 새로고침 (5분마다로 변경하여 초기화 문제 방지)
  useEffect(() => {
    const interval = setInterval(() => {
      // localStorage에 저장된 값이 있으면 우선 사용
      const storedTotal = localStorage.getItem('credits_total');
      const storedUpdate = localStorage.getItem('credits_last_update');
      
      if (storedTotal && storedUpdate) {
        const storedTime = new Date(storedUpdate);
        const now = new Date();
        const diffMinutes = (now.getTime() - storedTime.getTime()) / (1000 * 60);
        
        // 5분 이내의 데이터면 서버에서 새로 가져오지 않음
        if (diffMinutes < 5) {
          return;
        }
      }
      
      fetchCreditsData();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [user?.id]); // user.id가 변경될 때마다 인터벌 재등록

  const value: CreditsContextType = {
    creditsData,
    updateCredits,
    addCredits,
    refreshCredits,
    updateChallengeProgress,
    waterGarden,
    getCreditsHistory,
    completeChallenge,
    completeActivity,
    isLoading,
    error,
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = (): CreditsContextType => {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};

