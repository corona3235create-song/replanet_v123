#!/usr/bin/env python3
"""
공공데이터 포털 API 호출 유틸리티
"""
import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import os

class PublicDataAPI:
    def __init__(self):
        # 환경변수에서 API 키 가져오기
        self.api_keys = {
            "air_quality": os.getenv("AIR_QUALITY_API_KEY", ""),
            "transport": os.getenv("TRANSPORT_API_KEY", ""),
            "energy": os.getenv("ENERGY_API_KEY", ""),
            "weather": os.getenv("WEATHER_API_KEY", "")
        }
        
        # API 엔드포인트 설정
        self.endpoints = {
            "air_quality": "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty",
            "transport": "http://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnNoList",
            "energy": "http://apis.data.go.kr/1613000/EnergyStatisticsService/getEnergyStatistics",
            "weather": "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
        }
    
    def get_air_quality(self, region: str = "서울") -> Dict[str, Any]:
        """대기질 정보 조회"""
        try:
            url = self.endpoints["air_quality"]
            params = {
                "serviceKey": self.api_keys["air_quality"],
                "returnType": "json",
                "numOfRows": 100,
                "pageNo": 1,
                "sidoName": region,
                "ver": "1.0"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # 데이터 파싱 및 정제
            if "response" in data and "body" in data["response"]:
                items = data["response"]["body"].get("items", [])
                
                # 대기질 지수 계산 (임시)
                air_quality_index = self._calculate_air_quality_index(items)
                
                return {
                    "region": region,
                    "air_quality_index": air_quality_index,
                    "pm10": self._get_pm10_average(items),
                    "pm25": self._get_pm25_average(items),
                    "o3": self._get_o3_average(items),
                    "no2": self._get_no2_average(items),
                    "last_updated": datetime.utcnow().isoformat(),
                    "status": "success"
                }
            else:
                return self._get_default_air_quality(region)
                
        except Exception as e:
            print(f"대기질 API 호출 실패: {e}")
            return self._get_default_air_quality(region)
    
    def get_transport_usage(self, region: str = "서울") -> Dict[str, Any]:
        """교통 이용률 조회"""
        try:
            # 실제 API 호출 (예시)
            # 여기서는 임시 데이터 반환
            return {
                "region": region,
                "subway_usage": 85.2,  # 지하철 이용률
                "bus_usage": 78.5,     # 버스 이용률
                "bicycle_usage": 12.3, # 자전거 이용률
                "walking_usage": 45.6, # 보행률
                "last_updated": datetime.utcnow().isoformat(),
                "status": "success"
            }
        except Exception as e:
            print(f"교통 이용률 API 호출 실패: {e}")
            return self._get_default_transport_usage(region)
    
    def get_energy_usage(self, region: str = "서울") -> Dict[str, Any]:
        """에너지 사용량 조회"""
        try:
            # 실제 API 호출 (예시)
            return {
                "region": region,
                "electricity_usage": 1250.5,  # 전력 사용량 (kWh)
                "gas_usage": 850.2,           # 가스 사용량 (m³)
                "renewable_energy": 15.8,     # 재생에너지 비율 (%)
                "energy_efficiency": 78.5,    # 에너지 효율 지수
                "last_updated": datetime.utcnow().isoformat(),
                "status": "success"
            }
        except Exception as e:
            print(f"에너지 사용량 API 호출 실패: {e}")
            return self._get_default_energy_usage(region)
    
    def get_weather_info(self, region: str = "서울") -> Dict[str, Any]:
        """날씨 정보 조회"""
        try:
            # 실제 API 호출 (예시)
            return {
                "region": region,
                "temperature": 22.5,      # 온도 (°C)
                "humidity": 65,           # 습도 (%)
                "wind_speed": 3.2,        # 풍속 (m/s)
                "air_pressure": 1013.2,   # 기압 (hPa)
                "last_updated": datetime.utcnow().isoformat(),
                "status": "success"
            }
        except Exception as e:
            print(f"날씨 API 호출 실패: {e}")
            return self._get_default_weather(region)
    
    def get_regional_environmental_index(self, region: str = "서울") -> Dict[str, Any]:
        """지역별 환경 지수 종합 조회"""
        try:
            # 각 API에서 데이터 수집
            air_quality = self.get_air_quality(region)
            transport = self.get_transport_usage(region)
            energy = self.get_energy_usage(region)
            weather = self.get_weather_info(region)
            
            # 종합 환경 지수 계산
            overall_score = self._calculate_overall_environmental_index(
                air_quality, transport, energy, weather
            )
            
            return {
                "region": region,
                "overall_score": overall_score,
                "air_quality": air_quality,
                "transport": transport,
                "energy": energy,
                "weather": weather,
                "last_updated": datetime.utcnow().isoformat(),
                "status": "success"
            }
            
        except Exception as e:
            print(f"환경 지수 조회 실패: {e}")
            return self._get_default_environmental_index(region)
    
    # 헬퍼 메서드들
    def _calculate_air_quality_index(self, items: list) -> int:
        """대기질 지수 계산"""
        if not items:
            return 75  # 기본값
        
        # PM10, PM2.5, O3, NO2 값들을 종합하여 지수 계산
        # 실제로는 복잡한 공식이 필요하지만 여기서는 간단히 처리
        return min(100, max(0, 85 - len(items) * 2))
    
    def _get_pm10_average(self, items: list) -> float:
        """PM10 평균값 계산"""
        if not items:
            return 45.0
        return 45.0  # 임시값
    
    def _get_pm25_average(self, items: list) -> float:
        """PM2.5 평균값 계산"""
        if not items:
            return 25.0
        return 25.0  # 임시값
    
    def _get_o3_average(self, items: list) -> float:
        """O3 평균값 계산"""
        if not items:
            return 0.05
        return 0.05  # 임시값
    
    def _get_no2_average(self, items: list) -> float:
        """NO2 평균값 계산"""
        if not items:
            return 0.03
        return 0.03  # 임시값
    
    def _calculate_overall_environmental_index(self, air_quality, transport, energy, weather) -> int:
        """종합 환경 지수 계산"""
        try:
            air_score = air_quality.get("air_quality_index", 75)
            transport_score = (transport.get("subway_usage", 0) + transport.get("bus_usage", 0)) / 2
            energy_score = energy.get("energy_efficiency", 75)
            weather_score = 80  # 날씨는 기본값
            
            overall = (air_score + transport_score + energy_score + weather_score) / 4
            return round(overall)
        except:
            return 80
    
    # 기본값 반환 메서드들
    def _get_default_air_quality(self, region: str) -> Dict[str, Any]:
        return {
            "region": region,
            "air_quality_index": 75,
            "pm10": 45.0,
            "pm25": 25.0,
            "o3": 0.05,
            "no2": 0.03,
            "last_updated": datetime.utcnow().isoformat(),
            "status": "default"
        }
    
    def _get_default_transport_usage(self, region: str) -> Dict[str, Any]:
        return {
            "region": region,
            "subway_usage": 80.0,
            "bus_usage": 75.0,
            "bicycle_usage": 10.0,
            "walking_usage": 40.0,
            "last_updated": datetime.utcnow().isoformat(),
            "status": "default"
        }
    
    def _get_default_energy_usage(self, region: str) -> Dict[str, Any]:
        return {
            "region": region,
            "electricity_usage": 1200.0,
            "gas_usage": 800.0,
            "renewable_energy": 15.0,
            "energy_efficiency": 75.0,
            "last_updated": datetime.utcnow().isoformat(),
            "status": "default"
        }
    
    def _get_default_weather(self, region: str) -> Dict[str, Any]:
        return {
            "region": region,
            "temperature": 20.0,
            "humidity": 60,
            "wind_speed": 3.0,
            "air_pressure": 1013.0,
            "last_updated": datetime.utcnow().isoformat(),
            "status": "default"
        }
    
    def _get_default_environmental_index(self, region: str) -> Dict[str, Any]:
        return {
            "region": region,
            "overall_score": 80,
            "air_quality": self._get_default_air_quality(region),
            "transport": self._get_default_transport_usage(region),
            "energy": self._get_default_energy_usage(region),
            "weather": self._get_default_weather(region),
            "last_updated": datetime.utcnow().isoformat(),
            "status": "default"
        }

# 전역 인스턴스
public_data_api = PublicDataAPI()


