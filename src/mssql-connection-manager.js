const sql = require('mssql');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const MetadataCache = require('./db/metadata-cache');
const PKDeleter = require('./db/pk-deleter');
const { getAppRoot } = require('./modules/paths');
const { format } = require('./modules/i18n');
const FKAnalyzer = require('./db/fk-analyzer');
const QueryExecutor = require('./db/query-executor');

 

// Language setting (using environment variable, default to English)
const LANGUAGE = process.env.LANGUAGE || 'en';

// Multilingual messages
const messages = {
    en: {
        dbinfoLoaded: 'dbinfo.json loaded: {count} DB configs',
        dbinfoNotFound: 'dbinfo.json file not found.',
        dbinfoLoadFailed: 'Failed to load dbinfo.json: {message}',
        dbConfigNotFound: 'Configuration for DB key \'{key}\' not found.',
        dbConnecting: 'Connecting to DB \'{key}\'... ({server}:{port}/{database})',
        dbConnectionSuccess: 'DB \'{key}\' connection successful!',
        dbConnectionFailed: 'DB \'{key}\' connection failed: {message}',
        dbQueryFailed: 'DB \'{key}\' query execution failed: {message}',
        dbDisconnected: 'DB \'{key}\' disconnected',
        dbDisconnectFailed: 'DB \'{key}\' disconnect failed: {message}',
        allDbsDisconnected: 'All DBs disconnected',
        dbDisconnectError: 'DB disconnect failed: {message}',
        sourceDbAlreadyConnected: 'Source database is already connected.',
        sourceDbConnecting: 'Connecting to source database... ({server}:{port}/{database})',
        sourceDbConnectionSuccess: 'Source database connection successful!',
        sourceDbConnectionFailed: 'Source database connection failed: {message}',
        targetDbAlreadyConnected: 'Target database is already connected.',
        targetDbConnecting: 'Connecting to target database... ({server}:{port}/{database})',
        targetDbConnectionSuccess: 'Target database connection successful!',
        targetDbConnectionFailed: 'Target database connection failed: {message}',
        sessionStarted: '{type} DB session started (temp table available)',
        sessionStartFailed: 'Session start failed ({db}): {message}',
        sessionNotStarted: '{type} DB session not started. Call beginSession() first.',
        sessionQueryFailed: 'Session query execution failed ({db}): {message}',
        sessionEnded: '{type} DB session ended',
        sessionEndFailed: 'Session end failed ({db}): {message}',
        transactionStarted: '{type} DB transaction started',
        transactionStartFailed: 'Transaction start failed: {message}',
        transactionCommitted: '{type} DB transaction committed',
        transactionCommitFailed: 'Transaction commit failed: {message}',
        transactionRolledBack: '{type} DB transaction rolled back',
        transactionRollbackFailed: 'Transaction rollback failed: {message}',
        sourceDb: 'Source',
        targetDb: 'Target',
        dbType: 'DB',
        insertSuccess: 'Data inserted into target DB: {table} - {count} rows',
        insertFailed: 'Data insertion failed: {message}',
        deleteSuccess: 'Data deleted from target DB: {table} - {count} rows',
        deleteFailed: 'Data deletion failed: {message}',
        tableColumnsLoaded: 'Table \'{table}\' columns loaded and cached: {count} columns',
        tableColumnsLoadFailed: 'Failed to load columns for table \'{table}\': {message}',
        tableColumnsCacheMiss: 'Table column cache miss: {table}, loading...',
        tableColumnsCacheHit: 'Table column cache hit: {table}',
        identityColumnFound: 'Identity column found for {table}: {column}',
        identityColumnNotFound: 'No identity column found for {table}',
        fkRelationsFound: 'FK relations found: {count}',
        fkRelationsCalculating: 'Calculating FK relations...',
        fkRelationsCalculated: 'FK relations calculated: {count} tables',
        tableDeletionOrder: 'Table deletion order: {tables}',
        tableDeletionOrderFailed: 'Failed to calculate table deletion order: {message}',
        sourceQueryFailed: 'Source database query execution failed: {message}',
        noDataToInsert: 'No data to insert.',
        targetInsertFailed: 'Target database insertion failed: {message}',
        cacheCleared: '🗑️ Table column cache cleared (excluding Identity columns)',
        cacheStats: '📊 Table column cache stats: {cachedTables} tables, {totalColumns} columns',
        cacheUsed: '📋 Using cached table column info: {table} ({db})',
        loadingColumns: '🔍 Loading table column info from {db} database: {table} - excluding Identity columns',
        cacheSaved: '💾 Table column info cached: {table} ({db}) - {count} columns',
        columnLoadFailed: 'Failed to load table column info ({table}): {message}',
        targetDb2: 'Target',
        noSourceData: 'No source data, skipping deletion for table {table}.',
        targetDbInfo: '🎯 [TARGET DB] Performing deletion on {server}/{database}',
        columnNameCorrected: 'ℹ️ identityColumns name auto-corrected: "{from}" → "{to}"',
        columnNotExists: '⚠️ Warning: identityColumns "{column}" does not exist in target table.',
        targetTableColumns: '   Target table columns: {columns}',
        noPkValues: '❌ No valid PK values, skipping deletion for table {table}.',
        identityColumnsInfo: '   identityColumns: {columns}',
        sourceDataRows: '   sourceData row count: {count}',
        firstRowColumns: '   First row columns: {columns}',
        pkExtracted: '✓ PK values extracted: {count} rows (identityColumns: {columns})',
        pkExtractedCorrected: '✓ PK values extracted: {count} rows (identityColumns: {from} → {to})',
        pkValues: '   PK values: {values}',
        pkValuesFirst10: '   PK values (first 10): {values}...',
        deletingChunk: 'Processing PK-based deletion chunk {current}/{total} ({count} rows)',
        deletingByPk: 'Deleting target table data by PK: {table} ({count} rows targeted)',
        deletingChunkExecute: 'Executing PK-based deletion chunk {current}/{total}...',
        deleteQuery: 'DELETE query: {query}',
        deletingPkValues: 'Target PK values for deletion: {values}',
        deletingPkValuesFirst5: 'Target PK values for deletion (first 5): {values}...',
        deleteComplete: 'Deletion complete: {count} rows deleted',
        chunkDeleteComplete: 'Chunk {current} deletion complete: {count} rows',
        skippingPkDelete: 'ℹ️ Target table {table} is empty. Skipping PK-based deletion before INSERT.',
        targetTableEmpty: 'ℹ️ Target table is empty. No data to delete, proceeding with INSERT only.',
        noMatchingData: '⚠️ Target table has {totalRows} rows, but no matching data for source PK values ({count} values).',
        debugSampleQuery: '   [DEBUG] Sample PK query result: {count} rows',
        debugSamplePk: '   [DEBUG] Sample source PK: {value}',
        debugTargetPkSample: '   [DEBUG] Actual {column} samples in target: {values}',
        debugHint: '   For more details: Set LOG_LEVEL=DEBUG environment variable.',
        insertWillProceed: '   → INSERT will proceed normally.',
        noDeleteTarget: 'ℹ️ No deletion target ({message})',
        totalDeleted: 'Total deleted rows: {count}',
        pkDeleteFailed: 'Target database PK-based deletion failed: {message}',
        deletingAll: 'Deleting all data from target table: {query}',
        deletedRows: 'Deleted rows: {count}',
        deleteAllFailed: 'Target database full deletion failed: {message}',
        transactionBeginFailed: 'Transaction start failed: {message}',
        sourceDbClosed: 'Source database connection closed',
        targetDbClosed: 'Target database connection closed',
        closeConnectionError: 'Error closing database connections: {message}',
        fkQueryingDb: 'Querying FK relations in {db} DB...',
        fkFoundInDb: 'Found {count} FK relations in {db} DB',
        fkQueryFailed: '{db} FK relation query failed: {message}',
        calculatingDeletionOrder: 'Calculating table deletion order... (table count: {count})',
        relevantFkCount: 'Relevant FK relation count: {count}',
        calculatedDeletionOrder: 'Calculated table deletion order: {order}',
        circularRefDetected: '⚠️ Circular reference detected in tables: {tables}',
        circularRefWarning: 'These tables may require temporarily disabling FK constraints.',
        deletionOrderFailed: 'Failed to calculate table deletion order: {message}',
        togglingFk: '{action} FK constraints in {db} DB...',
        fkToggleComplete: 'FK constraints {action} complete in {db} DB',
        fkToggleFailed: 'FK constraint {action} failed: {message}',
        targetQueryFailed: 'Target DB query execution failed: {message}',
        sourceQueryExecuteFailed: 'Source DB query execution failed: {message}',
        fkEnable: 'Enabling',
        fkDisable: 'Disabling',
        resourceDefinitionNotFound: 'Resource definition not found in source: {schema}.{name} ({type})',
        resourceDefinitionFound: 'Resource definition found: {schema}.{name} ({type}) - {length} chars',
        resourceMigrated: 'Resource migrated to target: {target} ({type})',
        resourceMigrateFailed: 'Resource migration failed: {target} ({type}) - {message}',
        unsupportedResourceType: 'Unsupported resource type: {type}',
        resourceSchemaMismatch: 'Source and target schemas differ for {name}; definition header will be rewritten to {targetSchema}.{targetName}'
    },
    kr: {
        dbinfoLoaded: 'dbinfo.json 로드 완료: {count}개 DB 설정',
        dbinfoNotFound: 'dbinfo.json 파일을 찾을 수 없습니다.',
        dbinfoLoadFailed: 'dbinfo.json 로드 실패: {message}',
        dbConfigNotFound: 'DB 키 \'{key}\'에 대한 설정을 찾을 수 없습니다.',
        dbConnecting: 'DB \'{key}\'에 연결 중... ({server}:{port}/{database})',
        dbConnectionSuccess: 'DB \'{key}\' 연결 성공!',
        dbConnectionFailed: 'DB \'{key}\' 연결 실패: {message}',
        dbQueryFailed: 'DB \'{key}\' 쿼리 실행 실패: {message}',
        dbDisconnected: 'DB \'{key}\' 연결 해제 완료',
        dbDisconnectFailed: 'DB \'{key}\' 연결 해제 실패: {message}',
        allDbsDisconnected: '모든 DB 연결 해제 완료',
        dbDisconnectError: 'DB 연결 해제 실패: {message}',
        sourceDbAlreadyConnected: '소스 데이터베이스가 이미 연결되어 있습니다.',
        sourceDbConnecting: '소스 데이터베이스에 연결 중... ({server}:{port}/{database})',
        sourceDbConnectionSuccess: '소스 데이터베이스 연결 성공!',
        sourceDbConnectionFailed: '소스 데이터베이스 연결 실패: {message}',
        targetDbAlreadyConnected: '대상 데이터베이스가 이미 연결되어 있습니다.',
        targetDbConnecting: '대상 데이터베이스에 연결 중... ({server}:{port}/{database})',
        targetDbConnectionSuccess: '대상 데이터베이스 연결 성공!',
        targetDbConnectionFailed: '대상 데이터베이스 연결 실패: {message}',
        sessionStarted: '{type} DB 세션 시작됨 (temp 테이블 사용 가능)',
        sessionStartFailed: '세션 시작 실패 ({db}): {message}',
        sessionNotStarted: '{type} DB 세션이 시작되지 않았습니다. beginSession()을 먼저 호출하세요.',
        sessionQueryFailed: '세션 쿼리 실행 실패 ({db}): {message}',
        sessionEnded: '{type} DB 세션 종료됨',
        sessionEndFailed: '세션 종료 실패 ({db}): {message}',
        transactionStarted: '{type} DB 트랜잭션 시작됨',
        transactionStartFailed: '트랜잭션 시작 실패: {message}',
        transactionCommitted: '{type} DB 트랜잭션 커밋됨',
        transactionCommitFailed: '트랜잭션 커밋 실패: {message}',
        transactionRolledBack: '{type} DB 트랜잭션 롤백됨',
        transactionRollbackFailed: '트랜잭션 롤백 실패: {message}',
        sourceDb: '소스',
        targetDb: '대상',
        dbType: 'DB',
        insertSuccess: '대상 DB에 데이터 삽입 완료: {table} - {count}개 행',
        insertFailed: '데이터 삽입 실패: {message}',
        deleteSuccess: '대상 DB에서 데이터 삭제 완료: {table} - {count}개 행',
        deleteFailed: '데이터 삭제 실패: {message}',
        tableColumnsLoaded: '테이블 \'{table}\' 컬럼 정보 로드 및 캐시 완료: {count}개 컬럼',
        tableColumnsLoadFailed: '테이블 \'{table}\' 컬럼 로드 실패: {message}',
        tableColumnsCacheMiss: '테이블 컬럼 캐시 미스: {table}, 로딩 중...',
        tableColumnsCacheHit: '테이블 컬럼 캐시 히트: {table}',
        identityColumnFound: '{table}의 Identity 컬럼 발견: {column}',
        identityColumnNotFound: '{table}에 Identity 컬럼이 없습니다',
        fkRelationsFound: 'FK 관계 발견: {count}개',
        fkRelationsCalculating: 'FK 관계 분석 중...',
        fkRelationsCalculated: 'FK 관계 분석 완료: {count}개 테이블',
        tableDeletionOrder: '테이블 삭제 순서: {tables}',
        tableDeletionOrderFailed: '테이블 삭제 순서 계산 실패: {message}',
        sourceQueryFailed: '소스 데이터베이스 쿼리 실행 실패: {message}',
        noDataToInsert: '삽입할 데이터가 없습니다.',
        targetInsertFailed: '대상 데이터베이스 삽입 실패: {message}',
        cacheCleared: '🗑️ 테이블 컬럼 캐시 초기화 완료 (Identity Column 제외 적용)',
        cacheStats: '📊 테이블 컬럼 캐시 통계: {cachedTables}개 테이블, {totalColumns}개 컬럼',
        cacheUsed: '📋 캐시에서 테이블 컬럼 정보 사용: {table} ({db})',
        loadingColumns: '🔍 {db} 데이터베이스에서 테이블 컬럼 정보 조회: {table} - Identity Column 제외',
        cacheSaved: '💾 테이블 컬럼 정보 캐시 저장: {table} ({db}) - {count}개 컬럼',
        columnLoadFailed: '테이블 컬럼 정보 조회 실패 ({table}): {message}',
        targetDb2: '대상',
        noSourceData: '소스 데이터가 없어 {table} 테이블 삭제를 건너뜁니다.',
        targetDbInfo: '🎯 [TARGET DB] {server}/{database} 에서 삭제 작업 수행',
        columnNameCorrected: 'ℹ️ identityColumns 컬럼명 자동 보정: "{from}" → "{to}"',
        columnNotExists: '⚠️ 경고: identityColumns "{column}"이(가) 타겟 테이블에 존재하지 않습니다.',
        targetTableColumns: '   타겟 테이블 컬럼: {columns}',
        noPkValues: '❌ 유효한 PK 값이 없어 {table} 테이블 삭제를 건너뜁니다.',
        identityColumnsInfo: '   identityColumns: {columns}',
        sourceDataRows: '   sourceData 행 수: {count}',
        firstRowColumns: '   첫 번째 행의 컬럼: {columns}',
        pkExtracted: '✓ PK 값 추출 완료: {count}개 행 (identityColumns: {columns})',
        pkExtractedCorrected: '✓ PK 값 추출 완료: {count}개 행 (identityColumns: {from} → {to})',
        pkValues: '   PK 값: {values}',
        pkValuesFirst10: '   PK 값 (처음 10개): {values}...',
        deletingChunk: 'PK 기준 삭제 청크 {current}/{total} 처리 중 ({count}개 행)',
        deletingByPk: '대상 테이블 PK 기준 데이터 삭제 중: {table} ({count}개 행 대상)',
        deletingChunkExecute: 'PK 기준 삭제 청크 {current}/{total} 실행 중...',
        deleteQuery: 'DELETE 쿼리: {query}',
        deletingPkValues: '삭제 대상 PK 값: {values}',
        deletingPkValuesFirst5: '삭제 대상 PK 값 (처음 5개): {values}...',
        deleteComplete: '삭제 완료: {count}행 삭제됨',
        chunkDeleteComplete: '청크 {current} 삭제 완료: {count}행',
        skippingPkDelete: 'ℹ️ 타겟 테이블 {table}이(가) 비어있습니다. INSERT 전 PK 기반 삭제를 건너뜁니다.',
        targetTableEmpty: 'ℹ️ 타겟 테이블이 비어있습니다. 삭제할 데이터가 없으므로 INSERT만 진행합니다.',
        noMatchingData: '⚠️ 타겟 테이블에 {totalRows}행이 있지만, 소스 PK 값({count}개)과 일치하는 데이터가 없습니다.',
        debugSampleQuery: '   [DEBUG] 샘플 PK로 조회 결과: {count}행',
        debugSamplePk: '   [DEBUG] 샘플 소스 PK: {value}',
        debugTargetPkSample: '   [DEBUG] 타겟의 실제 {column} 샘플: {values}',
        debugHint: '   상세 정보를 보려면: LOG_LEVEL=DEBUG 환경 변수를 설정하세요.',
        insertWillProceed: '   → INSERT는 정상 진행됩니다.',
        noDeleteTarget: 'ℹ️ 삭제 대상 없음 ({message})',
        totalDeleted: '총 삭제된 행 수: {count}',
        pkDeleteFailed: '대상 데이터베이스 PK 기준 삭제 실패: {message}',
        deletingAll: '대상 테이블 전체 데이터 삭제 중: {query}',
        deletedRows: '삭제된 행 수: {count}',
        deleteAllFailed: '대상 데이터베이스 전체 삭제 실패: {message}',
        transactionBeginFailed: '트랜잭션 시작 실패: {message}',
        sourceDbClosed: '소스 데이터베이스 연결 종료',
        targetDbClosed: '대상 데이터베이스 연결 종료',
        closeConnectionError: '데이터베이스 연결 종료 중 오류: {message}',
        fkQueryingDb: '{db} DB의 FK 참조 관계 조회 중...',
        fkFoundInDb: '{db} DB에서 {count}개의 FK 관계 발견',
        fkQueryFailed: '{db} FK 관계 조회 실패: {message}',
        calculatingDeletionOrder: '테이블 삭제 순서 계산 중... (테이블 수: {count})',
        relevantFkCount: '관련 FK 관계 수: {count}',
        calculatedDeletionOrder: '계산된 테이블 삭제 순서: {order}',
        circularRefDetected: '⚠️ 순환 참조가 감지된 테이블들: {tables}',
        circularRefWarning: '이 테이블들은 FK 제약 조건을 일시적으로 비활성화해야 할 수 있습니다.',
        deletionOrderFailed: '테이블 삭제 순서 계산 실패: {message}',
        togglingFk: '{db} DB의 FK 제약 조건 {action} 중...',
        fkToggleComplete: '{db} DB의 FK 제약 조건 {action} 완료',
        fkToggleFailed: 'FK 제약 조건 {action} 실패: {message}',
        targetQueryFailed: '타겟 DB 쿼리 실행 실패: {message}',
        sourceQueryExecuteFailed: '소스 DB 쿼리 실행 실패: {message}',
        fkEnable: '활성화',
        fkDisable: '비활성화',
        resourceDefinitionNotFound: '소스에서 리소스 정의를 찾을 수 없습니다: {schema}.{name} ({type})',
        resourceDefinitionFound: '리소스 정의 찾음: {schema}.{name} ({type}) - {length}자',
        resourceMigrated: '타겟으로 리소스 이관 완료: {target} ({type})',
        resourceMigrateFailed: '리소스 이관 실패: {target} ({type}) - {message}',
        unsupportedResourceType: '지원하지 않는 리소스 타입: {type}',
        resourceSchemaMismatch: '{name}의 소스/타겟 스키마가 다릅니다. 정의 헤더를 {targetSchema}.{targetName}(으)로 다시 작성합니다.'
    }
};

