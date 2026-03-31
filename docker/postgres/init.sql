DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'games') THEN
      CREATE DATABASE games;
   END IF;

   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wallets') THEN
      CREATE DATABASE wallets;
   END IF;


   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'admin') THEN
      CREATE DATABASE admin;
   END IF;
END
$$;