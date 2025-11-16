class AbstractDbAdapter {
  constructor(dbId, logger) {
    this.dbId = dbId || 'unknown';
    this.logger = logger || console;
    this.connected = false;
  }

  // Lifecycle
  async connect(config) {
    throw new Error('connect(config) not implemented');
  }

  async disconnect() {
    throw new Error('disconnect() not implemented');
  }

  // Query primitives
  async request() {
    throw new Error('request() not implemented');
  }

  async query(sqlText, params) {
    const req = await this.request();
    return req.query ? req.query(sqlText, params) : Promise.reject(new Error('Adapter request() has no query()'));
  }

  // Transactions
  async beginTransaction() {
    throw new Error('beginTransaction() not implemented');
  }

  async commit() {
    throw new Error('commit() not implemented');
  }

  async rollback() {
    throw new Error('rollback() not implemented');
  }

  // Capabilities and health
  getTestQuery() {
    throw new Error('getTestQuery() not implemented');
  }

  getCapabilities() {
    return { transactions: true };
  }
}

module.exports = AbstractDbAdapter;
