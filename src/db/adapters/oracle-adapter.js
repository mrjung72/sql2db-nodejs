let oracledb;
try { oracledb = require('oracledb'); } catch (e) { /* optional dep */ }
const AbstractDbAdapter = require('./abstract-adapter');

class OracleAdapter extends AbstractDbAdapter {
  constructor(dbId, logger) {
    super(dbId, logger);
    this.pool = null;
    this.connection = null; // transaction connection
    this.inTransaction = false;
  }

  async connect(config) {
    if (!oracledb) throw new Error('oracledb module not installed');
    if (this.connected && this.pool) return this.pool;
    const poolConfig = {
      user: config.user,
      password: config.password,
      connectString: config.connectString || `${config.server || config.host}:${config.port || 1521}/${config.database}`,
      poolMin: 0,
      poolMax: 10,
      poolIncrement: 1
    };
    this.pool = await oracledb.createPool(poolConfig);
    // Test connection
    const conn = await this.pool.getConnection();
    await conn.close();
    this.connected = true;
    return this.pool;
  }

  async disconnect() {
    if (this.pool) {
      try { await this.pool.close(0); } catch (_) {}
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
          const res = await conn.execute(sqlText, [], { outFormat: oracledb.OBJECT, autoCommit: false });
          const rows = res.rows || [];
          const rowCount = (res.rowsAffected) || rows.length || 0;
          return { recordset: rows, rowsAffected: [rowCount] };
        } finally {
          await conn.close();
        }
      }
    };
  }

  async query(sqlText) {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    const conn = await this.pool.getConnection();
    try {
      const res = await conn.execute(sqlText, [], { outFormat: oracledb.OBJECT, autoCommit: true });
      const rows = res.rows || [];
      const rowCount = (res.rowsAffected) || rows.length || 0;
      return { recordset: rows, rowsAffected: [rowCount] };
    } finally {
      await conn.close();
    }
  }

  async beginTransaction() {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    if (this.inTransaction) return;
    this.connection = await this.pool.getConnection();
    // Oracle auto begins on first DML; ensure we keep the connection
    this.inTransaction = true;
  }

  async commit() {
    if (!this.inTransaction || !this.connection) return;
    await this.connection.commit();
    await this.connection.close();
    this.connection = null;
    this.inTransaction = false;
  }

  async rollback() {
    if (!this.inTransaction || !this.connection) return;
    try { await this.connection.rollback(); } finally {
      await this.connection.close();
      this.connection = null;
      this.inTransaction = false;
    }
  }

  getTestQuery() {
    return 'SELECT 1 FROM dual';
  }
}

module.exports = OracleAdapter;
