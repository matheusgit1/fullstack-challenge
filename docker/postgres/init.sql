SELECT 'CREATE DATABASE games'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'games'
)\gexec

SELECT 'CREATE DATABASE wallets'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'wallets'
)\gexec

SELECT 'CREATE DATABASE admin'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'admin'
)\gexec