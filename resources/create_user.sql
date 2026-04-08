-- 02_create_user.sql
-- dbinfo.json의 user/password와 동일한 로그인 및 DB 유저 생성

-- ── 로그인 생성 (서버 레벨) ─────────────────────────────────
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'sample')
BEGIN
    CREATE LOGIN [sample]
        WITH PASSWORD    = 'sample1234!',
             CHECK_POLICY = OFF,        -- 복잡도 정책 비적용 (테스트용)
             CHECK_EXPIRATION = OFF;
    PRINT 'Login [sample] created.';
END
GO

-- ── sourceDB 유저 ────────────────────────────────────────────
USE sourceDB;
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'sample')
BEGIN
    CREATE USER [sample] FOR LOGIN [sample];
    PRINT 'User [sample] created in sourceDB.';
END
GO
ALTER ROLE db_owner ADD MEMBER [sample];
GO

-- ── targetDB 유저 ────────────────────────────────────────────
USE targetDB;
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'sample')
BEGIN
    CREATE USER [sample] FOR LOGIN [sample];
    PRINT 'User [sample] created in targetDB.';
END
GO
ALTER ROLE db_owner ADD MEMBER [sample];
GO

-- ── sampleDB 유저 ────────────────────────────────────────────
USE sampleDB;
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'sample')
BEGIN
    CREATE USER [sample] FOR LOGIN [sample];
    PRINT 'User [sample] created in sampleDB.';
END
GO
ALTER ROLE db_owner ADD MEMBER [sample];
GO
