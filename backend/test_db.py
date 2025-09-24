# test_db.py
import pymysql
import sys

HOST = "seoul-ht-08-db.cpk0oamsu0g6.us-west-1.rds.amazonaws.com"
USER = "admin"
PASS = "!donggukCAI1234"
PORT = 3306
DB = "seoul-ht-08-db"  # 선택사항, 없어도 접속은 가능

try:
    conn = pymysql.connect(host=HOST, user=USER, password=PASS, port=PORT, database=DB, connect_timeout=5)
    print("✅ MySQL 연결 성공!")
    conn.close()
except Exception as e:
    print("❌ 연결 실패:", e)
    sys.exit(1)