const msg = messages[LANGUAGE] || messages.en;

class MSSQLConnectionManager {
    constructor() {
        this.sourcePool = null;
        this.targetPool = null;
        this.isSourceConnected = false;
        this.isTargetConnected = false;
        this.customSourceConfig = null;
        this.customTargetConfig = null;
        this.tableColumnCache = {}; // Table column information cache (deprecated: maintained in MetadataCache)
        
        // Session management attributes
        this.sourceSession = null;
        this.targetSession = null;
        this.sessionTransaction = null;
        
        // Attributes for all DB connections from dbinfo.json
        this.dbPools = {}; // Connection pool storage for each DB
        this.dbConnections = {}; // Connection status storage for each DB
        this.dbConfigs = null; // dbinfo.json configuration

        // Cache for table column type information used by bulk insert
        this.tableColumnTypeCache = {};

        // Initialize helpers
        this.metadataCache = new MetadataCache({
            getPool: (isSource) => (isSource ? this.sourcePool : this.targetPool),
            ensureConnected: async (isSource) => (isSource ? this.connectSource() : this.connectTarget()),
            msg
        });

        this.pkDeleter = new PKDeleter({
            getTargetPool: () => this.targetPool,
            ensureTargetConnected: () => this.connectTarget(),
            getTableColumns: (tableName) => this.metadataCache.getTableColumns(tableName, false),
            msg
        });

        this.fkAnalyzer = new FKAnalyzer({
            getPool: (isSource) => (isSource ? this.sourcePool : this.targetPool),
            ensureConnected: async (isSource) => (isSource ? this.connectSource() : this.connectTarget()),
            msg
        });

        this.queryExecutor = new QueryExecutor({
            getSourcePool: () => this.sourcePool,
            getTargetPool: () => this.targetPool,
            ensureSourceConnected: () => this.connectSource(),
            ensureTargetConnected: () => this.connectTarget(),
            msg
        });
    }

