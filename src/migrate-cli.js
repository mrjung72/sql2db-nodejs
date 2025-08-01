#!/usr/bin/env node

const MSSQLDataMigrator = require('./mssql-data-migrator');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// 명령줄 인수 파싱
const args = process.argv.slice(2);
const command = args[0];


// 도움말 표시
function showHelp() {
    console.log(`
MSSQL 데이터 이관 도구
사용법: node src/migrate-cli.js <명령> [옵션]

명령:
  migrate                    데이터 이관 실행
  validate                   쿼리문정의 파일 검증
  list-dbs                   데이터베이스 목록 표시 (연결 가능 여부 포함)
  help                       도움말 표시

옵션:
  --query, -q <파일경로>     사용자 정의 쿼리문정의 파일 경로 (JSON 또는 XML)
  --dry-run                  실제 이관 없이 시뮬레이션만 실행

예시:
  node src/migrate-cli.js migrate --query ./queries/migration-queries.xml
  node src/migrate-cli.js migrate -q ./queries/migration-queries.xml
  node src/migrate-cli.js list-dbs
  node src/migrate-cli.js validate --query ./queries/migration-queries.xml

환경 변수 설정:
  .env 파일 또는 시스템 환경 변수로 데이터베이스 연결 정보를 설정하세요.
  자세한 내용은 queries/env.example 파일을 참고하세요.
`);
}

// 옵션 파싱
function parseOptions(args) {
    const options = {
        queryFilePath: null,
        dryRun: false
    };
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--query':
            case '-q':
                options.queryFilePath = args[i + 1];
                i++; // 다음 인수 건너뛰기
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
        }
    }
    
    return options;
}

