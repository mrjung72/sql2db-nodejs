-- 01_create_databases.sql
-- sourceDB, targetDB, sampleDB 생성

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sourceDB')
BEGIN
    CREATE DATABASE sourceDB
        COLLATE Korean_Wansung_CI_AS;
    PRINT 'sourceDB created.';
END
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'targetDB')
BEGIN
    CREATE DATABASE targetDB
        COLLATE Korean_Wansung_CI_AS;
    PRINT 'targetDB created.';
END
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sampleDB')
BEGIN
    CREATE DATABASE sampleDB
        COLLATE Korean_Wansung_CI_AS;
    PRINT 'sampleDB created.';
END
GO
