const fs = require('fs');
const path = require('path');
const MSSQLConnectionManager = require('./mssql-connection-manager');
const ProgressManager = require('./progress-manager');
const logger = require('./logger');
const { getAppRoot } = require('./modules/paths');

// 모듈화된 컴포넌트들
const ConfigManager = require('./modules/config-manager');
const VariableManager = require('./modules/variable-manager');
const QueryProcessor = require('./modules/query-processor');
const ScriptProcessor = require('./modules/script-processor');

require('dotenv').config();

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

// 다국어 메시지
const messages = {
    en: {
        migrationStart: 'Data migration started:',
        logsDirectoryError: 'Could not create logs directory:',
        dbConfigFound: 'DB connection information found in query definition file.',
        sourceDbConfig: 'Source DB configuration (DB ID)',
        targetDbConfig: 'Target DB configuration (DB ID)',
        targetDbReadOnly: 'Target DB',
        targetDbReadOnlyError: 'is read-only database. Only DB with isWritable=true can be used as target.',
        directConfiguredSource: 'Directly configured source database',
        directConfiguredTarget: 'Directly configured target database',
        usingEnvVars: 'Using DB connection information from environment variables (.env).',
        configLoadFailed: 'Query definition file load failed:',
        globalColumnApplied: 'Global column override applied',
        globalColumnAppliedAll: 'all',
        globalColumnNotApplied: 'Global column override not applied',
        globalColumnSelected: 'Global column override selected',
        globalColumnNotFound: 'Global column override: requested column',
        globalColumnNotFoundEnd: 'not found in global configuration',
        queryMigrationStart: '=== Query migration started:',
        queryDescription: 'Description:',
        preProcessStart: '--- Pre-process execution ---',
        preProcessFailed: 'Pre-process execution failed:',
        preProcessComplete: '--- Pre-process completed ---',
        postProcessStart: '--- Post-process execution ---',
        postProcessFailed: 'Post-process execution failed:',
        postProcessComplete: '--- Post-process completed ---',
        sourceQueryValidated: '✅ sourceQuery validation passed:',
        sourceQueryValidationFailed: 'sourceQuery validation failed:',
        deletingBeforeInsert: 'Deleting data from target table based on PK before migration:',
        noDataToMigrate: 'No data retrieved. Skipping migration.',
        queryMigrationComplete: '=== Query migration completed:',
        rowsProcessed: 'rows processed',
        queryMigrationFailed: '=== Query migration failed:',
        noDataToInsert: 'No data to insert.',
        totalRows: 'Total',
        totalRowsBatch: 'rows to be inserted in batches of',
        batchProcessing: 'Processing batch',
        progress: 'Progress:',
        totalInserted: 'Total',
        totalInsertedEnd: 'rows inserted',
        batchInsertFailed: 'Batch insertion failed:',
        migrationProcessStart: 'MSSQL data migration process started',
        cannotResumeMigration: 'Cannot resume migration:',
        cannotResumeMigrationStatus: 'Migration cannot be resumed. Status:',
        resumingMigration: 'Resuming migration:',
        migrationId: 'Migration ID:',
        connectingToDb: 'Connecting to databases...',
        extractingVariables: 'Dynamic variable extraction started:',
        extractingVariablesComplete: 'All dynamic variable extraction completed',
        enabledQueries: 'Enabled queries:',
        totalQueriesToExecute: 'Total queries to execute:',
        estimatingRowCount: '🔍 Estimating row count for each query...',
        totalEstimatedRows: '📊 Total estimated rows to migrate:',
        existingEstimatedRows: 'Existing estimated rows:',
        transactionStart: 'Transaction started',
        transactionRollback: 'Transaction rollback due to error',
        transactionCommit: 'Transaction committed',
        transactionRollbackComplete: 'Transaction rollback completed',
        transactionRollbackFailed: 'Transaction rollback failed:',
        migrationProcessError: 'Migration process error:',
        migrationProcessComplete: '\n=== Migration process completed ===',
        totalExecutionTime: 'Total execution time:',
        secondsSuffix: 'seconds',
        successfulQueries: 'Successful queries:',
        failedQueries: 'Failed queries:',
        totalProcessedRows: 'Total processed rows:',
        progressSummary: '\n=== Progress summary ===',
        finalStatus: 'Final status:',
        totalProgress: 'Total progress:',
        success: 'success',
        failed: 'failed',
        detailedLog: '\nDetailed log:',
        progressFile: 'Progress file:',
        dryRunMode: '🧪 DRY RUN mode: Data migration simulation\n',
        connectingToSource: '📡 Connecting to source database...',
        dynamicVarSimulation: '\n🔍 Dynamic variable extraction simulation:',
        items: 'items',
        noDescription: 'no description',
        extractionComplete: '✅ Extraction completed → Variable:',
        extractionFailed: '❌ Extraction failed:',
        querySimulation: '\n📋 Migration query simulation:',
        queryId: 'Query ID:',
        description: 'Description:',
        targetTable: 'Target table:',
        dataToMigrate: '📊 Data to migrate:',
        rows: 'rows',
        simulationSuccess: '✅ Simulation successful',
        simulationFailed: '❌ Simulation failed:',
        dryRunSummary: '\n🎯 DRY RUN simulation summary',
        executionTime: '⏱️  Execution time:',
        totalQueriesCount: '📊 Total queries:',
        totalDataToMigrate: '📈 Total data to migrate:',
        dryRunNote: '\n💡 Note: DRY RUN mode does not modify actual data.',
        dryRunError: '❌ Error during DRY RUN:',
        configValidated: '✅ Configuration validation completed',
        totalQueriesFound: '- Total queries:',
        enabledQueriesFound: '- Enabled queries:',
        dynamicVariablesFound: '- Dynamic variables:',
        configValidationFailed: '❌ Configuration validation failed:',
        connectionSuccess: 'connection successful',
        requiredEnvVarsNotSet: 'Required environment variables not set:',
        unknownAttributesInSettings: '⚠️ Unknown attributes in settings:',
        allowedAttributesSettings: 'Allowed attributes:',
        noEnabledQueries: '⚠️ No enabled queries. (Query definition file structure validation successful)',
        invalidAttributesInQuery: '❌ Invalid attributes in queries[',
        idNotSpecified: 'not specified',
        allowedAttributesQuery: 'Allowed attributes:',
        invalidAttributeError: 'Query has invalid attribute names:',
        missingIdInQuery: 'queries[',
        missingIdEnd: '] does not have id attribute.',
        missingSourceQuery: 'Query',
        missingSourceQueryEnd: 'does not have sourceQuery or sourceQueryFile.',
        missingTargetTable: 'does not have targetTable attribute.',
        invalidPreProcessAttrs: 'has invalid attributes in preProcess:',
        invalidPostProcessAttrs: 'has invalid attributes in postProcess:'
    },
    kr: {
        migrationStart: '데이터 이관 시작:',
        logsDirectoryError: '로그 디렉토리 생성 실패:',
        dbConfigFound: '쿼리문정의 파일에서 DB 연결 정보를 발견했습니다.',
        sourceDbConfig: '소스 DB 설정(DB ID)',
        targetDbConfig: '타겟 DB 설정 (DB ID)',
        targetDbReadOnly: '타겟 DB',
        targetDbReadOnlyError: '는 읽기 전용 데이터베이스입니다. isWritable=true인 DB만 타겟으로 사용할 수 있습니다.',
        directConfiguredSource: '직접 설정된 소스 데이터베이스',
        directConfiguredTarget: '직접 설정된 타겟 데이터베이스',
        usingEnvVars: '환경 변수(.env)에서 DB 연결 정보를 사용합니다.',
        configLoadFailed: '쿼리문정의 파일 로드 실패:',
        globalColumnApplied: '전역 컬럼 오버라이드 적용',
        globalColumnAppliedAll: 'all',
        globalColumnNotApplied: '전역 컬럼 오버라이드 적용 안 함',
        globalColumnSelected: '전역 컬럼 오버라이드 선택 적용:',
        globalColumnNotFound: '전역 컬럼 오버라이드: 요청된 컬럼',
        globalColumnNotFoundEnd: '이 전역 설정에 없음',
        queryMigrationStart: '=== 쿼리 이관 시작:',
        queryDescription: '설명:',
        preProcessStart: '--- 전처리 실행 ---',
        preProcessFailed: '전처리 실행 실패:',
        preProcessComplete: '--- 전처리 완료 ---',
        postProcessStart: '--- 후처리 실행 ---',
        postProcessFailed: '후처리 실행 실패:',
        postProcessComplete: '--- 후처리 완료 ---',
        sourceQueryValidated: '✅ sourceQuery 검증 통과:',
        sourceQueryValidationFailed: 'sourceQuery 검증 실패:',
        deletingBeforeInsert: '이관 전 대상 테이블 PK 기준 데이터 삭제:',
        noDataToMigrate: '조회된 데이터가 없습니다. 이관을 건너뜁니다.',
        queryMigrationComplete: '=== 쿼리 이관 완료:',
        rowsProcessed: '행 처리',
        queryMigrationFailed: '=== 쿼리 이관 실패:',
        noDataToInsert: '삽입할 데이터가 없습니다.',
        totalRows: '총',
        totalRowsBatch: '행을',
        batchProcessing: '배치',
        progress: '진행률:',
        totalInserted: '총',
        totalInsertedEnd: '행 삽입 완료',
        batchInsertFailed: '배치 삽입 실패:',
        migrationProcessStart: 'MSSQL 데이터 이관 프로세스 시작',
        cannotResumeMigration: '재시작할 마이그레이션을 찾을 수 없습니다:',
        cannotResumeMigrationStatus: '마이그레이션을 재시작할 수 없습니다. 상태:',
        resumingMigration: '마이그레이션 재시작:',
        migrationId: 'Migration ID:',
        connectingToDb: '데이터베이스 연결 중...',
        extractingVariables: '동적 변수 추출 시작:',
        extractingVariablesComplete: '모든 동적 변수 추출 완료',
        enabledQueries: '활성화된 쿼리:',
        totalQueriesToExecute: '실행할 쿼리 수:',
        estimatingRowCount: '🔍 쿼리별 행 수 추정 시작...',
        totalEstimatedRows: '📊 총 예상 이관 행 수:',
        existingEstimatedRows: '기존 예상 행 수:',
        transactionStart: '트랜잭션 시작',
        transactionRollback: '오류 발생으로 인한 트랜잭션 롤백',
        transactionCommit: '트랜잭션 커밋',
        transactionRollbackComplete: '트랜잭션 롤백 완료',
        transactionRollbackFailed: '트랜잭션 롤백 실패:',
        migrationProcessError: '이관 프로세스 오류:',
        migrationProcessComplete: '\n=== 이관 프로세스 완료 ===',
        totalExecutionTime: '총 실행 시간:',
        secondsSuffix: '초',
        successfulQueries: '성공한 쿼리:',
        failedQueries: '실패한 쿼리:',
        totalProcessedRows: '총 처리된 행:',
        progressSummary: '\n=== 진행 상황 요약 ===',
        finalStatus: '최종 상태:',
        totalProgress: '전체 진행률:',
        success: '성공',
        failed: '실패',
        detailedLog: '\n상세 로그:',
        progressFile: '진행 상황 파일:',
        dryRunMode: '🧪 DRY RUN 모드: 데이터 마이그레이션 시뮬레이션\n',
        connectingToSource: '📡 소스 데이터베이스 연결 중...',
        dynamicVarSimulation: '\n🔍 동적 변수 추출 시뮬레이션:',
        items: '개',
        noDescription: '설명 없음',
        extractionComplete: '✅ 추출 완료 → 변수:',
        extractionFailed: '❌ 추출 실패:',
        querySimulation: '\n📋 마이그레이션 쿼리 시뮬레이션:',
        queryId: '쿼리 ID:',
        description: '설명:',
        targetTable: '대상 테이블:',
        dataToMigrate: '📊 이관 예정 데이터:',
        rows: '행',
        simulationSuccess: '✅ 시뮬레이션 성공',
        simulationFailed: '❌ 시뮬레이션 실패:',
        dryRunSummary: '\n🎯 DRY RUN 시뮬레이션 결과 요약',
        executionTime: '⏱️  실행 시간:',
        totalQueriesCount: '📊 총 쿼리 수:',
        totalDataToMigrate: '📈 총 이관 예정 데이터:',
        dryRunNote: '\n💡 참고: DRY RUN 모드에서는 실제 데이터 변경이 일어나지 않습니다.',
        dryRunError: '❌ DRY RUN 실행 중 오류:',
        configValidated: '✅ 설정 검증 완료',
        totalQueriesFound: '- 전체 쿼리 수:',
        enabledQueriesFound: '- 활성화된 쿼리 수:',
        dynamicVariablesFound: '- 동적 변수 수:',
        configValidationFailed: '❌ 설정 검증 실패:',
        connectionSuccess: '연결 성공',
        requiredEnvVarsNotSet: '필수 환경 변수가 설정되지 않았습니다:',
        unknownAttributesInSettings: '⚠️ settings에 알 수 없는 속성이 있습니다:',
        allowedAttributesSettings: '허용되는 속성:',
        noEnabledQueries: '⚠️ 활성화된 쿼리가 없습니다. (쿼리문정의 파일 구조 검증은 성공)',
        invalidAttributesInQuery: '❌ queries[',
        idNotSpecified: '미지정',
        allowedAttributesQuery: '허용되는 속성:',
        invalidAttributeError: '쿼리에 잘못된 속성명이 있습니다:',
        missingIdInQuery: 'queries[',
        missingIdEnd: ']에 id 속성이 없습니다.',
        missingSourceQuery: '쿼리',
        missingSourceQueryEnd: '에 sourceQuery 또는 sourceQueryFile이 없습니다.',
        missingTargetTable: '에 targetTable 속성이 없습니다.',
        invalidPreProcessAttrs: '의 preProcess에 잘못된 속성이 있습니다:',
        invalidPostProcessAttrs: '의 postProcess에 잘못된 속성이 있습니다:'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * 모듈화된 MSSQL 데이터 마이그레이터
 */
class MSSQLDataMigrator {
    constructor(queryFilePath, dryRun = false) {
        this.queryFilePath = queryFilePath;
        this.dryRun = dryRun;
        this.msg = msg;
        this.enableLogging = process.env.ENABLE_LOGGING === 'true';
        this.enableTransaction = process.env.ENABLE_TRANSACTION === 'true';
        
        // 로그 파일
        this.logFile = null;
        
        // 현재 쿼리 추적
        this.currentQuery = null;
        
        // 기본 컴포넌트
        this.connectionManager = new MSSQLConnectionManager();
        this.progressManager = null;
        
        // 모듈화된 컴포넌트들
        this.configManager = new ConfigManager();
        this.variableManager = new VariableManager(this.connectionManager, this.log.bind(this));
        this.queryProcessor = new QueryProcessor(
            this.connectionManager,
            this.variableManager,
            this.log.bind(this)
        );
        this.scriptProcessor = new ScriptProcessor(
            this.connectionManager,
            this.variableManager,
            this.queryProcessor,
            this.log.bind(this)
        );
        
        // 설정
        this.config = null;
        this.dbInfo = null;
    }

    /**
     * 로그 기록
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        console.log(logMessage);
        
        if (this.enableLogging && this.logFile) {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        }
    }

    /**
     * 로그 파일 초기화
     */
    initializeLogging() {
        if (!this.enableLogging) return;
        
        // 앱 루트 경로 통일
        const appRoot = getAppRoot();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFileName = `migration-log-${timestamp}.txt`;
        this.logFile = path.join(appRoot, 'logs', logFileName);
        
        const logsDir = path.dirname(this.logFile);
        try {
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
        } catch (error) {
            console.warn(`${this.msg.logsDirectoryError} ${error.message}`);
        }
        
        this.log(`${this.msg.migrationStart} ${new Date().toISOString()}`);
    }

    /**
     * DB 정보 파일 로드
     */
    async loadDbInfo() {
        this.dbInfo = await this.configManager.loadDbInfo();
        return this.dbInfo;
    }

    /**
     * DB ID로 연결 정보 조회
     */
    getDbConfigById(dbId) {
        return this.configManager.getDbConfigById(dbId);
    }

    /**
     * 쿼리문정의 파일 로드 및 파싱
     */
    async loadConfig() {
        try {
            // 설정 로드
            this.config = await this.configManager.loadConfig(this.queryFilePath);
            
            // 변수 설정
            this.variableManager.setVariables(this.config.variables || {});
            
            // DB 연결 정보 설정
            if (this.config.settings) {
                logger.info(this.msg.dbConfigFound);
                
                let sourceConfig = null;
                let targetConfig = null;
                
                if (typeof this.config.settings.sourceDatabase === 'string') {
                    const sourceId = this.config.settings.sourceDatabase;
                    sourceConfig = this.getDbConfigById(sourceId);
                    logger.info(this.msg.sourceDbConfig, sourceConfig);
                } else if (this.config.settings.sourceDatabase) {
                    sourceConfig = this.config.settings.sourceDatabase;
                    sourceConfig.description = sourceConfig.description || this.msg.directConfiguredSource;
                }
                
                if (typeof this.config.settings.targetDatabase === 'string') {
                    const targetId = this.config.settings.targetDatabase;
                    targetConfig = this.getDbConfigById(targetId);
                    
                    if (!targetConfig.isWritable) {
                        throw new Error(`${this.msg.targetDbReadOnly} '${targetId}'${this.msg.targetDbReadOnlyError}`);
                    }
                    
                    logger.info(this.msg.targetDbConfig, targetConfig);
                } else if (this.config.settings.targetDatabase) {
                    targetConfig = this.config.settings.targetDatabase;
                    targetConfig.isWritable = targetConfig.isWritable ?? true;
                    targetConfig.description = targetConfig.description || this.msg.directConfiguredTarget;
                }
                
                this.connectionManager.setCustomDatabaseConfigs(sourceConfig, targetConfig);
            } else {
                logger.info(this.msg.usingEnvVars);
            }
            
            return this.config;
        } catch (error) {
            logger.error(this.msg.configLoadFailed, error);
            throw new Error(`${this.msg.configLoadFailed} ${error.message}`);
        }
    }

    /**
     * 선택적으로 전역 컬럼 오버라이드 적용
     */
    async selectivelyApplyGlobalColumnOverrides(globalColumnOverrides, applyGlobalColumns, tableName = null, database = 'target') {
        if (!globalColumnOverrides || globalColumnOverrides.size === 0) {
            return {};
        }
        
        if (!applyGlobalColumns || applyGlobalColumns === '' || applyGlobalColumns === 'undefined') {
            return {};
        }
        
        // 대소문자 구분 없이 처리하기 위해 소문자로 변환
        const normalizedApplyGlobalColumns = applyGlobalColumns.toLowerCase().trim();
        
        // globalColumnOverrides의 키를 대소문자 구분 없이 검색하기 위한 Map 생성
        const columnMap = new Map();
        globalColumnOverrides.forEach((value, column) => {
            columnMap.set(column.toLowerCase(), { originalColumn: column, value: value });
        });
        
        switch (normalizedApplyGlobalColumns) {
            case 'all':
                if (tableName) {
                    const tableColumns = await this.queryProcessor.getTableColumns(tableName, database);
                    // 대소문자 구분 없이 비교하기 위해 소문자로 변환 (객체/문자열 모두 지원)
                    const tableColumnNames = tableColumns.map(col => typeof col === 'string' ? col : col.name);
                    const tableColumnsLower = tableColumnNames.map(col => col.toLowerCase());
                    const existingOverrides = {};
                    
                    globalColumnOverrides.forEach((value, column) => {
                        const columnLower = column.toLowerCase();
                        const matchIndex = tableColumnsLower.indexOf(columnLower);
                        
                        if (matchIndex !== -1) {
                            // 테이블의 실제 컬럼명 사용
                            const actualColumnName = tableColumnNames[matchIndex];
                            // JSON 문자열은 그대로 유지 (실제 데이터 적용 시 매핑됨)
                            existingOverrides[actualColumnName] = value;
                        }
                    });
                    
                    return existingOverrides;
                } else {
                    const allOverrides = {};
                    globalColumnOverrides.forEach((value, column) => {
                        // JSON 문자열은 그대로 유지 (실제 데이터 적용 시 매핑됨)
                        allOverrides[column] = value;
                    });
                    
                    return allOverrides;
                }
                
            case 'none':
                return {};
                
            default:
                if (normalizedApplyGlobalColumns.includes(',')) {
                    const selectedColumns = normalizedApplyGlobalColumns.split(',').map(col => col.trim());
                    const selectedOverrides = {};
                    
                    selectedColumns.forEach(column => {
                        const columnInfo = columnMap.get(column);
                        if (columnInfo) {
                            // JSON 문자열은 그대로 유지 (실제 데이터 적용 시 매핑됨)
                            selectedOverrides[columnInfo.originalColumn] = columnInfo.value;
                        }
                    });
                    
                    return selectedOverrides;
                } else {
                    const columnInfo = columnMap.get(normalizedApplyGlobalColumns);
                    if (columnInfo) {
                        // JSON 문자열은 그대로 유지 (실제 데이터 적용 시 매핑됨)
                        return { 
                            [columnInfo.originalColumn]: columnInfo.value
                        };
                    }
                    return {};
                }
        }
    }

    /**
     * 개별 쿼리 이관 실행
     */
    async executeQueryMigration(queryConfig) {
        try {
            this.log(`\n${this.msg.queryMigrationStart} ${queryConfig.id} ===`);
            this.log(`${this.msg.queryDescription} ${queryConfig.description}`);
            
            // 전처리 실행
            if (queryConfig.preProcess) {
                this.log(`${this.msg.preProcessStart}`);
                const preProcessHasTempTables = this.scriptProcessor.detectTempTableUsageInScript(queryConfig.preProcess.script);
                const preResult = await this.scriptProcessor.executeProcessScript(
                    queryConfig.preProcess, 
                    'target', 
                    preProcessHasTempTables
                );
                
                if (!preResult.success) {
                    throw new Error(`${queryConfig.id} ${this.msg.preProcessFailed} ${preResult.error}`);
                }
                this.log(`${this.msg.preProcessComplete}`);
            }
            
            // 배치 크기 결정
            let batchSize = parseInt(process.env.BATCH_SIZE) || 1000;
            if (queryConfig.batchSize) {
                const processedBatchSize = this.variableManager.replaceVariables(queryConfig.batchSize.toString());
                batchSize = parseInt(processedBatchSize) || batchSize;
            }
            
            // sourceQuery 검증
            const validationResult = this.queryProcessor.validateSingleSqlStatement(queryConfig.sourceQuery);
            if (!validationResult.isValid) {
                throw new Error(`${this.msg.sourceQueryValidationFailed} ${validationResult.message}`);
            }
            this.log(`${this.msg.sourceQueryValidated} ${validationResult.message}`);

            // 소스 데이터 조회
            const sourceData = await this.connectionManager.querySource(queryConfig.sourceQuery);
            
            // PK 기준 삭제 처리
            if (queryConfig.sourceQueryDeleteBeforeInsert) {
                this.log(`${this.msg.deletingBeforeInsert} ${queryConfig.targetTable}`);
                if (sourceData && sourceData.length > 0) {
                    const identityColumns = typeof queryConfig.identityColumns === 'string' && queryConfig.identityColumns.includes(',')
                        ? queryConfig.identityColumns.split(',').map(pk => pk.trim())
                        : queryConfig.identityColumns;
                    await this.connectionManager.deleteFromTargetByPK(queryConfig.targetTable, identityColumns, sourceData);
                }
            }
            
            if (sourceData.length === 0) {
                this.log(this.msg.noDataToMigrate);
                return { success: true, rowsProcessed: 0 };
            }
            
            // globalColumnOverrides 선택 적용 (applyGlobalColumns 설정 기반)
            let processedData = sourceData;
            try {
                const selected = await this.selectivelyApplyGlobalColumnOverrides(
                    this.config.globalColumnOverrides,
                    queryConfig.sourceQueryApplyGlobalColumns,
                    queryConfig.targetTable,
                    'target'
                );

                // 선택된 오버라이드가 있는 경우에만 Map으로 변환하여 적용
                if (selected && Object.keys(selected).length > 0) {
                    const selectedMap = new Map(Object.entries(selected));
                    processedData = this.variableManager.applyGlobalColumnOverrides(sourceData, selectedMap);
                    const appliedCols = Object.keys(selected).join(', ');
                    this.log(`${this.msg.globalColumnApplied} ${appliedCols}`);
                } else if (queryConfig.sourceQueryApplyGlobalColumns) {
                    this.log(`${this.msg.globalColumnNotFound} ${queryConfig.sourceQueryApplyGlobalColumns} ${this.msg.globalColumnNotFoundEnd}`);
                } else {
                    this.log(`${this.msg.globalColumnNotApplied}`);
                }
            } catch (gcoError) {
                this.log(`${this.msg.globalColumnNotApplied} (${gcoError.message})`);
            }
            
            // 데이터 삽입
            const insertedRows = await this.insertDataInBatches(
                queryConfig.targetTable,
                queryConfig.targetColumns,
                processedData,
                batchSize,
                queryConfig.id
            );
            
            // 후처리 실행
            if (queryConfig.postProcess) {
                this.log(`${this.msg.postProcessStart}`);
                const postProcessHasTempTables = this.scriptProcessor.detectTempTableUsageInScript(queryConfig.postProcess.script);
                const postResult = await this.scriptProcessor.executeProcessScript(
                    queryConfig.postProcess, 
                    'target', 
                    postProcessHasTempTables
                );
                
                if (!postResult.success) {
                    this.log(`${queryConfig.id} ${this.msg.postProcessFailed} ${postResult.error}`);
                }
                this.log(`${this.msg.postProcessComplete}`);
            }
            
            this.log(`${this.msg.queryMigrationComplete} ${queryConfig.id} (${insertedRows}${this.msg.rowsProcessed}) ===\n`);
            
            return { success: true, rowsProcessed: insertedRows };
        } catch (error) {
            this.log(`${this.msg.queryMigrationFailed} ${queryConfig.id} - ${error.message} ===\n`);
            return { success: false, error: error.message, rowsProcessed: 0 };
        }
    }

    /**
     * 배치 단위로 데이터 삽입
     */
    async insertDataInBatches(tableName, columns, data, batchSize, queryId = null) {
        try {
            if (!data || data.length === 0) {
                this.log(this.msg.noDataToInsert);
                return 0;
            }

            const totalRows = data.length;
            let insertedRows = 0;
            
            const batchLabel = LANGUAGE === 'kr' ? `${batchSize}개씩 배치로 삽입 시작` : `${this.msg.totalRowsBatch} ${batchSize}`;
            this.log(`${this.msg.totalRows} ${totalRows} ${batchLabel}`);
            
            for (let i = 0; i < totalRows; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                const batchNumber = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(totalRows / batchSize);
             
                const processingLabel = LANGUAGE === 'kr' ? '처리 중' : 'processing';
                const rowsLabel = LANGUAGE === 'kr' ? `${batch.length}${this.msg.rows}` : `${batch.length} ${this.msg.rows}`;
                this.log(`${this.msg.batchProcessing} ${batchNumber}/${totalBatches} ${processingLabel} (${rowsLabel})`);
                
                const result = await this.connectionManager.insertToTarget(tableName, columns, batch);
                const batchInsertedRows = result.rowsAffected[0];
                insertedRows += batchInsertedRows;
                
                const progress = ((i + batch.length) / totalRows * 100).toFixed(1);
                this.log(`${this.msg.progress} ${progress}% (${i + batch.length}/${totalRows})`);
                
                if (this.progressManager && queryId) {
                    this.progressManager.updateBatchProgress(
                        queryId, 
                        batchNumber, 
                        totalBatches, 
                        batchSize, 
                        i + batch.length
                    );
                }
            }
            
            this.log(`${this.msg.totalInserted} ${insertedRows}${this.msg.totalInsertedEnd}`);
            return insertedRows;
        } catch (error) {
            this.log(`${this.msg.batchInsertFailed} ${error.message}`);
            throw error;
        }
    }

    /**
     * 전체 이관 프로세스 실행
     */
    async executeMigration(resumeMigrationId = null) {
        const startTime = Date.now();
        let duration = 0;
        let totalProcessed = 0;
        let successCount = 0;
        let failureCount = 0;
        const results = [];
        let isResuming = false;
        
        try {
            this.initializeLogging();
            this.log(this.msg.migrationProcessStart);
            
            // 진행 상황 관리자 초기화
            if (resumeMigrationId) {
                this.progressManager = ProgressManager.loadProgress(resumeMigrationId);
                if (!this.progressManager) {
                    throw new Error(`${this.msg.cannotResumeMigration} ${resumeMigrationId}`);
                }
                
                if (!this.progressManager.canResume()) {
                    throw new Error(`${this.msg.cannotResumeMigrationStatus} ${this.progressManager.progressData.status}`);
                }
                
                isResuming = true;
                this.progressManager.prepareForResume();
                this.log(`${this.msg.resumingMigration} ${this.progressManager.migrationId}`);
            } else {
                this.progressManager = new ProgressManager();
                this.log(`${this.msg.migrationId} ${this.progressManager.migrationId}`);
            }
            
            // 쿼리문정의 파일 로드
            await this.loadConfig();
            
            // 데이터베이스 연결
            this.log(this.msg.connectingToDb);
            this.progressManager.updatePhase('CONNECTING', 'RUNNING', 'Connecting to databases');
            await this.connectionManager.connectBoth();
            
            // 전역 전처리 그룹 실행
            if (this.config.globalProcesses && this.config.globalProcesses.preProcessGroups) {
                await this.scriptProcessor.executeGlobalProcessGroups('preProcess', this.config, this.progressManager);
            }
            
            // 동적 변수 추출 실행
            if (this.config.dynamicVariables && this.config.dynamicVariables.length > 0) {
                this.log(`${this.msg.extractingVariables} ${this.config.dynamicVariables.length}${this.msg.items || '개'}`);
                this.progressManager.updatePhase('EXTRACTING_VARIABLES', 'RUNNING', `Extracting ${this.config.dynamicVariables.length} dynamic variables`);
                
                for (const extractConfig of this.config.dynamicVariables) {
                    if (extractConfig.enabled !== false) {
                        await this.variableManager.extractDataToVariable(extractConfig);
                    }
                }
                
                this.progressManager.updatePhase('EXTRACTING_VARIABLES', 'COMPLETED', 'Dynamic variable extraction completed');
                this.log(this.msg.extractingVariablesComplete);
            }
            
            // 활성화된 쿼리 필터링
            let enabledQueries = this.config.queries.filter(query => query.enabled);
            
            // 재시작인 경우 완료된 쿼리 필터링
            if (isResuming) {
                const completedQueries = this.progressManager.getCompletedQueries();
                const originalCount = enabledQueries.length;
                enabledQueries = enabledQueries.filter(query => !completedQueries.includes(query.id));
                const itemSuffix = LANGUAGE === 'kr' ? '개' : '';
                const completedLabel = LANGUAGE === 'kr' ? '완료된 쿼리' : 'completed queries';
                this.log(`${this.msg.enabledQueries} ${originalCount}${itemSuffix}, ${completedLabel}: ${completedQueries.length}${itemSuffix}, ${this.msg.totalQueriesToExecute} ${enabledQueries.length}${itemSuffix}`);
                
                completedQueries.forEach(queryId => {
                    const queryData = this.progressManager.progressData.queries[queryId];
                    if (queryData && queryData.status === 'COMPLETED') {
                        results.push({
                            queryId: queryId,
                            description: queryData.description || '',
                            success: true,
                            rowsProcessed: queryData.processedRows || 0
                        });
                        totalProcessed += queryData.processedRows || 0;
                        successCount++;
                    }
                });
            } else {
                this.log(`${this.msg.totalQueriesToExecute} ${enabledQueries.length}`);
            }
            
            // 전체 행 수 추정
            let totalEstimatedRows = 0;
            if (!isResuming) {
                this.log(this.msg.estimatingRowCount);
                for (const query of enabledQueries) {
                    const rowCount = await this.queryProcessor.estimateQueryRowCount(query, this.queryFilePath);
                    totalEstimatedRows += rowCount;
                }
                this.log(`${this.msg.totalEstimatedRows} ${totalEstimatedRows.toLocaleString()}`);
                this.progressManager.startMigration(this.config.queries.filter(query => query.enabled).length, totalEstimatedRows);
            } else {
                totalEstimatedRows = this.progressManager.progressData.totalRows || 0;
                this.log(`${this.msg.existingEstimatedRows} ${totalEstimatedRows.toLocaleString()}${this.msg.rows}`);
            }
            
            // 트랜잭션 시작
            let transaction = null;
            if (this.enableTransaction) {
                this.log(this.msg.transactionStart);
                transaction = await this.connectionManager.beginTransaction();
            }
            
            try {
                this.progressManager.updatePhase('MIGRATING', 'RUNNING', 'Migrating data');
                
                // 각 쿼리 실행
                for (const queryConfig of enabledQueries) {
                    this.currentQuery = queryConfig;
                    
                    // SELECT * 처리 및 컬럼 오버라이드 적용
                    const processedQueryConfig = await this.queryProcessor.processQueryConfig(queryConfig, this.queryFilePath);
                    
                    // columnOverrides 설정 - 선택적으로 전역 컬럼 오버라이드 적용
                    const selectedOverrides = await this.selectivelyApplyGlobalColumnOverrides(
                        this.config.globalColumnOverrides,
                        processedQueryConfig.sourceQueryApplyGlobalColumns,
                        processedQueryConfig.targetTable,
                        'target'
                    );
                    processedQueryConfig.columnOverrides = new Map(Object.entries(selectedOverrides));
                    
                    this.progressManager.startQuery(queryConfig.id, queryConfig.description, 0);
                    
                    const result = await this.executeQueryMigration(processedQueryConfig);
                    results.push({
                        queryId: queryConfig.id,
                        description: queryConfig.description,
                        ...result
                    });
                    
                    totalProcessed += result.rowsProcessed;
                    
                    if (result.success) {
                        successCount++;
                        this.progressManager.completeQuery(queryConfig.id, {
                            processedRows: result.rowsProcessed,
                            insertedRows: result.rowsProcessed
                        });
                    } else {
                        failureCount++;
                        this.progressManager.failQuery(queryConfig.id, new Error(result.error || 'Unknown error'));
                        
                        if (this.enableTransaction && transaction) {
                            this.log(this.msg.transactionRollback);
                            await transaction.rollback();
                            const errorMsg = LANGUAGE === 'kr' ? `쿼리 실행 실패: ${queryConfig.id}` : `Query execution failed: ${queryConfig.id}`;
                            throw new Error(errorMsg);
                        }
                    }
                    
                    this.currentQuery = null;
                }
                
                // 트랜잭션 커밋
                if (this.enableTransaction && transaction) {
                    this.log(this.msg.transactionCommit);
                    await transaction.commit();
                }
                
                // 전역 후처리 그룹 실행
                if (this.config.globalProcesses && this.config.globalProcesses.postProcessGroups) {
                    await this.scriptProcessor.executeGlobalProcessGroups('postProcess', this.config, this.progressManager);
                }
                
            } catch (error) {
                if (this.enableTransaction && transaction) {
                    try {
                        await transaction.rollback();
                        this.log(this.msg.transactionRollbackComplete);
                    } catch (rollbackError) {
                        this.log(`${this.msg.transactionRollbackFailed} ${rollbackError.message}`);
                    }
                }
                throw error;
            }
            
        } catch (error) {
            this.log(`${this.msg.migrationProcessError} ${error.message}`);
            
            if (this.progressManager) {
                this.progressManager.failMigration(error);
            }
            
            throw error;
            
        } finally {
            await this.connectionManager.closeConnections();
            
            const endTime = Date.now();
            duration = (endTime - startTime) / 1000;
            
            if (this.progressManager && failureCount === 0) {
                this.progressManager.completeMigration();
            }
            
            this.log(this.msg.migrationProcessComplete);
            this.log(`${this.msg.totalExecutionTime} ${duration.toFixed(2)}${this.msg.secondsSuffix}`);
            const itemSuffix = LANGUAGE === 'kr' ? '' : '';
            this.log(`${this.msg.successfulQueries} ${successCount}${itemSuffix}`);
            this.log(`${this.msg.failedQueries} ${failureCount}${itemSuffix}`);
            this.log(`${this.msg.totalProcessedRows} ${totalProcessed}`);
            
            if (this.progressManager) {
                const summary = this.progressManager.getProgressSummary();
                this.log(this.msg.progressSummary);
                this.log(`${this.msg.migrationId} ${summary.migrationId}`);
                this.log(`${this.msg.finalStatus} ${summary.status}`);
                this.log(`${this.msg.totalProgress} ${summary.totalProgress.toFixed(1)}%`);
            }
            
            results.forEach(result => {
                const status = result.success ? this.msg.success : this.msg.failed;
                const rowsText = LANGUAGE === 'kr' ? `${result.rowsProcessed}행` : `${result.rowsProcessed} ${this.msg.rows}`;
                this.log(`${result.queryId}: ${status} (${rowsText}) - ${result.description}`);
            });
            
            if (this.enableLogging) {
                this.log(`${this.msg.detailedLog} ${this.logFile}`);
            }
            
            if (this.progressManager) {
                this.log(`${this.msg.progressFile} ${this.progressManager.progressFile}`);
            }
        }
        
        const migrationResult = {
            success: failureCount === 0,
            duration,
            totalProcessed,
            successCount,
            failureCount,
            results
        };
        
        if (this.progressManager) {
            migrationResult.migrationId = this.progressManager.migrationId;
            migrationResult.progressFile = this.progressManager.progressFile;
            migrationResult.progressSummary = this.progressManager.getProgressSummary();
        }
        
        return migrationResult;
    }

    /**
     * DRY RUN 모드
     */
    async executeDryRun() {
        console.log(this.msg.dryRunMode);
        
        const startTime = Date.now();
        let totalQueries = 0;
        let totalRows = 0;
        const results = [];
        
        try {
            await this.loadConfig();
            
            console.log(this.msg.connectingToSource);
            await this.connectionManager.connectSource();
            
            // 동적 변수 추출
            if (this.config.dynamicVariables && this.config.dynamicVariables.length > 0) {
                const itemSuffix = LANGUAGE === 'kr' ? '개' : ` ${this.msg.items}`;
                console.log(`${this.msg.dynamicVarSimulation} ${this.config.dynamicVariables.length}${itemSuffix}`);
                
                for (const extractConfig of this.config.dynamicVariables) {
                    if (extractConfig.enabled !== false) {
                        console.log(`  • ${extractConfig.id}: ${extractConfig.description || this.msg.noDescription}`);
                        
                        try {
                            await this.variableManager.extractDataToVariable(extractConfig);
                            console.log(`    ${this.msg.extractionComplete} ${extractConfig.variableName}`);
                        } catch (error) {
                            console.log(`    ${this.msg.extractionFailed} ${error.message}`);
                        }
                    }
                }
            }
            
            // 쿼리 시뮬레이션
            const enabledQueries = this.config.queries.filter(q => q.enabled !== false);
            const querySuffix = LANGUAGE === 'kr' ? '개' : ` ${this.msg.items}`;
            console.log(`${this.msg.querySimulation} ${enabledQueries.length}${querySuffix}`);
            console.log('='.repeat(80));
            
            for (let i = 0; i < enabledQueries.length; i++) {
                const queryConfig = enabledQueries[i];
                console.log(`\n${i + 1}. ${this.msg.queryId} ${queryConfig.id}`);
                console.log(`   ${this.msg.description} ${queryConfig.description || this.msg.noDescription}`);
                console.log(`   ${this.msg.targetTable} ${queryConfig.targetTable}`);
                
                try {
                    const rowCount = await this.queryProcessor.estimateQueryRowCount(queryConfig, this.queryFilePath);
                    totalRows += rowCount;
                    totalQueries++;
                    
                    const rowsLabel = LANGUAGE === 'kr' ? `${rowCount.toLocaleString()}행` : `${rowCount.toLocaleString()} ${this.msg.rows}`;
                    console.log(`   ${this.msg.dataToMigrate} ${rowsLabel}`);
                    
                    results.push({
                        id: queryConfig.id,
                        targetTable: queryConfig.targetTable,
                        rowCount: rowCount,
                        status: 'success'
                    });
                    
                    console.log(`   ${this.msg.simulationSuccess}`);
                    
                } catch (error) {
                    console.log(`   ${this.msg.simulationFailed} ${error.message}`);
                    results.push({
                        id: queryConfig.id,
                        targetTable: queryConfig.targetTable,
                        rowCount: 0,
                        status: 'error',
                        error: error.message
                    });
                }
            }
            
            // 결과 요약
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            const successCount = results.filter(r => r.status === 'success').length;
            const failureCount = results.filter(r => r.status === 'error').length;
            
            console.log('\n' + '='.repeat(80));
            console.log(this.msg.dryRunSummary);
            console.log('='.repeat(80));
            const timeSuffix = LANGUAGE === 'kr' ? '초' : 's';
            const countSuffix = LANGUAGE === 'kr' ? '개' : '';
            const rowsLabel = LANGUAGE === 'kr' ? `${totalRows.toLocaleString()}행` : `${totalRows.toLocaleString()} ${this.msg.rows}`;
            console.log(`${this.msg.executionTime} ${duration}${timeSuffix}`);
            console.log(`${this.msg.totalQueriesCount} ${totalQueries}${countSuffix}`);
            console.log(`${this.msg.totalDataToMigrate} ${rowsLabel}`);
            const successLabel = LANGUAGE === 'kr' ? '성공한 쿼리' : 'successful queries';
            const failureLabel = LANGUAGE === 'kr' ? '실패한 쿼리' : 'failed queries';
            console.log(`✅ ${successLabel}: ${successCount}${countSuffix}`);
            console.log(`❌ ${failureLabel}: ${failureCount}${countSuffix}`);
            
            if (failureCount > 0) {
                const failedListLabel = LANGUAGE === 'kr' ? '\n❌ 실패한 쿼리 목록:' : '\n❌ Failed queries:';
                console.log(failedListLabel);
                results.filter(r => r.status === 'error').forEach(r => {
                    console.log(`  • ${r.id} (${r.targetTable}): ${r.error}`);
                });
            }
            
            console.log(this.msg.dryRunNote);
            
            return {
                success: failureCount === 0,
                totalQueries,
                totalRows,
                successCount,
                failureCount,
                duration: parseFloat(duration),
                results
            };
            
        } catch (error) {
            console.error(`${this.msg.dryRunError} ${error.message}`);
            return {
                success: false,
                error: error.message,
                totalQueries: 0,
                totalRows: 0,
                successCount: 0,
                failureCount: 1,
                duration: ((Date.now() - startTime) / 1000).toFixed(2),
                results: []
            };
        } finally {
            await this.connectionManager.closeConnections();
        }
    }

    /**
     * 설정 검증
     */
    async validateConfiguration() {
        try {
            await this.loadConfig();
            
            // 허용되는 속성명 정의
            const validQueryAttributes = [
                'id', 'description', 'enabled', 'sourceQuery', 'sourceQueryFile', 
                'targetTable', 'targetSchema', 'targetColumns', 'identityColumns', 'batchSize',
                'deleteBeforeInsert', 'sourceQueryDeleteBeforeInsert', 
                'sourceQueryApplyGlobalColumns', 'applyGlobalColumns',
                'preProcess', 'postProcess', 'columnOverrides', 'isCreateTable'
            ];
            
            const validDynamicVarAttributes = [
                'id', 'description', 'variableName', 'extractType', 'database',
                'enabled', 'columns', 'columnName'
            ];
            
            const validSettingsAttributes = [
                'sourceDatabase', 'targetDatabase', 'batchSize', 'deleteBeforeInsert', 'isCreateTable', 'targetSchema'
            ];
            
            const validPrePostProcessAttributes = [
                'script', 'runInTransaction', 'database', 'description', 'applyGlobalColumns'
            ];
            
            const validGlobalProcessGroupAttributes = [
                'id', 'description', 'enabled'
            ];
            
            if (!this.config.settings) {
                const requiredEnvVars = [
                    'SOURCE_DB_SERVER', 'SOURCE_DB_DATABASE', 'SOURCE_DB_USER', 'SOURCE_DB_PASSWORD',
                    'TARGET_DB_SERVER', 'TARGET_DB_DATABASE', 'TARGET_DB_USER', 'TARGET_DB_PASSWORD'
                ];
                
                const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
                if (missingVars.length > 0) {
                    throw new Error(`${this.msg.requiredEnvVarsNotSet} ${missingVars.join(', ')}`);
                }
            } else {
                // settings 속성명 검증
                const invalidSettingsAttrs = Object.keys(this.config.settings).filter(
                    attr => !validSettingsAttributes.includes(attr)
                );
                if (invalidSettingsAttrs.length > 0) {
                    console.warn(`${this.msg.unknownAttributesInSettings} ${invalidSettingsAttrs.join(', ')}`);
                    console.warn(`   ${this.msg.allowedAttributesSettings} ${validSettingsAttributes.join(', ')}`);
                }
            }
            
            // dynamicVariables 속성명 검증
            if (this.config.dynamicVariables && Array.isArray(this.config.dynamicVariables)) {
                for (let i = 0; i < this.config.dynamicVariables.length; i++) {
                    const dynVar = this.config.dynamicVariables[i];
                    const invalidAttrs = Object.keys(dynVar).filter(
                        attr => !validDynamicVarAttributes.includes(attr) && attr !== 'query'
                    );
                    
                    if (invalidAttrs.length > 0) {
                        const errorMsg = `❌ dynamicVariables[${i}] (id: ${dynVar.id || this.msg.idNotSpecified})`;
                        console.error(`${errorMsg}: ${invalidAttrs.join(', ')}`);
                        console.error(`   ${this.msg.allowedAttributesSettings} ${validDynamicVarAttributes.join(', ')}`);
                        const errorText = LANGUAGE === 'kr' ? `dynamicVariables에 잘못된 속성명이 있습니다: ${invalidAttrs.join(', ')}` : `Invalid attributes in dynamicVariables: ${invalidAttrs.join(', ')}`;
                        throw new Error(errorText);
                    }
                }
            }
            
            // queries 속성명 검증
            const allQueries = this.config.queries || [];
            const enabledQueries = allQueries.filter(q => q.enabled !== false);
            
            if (enabledQueries.length === 0) {
                console.log(this.msg.noEnabledQueries);
            }
            
            for (let i = 0; i < allQueries.length; i++) {
                const query = allQueries[i];
                
                // 속성명 검증
                const invalidAttrs = Object.keys(query).filter(
                    attr => !validQueryAttributes.includes(attr)
                );
                
                if (invalidAttrs.length > 0) {
                    console.error(`${this.msg.invalidAttributesInQuery}${i}] (id: ${query.id || this.msg.idNotSpecified}): ${invalidAttrs.join(', ')}`);
                    console.error(`   ${this.msg.allowedAttributesQuery} ${validQueryAttributes.join(', ')}`);
                    throw new Error(`${this.msg.invalidAttributeError} ${invalidAttrs.join(', ')}`);
                }
                
                // 필수 속성 검증
                if (!query.id) {
                    throw new Error(`${this.msg.missingIdInQuery}${i}${this.msg.missingIdEnd}`);
                }
                
                if (!query.sourceQuery && !query.sourceQueryFile) {
                    throw new Error(`${this.msg.missingSourceQuery} '${query.id}' ${this.msg.missingSourceQueryEnd}`);
                }
                
                if (!query.targetTable) {
                    throw new Error(`${this.msg.missingSourceQuery} '${query.id}' ${this.msg.missingTargetTable}`);
                }
                
                // preProcess/postProcess 속성명 검증
                if (query.preProcess) {
                    const invalidPreAttrs = Object.keys(query.preProcess).filter(
                        attr => !validPrePostProcessAttributes.includes(attr)
                    );
                    if (invalidPreAttrs.length > 0) {
                        console.error(`❌ ${this.msg.missingSourceQuery} '${query.id}'${this.msg.invalidPreProcessAttrs} ${invalidPreAttrs.join(', ')}`);
                        console.error(`   ${this.msg.allowedAttributesQuery} ${validPrePostProcessAttributes.join(', ')}`);
                        const errorText = LANGUAGE === 'kr' ? `preProcess에 잘못된 속성명이 있습니다: ${invalidPreAttrs.join(', ')}` : `Invalid attributes in preProcess: ${invalidPreAttrs.join(', ')}`;
                        throw new Error(errorText);
                    }
                }
                
                if (query.postProcess) {
                    const invalidPostAttrs = Object.keys(query.postProcess).filter(
                        attr => !validPrePostProcessAttributes.includes(attr)
                    );
                    if (invalidPostAttrs.length > 0) {
                        console.error(`❌ ${this.msg.missingSourceQuery} '${query.id}'${this.msg.invalidPostProcessAttrs} ${invalidPostAttrs.join(', ')}`);
                        console.error(`   ${this.msg.allowedAttributesQuery} ${validPrePostProcessAttributes.join(', ')}`);
                        const errorText = LANGUAGE === 'kr' ? `postProcess에 잘못된 속성명이 있습니다: ${invalidPostAttrs.join(', ')}` : `Invalid attributes in postProcess: ${invalidPostAttrs.join(', ')}`;
                        throw new Error(errorText);
                    }
                }
            }
            
            // globalProcesses 속성명 검증
            if (this.config.globalProcesses) {
                if (this.config.globalProcesses.preProcessGroups) {
                    for (let i = 0; i < this.config.globalProcesses.preProcessGroups.length; i++) {
                        const group = this.config.globalProcesses.preProcessGroups[i];
                        const invalidAttrs = Object.keys(group).filter(
                            attr => !validGlobalProcessGroupAttributes.includes(attr) && attr !== 'script'
                        );
                        
                        if (invalidAttrs.length > 0) {
                            const errorMsg = `❌ preProcessGroups[${i}] (id: ${group.id || this.msg.idNotSpecified})`;
                            console.error(`${errorMsg}: ${invalidAttrs.join(', ')}`);
                            console.error(`   ${this.msg.allowedAttributesSettings} ${validGlobalProcessGroupAttributes.join(', ')}, script`);
                            const errorText = LANGUAGE === 'kr' ? `preProcessGroups에 잘못된 속성명이 있습니다: ${invalidAttrs.join(', ')}` : `Invalid attributes in preProcessGroups: ${invalidAttrs.join(', ')}`;
                            throw new Error(errorText);
                        }
                    }
                }
                
                if (this.config.globalProcesses.postProcessGroups) {
                    for (let i = 0; i < this.config.globalProcesses.postProcessGroups.length; i++) {
                        const group = this.config.globalProcesses.postProcessGroups[i];
                        const invalidAttrs = Object.keys(group).filter(
                            attr => !validGlobalProcessGroupAttributes.includes(attr) && attr !== 'script'
                        );
                        
                        if (invalidAttrs.length > 0) {
                            const errorMsg = `❌ postProcessGroups[${i}] (id: ${group.id || this.msg.idNotSpecified})`;
                            console.error(`${errorMsg}: ${invalidAttrs.join(', ')}`);
                            console.error(`   ${this.msg.allowedAttributesSettings} ${validGlobalProcessGroupAttributes.join(', ')}, script`);
                            const errorText = LANGUAGE === 'kr' ? `postProcessGroups에 잘못된 속성명이 있습니다: ${invalidAttrs.join(', ')}` : `Invalid attributes in postProcessGroups: ${invalidAttrs.join(', ')}`;
                            throw new Error(errorText);
                        }
                    }
                }
            }
            
            console.log(this.msg.configValidated);
            console.log(`   ${this.msg.totalQueriesFound} ${allQueries.length}`);
            console.log(`   ${this.msg.enabledQueriesFound} ${enabledQueries.length}`);
            if (this.config.dynamicVariables) {
                console.log(`   ${this.msg.dynamicVariablesFound} ${this.config.dynamicVariables.length}`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`${this.msg.configValidationFailed} ${error.message}`);
            return false;
        }
    }

    /**
     * 개별 DB 연결 테스트
     */
    async testSingleDbConnection(dbConfig) {
        const sql = require('mssql');
        let pool = null;
        
        try {
            pool = new sql.ConnectionPool(dbConfig);
            await pool.connect();
            await pool.close();
            
            return {
                success: true,
                message: this.msg.connectionSuccess,
                responseTime: null
            };
        } catch (error) {
            if (pool) {
                try {
                    await pool.close();
                } catch (closeError) {
                    // 무시
                }
            }
            
            return {
                success: false,
                message: error.message,
                error: error.code || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * 현재 쿼리 조회
     */
    getCurrentQuery() {
        return this.currentQuery;
    }
}

module.exports = MSSQLDataMigrator;

