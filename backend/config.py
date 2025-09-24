import os

# AWS RDS Database Configuration
DB_HOST = "seoul-ht-08-db.cpk0oamsu0g6.us-west-1.rds.amazonaws.com"
DB_PORT = "3306"
DB_USER = "admin"
DB_PASS = "!donggukCAI1234"
DB_NAME = "seoul-ht-08-db"

# JWT Configuration
SECRET_KEY = "qwer7qwerafafdddddddddddd13sfsfddfvlkalfkjsdldafasfafdfaf7qwer7qwer7qwer7qwer7qwer7"
ALGORITHM = "HS256"

# Override environment variables if they exist
DB_HOST = os.getenv("DB_HOST", DB_HOST)
DB_PORT = os.getenv("DB_PORT", DB_PORT)
DB_USER = os.getenv("DB_USER", DB_USER)
DB_PASS = os.getenv("DB_PASS", DB_PASS)
DB_NAME = os.getenv("DB_NAME", DB_NAME)
SECRET_KEY = os.getenv("SECRET_KEY", SECRET_KEY)
ALGORITHM = os.getenv("ALGORITHM", ALGORITHM)
