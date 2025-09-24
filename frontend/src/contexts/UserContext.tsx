import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

// 교통수단 통계 데이터
export interface TransportStats {
  [key: string]: {
    count: number;
    percentage: number;
    carbon_saved: number;
  };
}

// 교통수단 분석 데이터
export interface TransportAnalysis {
  preferred_transport: string;
  transport_stats: TransportStats;
  total_trips: number;
  analysis_date: string;
  ai_insights: string[];
}

// 사용자 페르소나 데이터
export interface UserPersona {
  id: string;
  name: string;
  email: string;
  password?: string; // 비밀번호 추가
  phone: string;
  joinDate: string;
  level: string;
  totalCredits: number;
  totalCarbonReduced: number;
  preferredTransport: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  gardenLevel: number;
  challengeProgress: number;
  challengeGoal: number;
  transportAnalysis?: TransportAnalysis;
}

// 데모용 사용자 페르소나 데이터
const DEMO_USER: UserPersona = {
  id: "1",
  name: '김에코',
  email: 'kim.eco@example.com',
  phone: '010-1234-5678',
  joinDate: '2024-01-15',
  level: 'Lv.1',
  totalCredits: 1240,
  totalCarbonReduced: 18.5,
  preferredTransport: '대중교통',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  gardenLevel: 1,
  challengeProgress: 18.5,
  challengeGoal: 20.0
};

interface UserContextType {
  user: UserPersona;
  updateUser: (updates: Partial<UserPersona>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<UserPersona>(DEMO_USER);
  const [isLoading, setIsLoading] = React.useState(false);
  const { user: authUser } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // AuthContext의 사용자 정보가 변경될 때 UserContext 동기화
  useEffect(() => {
    if (authUser) {
      setUser(prev => ({
        ...prev,
        id: authUser.id, // AuthContext에서 이미 string으로 변환됨
        name: authUser.name,
        email: authUser.email,
        password: authUser.password,
        phone: authUser.phone || prev.phone,
      }));
    }
  }, [authUser]);

  // localStorage에서 크레딧 데이터를 가져와서 UserContext 동기화
  useEffect(() => {
    const updateUserFromStorage = () => {
      const storedCredits = localStorage.getItem('credits_total');
      const storedCarbon = localStorage.getItem('credits_carbon');
      
      if (storedCredits && storedCarbon) {
        const totalCredits = parseInt(storedCredits);
        const totalCarbonReduced = parseFloat(storedCarbon);
        
        setUser(prev => ({
          ...prev,
          totalCredits,
          totalCarbonReduced,
          level: `Lv.${Math.floor(totalCredits / 100) + 1}`,
          gardenLevel: Math.floor(totalCredits / 100) + 1,
        }));
      }
    };

    // 초기 로드
    updateUserFromStorage();

    // localStorage 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'credits_total' || e.key === 'credits_carbon') {
        updateUserFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 주기적으로 localStorage 확인 (같은 탭 내에서의 변경 감지)
    const interval = setInterval(updateUserFromStorage, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateUser = (updates: Partial<UserPersona>) => {
    setUser(prev => ({
      ...prev,
      ...updates,
      // 레벨 자동 계산
      level: updates.totalCarbonReduced !== undefined 
        ? `Lv.${Math.floor(updates.totalCarbonReduced / 10) + 1}`
        : prev.level,
      // 정원 레벨 자동 계산
      gardenLevel: updates.totalCarbonReduced !== undefined
        ? Math.floor(updates.totalCarbonReduced / 10) + 1
        : prev.gardenLevel
    }));
  };

  const fetchTransportAnalysis = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/transport/analysis/1`);
      if (response.ok) {
        const analysis = await response.json();
        updateUser({
          preferredTransport: analysis.preferred_transport,
          transportAnalysis: analysis
        });
      }
    } catch (error) {
      console.error('Error fetching transport analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: UserContextType = {
    user,
    updateUser,
    isLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
