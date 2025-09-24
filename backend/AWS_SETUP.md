# AWS 연동 설정 가이드

## 1. AWS 서비스 설정

### A. S3 버킷 생성
```bash
# AWS CLI 설치 후
aws s3 mb s3://ecooo-reports --region ap-northeast-2
```

### B. IAM 사용자 생성 및 권한 설정
1. AWS 콘솔에서 IAM 사용자 생성
2. 다음 정책 연결:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::ecooo-reports/*"
        }
    ]
}
```

### C. 환경변수 설정
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=ap-northeast-2
export S3_BUCKET_NAME=ecooo-reports
```

## 2. CloudFront 설정 (선택사항)

### A. CloudFront 배포 생성
1. AWS 콘솔에서 CloudFront 배포 생성
2. Origin Domain: `ecooo-reports.s3.ap-northeast-2.amazonaws.com`
3. Default Root Object: `index.html`

### B. CDN URL 사용
```python
# export.py에서 CloudFront URL 사용
CLOUDFRONT_DOMAIN = "d1234567890.cloudfront.net"
return f"https://{CLOUDFRONT_DOMAIN}/reports/{filename}"
```

## 3. Lambda 함수 배포 (고급)

### A. PDF 생성 Lambda 함수
```python
import json
import boto3
from reportlab.pdfgen import canvas
from io import BytesIO

def lambda_handler(event, context):
    # PDF 생성 로직
    # S3에 업로드
    # URL 반환
    pass
```

### B. API Gateway 연동
1. API Gateway에서 Lambda 함수 연결
2. CORS 설정
3. 프론트엔드에서 API Gateway URL 사용

## 4. 모니터링 및 로깅

### A. CloudWatch 설정
```python
import boto3

cloudwatch = boto3.client('cloudwatch')

# 메트릭 전송
cloudwatch.put_metric_data(
    Namespace='Ecooo/Reports',
    MetricData=[
        {
            'MetricName': 'PDFGenerated',
            'Value': 1,
            'Unit': 'Count'
        }
    ]
)
```

### B. 로그 그룹 생성
```bash
aws logs create-log-group --log-group-name /aws/lambda/ecooo-pdf-generator
```

## 5. 비용 최적화

### A. S3 라이프사이클 정책
```json
{
    "Rules": [
        {
            "ID": "DeleteOldReports",
            "Status": "Enabled",
            "Expiration": {
                "Days": 30
            }
        }
    ]
}
```

### B. CloudFront 캐싱
- PDF 파일: 1시간 캐싱
- 정적 리소스: 24시간 캐싱

## 6. 보안 설정

### A. S3 버킷 정책
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::ecooo-reports/reports/*"
        }
    ]
}
```

### B. CORS 설정
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"]
        }
    ]
}
```
