from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import boto3
import os
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

router = APIRouter()

# AWS S3 설정 (환경변수에서 가져오기)
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'ap-northeast-2')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'ecooo-reports')

def get_db_connection():
    """SQLite 데이터베이스 연결"""
    conn = sqlite3.connect('ecooo.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_user_data(user_id: int) -> Dict[str, Any]:
    """사용자 데이터 가져오기"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 사용자 기본 정보
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    
    # 크레딧 내역
    cursor.execute("""
        SELECT * FROM credits_ledger 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    """, (user_id,))
    credits_history = cursor.fetchall()
    
    # 교통수단 이용 내역
    cursor.execute("""
        SELECT * FROM mobility_logs 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    """, (user_id,))
    mobility_history = cursor.fetchall()
    
    # 챌린지 참여 내역
    cursor.execute("""
        SELECT * FROM challenges 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    """, (user_id,))
    challenges_history = cursor.fetchall()
    
    conn.close()
    
    return {
        'user': dict(user) if user else {},
        'credits_history': [dict(row) for row in credits_history],
        'mobility_history': [dict(row) for row in mobility_history],
        'challenges_history': [dict(row) for row in challenges_history]
    }

def calculate_statistics(data: Dict[str, Any]) -> Dict[str, Any]:
    """통계 계산"""
    credits_history = data['credits_history']
    mobility_history = data['mobility_history']
    
    # 총 크레딧 계산
    total_credits = sum(entry['points'] for entry in credits_history if entry['type'] == 'EARN')
    total_spent = sum(abs(entry['points']) for entry in credits_history if entry['type'] == 'SPEND')
    current_credits = total_credits - total_spent
    
    # 탄소 절감량 계산
    total_carbon_reduced = sum(entry.get('carbon_saved', 0) for entry in mobility_history)
    
    # 교통수단별 통계
    transport_stats = {}
    for entry in mobility_history:
        transport_type = entry.get('transport_type', '기타')
        if transport_type not in transport_stats:
            transport_stats[transport_type] = {'count': 0, 'carbon_saved': 0}
        transport_stats[transport_type]['count'] += 1
        transport_stats[transport_type]['carbon_saved'] += entry.get('carbon_saved', 0)
    
    # 챌린지 통계
    completed_challenges = len([c for c in data['challenges_history'] if c.get('status') == 'completed'])
    
    return {
        'current_credits': current_credits,
        'total_earned': total_credits,
        'total_spent': total_spent,
        'total_carbon_reduced': total_carbon_reduced,
        'transport_stats': transport_stats,
        'completed_challenges': completed_challenges,
        'total_activities': len(mobility_history)
    }

def create_pdf_report(user_data: Dict[str, Any], stats: Dict[str, Any]) -> bytes:
    """PDF 리포트 생성"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
    story = []
    
    # 스타일 정의
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkgreen
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    normal_style = styles['Normal']
    
    # 제목
    story.append(Paragraph("🌱 ECO LIFE 활동 리포트", title_style))
    story.append(Spacer(1, 20))
    
    # 사용자 정보
    user = user_data['user']
    story.append(Paragraph("👤 사용자 정보", heading_style))
    user_info = f"""
    <b>이름:</b> {user.get('name', 'N/A')}<br/>
    <b>이메일:</b> {user.get('email', 'N/A')}<br/>
    <b>가입일:</b> {user.get('created_at', 'N/A')}<br/>
    <b>레벨:</b> Lv.{stats['current_credits'] // 100 + 1}
    """
    story.append(Paragraph(user_info, normal_style))
    story.append(Spacer(1, 20))
    
    # 크레딧 현황
    story.append(Paragraph("💰 크레딧 현황", heading_style))
    credits_info = f"""
    <b>현재 크레딧:</b> {stats['current_credits']:,}C<br/>
    <b>총 획득 크레딧:</b> {stats['total_earned']:,}C<br/>
    <b>총 사용 크레딧:</b> {stats['total_spent']:,}C<br/>
    <b>총 탄소 절감량:</b> {stats['total_carbon_reduced']:.2f}kg
    """
    story.append(Paragraph(credits_info, normal_style))
    story.append(Spacer(1, 20))
    
    # 교통수단별 통계
    story.append(Paragraph("🚌 교통수단별 이용 현황", heading_style))
    if stats['transport_stats']:
        transport_data = [['교통수단', '이용 횟수', '탄소 절감량 (kg)']]
        for transport, data in stats['transport_stats'].items():
            transport_data.append([
                transport, 
                str(data['count']), 
                f"{data['carbon_saved']:.2f}"
            ])
        
        transport_table = Table(transport_data)
        transport_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(transport_table)
    else:
        story.append(Paragraph("교통수단 이용 내역이 없습니다.", normal_style))
    
    story.append(Spacer(1, 20))
    
    # 최근 활동 내역
    story.append(Paragraph("📋 최근 활동 내역", heading_style))
    recent_activities = user_data['credits_history'][:10]  # 최근 10개
    if recent_activities:
        activity_data = [['날짜', '활동', '크레딧', '타입']]
        for activity in recent_activities:
            activity_data.append([
                activity['created_at'][:10],
                activity['reason'][:20] + '...' if len(activity['reason']) > 20 else activity['reason'],
                f"{activity['points']:+d}",
                activity['type']
            ])
        
        activity_table = Table(activity_data)
        activity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8)
        ]))
        story.append(activity_table)
    else:
        story.append(Paragraph("활동 내역이 없습니다.", normal_style))
    
    story.append(Spacer(1, 20))
    
    # 요약 통계
    story.append(Paragraph("📊 요약 통계", heading_style))
    summary_info = f"""
    <b>총 활동 횟수:</b> {stats['total_activities']}회<br/>
    <b>완료한 챌린지:</b> {stats['completed_challenges']}개<br/>
    <b>환경 기여도:</b> {stats['total_carbon_reduced']:.2f}kg CO₂ 절감<br/>
    <b>생성일:</b> {datetime.now().strftime('%Y년 %m월 %d일')}
    """
    story.append(Paragraph(summary_info, normal_style))
    
    # PDF 생성
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def upload_to_s3(pdf_content: bytes, filename: str) -> str:
    """S3에 PDF 업로드"""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=f"reports/{filename}",
            Body=pdf_content,
            ContentType='application/pdf'
        )
        
        # CloudFront URL 생성 (CDN을 사용하는 경우)
        return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/reports/{filename}"
        
    except ClientError as e:
        print(f"S3 업로드 오류: {e}")
        return None

