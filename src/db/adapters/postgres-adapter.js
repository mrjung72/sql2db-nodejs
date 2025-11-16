let Pool;
try { ({ Pool } = require('pg')); } catch (e) { /* optional until used */ }
const AbstractDbAdapter = require('./abstract-adapter');

class PostgresAdapter extends AbstractDbAdapter {
  constructor(dbId, logger) {
    super(dbId, logger);
    this.pool = null;
    this.client = null;
    this.inTransaction = false;
  }

  async connect(config) {
    if (!Pool) throw new Error("PostgreSQL driver not installed. Run: npm i pg");
    if (this.connected && this.pool) return this.pool;
    const poolConfig = {
      host: config.server || config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
      idleTimeoutMillis: (config.options && config.options.connectionTimeout) || 30000
    };
    this.pool = new Pool(poolConfig);
    // Lazy client acquisition; just test connectivity
    const client = await this.pool.connect();
    client.release();
    this.connected = true;
    return this.pool;
  }

  async disconnect() {
    if (this.pool) {
      try { await this.pool.end(); } catch (_) {}
    }
    this.pool = null;
    this.client = null;
    this.inTransaction = false;
    this.connected = false;
  }

  async request() {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    const client = await this.pool.connect();
    return {
      query: async (sqlText) => {
        try {
          const res = await client.query(sqlText);
          return { rows: res.rows, rowCount: res.rowCount };
        } finally {
          client.release();
        }
      }
    };
  }

  async query(sqlText) {
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    const res = await this.pool.query(sqlText);
    // Normalize to mimic mssql result when possible
    return { recordset: res.rows, rowsAffected: [res.rowCount] };
  }

  async beginTransaction() {
    if (this.inTransaction) return;
    if (!this.pool) throw new Error(`[${this.dbId}] Not connected`);
    this.client = await this.pool.connect();
    await this.client.query('BEGIN');
    this.inTransaction = true;
  }

  async commit() {
    if (!this.inTransaction || !this.client) return;
    await this.client.query('COMMIT');
    this.client.release();
    this.client = null;
    this.inTransaction = false;
  }

  async rollback() {
    if (!this.inTransaction || !this.client) return;
    try { await this.client.query('ROLLBACK'); } finally {
      this.client.release();
      this.client = null;
      this.inTransaction = false;
    }
  }

  getTestQuery() {
    return 'SELECT 1';
  }
}

module.exports = PostgresAdapter;
