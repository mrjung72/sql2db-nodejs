let mysql;
try { mysql = require('mysql2/promise'); } catch (e) { /* optional until used */ }
const AbstractDbAdapter = require('./abstract-adapter');

class MysqlAdapter extends AbstractDbAdapter {
  constructor(dbId, logger) {
    super(dbId, logger);
    this.pool = null;
    this.connection = null; // transaction connection
    this.inTransaction = false;
  }

  async connect(config) {
    if (!mysql) throw new Error("MySQL driver not installed. Run: npm i mysql2");
    if (this.connected && this.pool) return this.pool;
    const poolConfig = {
      host: config.server || config.host,
      port: config.port || 3306,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    this.pool = mysql.createPool(poolConfig);
    // test connection
    const conn = await this.pool.getConnection();
    conn.release();
    this.connected = true;
    return this.pool;
  }

  async disconnect() {
    if (this.pool) {
      try { await this.pool.end(); } catch (_) {}
    }
    this.pool = null;
    this.connection = null;
    this.inTransaction = false;
    this.connected = false;
  }

  async request() {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    const conn = await this.pool.getConnection();
    return {
      query: async (sqlText) => {
        try {
          const [rows, result] = await conn.query(sqlText);
          const rowCount = (result && result.affectedRows) || rows.length || 0;
          return { recordset: rows, rowsAffected: [rowCount] };
        } finally {
          conn.release();
        }
      }
    };
  }

  async query(sqlText) {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    const [rows, result] = await this.pool.query(sqlText);
    const rowCount = (result && result.affectedRows) || rows.length || 0;
    return { recordset: rows, rowsAffected: [rowCount] };
  }

  async beginTransaction() {
    if (this.inTransaction) return;
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();
    this.inTransaction = true;
  }

  async commit() {
    if (!this.inTransaction || !this.connection) return;
    await this.connection.commit();
    this.connection.release();
    this.connection = null;
    this.inTransaction = false;
  }

  async rollback() {
    if (!this.inTransaction || !this.connection) return;
    try { await this.connection.rollback(); } finally {
      this.connection.release();
      this.connection = null;
      this.inTransaction = false;
    }
  }

  getTestQuery() {
    return 'SELECT 1 as test';
  }
}

module.exports = MysqlAdapter;
