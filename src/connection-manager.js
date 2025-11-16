const { createAdapter } = require('./db/adapter-factory');
const logger = require('./logger');

class ConnectionManager {
  constructor(logger) {
    this.logger = logger || console;
    this.adapters = new Map(); // dbId -> { adapter, config }
    this.sourceDbId = null;
    this.targetDbId = null;
  }

  upsertDbConfig(dbId, config) {
    if (!dbId || !config) throw new Error('dbId and config are required');
    const prev = this.adapters.get(dbId);
    if (prev && prev.adapter) {
      // keep existing adapter instance but refresh config
      prev.config = config;
      this.adapters.set(dbId, prev);
      return;
    }
    const adapter = createAdapter(config.type || 'mssql', dbId, this.logger);
    this.adapters.set(dbId, { adapter, config });
  }

  // Backward-compat: allow setting source/target configs directly
  setCustomDatabaseConfigs(sourceConfig, targetConfig) {
    if (sourceConfig) {
      const srcId = sourceConfig.id || 'source';
      this.upsertDbConfig(srcId, sourceConfig);
      this.sourceDbId = srcId;
    }
    if (targetConfig) {
      const tgtId = targetConfig.id || 'target';
      this.upsertDbConfig(tgtId, targetConfig);
      this.targetDbId = tgtId;
    }
  }

  getAdapter(dbId) {
    const entry = this.adapters.get(dbId);
    if (!entry) throw new Error(`No adapter for dbId: ${dbId}`);
    return entry.adapter;
  }

  getConfig(dbId) {
    const entry = this.adapters.get(dbId);
    if (!entry) throw new Error(`No config for dbId: ${dbId}`);
    return entry.config;
  }

  async connect(dbId) {
    const { adapter, config } = this.adapters.get(dbId) || {};
    if (!adapter || !config) throw new Error(`Adapter/config missing for dbId: ${dbId}`);
    return adapter.connect(config);
  }

  async disconnect(dbId) {
    const entry = this.adapters.get(dbId);
    if (!entry) return;
    return entry.adapter.disconnect();
  }

  // Backward-compatible helper: connect both source and target if configured
  async connectBoth() {
    const tasks = [];
    if (this.sourceDbId) {
      tasks.push(this.connect(this.sourceDbId));
    }
    if (this.targetDbId && this.targetDbId !== this.sourceDbId) {
      tasks.push(this.connect(this.targetDbId));
    }
    await Promise.all(tasks);
  }

  // Backward-compatible helper: disconnect all known DB adapters
  async closeConnections() {
    const tasks = [];
    for (const dbId of this.adapters.keys()) {
      tasks.push(this.disconnect(dbId));
    }
    await Promise.all(tasks);
  }

  async testConnection(dbId) {
    const adapter = this.getAdapter(dbId);
    const testSql = adapter.getTestQuery();
    await this.connect(dbId);
    const result = await adapter.query(testSql);
    return result && result.recordset ? 'OK' : 'OK';
  }

  // === Compatibility helpers ===
  getAvailableDBKeys() {
    return Array.from(this.adapters.keys());
  }

  async queryDB(dbId, sqlText) {
    await this.connect(dbId);
    const adapter = this.getAdapter(dbId);
    // DEBUG 레벨에서 실행 SQL 로그
    if (logger && typeof logger.logQuery === 'function') {
      logger.logQuery(dbId, sqlText);
    }
    const res = await adapter.query(sqlText);
    // Normalize to recordset array when possible
    if (res && res.recordset) return res.recordset;
    return res;
  }

  async executeQueryOnSource(sqlText) {
    if (!this.sourceDbId) throw new Error('Source DB not configured');
    return this.queryDB(this.sourceDbId, sqlText);
  }

  async executeQueryOnTarget(sqlText) {
    if (!this.targetDbId) throw new Error('Target DB not configured');
    return this.queryDB(this.targetDbId, sqlText);
  }

  async querySource(sqlText) {
    return this.executeQueryOnSource(sqlText);
  }

  // MSSQL-only utilities used by current processors; safe no-op for other DBs until specialized adapters are added
  async getTableColumns(tableName, useSource = false) {
    const dbId = useSource ? this.sourceDbId : this.targetDbId;
    const { config } = this.adapters.get(dbId) || {};
    if (!dbId || !config) throw new Error('DB not configured');
    const type = String(config.type || 'mssql').toLowerCase();
    if (type !== 'mssql') {
      // Fallback: return empty to avoid breaking non-MSSQL until per-DB metadata is implemented
      return [];
    }
    const query = `
      SELECT c.COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS c
      INNER JOIN sys.columns sc ON c.COLUMN_NAME = sc.name 
          AND c.TABLE_NAME = OBJECT_NAME(sc.object_id)
      WHERE c.TABLE_NAME = '${tableName}'
        AND sc.is_computed = 0
        AND sc.is_identity = 0
        AND c.DATA_TYPE NOT IN ('varbinary', 'binary', 'image')
      ORDER BY c.ORDINAL_POSITION
    `;
    const rows = await this.queryDB(dbId, query);
    return (rows || []).map(r => ({ name: r.COLUMN_NAME }));
  }

  async getIdentityColumns(tableName, useSource = false) {
    const dbId = useSource ? this.sourceDbId : this.targetDbId;
    const { config } = this.adapters.get(dbId) || {};
    if (!dbId || !config) throw new Error('DB not configured');
    const type = String(config.type || 'mssql').toLowerCase();
    if (type !== 'mssql') return [];
    const query = `
      SELECT c.name AS COLUMN_NAME
      FROM sys.columns c
      INNER JOIN sys.tables t ON c.object_id = t.object_id
      WHERE t.name = '${tableName}'
        AND c.is_identity = 1
      ORDER BY c.column_id
    `;
    const rows = await this.queryDB(dbId, query);
    return (rows || []).map(r => r.COLUMN_NAME);
  }

