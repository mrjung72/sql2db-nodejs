const sql = require('mssql');
const AbstractDbAdapter = require('./abstract-adapter');

class MssqlAdapter extends AbstractDbAdapter {
  constructor(dbId, logger) {
    super(dbId, logger);
    this.pool = null;
    this.transaction = null;
  }

  async connect(config) {
    if (this.connected && this.pool) return this.pool;
    const pool = new sql.ConnectionPool(config);
    this.pool = await pool.connect();
    this.connected = true;
    return this.pool;
  }

  async disconnect() {
    if (this.pool) {
      try { await this.pool.close(); } catch (_) {}
    }
    this.pool = null;
    this.connected = false;
  }

  async request() {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    if (this.transaction) return new sql.Request(this.transaction);
    return new sql.Request(this.pool);
  }

  async query(sqlText) {
    const req = await this.request();
    return req.query(sqlText);
  }

  async beginTransaction() {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    if (this.transaction) return this.transaction;
    this.transaction = new sql.Transaction(this.pool);
    await this.transaction.begin();
    return this.transaction;
  }

  async commit() {
    if (!this.transaction) return;
    await this.transaction.commit();
    this.transaction = null;
  }

  async rollback() {
    if (!this.transaction) return;
    await this.transaction.rollback();
    this.transaction = null;
  }

  getTestQuery() {
    return 'SELECT 1 as test';
  }
}

module.exports = MssqlAdapter;
