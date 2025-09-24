// MobilityTracker.tsx
// [자동 기록 기능 추가] 전체 파일이 새롭게 추가되었습니다.
// 이 컴포넌트는 GPS를 이용해 사용자의 이동 기록을 실시간으로 추적하는 역할을 합니다.

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // useAuth 임포트

// [자동 기록 기능 추가] 이동 수단 타입을 정의합니다.
type TransportMode = 'WALK' | 'BIKE' | 'BUS' | 'SUBWAY';
const TRANSPORT_MODES: TransportMode[] = ['WALK', 'BIKE', 'BUS', 'SUBWAY'];

// [자동 기록 기능 추가] 위도, 경도 좌표의 타입을 정의합니다.\
interface Position {
  lat: number;
  lon: number;
}

const API_URL = process.env.REACT_APP_API_URL ?? '';

const MobilityTracker: React.FC = () => {
  const { user } = useAuth(); // 현재 사용자 정보 가져오기
  // [자동 기록 기능 추가] 컴포넌트의 상태 변수들을 정의합니다.
  const [isTracking, setIsTracking] = useState<boolean>(false); // 현재 추적 중인지 여부
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null); // 선택된 이동 수단
  const [distance, setDistance] = useState<number>(0); // 총 이동 거리 (km)
  const [startTime, setStartTime] = useState<Date | null>(null); // 시작 시간
  const [positions, setPositions] = useState<Position[]>([]); // 이동 경로 좌표 배열

  // 중복 저장 방지(버튼 더블클릭 등)
  const savingRef = useRef<boolean>(false);

  // [자동 기록 기능 추가] watchPosition의 ID를 저장하기 위한 ref
  const watchIdRef = useRef<number | null>(null);

  // [자동 기록 기능 추가] 두 GPS 좌표 사이의 거리를 계산하는 함수 (Haversine 공식)
  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (pos2.lat - pos1.lat) * (Math.PI / 180);
    const dLon = (pos2.lon - pos1.lon) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pos1.lat * (Math.PI / 180)) *
        Math.cos(pos2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 거리 (km)
  };

  // 디버그용: API URL 확인
  useEffect(() => {
    if (!API_URL) {
      // eslint-disable-next-line no-console
      console.warn('[MobilityTracker] REACT_APP_API_URL이 비어있습니다. .env 설정과 개발서버 재시작을 확인하세요.');
    } else {
      // eslint-disable-next-line no-console
      console.log('[MobilityTracker] API_URL =', API_URL);
    }
  }, []);

  // [자동 기록 기능 추가] "기록 시작" 버튼을 눌렀을 때 실행되는 함수
  const handleStartTracking = () => {
    if (!selectedMode || !TRANSPORT_MODES.includes(selectedMode)) {
      alert('이동 수단을 먼저 선택해주세요.');
      return;
    }

    // GPS 권한 확인 및 위치 정보 받아오기 시작
    if (navigator.geolocation) {
      setIsTracking(true);
      setStartTime(new Date());
      setDistance(0);
      setPositions([]);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos: Position = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          setPositions((prevPositions) => {
            if (prevPositions.length > 0) {
              const lastPos = prevPositions[prevPositions.length - 1];
              const newDistance = calculateDistance(lastPos, newPos);
              // NaN 유입 방지
              if (Number.isFinite(newDistance) && newDistance >= 0) {
                setDistance((prevDistance) => prevDistance + newDistance);
              }
            }
            return [...prevPositions, newPos];
          });
        },
        (error) => {
          console.error('GPS Error:', error);
          alert('GPS 정보를 가져오는 데 실패했습니다.');
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('이 브라우저에서는 GPS를 지원하지 않습니다.');
    }
  };

  // [자동 기록 기능 추가] "기록 종료" 버튼을 눌렀을 때 실행되는 함수
  const handleStopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    // 이중 저장 방지
    if (savingRef.current) return;

    const endTime = new Date();

    // 사전 유효성 검사
    if (!selectedMode || !TRANSPORT_MODES.includes(selectedMode)) {
      setSelectedMode(null);
      setDistance(0);
      return;
    }
    if (!startTime) {
      setSelectedMode(null);
      setDistance(0);
      return;
    }
    // if (!Number.isFinite(distance) || distance < 0.001) { // 1m 미만이면 저장하지 않음 (주석 처리 또는 제거)
    //   setSelectedMode(null);
    //   setDistance(0);
    //   return;
    // }
    if (!API_URL) {
      alert('API URL이 설정되지 않았습니다(.env의 REACT_APP_API_URL 확인).');
      setSelectedMode(null);
      setDistance(0);
      return;
    }
    if (!user || !user.user_id) { // 사용자 인증 확인
      alert('로그인된 사용자 정보가 없습니다. 다시 로그인해주세요.');
      setSelectedMode(null);
      setDistance(0);
      return;
    }

    const logData = {
      user_id: user.user_id, // 실제 로그인된 사용자 ID로 교체
      mode: selectedMode, // 백엔드가 Enum(MobilityMode) 기대
      distance_km: distance,
      started_at: startTime.toISOString(),
      ended_at: endTime.toISOString(),
      // 필요 시 start_point/end_point 포함 가능
      // start_point: positions[0] ? `${positions[0].lat},${positions[0].lon}` : null,
      // end_point: positions[positions.length - 1] ? `${positions[positions.length - 1].lat},${positions[positions.length - 1].lon}` : null,
    };

    try {
      savingRef.current = true;
      const token = localStorage.getItem('access_token'); // 토큰 가져오기
      if (!token) {
        alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const url = `${API_URL}/mobility/log`;
      const response = await axios.post(url, logData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // 필요 시 withCredentials: true
      });

      const co2Saved = response?.data?.co2_saved_g;
      const creditsEarned = response?.data?.eco_credits_earned;

      if (typeof co2Saved === 'number' && typeof creditsEarned === 'number') {
        alert(
          `기록에 성공했습니다!\n- 탄소 절감량: ${co2Saved.toFixed(2)}g\n- 획득 크레딧: ${creditsEarned}P`
        );
      } else {
        alert(
          `기록은 저장되었지만, 일부 데이터에 문제가 있습니다.\n응답 데이터: ${JSON.stringify(
            response?.data
          )}`
        );
      }

      // 대시보드 등 리프레시 알림
      window.dispatchEvent(new CustomEvent('logAdded'));
    } catch (err: unknown) {
      // ====== 여기부터 '광역' 캐치 블록 정확히 끼워넣음 ======
      const e = err as any;

      // Axios 계열로 보이는지(다중 인스턴스/어댑터 대비 덕타이핑)
      const looksAxios =
        !!e &&
        typeof e === 'object' &&
        (e.isAxiosError === true ||
          e.name === 'AxiosError' ||
          typeof e.toJSON === 'function' ||
          (e.config && (e.response || e.request)));

      if (looksAxios) {
        console.error('[POST /mobility/log] Axios-like error', {
          message: e.message,
          name: e.name,
          url: e.config?.url,
          method: e.config?.method,
          data: e.config?.data,
          status: e.response?.status,
          statusText: e.response?.statusText,
          responseData: e.response?.data,
          headers: e.response?.headers,
          request: e.request,
        });

        alert(
          `기록 저장에 실패했습니다.\n${e.response?.status ?? ''} ${ 
            e.response?.statusText ?? e.message
          }`
        );
      } else if (e instanceof TypeError || e?.name === 'TypeError') {
        // 브라우저 네트워크 계열(CORS/혼합콘텐츠/프리플라이트 차단 등)
        console.error('[POST /mobility/log] Browser network error (TypeError?)', {
          name: e.name,
          message: e.message,
          cause: e.cause,
        });
        alert('기록 저장에 실패했습니다.\n브라우저 네트워크 차단(CORS/보안) 가능성이 있습니다.');
      } else {
        console.error('Unknown error:', e);
        alert('기록 저장에 실패했습니다.');
      }
      // ====== 여기까지 정확히 삽입 ======
    } finally {
      savingRef.current = false;
      // 상태 초기화
      setSelectedMode(null);
      setDistance(0);
      setPositions([]);
      setStartTime(null);
    }
  };

  // [자동 기록 기능 추가] 컴포넌트가 언마운트될 때 GPS 추적을 중지하도록 설정
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // [자동 기록 기능 추가] 화면에 보여질 UI 부분입니다.
  return (
    <div
      style={{
        border: '1px solid #eee',
        padding: '20px',
        margin: '16px',
        borderRadius: '12px',
        background: '#f9f9f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>실시간 이동 기록</h3>

      {!isTracking && (
        <div>
          <p style={{ textAlign: 'center', marginBottom: '12px' }}>
            이동 수단을 선택하세요:
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {TRANSPORT_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                style={{
                  backgroundColor: selectedMode === mode ? '#1abc9c' : '#e9ecef',
                  color: selectedMode === mode ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '12px 20px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        {isTracking ? (
          <button
            onClick={handleStopTracking}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '15px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            기록 종료
          </button>
        ) : (
          <button
            onClick={handleStartTracking}
            disabled={!selectedMode}
            style={{
              backgroundColor: selectedMode ? '#1abc9c' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '15px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: selectedMode ? 'pointer' : 'not-allowed',
              width: '100%',
            }}
          >
            기록 시작
          </button>
        )}
      </div>

      {isTracking && (
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            background: '#fff',
            padding: '15px',
            borderRadius: '10px',
          }}
        >
          <p>
            <strong>{selectedMode}</strong> 모드로 추적 중...
          </p>
          <p
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1abc9c',
              margin: '5px 0 0',
            }}
          >
            {distance.toFixed(3)} km
          </p>
        </div>
      )}
    </div>
  );
};

export default MobilityTracker;
