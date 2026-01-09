CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  mother_name VARCHAR(120) NOT NULL,
  father_name VARCHAR(120) NOT NULL,
  combat_class ENUM('ASSAULT','SNIPER','SUPPRESSOR','MED','ENG','COM') NOT NULL,
  birth_date DATE NOT NULL,
  blood_type ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  has_allergy TINYINT(1) NOT NULL,
  allergy_details VARCHAR(255),
  phone VARCHAR(30) NOT NULL,
  emergency_phone VARCHAR(30) NOT NULL,
  emergency_contact_name VARCHAR(120) NOT NULL,
  permission_level ENUM('ALTO-COMANDO','COMANDO','ADMIN','BASE','RECRUTA') NOT NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  lockout_until DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS user_credentials (
  user_id CHAR(36) PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  location VARCHAR(160),
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_events_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_assignments (
  id CHAR(36) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  assigned_by CHAR(36) NOT NULL,
  assigned_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_assign_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_assign_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assign_by FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE KEY uq_event_user (event_id, user_id),
  INDEX idx_assign_event (event_id),
  INDEX idx_assign_user (user_id)
);

CREATE TABLE IF NOT EXISTS event_attendance (
  id CHAR(36) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  present TINYINT(1) NOT NULL DEFAULT 0,
  marked_by CHAR(36) NOT NULL,
  marked_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_att_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_by FOREIGN KEY (marked_by) REFERENCES users(id),
  UNIQUE KEY uq_att_event_user (event_id, user_id),
  INDEX idx_att_event (event_id),
  INDEX idx_att_user (user_id)
);

CREATE TABLE IF NOT EXISTS event_observations (
  id CHAR(36) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  operator_id CHAR(36) NULL,
  note TEXT NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_obs_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_obs_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_obs_by FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY uq_obs_event_operator (event_id, operator_id),
  INDEX idx_obs_event (event_id),
  INDEX idx_obs_operator (operator_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  replaced_by CHAR(36) NULL,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  action VARCHAR(160) NOT NULL,
  ip VARCHAR(64),
  user_agent VARCHAR(255),
  metadata JSON,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_mfa (
  user_id CHAR(36) PRIMARY KEY,
  secret_base32 VARCHAR(255) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_user_mfa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