  // === Session wrappers (no-op for now; adapters may emulate when supported) ===
  async beginSession(database = 'target') {
    const dbId = database === 'source' ? this.sourceDbId : this.targetDbId;
    if (!dbId) throw new Error(`${database} DB not configured`);
    await this.connect(dbId);
    return true;
  }

  async executeQueryInSession(sqlText, database = 'target') {
    return database === 'source'
      ? this.executeQueryOnSource(sqlText)
      : this.executeQueryOnTarget(sqlText);
  }

  async endSession(database = 'target') {
    // no-op; sessions are adapter-specific
    return true;
  }

  // === Transaction wrappers ===
  async beginTransaction(database = 'target') {
    const dbId = database === 'source' ? this.sourceDbId : this.targetDbId;
    if (!dbId) throw new Error(`${database} DB not configured`);
    const adapter = this.getAdapter(dbId);
    await this.connect(dbId);
    return adapter.beginTransaction();
  }

  async commit(database = 'target') {
    const dbId = database === 'source' ? this.sourceDbId : this.targetDbId;
    if (!dbId) throw new Error(`${database} DB not configured`);
    const adapter = this.getAdapter(dbId);
    return adapter.commit();
  }

  async rollback(database = 'target') {
    const dbId = database === 'source' ? this.sourceDbId : this.targetDbId;
    if (!dbId) throw new Error(`${database} DB not configured`);
    const adapter = this.getAdapter(dbId);
    return adapter.rollback();
  }

  // === Minimal insert support (MSSQL only for now) ===
  async insertToTarget(tableName, columns, data) {
    if (!this.targetDbId) throw new Error('Target DB not configured');
    const { adapter, config } = this.adapters.get(this.targetDbId) || {};
    const type = String(config.type || 'mssql').toLowerCase();
    if (type !== 'mssql') {
      throw new Error('insertToTarget not implemented for DB type: ' + type);
    }

    if (!data || data.length === 0) {
      return { rowsAffected: [0] };
    }

    let effectiveColumns = columns;
    if (effectiveColumns === '*') {
      const tableColumns = await this.getTableColumns(tableName, false);
      effectiveColumns = (tableColumns || []).map(col => (typeof col === 'string' ? col : col.name));
    } else if (Array.isArray(effectiveColumns) && effectiveColumns.length === 1 && effectiveColumns[0] === '*') {
      const tableColumns = await this.getTableColumns(tableName, false);
      effectiveColumns = (tableColumns || []).map(col => (typeof col === 'string' ? col : col.name));
    }

    const placeholders = effectiveColumns.map((_, idx) => `@param${idx}`).join(', ');
    const insertQuery = `INSERT INTO ${tableName} (${effectiveColumns.join(', ')}) VALUES (${placeholders})`;

    // DEBUG 레벨에서 INSERT SQL 템플릿 로그
    if (logger && typeof logger.logQuery === 'function') {
      logger.logQuery(`${this.targetDbId || 'target'}.${tableName}`, insertQuery);
    }

    let total = 0;
    for (const row of data) {
      const req = await adapter.request();
      effectiveColumns.forEach((col, idx) => {
        req.input(`param${idx}`, row[col]);
      });
      const res = await req.query(insertQuery);
      if (res && res.rowsAffected && res.rowsAffected[0]) total += res.rowsAffected[0];
    }
    return { rowsAffected: [total] };
  }

  // === Minimal PK-based delete (MSSQL only) ===
  async deleteFromTargetByPK(tableName, identityColumns, sourceData) {
    if (!this.targetDbId) throw new Error('Target DB not configured');
    const { config } = this.adapters.get(this.targetDbId) || {};
    const type = String(config.type || 'mssql').toLowerCase();
    if (type !== 'mssql') {
      throw new Error('deleteFromTargetByPK not implemented for DB type: ' + type);
    }

    if (!sourceData || sourceData.length === 0) {
      return { rowsAffected: [0] };
    }

    // normalize identityColumns to array
    const pkCols = Array.isArray(identityColumns)
      ? identityColumns
      : (typeof identityColumns === 'string' && identityColumns.includes(','))
        ? identityColumns.split(',').map(s => s.trim())
        : [identityColumns];

    // Build batched OR predicates
    const chunkSize = 500; // balance between SQL size and roundtrips
    let totalDeleted = 0;
    for (let i = 0; i < sourceData.length; i += chunkSize) {
      const chunk = sourceData.slice(i, i + chunkSize);
      const orClauses = chunk.map(row => {
        const ands = pkCols.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return `${col} IS NULL`;
          return typeof val === 'string'
            ? `${col} = '${String(val).replace(/'/g, "''")}'`
            : `${col} = ${val}`;
        }).join(' AND ');
        return `(${ands})`;
      }).join(' OR ');

      const deleteSql = `DELETE FROM ${tableName} WHERE ${orClauses}`;
      const res = await this.executeQueryOnTarget(deleteSql);
      if (res && res.rowsAffected && res.rowsAffected.length > 0) {
        totalDeleted += res.rowsAffected.reduce((s, n) => s + n, 0);
      }
    }

    return { rowsAffected: [totalDeleted] };
  }
}

module.exports = ConnectionManager;
