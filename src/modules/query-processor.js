const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const { format } = require('../modules/i18n');

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

// 다국어 메시지
const messages = {
    en: {
        cacheCleared: '🗑️ Table column cache cleared',
        cacheUsed: '📋 Using cached table column info: {table} ({db})',
        columnQuery: '🔍 Querying table column info from database: {table} ({db}) - Excluding Identity Columns',
        cacheSaved: '💾 Table column info cached: {table} ({db}) - {count} columns',
        columnQueryFailed: '⚠️ Failed to query table columns ({table}): {error}',
        identityQueryComplete: 'Identity column query completed ({table}): {columns}',
        identityQueryFailed: '⚠️ Failed to query identity columns ({table}): {error}',
        loadingSqlFile: 'Loading query from SQL file: {path}',
        sqlFileLoadComplete: 'SQL file loaded: {preview}',
        sqlFileLoadFailed: 'Failed to load SQL file: {file} - {error}',
        commentRemovalError: 'Error while removing comments: {error}',
        usingExternalSql: 'Using external SQL file: {file}',
        fileQueryWithVars: 'Query loaded from file (after variable substitution): {preview}',
        sourceQueryRequired: 'Either sourceQuery or sourceQueryFile must be specified.',
        selectAllDetected: 'SELECT * detected. Automatically fetching column info for table {table}{alias}',
        targetTableNotFound: 'Cannot find column info for target table {table}.',
        identityExcluded: 'Identity columns automatically excluded: {columns}',
        autoColumns: 'Auto-configured columns ({count}, excluding identity): {columns}',
        modifiedSourceQuery: 'Modified source query: {query}',
        queryConfigError: 'Error processing query config: {error}',
        sourceQueryValidation: 'sourceQuery validated as single SQL statement.',
        sourceQueryEmpty: 'sourceQuery is empty or not a string.',
        semicolonNotAllowed: 'Semicolons (;) are not allowed in sourceQuery. (Only one SELECT statement allowed)',
        nonSelectKeywords: 'Keywords other than SELECT are not allowed in sourceQuery.',
        estimatingRowCount: 'Loading SQL file for row count estimation: {file}',
        dynamicVarsNotExtracted: 'Dynamic variables not yet extracted: {vars}. Skipping row count estimation.',
        countQueryFailed: 'COUNT query failed, falling back to original query: {error}',
        estimatedRows: 'Query {id} estimated row count: {count}',
        rowEstimationError: 'Error estimating row count for query {id}: {error}',
        insertSelectProcessing: 'Processing INSERT SELECT column alignment: {count} patterns found',
        insertTableNotFound: '⚠️ Cannot find column info for INSERT table {table}.',
        columnCountMismatch: '⚠️ SELECT column count ({select}) exceeds INSERT table column count ({insert}).',
        insertSelectComplete: '✅ INSERT SELECT column alignment completed: {table} table',
        insertSelectProcessError: '⚠️ INSERT SELECT column alignment failed: {error}',
        insertSelectError: 'Error during INSERT SELECT column alignment: {error}',
        emptyOrInvalidSql: 'SQL file is empty or contains no valid query: {file}'
    },
    kr: {
        cacheCleared: '🗑️ 테이블 컬럼 캐시 초기화 완료',
        cacheUsed: '📋 캐시에서 테이블 컬럼 정보 사용: {table} ({db})',
        columnQuery: '🔍 데이터베이스에서 테이블 컬럼 정보 조회: {table} ({db}) - Identity Column 제외',
        cacheSaved: '💾 테이블 컬럼 정보 캐시 저장: {table} ({db}) - {count}개 컬럼',
        columnQueryFailed: '⚠️ 테이블 컬럼 조회 실패 ({table}): {error}',
        identityQueryComplete: 'IDENTITY 컬럼 조회 완료 ({table}): {columns}',
        identityQueryFailed: '⚠️ IDENTITY 컬럼 조회 실패 ({table}): {error}',
        loadingSqlFile: 'SQL 파일에서 쿼리 로드 중: {path}',
        sqlFileLoadComplete: 'SQL 파일 로드 완료: {preview}',
        sqlFileLoadFailed: 'SQL 파일 로드 실패: {file} - {error}',
        commentRemovalError: '주석 제거 중 오류 발생: {error}',
        usingExternalSql: '외부 SQL 파일 사용: {file}',
        fileQueryWithVars: '파일에서 로드된 쿼리 (변수 치환 후): {preview}',
        sourceQueryRequired: 'sourceQuery 또는 sourceQueryFile 중 하나는 반드시 지정해야 합니다.',
        selectAllDetected: 'SELECT * 감지됨. 테이블 {table}{alias}의 컬럼 정보를 자동으로 가져옵니다.',
        targetTableNotFound: '대상 테이블 {table}의 컬럼 정보를 찾을 수 없습니다.',
        identityExcluded: 'IDENTITY 컬럼 자동 제외: {columns}',
        autoColumns: '자동 설정된 컬럼 목록 ({count}개, IDENTITY 제외): {columns}',
        modifiedSourceQuery: '변경된 소스 쿼리: {query}',
        queryConfigError: '쿼리 설정 처리 중 오류: {error}',
        sourceQueryValidation: 'sourceQuery가 단일 SQL 문으로 검증되었습니다.',
        sourceQueryEmpty: 'sourceQuery가 비어있거나 문자열이 아닙니다.',
        semicolonNotAllowed: 'sourceQuery에는 세미콜론(;)이 허용되지 않습니다.(단 하나의 SELECT문만 허용)',
        nonSelectKeywords: 'sourceQuery에 SELECT 외 키워드는 허용되지 않습니다.',
        estimatingRowCount: '행 수 추정용 SQL 파일 로드: {file}',
        dynamicVarsNotExtracted: '동적 변수가 아직 추출되지 않음: {vars}. 행 수 추정을 건너뜁니다.',
        countQueryFailed: 'COUNT 쿼리 실패, 원본 쿼리로 fallback: {error}',
        estimatedRows: '쿼리 {id} 예상 행 수: {count}',
        rowEstimationError: '쿼리 {id} 행 수 추정 중 오류: {error}',
        insertSelectProcessing: 'INSERT SELECT 컬럼 맞춤 처리 중: {count}개 패턴 발견',
        insertTableNotFound: '⚠️ INSERT 테이블 {table}의 컬럼 정보를 찾을 수 없습니다.',
        columnCountMismatch: '⚠️ SELECT 컬럼 수({select})가 INSERT 테이블 컬럼 수({insert})보다 많습니다.',
        insertSelectComplete: '✅ INSERT SELECT 컬럼 맞춤 완료: {table} 테이블',
        insertSelectProcessError: '⚠️ INSERT SELECT 컬럼 맞춤 처리 실패: {error}',
        insertSelectError: 'INSERT SELECT 컬럼 맞춤 처리 중 오류: {error}',
        emptyOrInvalidSql: 'SQL 파일이 비어있거나 유효한 쿼리가 없습니다: {file}'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * 쿼리 처리 및 변환 담당 모듈
 */
class QueryProcessor {
    constructor(connectionManager, variableManager, logFunction) {
        this.connectionManager = connectionManager;
        this.variableManager = variableManager;
        this.log = logFunction || console.log;
        this.tableColumnCache = {};
    }

    /**
     * 테이블 컬럼 캐시 초기화
     */
    clearTableColumnCache() {
        this.tableColumnCache = {};
        this.log(msg.cacheCleared);
    }

    /**
     * 테이블의 실제 컬럼 목록 조회 (캐시 적용)
     */
    async getTableColumns(tableName, database = 'target') {
        try {
            const cacheKey = `${tableName}_${database}`;
            
            if (this.tableColumnCache[cacheKey]) {
                this.log(format(msg.cacheUsed, { table: tableName, db: database }));
                return this.tableColumnCache[cacheKey];
            }
            
            this.log(format(msg.columnQuery, { table: tableName, db: database }));
            
            // SQL injection prevention: tableName is properly escaped
            const escapedTableName = tableName.replace(/'/g, "''");
            const query = `
                SELECT c.COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS c
                INNER JOIN sys.columns sc ON c.COLUMN_NAME = sc.name 
                    AND c.TABLE_NAME = OBJECT_NAME(sc.object_id)
                WHERE c.TABLE_NAME = '${escapedTableName}'
                    AND sc.is_computed = 0
                    AND sc.is_identity = 0
                    AND c.DATA_TYPE NOT IN ('varbinary', 'binary', 'image')
                ORDER BY c.ORDINAL_POSITION
            `;

            let result;
            if (database === 'source') {
                result = await this.connectionManager.executeQueryOnSource(query);
            } else {
                result = await this.connectionManager.executeQueryOnTarget(query);
            }    
    
            // 반환 형태를 { name: COLUMN_NAME } 객체 배열로 통일
            if (result) {
                let resultSet = result.recordset?result.recordset:result;
                let columns = resultSet.map(row => ({ name: row.COLUMN_NAME }));
                this.tableColumnCache[cacheKey] = columns;
                this.log(format(msg.cacheSaved, { table: tableName, db: database, count: columns.length }));
                return columns;
            }            
            
            return [];

        } catch (error) {
            this.log(format(msg.columnQueryFailed, { table: tableName, error: error.message }));
            return [];
        }
    }

    /**
     * IDENTITY 컬럼 목록 조회
     */
    async getIdentityColumns(tableName, database = 'target') {
        try {
            const query = `
                SELECT c.name AS COLUMN_NAME
                FROM sys.columns c
                INNER JOIN sys.tables t ON c.object_id = t.object_id
                WHERE t.name = '${tableName}'
                  AND c.is_identity = 1
                ORDER BY c.column_id
            `;
            
            let result;
            if (database === 'source') {
                result = await this.connectionManager.executeQueryOnSource(query);
            } else {
                result = await this.connectionManager.executeQueryOnTarget(query);
            }
            
            if (result && result.recordset) {
                const identityColumns = result.recordset.map(row => row.COLUMN_NAME);
                this.log(format(msg.identityQueryComplete, { table: tableName, columns: identityColumns.join(', ') }));
                return identityColumns;
            }
            
            return [];
        } catch (error) {
            this.log(format(msg.identityQueryFailed, { table: tableName, error: error.message }));
            return [];
        }
    }

    /**
     * 외부 SQL 파일에서 쿼리 로드
     */
    async loadQueryFromFile(filePath, queryFilePath) {
        try {
            const fullPath = path.isAbsolute(filePath) 
                ? filePath 
                : path.resolve(path.dirname(queryFilePath), filePath);
            
            this.log(format(msg.loadingSqlFile, { path: fullPath }));
            const queryContent = fs.readFileSync(fullPath, 'utf8');
            
            const cleanedQuery = this.removeComments(queryContent);
            
            if (!cleanedQuery) {
                throw new Error(format(msg.emptyOrInvalidSql, { file: filePath }));
            }
            
            const preview = `${cleanedQuery.substring(0, 100)}${cleanedQuery.length > 100 ? '...' : ''}`;
            this.log(format(msg.sqlFileLoadComplete, { preview }));
            return cleanedQuery;
        } catch (error) {
            this.log(format(msg.sqlFileLoadFailed, { file: filePath, error: error.message }));
            throw new Error(format(msg.sqlFileLoadFailed, { file: filePath, error: error.message }));
        }
    }

    /**
     * SQL 주석 제거
     */
    removeComments(script) {
        let result = script;
        const debugComments = process.env.DEBUG_COMMENTS === 'true';
        
        try {
            // 1. 블록 주석 제거
            result = result.replace(/\/\*[\s\S]*?\*\//g, '');
            
            // 2. 라인 주석 제거
            const lines = result.split('\n');
            const cleanedLines = lines.map(line => {
                let inSingleQuote = false;
                let inDoubleQuote = false;
                let commentStart = -1;
                
                for (let i = 0; i < line.length - 1; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];
                    const prevChar = i > 0 ? line[i - 1] : '';
                    
                    if (char === "'" && !inDoubleQuote && prevChar !== '\\') {
                        inSingleQuote = !inSingleQuote;
                    } else if (char === '"' && !inSingleQuote && prevChar !== '\\') {
                        inDoubleQuote = !inDoubleQuote;
                    } else if (char === '-' && nextChar === '-' && !inSingleQuote && !inDoubleQuote) {
                        commentStart = i;
                        break;
                    }
                }
                
                if (commentStart >= 0) {
                    return line.substring(0, commentStart).trimEnd();
                }
                return line;
            });
            
            result = cleanedLines.join('\n');
            result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
            result = result.trim();
            
        } catch (error) {
            this.log(format(msg.commentRemovalError, { error: error.message }));
            return script;
        }
        
        return result;
    }

    /**
     * 쿼리 설정에서 SELECT * 처리 및 컬럼 자동 설정
     */
    async processQueryConfig(queryConfig, queryFilePath) {
        try {
            // SQL 파일에서 쿼리 로드
            if (queryConfig.sourceQueryFile) {
                this.log(format(msg.usingExternalSql, { file: queryConfig.sourceQueryFile }));
                const fileQuery = await this.loadQueryFromFile(queryConfig.sourceQueryFile, queryFilePath);
                queryConfig.sourceQuery = this.variableManager.replaceVariables(fileQuery);
                const preview = `${queryConfig.sourceQuery.substring(0, 200)}${queryConfig.sourceQuery.length > 200 ? '...' : ''}`;
                this.log(format(msg.fileQueryWithVars, { preview }));
            } else if (queryConfig.sourceQuery) {
                queryConfig.sourceQuery = this.variableManager.replaceVariables(queryConfig.sourceQuery);
            } else {
                throw new Error(msg.sourceQueryRequired);
            }
            
            // SELECT * 패턴 감지 및 처리
            const selectAllPattern = /SELECT\s+\*\s+FROM\s+(\w+)(?:\s+(?:AS\s+)?(?!WHERE|GROUP|HAVING|ORDER|LIMIT|OFFSET|UNION|INTERSECT|EXCEPT|FOR|OPTION|WITH\b)(\w+))?(?:\s+(?:WHERE|GROUP|HAVING|ORDER|LIMIT|OFFSET|UNION|INTERSECT|EXCEPT|FOR|OPTION|WITH)|\s*$)/i;
            const match = queryConfig.sourceQuery.match(selectAllPattern);
            
            if (match) {
                const tableName = match[1];
                const tableAlias = match[2];
                const aliasText = tableAlias ? ` (${LANGUAGE === 'kr' ? '별칭: ' : 'alias: '}${tableAlias})` : '';
                this.log(format(msg.selectAllDetected, { table: tableName, alias: aliasText }));
                
                // QueryProcessor의 캐시 포함 메서드 사용, 대상 DB는 'target'
                const columns = await this.getTableColumns(queryConfig.targetTable, 'target');
                
                if (columns.length === 0) {
                    throw new Error(format(msg.targetTableNotFound, { table: queryConfig.targetTable }));
                }
                
                const identityColumns = await this.getIdentityColumns(queryConfig.targetTable, 'target');
                const columnNames = columns.map(col => col.name);
                const filteredColumnNames = columnNames.filter(col => !identityColumns.includes(col));
                
                if (identityColumns.length > 0) {
                    this.log(format(msg.identityExcluded, { columns: identityColumns.join(', ') }));
                }
                
                queryConfig.targetColumns = filteredColumnNames;
                this.log(format(msg.autoColumns, { count: filteredColumnNames.length, columns: filteredColumnNames.join(', ') }));
                
                // sourceQuery도 컬럼명으로 변경
                let explicitColumns;
                if (tableAlias) {
                    explicitColumns = filteredColumnNames.map(col => `${tableAlias}.${col}`).join(', ');
                } else {
                    explicitColumns = filteredColumnNames.join(', ');
                }
                
                queryConfig.sourceQuery = queryConfig.sourceQuery.replace(/[;]+$/, '');
                queryConfig.sourceQuery = queryConfig.sourceQuery.replace(/SELECT\s+\*/i, `SELECT ${explicitColumns}`);
                this.log(format(msg.modifiedSourceQuery, { query: queryConfig.sourceQuery }));
            }
            
            return queryConfig;
        } catch (error) {
            this.log(format(msg.queryConfigError, { error: error.message }));
            throw error;
        }
    }

    /**
     * sourceQuery 단일 SQL 문 검증
     */
    validateSingleSqlStatement(sourceQuery) {
        if (!sourceQuery || typeof sourceQuery !== 'string') {
            return { isValid: true, message: msg.sourceQueryEmpty };
        }

        sourceQuery = sourceQuery.trim().replace(/[;]+$/, '');

        const semicolonMatches = sourceQuery.match(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/g);
        let statementCount = semicolonMatches ? semicolonMatches.length : 0;

        const goMatches = sourceQuery.match(/GO\s*(?:\r?\n|$)/gi);
        if (goMatches) statementCount += goMatches.length;

        const transactionMatches = sourceQuery.match(/(BEGIN|COMMIT|ROLLBACK)\s+TRANSACTION/gi);
        if (transactionMatches) statementCount += transactionMatches.length;

        const cleanQuery = sourceQuery
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();

        const sqlKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'EXEC', 'EXECUTE'];
        let keywordCount = 0;

        sqlKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = cleanQuery.match(regex);
            if (matches) keywordCount += matches.length;
        });

        if (statementCount > 0 || keywordCount > 1) {
            const errorMsg = statementCount > 0
                ? msg.semicolonNotAllowed
                : msg.nonSelectKeywords;
            
            return {
                isValid: false,
                message: errorMsg,
                statementCount,
                keywordCount
            };
        }

        return { isValid: true, message: msg.sourceQueryValidation };
    }

    /**
     * 행 수 추정
     */
    async estimateQueryRowCount(queryConfig, queryFilePath) {
        try {
            let sourceQuery;
            
            if (queryConfig.sourceQueryFile) {
                this.log(format(msg.estimatingRowCount, { file: queryConfig.sourceQueryFile }));
                const fileQuery = await this.loadQueryFromFile(queryConfig.sourceQueryFile, queryFilePath);
                sourceQuery = this.variableManager.replaceVariables(fileQuery);
            } else if (queryConfig.sourceQuery) {
                sourceQuery = this.variableManager.replaceVariables(queryConfig.sourceQuery);
            } else {
                throw new Error(msg.sourceQueryRequired);
            }
            
            // 동적 변수가 아직 추출되지 않은 경우 확인
            const dynamicVarPattern = /\$\{(\w+)\}/g;
            const dynamicVars = [...sourceQuery.matchAll(dynamicVarPattern)].map(match => match[1]);
            const allVars = this.variableManager.getAllVariables();
            const missingDynamicVars = dynamicVars.filter(varName => 
                !allVars.dynamic.hasOwnProperty(varName) && !allVars.static.hasOwnProperty(varName)
            );
            
            if (missingDynamicVars.length > 0) {
                this.log(format(msg.dynamicVarsNotExtracted, { vars: missingDynamicVars.join(', ') }));
                return 0;
            }
            
            try {
                const countQuery = `SELECT COUNT(*) as row_count FROM (${sourceQuery.trim().replace(/[;]+$/, '')}) as sub_query`;
                const countData = await this.connectionManager.querySource(countQuery);
                const rowCount = countData[0]?.row_count || 0;
                this.log(format(msg.estimatedRows, { id: queryConfig.id, count: rowCount.toLocaleString() }));
                return rowCount;
            } catch (countError) {
                this.log(format(msg.countQueryFailed, { error: countError.message }));
                const sourceData = await this.connectionManager.querySource(sourceQuery);
                return sourceData.length;
            }
            
        } catch (error) {
            this.log(format(msg.rowEstimationError, { id: queryConfig.id, error: error.message }));
            return 0;
        }
    }

    /**
     * INSERT SELECT 구문 컬럼 자동 맞춤
     */
    async processInsertSelectColumnAlignment(script, database = 'target') {
        try {
            const insertSelectPattern = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s+SELECT\s+(.+?)(\s+FROM\s+.+)/gi;
            let processedScript = script;
            const matches = [...script.matchAll(insertSelectPattern)];
            
            if (matches.length === 0) {
                return script;
            }
            
            this.log(format(msg.insertSelectProcessing, { count: matches.length }));
            
            for (const match of matches) {
                const fullMatch = match[0];
                const insertTableName = match[1];
                const insertColumnsPart = match[2];
                const selectColumnsPart = match[3];
                const fromPart = match[4];
                
                try {
                    const insertTableColumns = await this.connectionManager.getTableColumns(
                        insertTableName, 
                        database === 'source'
                    );
                    const insertColumnNames = insertTableColumns.map(col => col.name);
                    
                    if (insertColumnNames.length === 0) {
                        this.log(format(msg.insertTableNotFound, { table: insertTableName }));
                        continue;
                    }
                    
                    const selectColumns = selectColumnsPart.split(',').map(col => col.trim());
                    const insertColumns = insertColumnsPart.split(',').map(col => col.trim());
                    
                    if (insertColumnsPart.trim() === '*' || selectColumns.length !== insertColumns.length) {
                        let alignedInsertColumns;
                        
                        if (selectColumns.length <= insertColumnNames.length) {
                            alignedInsertColumns = insertColumnNames.slice(0, selectColumns.length);
                        } else {
                            this.log(format(msg.columnCountMismatch, { select: selectColumns.length, insert: insertColumnNames.length }));
                            alignedInsertColumns = insertColumnNames;
                        }
                        
                        const alignedInsertColumnsPart = alignedInsertColumns.join(', ');
                        const result = `INSERT INTO ${insertTableName} (${alignedInsertColumnsPart}) SELECT ${selectColumnsPart}${fromPart}`;
                        
                        processedScript = processedScript.replace(fullMatch, result);
                        this.log(format(msg.insertSelectComplete, { table: insertTableName }));
                    }
                    
                } catch (error) {
                    this.log(format(msg.insertSelectProcessError, { error: error.message }));
                }
            }
            
            return processedScript;
            
        } catch (error) {
            this.log(format(msg.insertSelectError, { error: error.message }));
            return script;
        }
    }
}

module.exports = QueryProcessor;

