const logger = require('../logger');
const { format } = require('../modules/i18n');

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

// 다국어 메시지
const messages = {
    en: {
        noActiveGroups: 'No active global {phase} groups.',
        executingGroups: '\n=== Executing Global {phase} Groups ({count}) ===',
        executingGroup: '\n--- [{id}] Executing {description} ---',
        tempTableDetected: '⚠️  Temp table detected in global {phase} group [{id}], executing in session management mode.',
        groupFailed: 'Global {phase} group [{id}] execution failed: {error}',
        groupCompleted: '--- [{id}] {description} Completed ---',
        executionStats: '  📈 Execution statistics: {executed}/{total} SQL statements succeeded',
        errorsOccurred: '  ⚠️  Warning: Errors occurred in {count} SQL statements',
        errorContinuing: 'Warning: {error} - Continuing with next group',
        groupsCompleted: '=== Global {phase} Groups Completed ===\n',
        noScript: 'No script to execute.',
        executing: 'Executing {description}...',
        noStatements: 'No SQL statements to execute.',
        executingSqlCount: 'Executing {count} SQL statements...',
        executingStatement: 'Executing SQL statement {current}/{total}: {preview}',
        statementSuccess: '  ✓ SQL statement {index} executed successfully: {rows} rows affected',
        sqlExecutionWarning: 'SQL execution warning (continuing): {error}',
        totalErrors: 'Total of {count} SQL execution errors occurred.',
        executionResult: '\n📊 {description} Execution Result:',
        totalStatements: '  • Total SQL Statements: {count}',
        successful: '  • Successful: {count}',
        failed: '  • Failed: {count}',
        executionFailed: '{description} execution failed: {error}',
        sessionCleanupComplete: '{description} session cleanup complete',
        sessionCleanupError: '{description} session cleanup error: {error}',
        preProcess: 'pre-processing',
        postProcess: 'post-processing'
    },
    kr: {
        noActiveGroups: '활성화된 전역 {phase} 그룹이 없습니다.',
        executingGroups: '\n=== 전역 {phase} 그룹 실행 ({count}개) ===',
        executingGroup: '\n--- [{id}] {description} 실행 중 ---',
        tempTableDetected: '⚠️  전역 {phase} 그룹 [{id}]에서 temp 테이블이 감지되어 세션 관리 모드로 실행합니다.',
        groupFailed: '전역 {phase} 그룹 [{id}] 실행 실패: {error}',
        groupCompleted: '--- [{id}] {description} 완료 ---',
        executionStats: '  📈 실행 통계: {executed}/{total}개 SQL 문 성공',
        errorsOccurred: '  ⚠️  경고: {count}개 SQL 문에서 오류 발생',
        errorContinuing: '경고: {error} - 다음 그룹 계속 진행',
        groupsCompleted: '=== 전역 {phase} 그룹 완료 ===\n',
        noScript: '실행할 스크립트가 없습니다.',
        executing: '{description} 실행 중...',
        noStatements: '실행할 SQL 문이 없습니다.',
        executingSqlCount: '총 {count}개의 SQL 문 실행 중...',
        executingStatement: 'SQL 문 {current}/{total} 실행: {preview}',
        statementSuccess: '  ✓ SQL 문 {index} 실행 성공: {rows}행 영향받음',
        sqlExecutionWarning: 'SQL 실행 경고 (계속 진행): {error}',
        totalErrors: '총 {count}개의 SQL 실행 오류가 발생했습니다.',
        executionResult: '\n📊 {description} 실행 결과:',
        totalStatements: '  • 총 SQL 문: {count}개',
        successful: '  • 성공 실행: {count}개',
        failed: '  • 실패: {count}개',
        executionFailed: '{description} 실행 실패: {error}',
        sessionCleanupComplete: '{description} 세션 정리 완료',
        sessionCleanupError: '{description} 세션 정리 중 오류: {error}',
        preProcess: '전처리',
        postProcess: '후처리'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * 전/후처리 스크립트 실행 담당 모듈
 */
class ScriptProcessor {
    constructor(connectionManager, variableManager, queryProcessor, logFunction) {
        this.connectionManager = connectionManager;
        this.variableManager = variableManager;
        this.queryProcessor = queryProcessor;
        this.log = logFunction || console.log;
    }

    /**
     * 전역 전/후처리 그룹 실행
     */
    async executeGlobalProcessGroups(phase, config, progressManager) {
        const globalProcesses = config.globalProcesses;

        // globalProcesses 전체가 비활성화된 경우
        if (globalProcesses && globalProcesses.enabled === false) {
            const phaseText = phase === 'preProcess' ? msg.preProcess : msg.postProcess;
            this.log(`Global processes disabled. Skipping ${phaseText} groups.`);
            return;
        }

        // phase 그룹 래퍼가 비활성화된 경우
        const wrapperEnabled = phase === 'preProcess'
            ? globalProcesses.preProcessGroupsEnabled
            : globalProcesses.postProcessGroupsEnabled;
        if (wrapperEnabled === false) {
            const phaseText = phase === 'preProcess' ? msg.preProcess : msg.postProcess;
            this.log(`Global ${phaseText} groups disabled. Skipping.`);
            return;
        }

        const groups = phase === 'preProcess'
            ? config.globalProcesses.preProcessGroups
            : config.globalProcesses.postProcessGroups;

        const enabledGroups = groups.filter(group => group.enabled);
        const phaseText = phase === 'preProcess' ? msg.preProcess : msg.postProcess;

        if (enabledGroups.length === 0) {
            this.log(format(msg.noActiveGroups, { phase: phaseText }));
            return;
        }
        
        this.log(format(msg.executingGroups, { phase: phaseText, count: enabledGroups.length }));
        progressManager.updatePhase(
            phase === 'preProcess' ? 'PRE_PROCESSING' : 'POST_PROCESSING', 
            'RUNNING', 
            `Executing global ${phase === 'preProcess' ? 'pre' : 'post'}-processing groups`
        );
        
        for (const group of enabledGroups) {
            this.log(format(msg.executingGroup, { id: group.id, description: group.description }));
            
            try {
                const scriptConfig = {
                    description: group.description,
                    script: group.script
                };
                
                const hasTempTables = this.detectTempTableUsageInScript(group.script);
                
                if (hasTempTables) {
                    this.log(format(msg.tempTableDetected, { phase: phaseText, id: group.id }));
                }
                
                const result = await this.executeProcessScript(scriptConfig, 'target', hasTempTables);
                
                if (!result.success) {
                    const errorMsg = format(msg.groupFailed, { phase: phaseText, id: group.id, error: result.error });
                    this.log(errorMsg);
                    
                    if (phase === 'preProcess') {
                        progressManager.updatePhase('PRE_PROCESSING', 'FAILED', errorMsg);
                        throw new Error(errorMsg);
                    } else {
                        this.log(format(msg.errorContinuing, { error: errorMsg }));
                    }
                } else {
                    this.log(format(msg.groupCompleted, { id: group.id, description: group.description }));
                    if (result.executedCount !== undefined) {
                        this.log(format(msg.executionStats, { executed: result.executedCount, total: result.totalStatements }));
                        if (result.errors && result.errors.length > 0) {
                            this.log(format(msg.errorsOccurred, { count: result.errors.length }));
                        }
                    }
                }
            } catch (error) {
                const errorMsg = format(msg.groupFailed, { phase: phaseText, id: group.id, error: error.message });
                this.log(errorMsg);
                
                if (phase === 'preProcess') {
                    progressManager.updatePhase('PRE_PROCESSING', 'FAILED', errorMsg);
                    throw new Error(errorMsg);
                } else {
                    this.log(format(msg.errorContinuing, { error: errorMsg }));
                }
            }
        }
        
        progressManager.updatePhase(
            phase === 'preProcess' ? 'PRE_PROCESSING' : 'POST_PROCESSING', 
            'COMPLETED', 
            `Global ${phase === 'preProcess' ? 'pre' : 'post'}-processing groups completed`
        );
        this.log(format(msg.groupsCompleted, { phase: phaseText }));
    }

    /**
     * 전/후처리 스크립트 실행
     */
    async executeProcessScript(scriptConfig, database = 'target', useSession = false) {
        let sessionStarted = false;
        
        try {
            if (!scriptConfig || !scriptConfig.script) {
                this.log(msg.noScript);
                return { success: true };
            }
            
            this.log(format(msg.executing, { description: scriptConfig.description }));
            
            if (useSession) {
                await this.connectionManager.beginSession(database);
                sessionStarted = true;
            }
            
            const debugScripts = process.env.DEBUG_SCRIPTS === 'true';
            
            // 변수 치환
            const processedScript = this.variableManager.replaceVariables(scriptConfig.script);
            
            // INSERT SELECT 컬럼 맞춤 처리
            const insertSelectAlignedScript = await this.queryProcessor.processInsertSelectColumnAlignment(
                processedScript, 
                database
            );
            
            // 주석 제거
            const cleanedScript = this.queryProcessor.removeComments(insertSelectAlignedScript);
            
            // 스크립트를 세미콜론으로 분할
            const sqlStatements = cleanedScript
                .split(';')
                .map(sql => sql.trim())
                .filter(sql => sql.length > 0);
            
            if (sqlStatements.length === 0) {
                this.log(msg.noStatements);
                return { success: true };
            }
            
            this.log(format(msg.executingSqlCount, { count: sqlStatements.length }));
            
            let executedCount = 0;
            const errors = [];
            
            for (let i = 0; i < sqlStatements.length; i++) {
                const sql = sqlStatements[i];
                try {
                    if (debugScripts) {
                        const preview = `${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`;
                        this.log(format(msg.executingStatement, { current: i + 1, total: sqlStatements.length, preview }));
                    }
                    
                    let result;
                    if (useSession) {
                        result = await this.connectionManager.executeQueryInSession(sql, database);
                    } else {
                        if (database === 'source') {
                            result = await this.connectionManager.executeQueryOnSource(sql);
                        } else {
                            result = await this.connectionManager.executeQueryOnTarget(sql);
                        }
                    }
                    executedCount++;
                    
                    if (result && result.rowsAffected && result.rowsAffected.length > 0) {
                        const affectedRows = result.rowsAffected.reduce((sum, count) => sum + count, 0);
                        if (affectedRows > 0) {
                            this.log(format(msg.statementSuccess, { index: i + 1, rows: affectedRows }));
                        }
                    }
                    
                } catch (sqlError) {
                    const errorMsg = format(msg.sqlExecutionWarning, { error: sqlError.message });
                    this.log(errorMsg);
                    
                    errors.push({
                        sqlIndex: i + 1,
                        sql: sql.substring(0, 200),
                        error: sqlError.message
                    });
                }
            }
            
            if (errors.length > 0) {
                this.log(format(msg.totalErrors, { count: errors.length }));
            }
            
            this.log(format(msg.executionResult, { description: scriptConfig.description }));
            this.log(format(msg.totalStatements, { count: sqlStatements.length }));
            this.log(format(msg.successful, { count: executedCount }));
            if (errors.length > 0) {
                this.log(format(msg.failed, { count: errors.length }));
            }
            
            return { 
                success: true, 
                executedCount, 
                totalStatements: sqlStatements.length,
                errors: errors.length > 0 ? errors : undefined
            };
            
        } catch (error) {
            this.log(format(msg.executionFailed, { description: scriptConfig.description, error: error.message }));
            return { success: false, error: error.message };
        } finally {
            if (sessionStarted) {
                try {
                    await this.connectionManager.endSession(database);
                    this.log(format(msg.sessionCleanupComplete, { description: scriptConfig.description }));
                } catch (sessionError) {
                    this.log(format(msg.sessionCleanupError, { description: scriptConfig.description, error: sessionError.message }));
                }
            }
        }
    }

    /**
     * temp 테이블 사용 여부 감지 (비활성화됨)
     */
    detectTempTableUsageInScript(script) {
        return false;
    }
}

module.exports = ScriptProcessor;