    // Load DB configuration from dbinfo.json
    loadDBConfigs() {
        try {
            const appRoot = getAppRoot();
            const configPath = path.join(appRoot, 'config', 'dbinfo.json');
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                this.dbConfigs = JSON.parse(configData);
                console.log(format(msg.dbinfoLoaded, { count: Object.keys(this.dbConfigs).length }));
                return this.dbConfigs;
            } else {
                console.warn(msg.dbinfoNotFound);
                return null;
            }
        } catch (error) {
            console.error(format(msg.dbinfoLoadFailed, { message: error.message }));
            return null;
        }
    }

    // Connect to specific DB
    async connectToDB(dbKey) {
        try {
            if (!this.dbConfigs) {
                this.loadDBConfigs();
            }
            
            if (!this.dbConfigs || !this.dbConfigs[dbKey]) {
                throw new Error(msg.dbConfigNotFound.replace('{key}', dbKey));
            }
            
            if (this.dbPools[dbKey] && this.dbConnections[dbKey]) {
                return this.dbPools[dbKey];
            }
            
            const dbConfig = this.dbConfigs[dbKey];
            const config = this.getDBConfig(dbConfig);
            
            console.log(format(msg.dbConnecting, { key: dbKey, server: config.server, port: config.port, database: config.database }));
            
            const pool = new sql.ConnectionPool(config);
            await pool.connect();
            
            this.dbPools[dbKey] = pool;
            this.dbConnections[dbKey] = true;
            
            console.log(format(msg.dbConnectionSuccess, { key: dbKey }));
            return pool;
            
        } catch (error) {
            console.error(format(msg.dbConnectionFailed, { key: dbKey, message: error.message }));
            throw new Error(format(msg.dbConnectionFailed, { key: dbKey, message: error.message }));
        }
    }

    // Execute query on specific DB
    async queryDB(dbKey, query) {
        try {
            const pool = await this.connectToDB(dbKey);
            const request = pool.request();
            const result = await request.query(query);
            return result.recordset || result;
        } catch (error) {
            console.error(format(msg.dbQueryFailed, { key: dbKey, message: error.message }));
            throw new Error(format(msg.dbQueryFailed, { key: dbKey, message: error.message }));
        }
    }

    // Return list of all available DB keys
    getAvailableDBKeys() {
        if (!this.dbConfigs) {
            this.loadDBConfigs();
        }
        
        if (!this.dbConfigs) {
            return [];
        }
        
        return Object.keys(this.dbConfigs);
    }

    // Disconnect specific DB
    async disconnectDB(dbKey) {
        try {
            if (this.dbPools[dbKey]) {
                await this.dbPools[dbKey].close();
                delete this.dbPools[dbKey];
                this.dbConnections[dbKey] = false;
                console.log(format(msg.dbDisconnected, { key: dbKey }));
            }
        } catch (error) {
            console.error(format(msg.dbDisconnectFailed, { key: dbKey, message: error.message }));
        }
    }

    async disconnectAllDBs() {
        try {
            const dbKeys = Object.keys(this.dbPools);
            for (const dbKey of dbKeys) {
                await this.disconnectDB(dbKey);
            }
            console.log(msg.allDbsDisconnected);
        } catch (error) {
            console.error(format(msg.dbDisconnectError, { message: error.message }));
        }
    }

    // Set custom DB configuration
    setCustomDatabaseConfigs(sourceConfig, targetConfig) {
        this.customSourceConfig = sourceConfig;
        this.customTargetConfig = targetConfig;
    }

    // Get source database connection configuration
    getDBConfig(dbConfig) {

        return {
            server: dbConfig.server,
            port: dbConfig.port || 1433,
            database: dbConfig.database,
            user: dbConfig.user,
            password: dbConfig.password,
            options: {
                encrypt: dbConfig.options?.encrypt ?? true,
                trustServerCertificate: dbConfig.options?.trustServerCertificate ?? true,
                enableArithAbort: dbConfig.options?.enableArithAbort ?? true,
                requestTimeout: dbConfig.options?.requestTimeout ?? 300000,
                connectionTimeout: dbConfig.options?.connectionTimeout ?? 30000
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };
    }

    // Connect to source database
    async connectSource() {
        try {
            if (this.sourcePool && this.isSourceConnected) {
                console.log(msg.sourceDbAlreadyConnected);
                return this.sourcePool;
            }

            const config = this.getDBConfig(this.customSourceConfig);
            console.log(format(msg.sourceDbConnecting, { server: config.server, port: config.port, database: config.database }));
            
            this.sourcePool = new sql.ConnectionPool(config);
            await this.sourcePool.connect();
            this.isSourceConnected = true;
            
            console.log(msg.sourceDbConnectionSuccess);
            return this.sourcePool;
        } catch (error) {
            console.error(format(msg.sourceDbConnectionFailed, { message: error.message }));
            throw new Error(format(msg.sourceDbConnectionFailed, { message: error.message }));
        }
    }

    async connectTarget() {
        try {
            if (this.targetPool && this.isTargetConnected) {
                console.log(msg.targetDbAlreadyConnected);
                return this.targetPool;
            }

            const config = this.getDBConfig(this.customTargetConfig);
            console.log(format(msg.targetDbConnecting, { server: config.server, port: config.port, database: config.database }));
            
            this.targetPool = new sql.ConnectionPool(config);
            await this.targetPool.connect();
            this.isTargetConnected = true;
            
            console.log(msg.targetDbConnectionSuccess);
            return this.targetPool;
        } catch (error) {
            console.error(format(msg.targetDbConnectionFailed, { message: error.message }));
            throw new Error(format(msg.targetDbConnectionFailed, { message: error.message }));
        }
    }

    // Connect to both databases
    async connectBoth() {
        await this.connectSource();
        await this.connectTarget();
        return {
            source: this.sourcePool,
            target: this.targetPool
        };
    }

    // Start session (for temp table usage)
    async beginSession(database = 'target') {
        try {
            const pool = database === 'source' ? this.sourcePool : this.targetPool;
            const connectionType = database === 'source' ? msg.sourceDb : msg.targetDb;
            
            if (!pool) {
                if (database === 'source') {
                    await this.connectSource();
                } else {
                    await this.connectTarget();
                }
            }
            
            // Start session
            const session = pool.request();
            if (database === 'source') {
                this.sourceSession = session;
            } else {
                this.targetSession = session;
            }
            
            console.log(format(msg.sessionStarted, { type: connectionType }));
            return session;
            
        } catch (error) {
            console.error(format(msg.sessionStartFailed, { db: database, message: error.message }));
            throw new Error(format(msg.sessionStartFailed, { db: database, message: error.message }));
        }
    }

    // Execute query in session
    async executeQueryInSession(query, database = 'target') {
        try {
            const session = database === 'source' ? this.sourceSession : this.targetSession;
            const connectionType = database === 'source' ? msg.sourceDb : msg.targetDb;
            
            if (!session) {
                throw new Error(format(msg.sessionNotStarted, { type: connectionType }));
            }
            
            const result = await session.query(query);
            return result;
            
        } catch (error) {
            console.error(format(msg.sessionQueryFailed, { db: database, message: error.message }));
            throw new Error(format(msg.sessionQueryFailed, { db: database, message: error.message }));
        }
    }

    // End session
    async endSession(database = 'target') {
        try {
            const connectionType = database === 'source' ? msg.sourceDb : msg.targetDb;
            
            if (database === 'source') {
                this.sourceSession = null;
            } else {
                this.targetSession = null;
            }
            
            console.log(format(msg.sessionEnded, { type: connectionType }));
            
        } catch (error) {
            console.error(format(msg.sessionEndFailed, { db: database, message: error.message }));
            throw new Error(format(msg.sessionEndFailed, { db: database, message: error.message }));
        }
    }

    // Begin transaction
    async beginTransaction(database = 'target') {
        try {
            const session = database === 'source' ? this.sourceSession : this.targetSession;
            const connectionType = database === 'source' ? msg.sourceDb : msg.targetDb;
            
            if (!session) {
                throw new Error(format(msg.sessionNotStarted, { type: connectionType }));
            }
            
            this.sessionTransaction = await session.beginTransaction();
            console.log(format(msg.transactionStarted, { type: connectionType }));
            
        } catch (error) {
            console.error(format(msg.transactionStartFailed, { message: error.message }));
            throw new Error(format(msg.transactionStartFailed, { message: error.message }));
        }
    }

    // Commit transaction
    async commitTransaction() {
        try {
            if (this.sessionTransaction) {
                await this.sessionTransaction.commit();
                this.sessionTransaction = null;
                console.log(format(msg.transactionCommitted, { type: '' }));
            }
        } catch (error) {
            console.error(format(msg.transactionCommitFailed, { message: error.message }));
            throw new Error(format(msg.transactionCommitFailed, { message: error.message }));
        }
    }

    // Rollback transaction
    async rollbackTransaction() {
        try {
            if (this.sessionTransaction) {
                await this.sessionTransaction.rollback();
                this.sessionTransaction = null;
                console.log(format(msg.transactionRolledBack, { type: '' }));
            }
        } catch (error) {
            console.error(format(msg.transactionRollbackFailed, { message: error.message }));
            throw new Error(format(msg.transactionRollbackFailed, { message: error.message }));
        }
    }

    // Get target table column metadata including data types for bulk insert
    async getTargetTableColumnTypes(tableName) {
        if (this.tableColumnTypeCache[tableName]) {
            return this.tableColumnTypeCache[tableName];
        }

        if (!this.isTargetConnected) {
            await this.connectTarget();
        }

        let parsed = { name: tableName, schema: null };
        try {
            parsed = sql.Table.parseName(tableName);
        } catch (parseErr) {
            // If the table name cannot be parsed, use it as-is and rely on the query
        }

        const request = this.targetPool.request();
        request.input('tableName', sql.NVarChar(128), parsed.name);
        request.input('schema', sql.NVarChar(128), parsed.schema);

        const query = `
            SELECT
                c.COLUMN_NAME AS name,
                c.DATA_TYPE AS dataType,
                c.IS_NULLABLE AS isNullable,
                c.CHARACTER_MAXIMUM_LENGTH AS maxLength,
                c.NUMERIC_PRECISION AS precision,
                c.NUMERIC_SCALE AS scale
            FROM INFORMATION_SCHEMA.COLUMNS c
            WHERE c.TABLE_NAME = @tableName
              AND (@schema IS NULL OR c.TABLE_SCHEMA = @schema)
            ORDER BY c.ORDINAL_POSITION
        `;

        const result = await request.query(query);
        const columns = result.recordset.map(row => ({
            name: row.name,
            dataType: row.dataType,
            isNullable: row.isNullable === 'YES',
            maxLength: row.maxLength,
            precision: row.precision,
            scale: row.scale
        }));

        this.tableColumnTypeCache[tableName] = columns;
        return columns;
    }

    // Map SQL Server data type to mssql type object for bulk insert
    mssqlTypeForColumn(column) {
        const type = (column.dataType || '').toLowerCase();
        const maxLength = column.maxLength;
        const precision = column.precision;
        const scale = column.scale == null ? 0 : column.scale;

        switch (type) {
            case 'bigint': return sql.BigInt;
            case 'int': return sql.Int;
            case 'smallint': return sql.SmallInt;
            case 'tinyint': return sql.TinyInt;
            case 'bit': return sql.Bit;
            case 'float': return sql.Float;
            case 'real': return sql.Real;
            case 'decimal':
            case 'dec':
                return sql.Decimal(precision || 18, scale);
            case 'numeric':
                return sql.Numeric(precision || 18, scale);
            case 'money': return sql.Money;
            case 'smallmoney': return sql.SmallMoney;
            case 'varchar':
                return sql.VarChar((maxLength === -1 || maxLength == null) ? sql.MAX : maxLength);
            case 'nvarchar':
                return sql.NVarChar((maxLength === -1 || maxLength == null) ? sql.MAX : maxLength);
            case 'char':
                return sql.Char(maxLength || 1);
            case 'nchar':
                return sql.NChar(maxLength || 1);
            case 'text': return sql.Text;
            case 'ntext': return sql.NText;
            case 'datetime': return sql.DateTime;
            case 'datetime2':
                return sql.DateTime2(scale);
            case 'smalldatetime': return sql.SmallDateTime;
            case 'date': return sql.Date;
            case 'time':
                return sql.Time(scale);
            case 'datetimeoffset':
                return sql.DateTimeOffset(scale);
            case 'uniqueidentifier': return sql.UniqueIdentifier;
            case 'xml': return sql.Xml;
            case 'varbinary':
                return sql.VarBinary((maxLength === -1 || maxLength == null) ? sql.MAX : maxLength);
            case 'binary':
                return sql.Binary(maxLength || 1);
            case 'image': return sql.Image;
            case 'geography': return sql.Geography;
            case 'geometry': return sql.Geometry;
            case 'hierarchyid':
            case 'udt':
                return sql.UDT;
            case 'timestamp':
            case 'rowversion':
                return sql.VarBinary(8);
            case 'sql_variant': return sql.Variant;
            default:
                console.warn(`Unknown SQL type '${column.dataType}' for column '${column.name}', falling back to NVarChar(MAX).`);
                return sql.NVarChar(sql.MAX);
        }
    }

    // Generate SQL Server data type declaration string from column metadata
    getSqlTypeDeclaration(column) {
        const dataType = (column.dataType || '').toLowerCase();
        const maxLength = column.maxLength;
        const precision = column.precision;
        const scale = column.scale == null ? 0 : column.scale;

        switch (dataType) {
            case 'bigint': return 'BIGINT';
            case 'int': return 'INT';
            case 'smallint': return 'SMALLINT';
            case 'tinyint': return 'TINYINT';
            case 'bit': return 'BIT';
            case 'float': return 'FLOAT';
            case 'real': return 'REAL';
            case 'decimal':
            case 'dec':
                return `DECIMAL(${precision || 18}, ${scale})`;
            case 'numeric':
                return `NUMERIC(${precision || 18}, ${scale})`;
            case 'money': return 'MONEY';
            case 'smallmoney': return 'SMALLMONEY';
            case 'varchar':
                return `VARCHAR(${(maxLength === -1 || maxLength == null) ? 'MAX' : maxLength})`;
            case 'nvarchar':
                return `NVARCHAR(${(maxLength === -1 || maxLength == null) ? 'MAX' : maxLength})`;
            case 'char':
                return `CHAR(${maxLength || 1})`;
            case 'nchar':
                return `NCHAR(${maxLength || 1})`;
            case 'text': return 'TEXT';
            case 'ntext': return 'NTEXT';
            case 'datetime': return 'DATETIME';
            case 'datetime2':
                return `DATETIME2(${scale == null ? 7 : scale})`;
            case 'smalldatetime': return 'SMALLDATETIME';
            case 'date': return 'DATE';
            case 'time':
                return `TIME(${scale == null ? 7 : scale})`;
            case 'datetimeoffset':
                return `DATETIMEOFFSET(${scale == null ? 7 : scale})`;
            case 'uniqueidentifier': return 'UNIQUEIDENTIFIER';
            case 'xml': return 'XML';
            case 'varbinary':
                return `VARBINARY(${(maxLength === -1 || maxLength == null) ? 'MAX' : maxLength})`;
            case 'binary':
                return `BINARY(${maxLength || 1})`;
            case 'image': return 'IMAGE';
            case 'geography': return 'GEOGRAPHY';
            case 'geometry': return 'GEOMETRY';
            case 'hierarchyid':
            case 'udt':
                return dataType.toUpperCase();
            case 'timestamp':
            case 'rowversion':
                return 'ROWVERSION';
            case 'sql_variant': return 'SQL_VARIANT';
            default:
                console.warn(`Unknown SQL type '${column.dataType}' for column '${column.name}', falling back to NVARCHAR(MAX).`);
                return 'NVARCHAR(MAX)';
        }
    }

    // Parse schema.table and return { schema, name, fullName } using bracket-quoted full name
    parseSourceTableName(sourceTableName) {
        if (!sourceTableName) return null;
        let parsed;
        try {
            parsed = sql.Table.parseName(sourceTableName);
        } catch (parseErr) {
            const parts = sourceTableName.split('.');
            parsed = {
                schema: parts.length > 1 ? parts[0] : null,
                name: parts.length > 1 ? parts[1] : parts[0]
            };
        }
        const schema = parsed.schema || 'dbo';
        const name = parsed.name;
        const fullName = `[${schema.replace(/]/g, ']]')}].[${name.replace(/]/g, ']]')}]`;
        return { schema, name, fullName };
    }

    // Get primary key columns from source table, ordered by key ordinal
    async getSourceTablePrimaryKey(sourceTableName) {
        if (!this.isSourceConnected) {
            await this.connectSource();
        }

        const { schema, name, fullName } = this.parseSourceTableName(sourceTableName);

        const query = `
            SELECT c.name AS column_name
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic
                ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c
                ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            INNER JOIN sys.tables t
                ON i.object_id = t.object_id
            INNER JOIN sys.schemas s
                ON t.schema_id = s.schema_id
            WHERE i.is_primary_key = 1
              AND s.name = @schemaName
              AND t.name = @tableName
            ORDER BY ic.key_ordinal
        `;

        const request = this.sourcePool.request();
        request.input('schemaName', sql.NVarChar(128), schema);
        request.input('tableName', sql.NVarChar(128), name);

        const result = await request.query(query);
        return (result.recordset || []).map(row => row.column_name);
    }

    // Get source table-level MS_Description comment
    async getSourceTableComment(sourceTableName) {
        if (!this.isSourceConnected) {
            await this.connectSource();
        }

        const { fullName } = this.parseSourceTableName(sourceTableName);

        const query = `
            SELECT value
            FROM sys.extended_properties
            WHERE major_id = OBJECT_ID(@fullName, 'U')
              AND minor_id = 0
              AND name = 'MS_Description'
        `;

        const request = this.sourcePool.request();
        request.input('fullName', sql.NVarChar(520), fullName);

        const result = await request.query(query);
        return result.recordset && result.recordset.length > 0 ? result.recordset[0].value : null;
    }

    // Get source column-level MS_Description comments as { columnName: value }
    async getSourceColumnComments(sourceTableName) {
        if (!this.isSourceConnected) {
            await this.connectSource();
        }

        const { fullName } = this.parseSourceTableName(sourceTableName);

        const query = `
            SELECT c.name AS column_name, ep.value
            FROM sys.extended_properties ep
            INNER JOIN sys.columns c
                ON ep.major_id = c.object_id AND ep.minor_id = c.column_id
            WHERE ep.major_id = OBJECT_ID(@fullName, 'U')
              AND ep.name = 'MS_Description'
              AND ep.class = 1
        `;

        const request = this.sourcePool.request();
        request.input('fullName', sql.NVarChar(520), fullName);

        const result = await request.query(query);
        const comments = {};
        (result.recordset || []).forEach(row => {
            comments[row.column_name] = row.value;
        });
        return comments;
    }

    // Determine whether a column type can participate in a primary key
    canBePrimaryKey(typeDeclaration) {
        if (!typeDeclaration) return false;
        const t = typeDeclaration.toLowerCase();
        const disallowedTypes = ['text', 'ntext', 'image', 'xml', 'sql_variant', 'rowversion', 'timestamp', 'hierarchyid', 'geography', 'geometry', 'udt'];
        if (disallowedTypes.some(dt => t === dt || t.startsWith(dt + '('))) return false;
        if (t.includes('(max)')) return false;
        return true;
    }

    // Normalize NVARCHAR/NCHAR lengths from source (some are shown as -1 or null)
    isMaxLengthType(typeDeclaration) {
        return /\(max\)$/i.test(typeDeclaration);
    }

    // Extract source table name from a simple SELECT query
    getSourceTableNameFromQuery(query) {
        if (!query || typeof query !== 'string') return null;
        const match = query.match(/\bFROM\s+([\w\[\]\.]+)/i);
        if (!match) return null;
        return match[1].replace(/[\[\]]/g, '');
    }

    // Get source table column metadata from INFORMATION_SCHEMA
    async getSourceTableColumnsFromInformationSchema(sourceTableName) {
        if (!this.isSourceConnected) {
            await this.connectSource();
        }

        const parts = sourceTableName.split('.');
        const schema = parts.length > 1 ? parts[0] : null;
        const name = parts.length > 1 ? parts[1] : parts[0];

        const query = `
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = @tableName
              AND (@schema IS NULL OR TABLE_SCHEMA = @schema)
            ORDER BY ORDINAL_POSITION
        `;

        const request = this.sourcePool.request();
        request.input('tableName', sql.NVarChar(128), name);
        request.input('schema', sql.NVarChar(128), schema);

        const result = await request.query(query);
        return (result.recordset || []).map(row => ({
            name: row.COLUMN_NAME,
            dataType: row.DATA_TYPE,
            maxLength: row.CHARACTER_MAXIMUM_LENGTH,
            precision: row.NUMERIC_PRECISION,
            scale: row.NUMERIC_SCALE,
            isNullable: row.IS_NULLABLE === 'YES'
        }));
    }

    // Create target table from source query metadata if it does not exist
    async createTargetTableFromSourceQuery(targetTable, sourceQuery) {
        try {
            if (!this.isSourceConnected) {
                await this.connectSource();
            }
            if (!this.isTargetConnected) {
                await this.connectTarget();
            }

            let targetParsed;
            try {
                targetParsed = sql.Table.parseName(targetTable);
            } catch (parseErr) {
                targetParsed = { name: targetTable, schema: null };
            }
            const targetSchema = targetParsed.schema || 'dbo';
            const targetName = targetParsed.name;
            const safeTargetSchema = targetSchema.replace(/]/g, ']]');
            const safeTargetName = targetName.replace(/]/g, ']]');
            const fullName = `[${safeTargetSchema}].[${safeTargetName}]`;

            // Determine source table for metadata copy (comments, primary key)
            const sourceTableName = this.getSourceTableNameFromQuery(sourceQuery);
            let primaryKeyColumns = [];
            let tableComment = null;
            let columnComments = {};

            if (sourceTableName) {
                const upperQuery = sourceQuery.toUpperCase();
                // WITH (NOLOCK) 같은 테이블 힌트는 복잡 쿼리로 보지 않음.
                const isComplexQuery = /\b(JOIN|UNION|INTERSECT|EXCEPT|APPLY|PIVOT|UNPIVOT|INTO)\b|\bWITH(?![\s]*\()/i.test(upperQuery);
                if (isComplexQuery) {
                    console.log(`Source query contains JOIN/UNION/etc. Skipping comment/PK extraction.`);
                } else {
                    try {
                        [tableComment, columnComments, primaryKeyColumns] = await Promise.all([
                            this.getSourceTableComment(sourceTableName),
                            this.getSourceColumnComments(sourceTableName),
                            this.getSourceTablePrimaryKey(sourceTableName)
                        ]);
                    } catch (metaErr) {
                        console.warn(`Failed to extract source metadata: ${metaErr.message}`);
                    }
                }
            }

            // Try sys.dm_exec_describe_first_result_set first
            let columns = [];
            try {
                const describeQuery = `
                    SELECT name, system_type_name, is_nullable
                    FROM sys.dm_exec_describe_first_result_set(@sourceQuery, NULL, 0)
                    WHERE error_number IS NULL
                    ORDER BY column_ordinal
                `;
                const request = this.sourcePool.request();
                request.input('sourceQuery', sql.NVarChar(sql.MAX), sourceQuery);
                const result = await request.query(describeQuery);

                if (result.recordset && result.recordset.length > 0) {
                    columns = result.recordset.map(row => ({
                        name: row.name,
                        typeDeclaration: row.system_type_name,
                        isNullable: row.is_nullable === true || row.is_nullable === 1
                    }));
                }
            } catch (dmfErr) {
                console.warn(`sys.dm_exec_describe_first_result_set failed: ${dmfErr.message}`);
            }

            // Fallback: read source table schema from INFORMATION_SCHEMA
            if (columns.length === 0) {
                if (!sourceTableName) {
                    throw new Error(`Could not determine source table name for isCreateTable from query: ${sourceQuery}`);
                }
                const sourceColumns = await this.getSourceTableColumnsFromInformationSchema(sourceTableName);
                if (sourceColumns.length === 0) {
                    throw new Error(`Could not retrieve column metadata for source table: ${sourceTableName}`);
                }
                columns = sourceColumns.map(col => ({
                    name: col.name,
                    typeDeclaration: this.getSqlTypeDeclaration(col),
                    isNullable: col.isNullable
                }));
            }

            // Filter primary key columns to those present in the result set
            const columnNameSet = new Set(columns.map(c => c.name));
            primaryKeyColumns = primaryKeyColumns.filter(pk => columnNameSet.has(pk));

            // Verify PK columns have eligible types
            const pkCanBeCreated = primaryKeyColumns.length > 0 && primaryKeyColumns.every(pk => {
                const col = columns.find(c => c.name === pk);
                return col && this.canBePrimaryKey(col.typeDeclaration);
            });

            // Build column definitions. PK columns are forced to NOT NULL.
            const columnDefinitions = columns.map(col => {
                const isPk = primaryKeyColumns.includes(col.name);
                const nullability = isPk ? 'NOT NULL' : (col.isNullable ? 'NULL' : 'NOT NULL');
                return `[${col.name}] ${col.typeDeclaration} ${nullability}`;
            }).join(',\n    ');

            const pkConstraint = pkCanBeCreated
                ? `,\n    CONSTRAINT [PK_${safeTargetSchema}_${safeTargetName}] PRIMARY KEY (${primaryKeyColumns.map(c => `[${c.replace(/]/g, ']]')}]`).join(', ')})`
                : '';

            const tableCommentSql = tableComment
                ? `EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'${tableComment.replace(/'/g, "''")}', @level0type = N'SCHEMA', @level0name = N'${targetSchema}', @level1type = N'TABLE', @level1name = N'${targetName}';`
                : '';

            const columnCommentSqls = columns.map(col => {
                const comment = columnComments[col.name];
                if (!comment) return '';
                return `EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'${comment.replace(/'/g, "''")}', @level0type = N'SCHEMA', @level0name = N'${targetSchema}', @level1type = N'TABLE', @level1name = N'${targetName}', @level2type = N'COLUMN', @level2name = N'${col.name}';`;
            }).filter(Boolean);

            const createQuery = `
                IF OBJECT_ID('${fullName}', 'U') IS NULL
                BEGIN
                    CREATE TABLE ${fullName} (
                        ${columnDefinitions}${pkConstraint}
                    );
                END
            `;

            // Extended properties must be added in a separate batch after the table is created,
            // because the table/column metadata is not visible to system procedures
            // until the CREATE TABLE batch completes.
            const safeFullName = fullName.replace(/'/g, "''");
            const commentStatements = [];
            if (tableComment) {
                commentStatements.push(`
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.extended_properties
                        WHERE major_id = OBJECT_ID('${safeFullName}', 'U')
                          AND minor_id = 0
                          AND name = N'MS_Description'
                    )
                    BEGIN
                        EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'${tableComment.replace(/'/g, "''")}', @level0type = N'SCHEMA', @level0name = N'${targetSchema}', @level1type = N'TABLE', @level1name = N'${targetName}';
                    END
                `);
            }

            columns.forEach(col => {
                const comment = columnComments[col.name];
                if (!comment) return;
                const safeComment = comment.replace(/'/g, "''");
                commentStatements.push(`
                    IF NOT EXISTS (
                        SELECT 1
                        FROM sys.extended_properties ep
                        INNER JOIN sys.columns c
                            ON ep.major_id = c.object_id AND ep.minor_id = c.column_id
                        WHERE ep.major_id = OBJECT_ID('${safeFullName}', 'U')
                          AND ep.name = N'MS_Description'
                          AND c.name = N'${col.name.replace(/'/g, "''")}'
                    )
                    BEGIN
                        EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'${safeComment}', @level0type = N'SCHEMA', @level0name = N'${targetSchema}', @level1type = N'TABLE', @level1name = N'${targetName}', @level2type = N'COLUMN', @level2name = N'${col.name.replace(/'/g, "''")}';
                    END
                `);
            });

            const addCommentsQuery = commentStatements.join('\n');

            const targetRequest = this.targetPool.request();
            await targetRequest.query(createQuery);

            if (addCommentsQuery) {
                const commentRequest = this.targetPool.request();
                await commentRequest.query(addCommentsQuery);
            }

            console.log(`Target table '${fullName}' created (or already exists) for data migration.`);
        } catch (error) {
            console.error(`Failed to create target table '${targetTable}': ${error.message}`);
            throw new Error(`Failed to create target table '${targetTable}': ${error.message}`);
        }
    }

    // Insert data into target database using bulk insert
    async insertToTarget(tableName, columns, data) {
        try {
            if (!this.isTargetConnected) {
                await this.connectTarget();
            }

            if (!data || data.length === 0) {
                console.log(msg.noDataToInsert);
                return { rowsAffected: [0] };
            }

            const columnTypes = await this.getTargetTableColumnTypes(tableName);
            const typeMap = new Map();
            for (const col of columnTypes) {
                typeMap.set(col.name.toLowerCase(), col);
            }

            const table = new sql.Table(tableName);
            for (const column of columns) {
                const meta = typeMap.get(column.toLowerCase());
                if (!meta) {
                    throw new Error(`Column '${column}' not found in target table '${tableName}' metadata.`);
                }
                table.columns.add(column, this.mssqlTypeForColumn(meta), { nullable: meta.isNullable });
            }

            for (const row of data) {
                const values = columns.map(column => (row[column] === undefined ? null : row[column]));
                table.rows.add(...values);
            }

            const request = this.targetPool.request();
            const result = await request.bulk(table);
            const rowCount = typeof result.rowsAffected === 'number'
                ? result.rowsAffected
                : (result.rowsAffected && result.rowsAffected[0] ? result.rowsAffected[0] : 0);

            console.log(format(msg.insertSuccess, { table: tableName, count: rowCount }));
            return { rowsAffected: [rowCount] };
        } catch (error) {
            console.error(format(msg.insertFailed, { message: error.message }));
            throw new Error(format(msg.insertFailed, { message: error.message }));
        }
    }

    // Clear table column cache
    clearTableColumnCache() {
        // Backward-compatible wrapper
        this.metadataCache.clear();
        // Keep local field in sync for any legacy access
        this.tableColumnCache = {};
        // Clear bulk insert type cache
        this.tableColumnTypeCache = {};
    }

    // Get table column cache statistics
    getTableColumnCacheStats() {
        return this.metadataCache.getStats();
    }

    // Query table column information (with caching)
    async getTableColumns(tableName, isSource = false) {
        return this.metadataCache.getTableColumns(tableName, isSource);
    }

    // Delete table data from target database (by PK)
    async deleteFromTargetByPK(tableName, identityColumns, sourceData) {
        return this.pkDeleter.deleteFromTargetByPK(tableName, identityColumns, sourceData);
    }

    // Delete all data from target table (used when considering FK order)
    async deleteAllFromTarget(tableName) {
        try {
            if (!this.isTargetConnected) {
                await this.connectTarget();
            }

            const request = this.targetPool.request();
            const deleteQuery = `DELETE FROM ${tableName}`;
            
            console.log(format(msg.deletingAll, { query: deleteQuery }));
            const result = await request.query(deleteQuery);
            
            console.log(format(msg.deletedRows, { count: result.rowsAffected[0] }));
            return result;
        } catch (error) {
            console.error(format(msg.deleteAllFailed, { message: error.message }));
            throw new Error(format(msg.deleteAllFailed, { message: error.message }));
        }
    }

    // Begin transaction
    async beginTransaction() {
        try {
            if (!this.isTargetConnected) {
                await this.connectTarget();
            }
            
            const transaction = new sql.Transaction(this.targetPool);
            await transaction.begin();
            return transaction;
        } catch (error) {
            console.error(format(msg.transactionBeginFailed, { message: error.message }));
            throw new Error(format(msg.transactionBeginFailed, { message: error.message }));
        }
    }

    // Close connections
    async closeConnections() {
        try {
            if (this.sourcePool && this.isSourceConnected) {
                await this.sourcePool.close();
                this.isSourceConnected = false;
                console.log(msg.sourceDbClosed);
            }
            
            if (this.targetPool && this.isTargetConnected) {
                await this.targetPool.close();
                this.isTargetConnected = false;
                console.log(msg.targetDbClosed);
            }
        } catch (error) {
            console.error(format(msg.closeConnectionError, { message: error.message }));
        }
    }

    // Resource type metadata
    getResourceTypeMap() {
        return {
            procedure: { typeLetters: ['P'], keyword: 'PROCEDURE' },
            function: { typeLetters: ['FN', 'IF', 'TF'], keyword: 'FUNCTION' },
            view: { typeLetters: ['V'], keyword: 'VIEW' },
            trigger: { typeLetters: ['TR'], keyword: 'TRIGGER' }
        };
    }

    getResourceObjectType(type) {
        const map = this.getResourceTypeMap();
        const normalized = (type || '').toLowerCase();
        if (!map[normalized]) {
            throw new Error(format(msg.unsupportedResourceType, { type }));
        }
        return map[normalized];
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    parseResourceName(name, defaultSchema) {
        if (!name) return { schema: defaultSchema || 'dbo', name: '' };
        const parts = name.split('.');
        if (parts.length >= 2) {
            return { schema: parts[0], name: parts.slice(1).join('.') };
        }
        return { schema: defaultSchema || 'dbo', name };
    }

    // Retrieve a programmable object definition from the source database
    async getResourceDefinition(sourceSchema, sourceName, type) {
        const typeInfo = this.getResourceObjectType(type);
        const typeFilter = typeInfo.typeLetters.length === 1
            ? `= '${typeInfo.typeLetters[0]}'`
            : `IN ('${typeInfo.typeLetters.join("','")}')`;

        const query = `
            SELECT sm.definition, o.type
            FROM sys.objects o
            INNER JOIN sys.schemas s ON o.schema_id = s.schema_id
            INNER JOIN sys.sql_modules sm ON o.object_id = sm.object_id
            WHERE o.name = @objectName
              AND s.name = @schemaName
              AND o.type ${typeFilter}
        `;

        try {
            const request = this.sourcePool.request();
            request.input('objectName', sql.NVarChar, sourceName);
            request.input('schemaName', sql.NVarChar, sourceSchema);
            const result = await request.query(query);

            if (!result.recordset || result.recordset.length === 0) {
                return null;
            }

            return result.recordset[0];
        } catch (error) {
            throw new Error(format(msg.resourceDefinitionNotFound, { schema: sourceSchema, name: sourceName, type }) + `: ${error.message}`);
        }
    }

    // Rewrite the schema/name in the CREATE header when target differs from source
    replaceSchemaInDefinition(definition, type, sourceSchema, sourceName, targetSchema, targetName) {
        if (!definition) return definition;
        const typeInfo = this.getResourceObjectType(type);
        const keyword = typeInfo.keyword;
        const escapedSchema = this.escapeRegex(sourceSchema);
        const escapedName = this.escapeRegex(sourceName);

        const headerRegex = new RegExp(
            `(CREATE\\s+${keyword}\\s+)(?:\\[?${escapedSchema}\\]?\\s*\\.\\s*)?(?:\\[?${escapedName}\\]?)(?=\\s|\\()`,
            'i'
        );

        return definition.replace(headerRegex, `$1[${targetSchema}].[${targetName}]`);
    }

    // Migrate a programmable object from source to target
    async migrateResourceToTarget(resource) {
        const {
            sourceSchema, sourceName, targetSchema, targetName, type, dropBeforeCreate
        } = resource;

        const typeInfo = this.getResourceObjectType(type);
        const keyword = typeInfo.keyword;

        const definitionRow = await this.getResourceDefinition(sourceSchema, sourceName, type);
        if (!definitionRow || !definitionRow.definition) {
            throw new Error(format(msg.resourceDefinitionNotFound, { schema: sourceSchema, name: sourceName, type }));
        }

        let definition = definitionRow.definition;

        if (sourceSchema !== targetSchema || sourceName !== targetName) {
            console.log(format(msg.resourceSchemaMismatch, {
                name: `${sourceSchema}.${sourceName}`,
                targetSchema,
                targetName
            }));
            definition = this.replaceSchemaInDefinition(definition, type, sourceSchema, sourceName, targetSchema, targetName);
        }

        console.log(format(msg.resourceDefinitionFound, {
            schema: sourceSchema,
            name: sourceName,
            type,
            length: definition.length
        }));

        const targetFullName = `[${targetSchema}].[${targetName}]`;

        let objectIdCheck;
        if (type === 'function') {
            objectIdCheck = `(OBJECT_ID('${targetFullName}', 'FN') IS NOT NULL OR OBJECT_ID('${targetFullName}', 'IF') IS NOT NULL OR OBJECT_ID('${targetFullName}', 'TF') IS NOT NULL)`;
        } else {
            const objectType = definitionRow.type || typeInfo.typeLetters[0];
            objectIdCheck = `OBJECT_ID('${targetFullName}', '${objectType}') IS NOT NULL`;
        }

        const dropPart = dropBeforeCreate
            ? `IF ${objectIdCheck}
    DROP ${keyword} ${targetFullName};`
            : '';

        const escapedDefinition = definition.replace(/'/g, "''");
        const migrationQuery = `
            ${dropPart}
            EXEC(N'${escapedDefinition}');
        `;

        try {
            const targetRequest = this.targetPool.request();
            await targetRequest.query(migrationQuery);
            console.log(format(msg.resourceMigrated, { target: targetFullName, type }));
        } catch (error) {
            throw new Error(format(msg.resourceMigrateFailed, { target: targetFullName, type, message: error.message }));
        }
    }

    // Check connection status
    getConnectionStatus() {
        return {
            source: this.isSourceConnected,
            target: this.isTargetConnected
        };
    }

    // Query FK relations between tables
    async getForeignKeyRelations(isSource = false) {
        return this.fkAnalyzer.getForeignKeyRelations(isSource);
    }

    // Calculate table deletion order (topological sort)
    async calculateTableDeletionOrder(tableNames, isSource = false) {
        return this.fkAnalyzer.calculateTableDeletionOrder(tableNames, isSource);
    }

    // FK 제약 조건 비활성화/활성화
    async toggleForeignKeyConstraints(enable = true, isSource = false) {
        return this.fkAnalyzer.toggleForeignKeyConstraints(enable, isSource);
    }

    // 타겟 데이터베이스에서 SQL 실행 (전처리/후처리용)
    async executeQueryOnTarget(query) {
        return this.queryExecutor.executeOnTarget(query);
    }

    // 소스 데이터베이스에서 SQL 실행 (전처리/후처리용)
    async executeQueryOnSource(query) {
        return this.queryExecutor.executeOnSource(query);
    }

    // 호환 래퍼: 소스 DB에서 데이터 배열 반환
    async querySource(query) {
        const result = await this.executeQueryOnSource(query);
        return (result && result.recordset) ? result.recordset : [];
    }

    // 호환 래퍼: 타겟 DB에서 데이터 배열 반환
    async queryTarget(query) {
        const result = await this.executeQueryOnTarget(query);
        return (result && result.recordset) ? result.recordset : [];
    }
}

module.exports = MSSQLConnectionManager; 