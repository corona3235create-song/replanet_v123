-- (선택) DB 생성 및 사용
-- CREATE DATABASE IF NOT EXISTS `seoul_ht_08_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- USE `seoul_ht_08_db`;

-- 사용자 그룹
CREATE TABLE IF NOT EXISTS user_groups (
  group_id BIGINT NOT NULL AUTO_INCREMENT,
  group_name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(120) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  user_group_id BIGINT DEFAULT NULL,
  role ENUM('USER','ADMIN') DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_email (email),
  KEY idx_user_group_id (user_group_id),
  CONSTRAINT fk_users_group FOREIGN KEY (user_group_id) REFERENCES user_groups(group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 크레딧 원장
CREATE TABLE IF NOT EXISTS credits_ledger (
  entry_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  ref_log_id BIGINT,
  type VARCHAR(20) NOT NULL,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  meta_json JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cl_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 정원 레벨
CREATE TABLE IF NOT EXISTS garden_levels (
  level_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  level_number INT NOT NULL UNIQUE,
  level_name VARCHAR(50) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  required_waters INT NOT NULL DEFAULT 10,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 정원
CREATE TABLE IF NOT EXISTS user_gardens (
  garden_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  current_level_id BIGINT NOT NULL,
  waters_count INT NOT NULL DEFAULT 0,
  total_waters INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ug_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_ug_level FOREIGN KEY (current_level_id) REFERENCES garden_levels(level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 물주기 로그
CREATE TABLE IF NOT EXISTS garden_watering_logs (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  garden_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  points_spent INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gwl_garden FOREIGN KEY (garden_id) REFERENCES user_gardens(garden_id),
  CONSTRAINT fk_gwl_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 탄소 배출 계수
CREATE TABLE IF NOT EXISTS carbon_factors (
  factor_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  mode VARCHAR(20) NOT NULL,
  g_per_km DECIMAL(10,3) NOT NULL,
  valid_from DATETIME NOT NULL,
  valid_to DATETIME NOT NULL DEFAULT '9999-12-31 23:59:59'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 수집 소스
CREATE TABLE IF NOT EXISTS ingest_sources (
  source_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  source_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 모빌리티 로그
CREATE TABLE IF NOT EXISTS mobility_logs (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  source_id BIGINT,
  mode VARCHAR(20) NOT NULL,
  distance_km DECIMAL(10,3) NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NOT NULL,
  co2_saved_g DECIMAL(12,3),
  points_earned INT NOT NULL DEFAULT 0,
  description VARCHAR(255),
  start_point VARCHAR(255),
  end_point VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ml_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_ml_source FOREIGN KEY (source_id) REFERENCES ingest_sources(source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 챌린지
CREATE TABLE IF NOT EXISTS challenges (
  challenge_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  scope VARCHAR(20) NOT NULL DEFAULT 'PERSONAL',
  target_mode VARCHAR(20) NOT NULL DEFAULT 'ANY',
  target_saved_g BIGINT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 업적
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 업적
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id BIGINT NOT NULL,
  achievement_id BIGINT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, achievement_id),
  CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_ua_ach FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 대시보드 통계
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  date DATE NOT NULL,
  co2_saved_today DECIMAL(12,3) NOT NULL DEFAULT 0.0,
  credits_earned_today INT NOT NULL DEFAULT 0,
  activities_count INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ds_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE KEY uq_ds_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 인덱스
CREATE INDEX idx_credits_ledger_user_id ON credits_ledger(user_id);
CREATE INDEX idx_credits_ledger_created_at ON credits_ledger(created_at);
CREATE INDEX idx_user_gardens_user_id ON user_gardens(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_mobility_logs_user_id ON mobility_logs(user_id);
CREATE INDEX idx_mobility_logs_created_at ON mobility_logs(created_at);
CREATE INDEX idx_dashboard_stats_user_date ON dashboard_stats(user_id, date);