// 메인 실행 함수
async function main() {
    try {
        // 로거 초기화
        logger.logLevelInfo();
        
        if (!command || command === 'help') {
            showHelp();
            return;
        }
        console.log('--------------> args', args);
        
        const options = parseOptions(args.slice(1));
        console.log('--------------> options', options);
        
        // list-dbs 명령은 쿼리 파일이 필요하지 않음
        if (!options.queryFilePath && command !== 'list-dbs') {
            logger.error('쿼리문정의 파일이 지정되지 않았습니다.');
            console.log('사용법:');
            console.log('  --query, -q <파일경로>  : 사용자 정의 쿼리문정의 파일 사용');
            process.exit(1);
        }
        
        // list-dbs 명령은 쿼리 파일 없이 실행
        const migrator = command === 'list-dbs' ? new MSSQLDataMigrator() : new MSSQLDataMigrator(options.queryFilePath);
        
        logger.info('MSSQL 데이터 이관 도구 시작', {
            version: 'v1.0.0',
            queryFilePath: options.queryFilePath || 'N/A (list-dbs 명령)'
        });
        
        console.log('MSSQL 데이터 이관 도구 v1.0.0');
        console.log('=====================================');
        
        // 사용 중인 쿼리문정의 파일 정보 표시 (list-dbs 명령 제외)
        if (command !== 'list-dbs') {
            console.log(`📁 쿼리문정의 파일 : ${options.queryFilePath}`);
            console.log('');
        }
        
        switch (command) {
            case 'migrate':
                console.log('데이터 이관을 시작합니다...\n');
                
                if (options.dryRun) {
                    console.log('*** DRY RUN 모드 - 실제 데이터 변경 없음 ***\n');
                    
                    const dryRunMigrator = new MSSQLDataMigrator(options.queryFilePath, true);
                    const result = await dryRunMigrator.executeDryRun();
                    
                    if (result.success) {
                        console.log('\n✅ DRY RUN 시뮬레이션이 성공적으로 완료되었습니다!');
                        process.exit(0);
                    } else {
                        console.log('\n❌ DRY RUN 시뮬레이션 중 오류가 발생했습니다.');
                        process.exit(1);
                    }
                }
                
                const result = await migrator.executeMigration();
                
                if (result.success) {
                    console.log('\n✅ 데이터 이관이 성공적으로 완료되었습니다!');
                    process.exit(0);
                } else {
                    console.log('\n❌ 데이터 이관 중 오류가 발생했습니다.');
                    process.exit(1);
                }
                break;
                
            case 'validate':
                console.log('쿼리문정의 파일 검증 중...\n');
                try {
                    const isValid = await migrator.validateConfiguration();
                    
                    if (isValid) {
                        console.log('✅ 쿼리문정의 파일이 유효합니다.');
                        process.exit(0);
                    } else {
                        console.log('❌ 쿼리문정의 파일에 오류가 있습니다.');
                        process.exit(1);
                    }
                } catch (error) {
                    console.error('❌ 쿼리문정의 파일 검증 실패:', error.message);
                    process.exit(1);
                }
                break;
                
            case 'list-dbs':
                console.log('사용 가능한 데이터베이스 목록을 조회합니다...\n');
                try {
                    const tempMigrator = new MSSQLDataMigrator();
                    await tempMigrator.loadDbInfo();
                    
                    if (!tempMigrator.dbInfo || !tempMigrator.dbInfo.dbs) {
                        console.log('❌ config/dbinfo.json 파일을 찾을 수 없거나 DB 정보가 없습니다.');
                        console.log('환경 변수(.env) 방식을 사용 중입니다.');
                        process.exit(1);
                    }
                    
                    const dbs = tempMigrator.dbInfo.dbs;
                    const dbList = Object.keys(dbs);
                    
                    console.log('📊 데이터베이스 목록 및 연결 상태');
                    console.log('=' .repeat(80));
                    console.log(`총 ${dbList.length}개의 데이터베이스가 정의되어 있습니다.\n`);
                    
                    // 각 DB의 연결 상태 테스트
                    console.log('🔍 연결 상태 테스트 중...\n');
                    const connectionResults = {};
                    
                    for (const dbId of dbList) {
                        const db = dbs[dbId];
                        process.stdout.write(`  테스트: ${dbId} (${db.server}:${db.port || 1433}/${db.database}) ... `);
                        
                        const dbConfig = tempMigrator.getDbConfigById(dbId);
                        const result = await tempMigrator.testSingleDbConnection(dbConfig);
                        connectionResults[dbId] = result;
                        
                        if (result.success) {
                            console.log('✅ 연결 성공');
                        } else {
                            console.log(`❌ 연결 실패: ${result.message}`);
                        }
                    }
                    
                    console.log('');
                    
                    // 쓰기 가능한 DB (타겟 DB로 사용 가능)
                    const writableDbs = dbList.filter(id => dbs[id].isWritable);
                    const readOnlyDbs = dbList.filter(id => !dbs[id].isWritable);
                    
                    console.log('🟢 타겟 DB로 사용 가능 (isWritable: true)');
                    console.log('-' .repeat(50));
                    if (writableDbs.length > 0) {
                        writableDbs.forEach(id => {
                            const db = dbs[id];
                            const connectionStatus = connectionResults[id];
                            const statusIcon = connectionStatus.success ? '🟢' : '🔴';
                            const statusText = connectionStatus.success ? '연결 가능' : '연결 불가';
                            
                            console.log(`  📝 ${id} ${statusIcon} ${statusText}`);
                            console.log(`     서버: ${db.server}:${db.port || 1433}`);
                            console.log(`     데이터베이스: ${db.database}`);
                            console.log(`     설명: ${db.description || '설명 없음'}`);
                            console.log(`     사용자: ${db.user}`);
                            if (!connectionStatus.success) {
                                console.log(`     ⚠️ 오류: ${connectionStatus.message}`);
                            }
                            console.log('');
                        });
                    } else {
                        console.log('  ⚠️ 쓰기 가능한 데이터베이스가 없습니다.');
                        console.log('');
                    }
                    
                    console.log('🔶 읽기 전용 (isWritable: false)');
                    console.log('-' .repeat(50));
                    if (readOnlyDbs.length > 0) {
                        readOnlyDbs.forEach(id => {
                            const db = dbs[id];
                            const connectionStatus = connectionResults[id];
                            const statusIcon = connectionStatus.success ? '🟢' : '🔴';
                            const statusText = connectionStatus.success ? '연결 가능' : '연결 불가';
                            
                            console.log(`  📖 ${id} ${statusIcon} ${statusText}`);
                            console.log(`     서버: ${db.server}:${db.port || 1433}`);
                            console.log(`     데이터베이스: ${db.database}`);
                            console.log(`     설명: ${db.description || '설명 없음'}`);
                            console.log(`     사용자: ${db.user}`);
                            if (!connectionStatus.success) {
                                console.log(`     ⚠️ 오류: ${connectionStatus.message}`);
                            }
                            console.log('');
                        });
                    } else {
                        console.log('  📝 모든 데이터베이스가 쓰기 가능합니다.');
                        console.log('');
                    }
                    
                    // 연결 상태 요약
                    const successCount = Object.values(connectionResults).filter(r => r.success).length;
                    const failureCount = dbList.length - successCount;
                    
                    console.log('📈 연결 상태 요약');
                    console.log('-' .repeat(50));
                    console.log(`✅ 연결 성공: ${successCount}개`);
                    console.log(`❌ 연결 실패: ${failureCount}개`);
                    console.log('');
                    
                    console.log('💡 사용법:');
                    console.log('  - 소스 DB: 연결 가능한 모든 DB 사용 가능');
                    console.log('  - 타겟 DB: isWritable=true이고 연결 가능한 DB만 사용 가능');
                    console.log('  - 설정 변경: config/dbinfo.json에서 isWritable 속성 수정');
                    console.log('  - 연결 문제: 서버 주소, 포트, 자격증명, 네트워크 상태 확인');
                    
                    process.exit(0);
                } catch (error) {
                    console.error('❌ 데이터베이스 목록 조회 실패:', error.message);
                    process.exit(1);
                }
                break;
                
            default:
                console.log(`알 수 없는 명령: ${command}`);
                console.log('사용 가능한 명령을 보려면 "help"를 실행하세요.');
                process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ 오류가 발생했습니다:', error.message);
        console.error('스택 트레이스:', error.stack);
        process.exit(1);
    }
}

// 예외 처리
process.on('unhandledRejection', (reason, promise) => {
    console.error('처리되지 않은 Promise 거부:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('처리되지 않은 예외:', error);
    process.exit(1);
});

// CLI 실행
if (require.main === module) {
    main();
}

module.exports = { main, showHelp }; 