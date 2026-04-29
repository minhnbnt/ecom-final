-- MariaDB init script
-- userdb is created automatically via MARIADB_DATABASE env var
-- django user is created automatically via MARIADB_USER env var

-- Grant all privileges to django user
GRANT ALL PRIVILEGES ON userdb.* TO 'django'@'%';
FLUSH PRIVILEGES;
