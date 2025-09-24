import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string; // Keep for existing uses if any
  user_id: number; // Add user_id as number
  name: string;
  email: string;
  password?: string; // 비밀번호 추가
  phone?: string; // 전화번호 추가
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // 인터페이스에 isLoading 추가
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  signup: (userData: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // isLoading 상태 추가

  // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('eco-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('eco-user');
      }
    }
    setIsLoading(false); // 초기 로딩 완료
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true); // 로그인 시작 시 로딩 상태
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password: password }), // Backend expects username, frontend uses email
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData.detail || 'Unknown error');
        return null;
      }

      const userData = await response.json();
      const { access_token, token_type, user_id, username, role } = userData;

      localStorage.setItem('access_token', access_token);
      
      const loggedInUser: User = {
        id: user_id.toString(), // Keep for existing uses if any
        user_id: user_id, // Assign numeric user_id
        name: username,
        email: email, // Use provided email for consistency
        role: role
      };

      localStorage.setItem('eco-user', JSON.stringify(loggedInUser));
      
      setUser(loggedInUser);
      setIsAuthenticated(true);
      
      return loggedInUser;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    } finally {
      setIsLoading(false); // 로그인 완료 시 로딩 해제
    }
  };

  const signup = async (userData: any): Promise<boolean> => {
    setIsLoading(true); // 회원가입 시작 시 로딩 상태
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.name,
          email: userData.email,
          password_hash: userData.password, // 실제 환경에서는 해싱 필요
          role: userData.role || 'USER' // 기본값 'USER'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Signup failed:', errorData.detail || 'Unknown error');
        return false;
      }

      const newUser = await response.json();
      // 회원가입 성공 후 바로 로그인 처리 (선택 사항)
      // 이 예시에서는 회원가입 후 로그인 페이지로 리다이렉트한다고 가정
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    } finally {
      setIsLoading(false); // 회원가입 완료 시 로딩 해제
    }
  };

  const logout = () => {
    localStorage.clear(); // 모든 로컬 스토리지 데이터 제거
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading, // 이제 정의된 isLoading 사용
    login,
    logout,
    signup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};