const MssqlAdapter = require('./adapters/mssql-adapter');
const PostgresAdapter = require('./adapters/postgres-adapter');
const MysqlAdapter = require('./adapters/mysql-adapter');
const OracleAdapter = require('./adapters/oracle-adapter');

function createAdapter(type, dbId, logger) {
  const normalized = String(type || 'mssql').toLowerCase();
  switch (normalized) {
    case 'mssql':
    case 'sqlserver':
      return new MssqlAdapter(dbId, logger);
    case 'postgres':
    case 'postgresql':
    case 'pg':
      return new PostgresAdapter(dbId, logger);
    case 'mysql':
    case 'mariadb':
      return new MysqlAdapter(dbId, logger);
    case 'oracle':
    case 'oracledb':
      return new OracleAdapter(dbId, logger);
    default:
      throw new Error(`Unsupported DB type: ${type}`);
  }
}

module.exports = { createAdapter };
