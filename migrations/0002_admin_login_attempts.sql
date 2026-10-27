-- failed admin logins, used to lock an address out after repeated wrong passwords
CREATE TABLE admin_login_attempts (
  ip TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX admin_login_attempts_ip_at ON admin_login_attempts (ip, at);