@router.get("/api/export/activity-report/{user_id}")
async def generate_activity_report(user_id: int):
    """활동 리포트 PDF 생성 및 다운로드"""
    try:
        # 사용자 데이터 가져오기
        user_data = get_user_data(user_id)
        if not user_data['user']:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        # 통계 계산
        stats = calculate_statistics(user_data)
        
        # PDF 생성
        pdf_content = create_pdf_report(user_data, stats)
        
        # 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"activity_report_{user_id}_{timestamp}.pdf"
        
        # S3 업로드 (선택사항)
        s3_url = None
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            s3_url = upload_to_s3(pdf_content, filename)
        
        # 직접 다운로드 응답
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(pdf_content))
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리포트 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/api/export/activity-report/{user_id}/s3")
async def get_s3_report_url(user_id: int):
    """S3에 저장된 리포트 URL 반환"""
    try:
        # 사용자 데이터 가져오기
        user_data = get_user_data(user_id)
        if not user_data['user']:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        # 통계 계산
        stats = calculate_statistics(user_data)
        
        # PDF 생성
        pdf_content = create_pdf_report(user_data, stats)
        
        # 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"activity_report_{user_id}_{timestamp}.pdf"
        
        # S3 업로드
        s3_url = upload_to_s3(pdf_content, filename)
        
        if s3_url:
            return {
                "success": True,
                "download_url": s3_url,
                "filename": filename,
                "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="S3 업로드에 실패했습니다.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리포트 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/api/export/activity-summary/{user_id}")
async def get_activity_summary(user_id: int):
    """활동 요약 데이터 반환 (JSON)"""
    try:
        user_data = get_user_data(user_id)
        if not user_data['user']:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        stats = calculate_statistics(user_data)
        
        return {
            "user": user_data['user'],
            "statistics": stats,
            "recent_activities": user_data['credits_history'][:5],
            "transport_summary": stats['transport_stats'],
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"요약 데이터 생성 중 오류가 발생했습니다: {str(e)}")
