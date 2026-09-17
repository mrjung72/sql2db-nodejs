# MSSQL Data Migration Tool User Manual

## 📖 Table of Contents
- [Overview](#overview)
- [Installation and Setup](#installation-and-setup)
- [Basic Usage](#basic-usage)
- [XML Structure Description](#xml-structure-description)
- [Advanced Features](#advanced-features)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The MSSQL Data Migration Tool is a Node.js-based tool for efficiently performing data migration between Microsoft SQL Server databases.

### Key Features
- 🔄 **Batch Data Migration**: Optimized for large-scale data processing
- 🎛️ **Flexible Configuration**: XML-based configuration
- 🔧 **Column Overrides**: Modify/add specific column values during migration
- ⚙️ **Pre/Post Processing**: Execute SQL scripts before/after migration
- 📊 **Dynamic Variables**: Extract and utilize data at runtime
- 🗄️ **Multi-DB Dynamic Variables**: Extract dynamic variables from all databases defined in dbinfo.json
- 🚦 **Transaction Support**: Ensure data consistency
- 📋 **Detailed Logging**: Track and debug migration processes with password masking
- 📈 **Real-time Progress Management**: Track and monitor job progress
- 🔄 **Interruption Recovery**: Resume interrupted migrations from the completed point
- 🔍 **Current Time Functions**: Support for various timestamp formats
- 🖥️ **Real-time Monitoring**: Keyboard interactive monitoring and charts
- ⭐ **SELECT * Auto Expansion**: Automatic column expansion in pre/post-processing scripts
- 🎨 **Pre/Post-processing Column Overrides**: Automatic column addition to INSERT/UPDATE statements
- 📝 **Advanced SQL Parsing**: Comment processing and complex SQL syntax support
- 🆕 **Case-Insensitive Column Matching**: Automatically matches column names regardless of case
- 🆕 **Large Dataset Support**: Handles SQL Server 2100 parameter limit automatically
- 🆕 **Enhanced Debugging**: Detailed diagnostics for troubleshooting delete operations
- 🆕 **Target Schema Support**: Automatic schema combination via `targetSchema`
- 🆕 **Target Table Auto-Creation**: Create tables with PK and comments using `isCreateTable`
- 🆕 **Resource Migration**: Migrate procedures, functions, views, and triggers
- 🆕 **Unit Work Error Control**: Continue or stop with `ignoreUnitWorkError`
- 🆕 **Console Log to File**: `console.*` outputs are automatically written to the log file
- 🆕 **Docker Compose Test Environment**: Local MSSQL test environment setup support

### 🆕 What's New in v0.9.1
- Non-interactive CLI via `app.js --mode` (validate/test/migrate/help)
- Works in Node and packaged EXE
- Documentation updates and consistency improvements

### 🆕 What's New in v0.9.0
- **Selective global overrides (per query)**: Strictly honor XML `applyGlobalColumns` (policy phase), then safely apply only to rows that actually contain those columns (row phase)
- **Column metadata consistency**: `getTableColumns()` now returns `{ name }[]`, improving consistency for SELECT * expansion and schema matching
- **Robust selection logic**: Handles column arrays with mixed `{name}` objects and strings in `selectivelyApplyGlobalColumnOverrides()`
- **Post-process statistics**: Prefer `EXEC sp_updatestats;` or `UPDATE STATISTICS ... WITH FULLSCAN;` instead of `ALTER DATABASE ... SET AUTO_UPDATE_STATISTICS ON`

## 🛠️ Installation and Setup

### 1. System Requirements

#### For Standalone Executable Users
- Windows 7 or higher (64-bit)
- SQL Server 2012 or higher (source/target)
- Appropriate database permissions
- **No Node.js installation required**

#### For Node.js Source Users
- Windows 7 or higher (64-bit)
- **Node.js 14.0 or higher** (18.x recommended)
- npm 6.0 or higher
- SQL Server 2012 or higher (source/target)
- Appropriate database permissions

### 2. Installation

#### Option 1: Standalone Executable (For End Users)

**Best for:**
- Users who want quick setup without Node.js
- Production environments
- Users unfamiliar with Node.js

**Installation Steps:**
1. Download `sql2db-v0.9.1-win-x64.zip` from the release page
2. Extract to your desired location (e.g., `C:\Tools\sql2db\`)
3. No additional installation required - ready to use!

**Package Contents:**
```
sql2db-v0.9.1/
├── sql2db.exe              # Main executable (no Node.js needed)
├── run.bat                 # English launcher
├── 실행하기.bat             # Korean launcher
├── config/
│   └── dbinfo.json         # Database configuration
├── queries/                # Query definition files
│   └── (your XML files)
├── resources/              # SQL resource files
│   ├── create_sample_tables.sql
│   └── insert_sample_data.sql
├── user_manual/            # Complete documentation
│   ├── USER_MANUAL.md
│   ├── USER_MANUAL_KR.md
│   ├── CHANGELOG.md
│   └── CHANGELOG_KR.md
├── logs/                   # Log output directory (auto-created)
└── results/                # Migration results (auto-created)
```

**Advantages:**
- ✅ No Node.js installation required
- ✅ Single executable file
- ✅ Fast startup
- ✅ ~50MB complete package with all dependencies
- ✅ Easy distribution

#### Option 2: Node.js Source Version (For Developers)

**Best for:**
- Developers who need to modify the source code
- CI/CD pipelines
- Custom integrations
- Development and testing

**Installation Steps:**

1. **Install Node.js**
   ```bash
   # Download from https://nodejs.org/
   # Verify installation
   node --version  # Should show v14.0 or higher
   npm --version   # Should show v6.0 or higher
   ```

2. **Get Source Code**
   ```bash
   # Option A: Clone from repository
   git clone https://github.com/your-repo/sql2db.git
   cd sql2db
   
   # Option B: Download and extract source zip
   # Extract sql2db-source-v0.8.4.zip
   cd sql2db
   ```

3. **Install Dependencies**
```bash
npm install
```

4. **Verify Installation**
   ```bash
   npm start
   # Should launch interactive menu
   ```

**Project Structure:**
```
sql2db/
├── app.js                  # Main interactive interface
├── package.json            # Project configuration
├── src/                    # Source code
│   ├── migrate-cli.js      # CLI entry point
│   ├── mssql-data-migrator-modular.js
│   ├── logger.js
│   ├── progress-manager.js
│   └── modules/            # Modular components
│       ├── config-manager.js
│       ├── variable-manager.js
│       ├── query-processor.js
│       └── script-processor.js
├── config/
│   └── dbinfo.json         # Database configuration
├── queries/                # Query definition files
├── resources/              # SQL resource files
├── test/                   # Test files
├── logs/                   # Log output
└── dist/                   # Built executables (after npm run build)
```

**Development Commands:**
```bash
# Run interactive interface
npm start              # English
npm run start:kr       # Korean

# Direct CLI usage
npm run migrate        # Migrate with query file
npm run validate       # Validate configuration
npm run dry-run        # Simulation mode
npm run list-dbs       # List databases

# Build standalone executable
npm run build          # Creates dist/sql2db.exe

# Create release package
npm run release        # Creates complete distribution package

# Clean build artifacts
npm run clean          # Remove dist/ and release/
```

**Advantages:**
- ✅ Full source code access
- ✅ Customizable and extensible
- ✅ Easy debugging and testing
- ✅ Can build custom executables
- ✅ Integrate with existing Node.js projects

### 3. Database Connection Setup
Edit `config/dbinfo.json` file:
```json
{
  "dbs": {
    "sourceDB": {
      "server": "source-server.com",
      "port": 1433,
      "database": "source_database",
      "user": "username",
      "password": "password",
      "isWritable": false,
      "description": "Source database",
      "options": {
        "encrypt": true,
        "trustServerCertificate": true
      }
    },
    "targetDB": {
      "server": "target-server.com", 
      "port": 1433,
      "database": "target_database",
      "user": "username",
      "password": "password",
      "isWritable": true,
      "description": "Target database"
    }
  }
}
```

## 🚀 Basic Usage

## Method 1: Using Standalone Executable

### Launch Interactive Interface

#### Windows Explorer
1. Navigate to extracted folder
2. Double-click `run.bat` (English) or `실행하기.bat` (Korean)

#### Command Line
```bash
# Navigate to installation directory
cd C:\Tools\sql2db

# English version
run.bat

# Korean version
실행하기.bat

# Or run executable directly with language via environment variable
set LANGUAGE=en && sql2db.exe
set LANGUAGE=kr && sql2db.exe
```

### Non-interactive CLI (New)

Run tasks directly without the interactive menu using `--mode` and optional flags.

Supported modes:

- `--mode=validate` Validate a query definition file
- `--mode=test` Test DB connections (list-dbs)
- `--mode=migrate` Execute data migration
- `--help` or `--mode=help` Show help

Examples (Node.js):

```bash
# Validate configuration
node app.js --lang=kr --mode=validate --query=queries/migration-queries.xml

# Test connections
node app.js --lang=kr --mode=test

# Run migration
node app.js --lang=kr --mode=migrate --query=queries/migration-queries.xml
```

Examples (Standalone EXE):

```bash
sql2db.exe --lang=kr --mode=validate --query=queries/migration-queries.xml
sql2db.exe --lang=kr --mode=test
sql2db.exe --lang=kr --mode=migrate --query=queries/migration-queries.xml
```

Notes:

- `--query` accepts absolute or relative path (relative to the executable folder in release builds).
- `--lang=en|kr` sets message language.

### Interactive Menu
```
=========================================
  MSSQL Data Migration Tool
  Version 0.9.1
=========================================

1. Validate Query Definition File
2. Test Database Connection
3. Execute Data Migration
4. Check Migration Progress
5. Show Help
0. Exit

Please select (0-5):
```

### Menu Options Explained

#### Option 1: Validate Query Definition File
**Purpose:** Check configuration file for errors before migration

**What it checks:**
- ✅ XML/JSON syntax validity
- ✅ Attribute name correctness
- ✅ Required fields presence
- ✅ Database references validity
- ✅ Query structure integrity

**Usage Steps:**
1. Select menu option `1`
2. Choose query definition file by number
3. Review validation results
4. Fix any errors shown

**Example Output:**
```
✅ Configuration validation successful!
   - Settings: Valid
   - Queries: 5 found
   - Dynamic Variables: 3 found
   - Global Processes: 2 groups found
```

#### Option 2: Test Database Connection
**Purpose:** Verify database connectivity before migration

**What it tests:**
- ✅ Server connectivity
- ✅ Authentication credentials
- ✅ Database accessibility
- ✅ Read/Write permissions

**Usage Steps:**
1. Select menu option `2`
2. View connection test results for all databases
3. Verify all connections are successful

**Example Output:**
```
Testing database connections...

✅ sourceDB
   Server: prod-db-01.company.com
   Database: production_db
   Status: Connected
   
✅ targetDB
   Server: dev-db-01.company.com
   Database: development_db
   Status: Connected
```

#### Option 3: Execute Data Migration
**Purpose:** Run actual data migration

**Process:**
1. Select query definition file
2. Review migration summary
3. Confirm execution
4. Monitor real-time progress
5. View completion summary

**Usage Steps:**
1. Select menu option `3`
2. Choose query definition file by number
3. Type 'Y' to confirm migration
4. Wait for completion
5. Check logs for details

**Example Output:**
```
Starting data migration...

✅ Query 1/5: migrate_users
   Processed: 10,000 rows in 5.2s (1,923 rows/sec)

✅ Query 2/5: migrate_orders
   Processed: 50,000 rows in 24.5s (2,041 rows/sec)

...

✅ Data migration completed successfully!
   Total time: 2m 15s
   Total rows: 150,000
```

#### Option 4: Check Migration Progress
**Purpose:** View history and details of past migrations

**Features:**
- View recent 3 migrations by default
- Access full migration history (press 'A')
- View detailed status for any migration
- Check query-level progress
- Review error information

**Usage Steps:**
1. Select menu option `4`
2. View migration list
3. Enter number for detailed info
4. Press 'A' to see all migrations
5. Press '0' to return to main menu

**Example Output:**
```
Migration History (Recent 3):

1. migration-2025-10-11-01-45-35
   Status: COMPLETED
   Started: 2025-10-11 1:45:35 AM
   Progress: 25/25 queries
   Completed: 2025-10-11 1:48:20 AM (165s)

2. migration-2025-10-11-01-39-47
   Status: FAILED
   Started: 2025-10-11 1:39:47 AM
   Progress: 15/25 queries
   Failed: 3

Enter number to view details, 'A' for all, or '0' to go back:
```

#### Option 5: Show Help
**Purpose:** Display usage information and examples

**Information Provided:**
- Command examples
- Configuration tips
- Documentation links
- Common troubleshooting

---

## Method 2: Using Node.js Source

### Interactive Interface

#### Launch from Command Line
```bash
# Navigate to project directory
cd /path/to/sql2db

# English version
npm start
# Output: Interactive menu launches

# Korean version
npm run start:kr
# Output: 대화형 메뉴 실행
```

The interactive menu is identical to the standalone executable version.

### Command Line Interface (CLI)

#### Validate Configuration
```bash
# Validate specific query file
node src/migrate-cli.js validate --query ./queries/migration-queries.xml

# Output example:
# ✅ Configuration validation successful!
#    Settings: Valid
#    Queries: 5 found
```

#### Test Database Connections
```bash
# Test all configured databases
node src/migrate-cli.js test

# List all available databases
node src/migrate-cli.js list-dbs

# Test specific database connection
node src/migrate-cli.js list-dbs --test sourceDB
```

#### Execute Data Migration
```bash
# Normal migration
node src/migrate-cli.js migrate --query ./queries/migration-queries.xml

# Simulation mode (DRY RUN) - no actual changes
node src/migrate-cli.js migrate --query ./queries/migration-queries.xml --dry-run

# With custom batch size
BATCH_SIZE=2000 node src/migrate-cli.js migrate --query ./queries/migration-queries.xml
```

#### Resume Interrupted Migration
```bash
# List available migrations to resume
node src/progress-cli.js list

# Check resume information
node src/progress-cli.js resume migration-2025-10-11-01-45-35

# Resume migration from last completed point
node src/migrate-cli.js resume migration-2025-10-11-01-45-35 --query ./queries/migration-queries.xml
```

#### Monitor Migration Progress
```bash
# List all migrations
node src/progress-cli.js list

# Show specific migration details
node src/progress-cli.js show migration-2025-10-11-01-45-35

# Real-time monitoring (requires migration to be running)
node src/progress-cli.js monitor migration-2025-10-11-01-45-35

# Display summary of all migrations
node src/progress-cli.js summary

# Clean up old progress files (older than 7 days)
node src/progress-cli.js cleanup 7
```

### Development Commands

#### Build Standalone Executable
```bash
# Build executable (creates dist/sql2db.exe)
npm run build

# Output:
# > pkg . --public --no-native-build --compress GZip
# ✅ Build completed: dist/sql2db.exe
```

#### Create Release Package
```bash
# Create complete distribution package
npm run release

# Output:
# - Builds executable
# - Creates release directory structure
# - Copies all necessary files
# - Generates documentation
# - Creates ZIP archive
# Result: release/sql2db-v0.8.0-bin.zip
```

#### Run Tests
```bash
# Run all test files
cd test
node test-basic-migration.js
node test-column-overrides.js
node test-dynamic-variables.js
# ... etc

# Or run specific test
node test/test-dry-run.js
```

#### Environment Variables
```bash
# Set batch size
set BATCH_SIZE=2000
node src/migrate-cli.js migrate --query ./queries/migration-queries.xml

# Enable detailed logging
set ENABLE_LOGGING=true
node src/migrate-cli.js migrate --query ./queries/migration-queries.xml

# Enable transaction support
set ENABLE_TRANSACTION=true
node src/migrate-cli.js migrate --query ./queries/migration-queries.xml

# Debug mode
set DEBUG_VARIABLES=true
set DEBUG_SCRIPTS=true
node src/migrate-cli.js migrate --query ./queries/migration-queries.xml
```

### npm Scripts Reference

| Command | Description |
|---------|-------------|
| `npm start` | Launch interactive interface (English) |
| `npm run start:kr` | Launch interactive interface (Korean) |
| `npm run migrate` | Execute migration (with prompt) |
| `npm run dry-run` | Execute simulation mode (with prompt) |
| `npm run validate` | Validate configuration (with prompt) |
| `npm run resume` | Resume interrupted migration (with prompt) |
| `npm run progress` | Display progress information (with prompt) |
| `npm run test-connections` | Test all database connections |
| `npm run list-dbs` | List all configured databases |
| `npm run help` | Display help information |
| `npm run build` | Build standalone executable |
| `npm run release` | Create complete release package |
| `npm run clean` | Remove build artifacts |

## 📋 XML Structure Description

### Basic Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<migration>
  <settings>
    <sourceDatabase>sourceDB</sourceDatabase>
    <targetDatabase>targetDB</targetDatabase>
    <batchSize>1000</batchSize>
    <logLevel>INFO</logLevel>
  </settings>
  
  <queries>
    <!-- Migration queries -->
  </queries>
  
  <dynamicVariables>
    <!-- Dynamic variables -->
  </dynamicVariables>
</migration>
```

### Settings Section
- **sourceDatabase**: Source database identifier from dbinfo.json
- **targetDatabase**: Target database identifier from dbinfo.json
- **batchSize**: Number of records processed per batch (default: 1000)
- **deleteBeforeInsert**: Whether to delete before insert (default: true)
  - `true`: Delete target data matching source business key values before migration
    - ⚠️ **IMPORTANT**: You must specify the columns used as delete criteria in the `identityColumns` attribute of each query
  - `false`: Insert directly without deletion (UPSERT mode)
- **isCreateTable**: Whether to create the target table automatically if it does not exist (default: false)
  - `true`: Create target table based on source/target metadata (including PK and comments)
  - `false`: Use existing table
- **targetSchema**: Default target schema (default: none)
  - If `targetTable` does not include a schema, it is automatically combined as `<targetSchema>.<targetTable>`
- **ignoreUnitWorkError**: Whether to continue when a unit query/table error occurs (default: false)
  - `true`: Mark the failed query as failed and continue with the next query
  - `false`: Stop the entire migration immediately on error
- **logLevel**: Logging level (DEBUG, INFO, WARN, ERROR, FATAL)

### Query Structure
```xml
<query id="unique_id" 
       targetTable="table_name" 
       identityColumns="primary_key_column"
       enabled="true">
  <sourceQuery>
    <![CDATA[SELECT * FROM source_table WHERE condition]]>
  </sourceQuery>
  
  <columnOverrides>
    <override column="column_name">value</override>
    <override column="timestamp_column">${CURRENT_TIMESTAMP}</override>
  </columnOverrides>
  
  <preProcess description="Backup">
    <![CDATA[INSERT INTO backup_table SELECT * FROM target_table;]]>
  </preProcess>
  
  <postProcess description="Logging">
    <![CDATA[INSERT INTO migration_log VALUES ('table_name', GETDATE());]]>
  </postProcess>
</query>
```

### Query Attributes

#### Required Attributes
- `id`: Unique identifier for the query
- `description`: Query description
- `targetTable`: Target table name
- `identityColumns`: Unique identifier column name(s) for distinguishing data rows - Business Key (used as criteria for data deletion and synchronization)
  - 💡 **Description**: This refers to business keys that uniquely identify each data row, NOT the database's physical Primary Key
  - ⚠️ **IMPORTANT**: IDENTITY (auto-increment) columns **CANNOT** be used in `identityColumns`
  - **Why This Cannot Be Used**:
    1. **Value Mismatch**: IDENTITY columns are automatically generated with different values in source and target, so the same record has different IDs
    2. **Deletion Errors**: When `deleteBeforeInsert=true`, cannot find target records using source IDs, causing deletion failures or wrong data deletion
    3. **Data Duplication**: The same business data gets repeatedly inserted with different IDs, creating duplicate records
  - **Solutions**: 
    - Use business keys (e.g., user_code, order_number, product_code)
    - Composite keys are supported (e.g., `identityColumns="user_code,region_code"`)
    - Add a separate unique identifier column to your table if needed
  - **Examples**: 
    - ❌ Bad: `identityColumns="log_id"` where `log_id` is IDENTITY
    - ✅ Good: `identityColumns="user_code"` where `user_code` is a business key
    - ✅ Good: `identityColumns="order_id,line_no"` where both are business keys
- `enabled`: Whether to execute (true/false)

#### Optional Attributes
- `targetColumns`: Target column list (same as source if empty)
- `batchSize`: Individual batch size (overrides global setting)
- `deleteBeforeInsert`: Individual delete setting (overrides global setting)
  - `true`: Delete target data using source business key values before migration
    - ⚠️ **IMPORTANT**: You must specify the columns used as delete criteria in the `identityColumns` attribute
  - `false`: Insert directly without deletion
- `targetSchema`: Individual target schema (overrides global `settings.targetSchema`)
- `isCreateTable`: Whether to create the target table automatically (overrides global `settings.isCreateTable`)
- `sourceQueryFile`: Path to an external SQL file (used instead of the `sourceQuery` element content)

#### `sourceQuery` Element Attributes
When using the `sourceQuery` element, the following attributes can be specified:
- `targetTable`: Target table name (required)
- `targetSchema`: Target schema
- `targetColumns`: Target column list
- `identityColumns`: Business key columns (delete criteria)
- `sourceQueryFile`: SQL file path
- `applyGlobalColumns`: Selectively apply global column overrides (e.g., `all`, `created_date`)
- `deleteBeforeInsert`: Whether to delete before insert
- `isCreateTable`: Whether to create the target table automatically

## 🔄 Dynamic Variables System

The tool supports dynamic variables that can extract data at runtime and use it in queries. **You can now extract dynamic variables from all databases defined in dbinfo.json.**

#### 🗄️ Database Selection Feature

When extracting dynamic variables, you can use the `database` attribute to specify a particular database:

- **If not specified**: Uses `sourceDatabase` as default
- **`sourceDB`**: Extract from source database
- **`targetDB`**: Extract from target database  
- **`sampleDB`**: Extract from sample database defined in dbinfo.json
- **Other DBs**: Use any database defined in dbinfo.json

### Variable Types

| Type | Description | Access Pattern | Default |
|------|-------------|----------------|---------|
| `column_identified` | Extract all columns as arrays keyed by column name | `${varName.columnName}` | ✅ Yes |
| `key_value_pairs` | Extract first two columns as key-value pairs | `${varName.key}` | No |

### Usage Examples

#### XML Configuration
```xml
<dynamicVariables>
  <!-- Using column_identified (default) from source DB -->
  <dynamicVar id="customer_data" description="Customer information" database="sourceDB">
    <query>SELECT CustomerID, CustomerName, Region FROM Customers</query>
    <!-- extractType omitted - defaults to column_identified -->
  </dynamicVar>
  
  <!-- Using key_value_pairs from target DB -->
  <dynamicVar id="status_mapping" description="Status mapping" database="targetDB">
    <query>SELECT StatusCode, StatusName FROM StatusCodes</query>
    <extractType>key_value_pairs</extractType>
  </dynamicVar>
  
  <!-- Extract from sample DB -->
  <dynamicVar id="company_info" description="Company information" database="sampleDB">
    <query>SELECT CompanyCode, CompanyName FROM Companies</query>
    <extractType>key_value_pairs</extractType>
  </dynamicVar>
</dynamicVariables>
```

#### Usage in Queries
```sql
-- In your migration queries
SELECT * FROM Orders 
WHERE CustomerID IN (${customer_data.CustomerID})
  AND Status IN (${status_mapping.StatusCode})
```

### Variable Processing
1. **Execution Order**: Dynamic variables are processed before migration queries
2. **Database Connection**: Uses the source database connection
3. **Error Handling**: If a variable query fails, it's replaced with an empty result
4. **Performance**: Variables are executed once and cached for the entire migration

## 🎨 Advanced Features

### 1. Global Timezone System & Date/Time Variables

The tool supports comprehensive date/time variables with global timezone support, allowing you to use timestamps in 22 different timezones worldwide.

#### Basic Syntax

**Timezone-Specific Format:**
```
${DATE.TIMEZONE:format}
```

**Local Time Format:**
```
${DATE:format}
```

**Note:** When timezone is not specified, the server's local timezone is used. For global consistency, it's recommended to explicitly specify a timezone.

#### Supported Timezones (22 Total)

| Timezone | Description | UTC Offset | Region |
|----------|-------------|------------|--------|
| **UTC** | Coordinated Universal Time | UTC+0 | Global Standard |
| **GMT** | Greenwich Mean Time | UTC+0 | United Kingdom |
| **KST** | Korea Standard Time | UTC+9 | South Korea |
| **JST** | Japan Standard Time | UTC+9 | Japan |
| **CST** | China Standard Time | UTC+8 | China |
| **SGT** | Singapore Time | UTC+8 | Singapore |
| **PHT** | Philippine Time | UTC+8 | Philippines |
| **AEST** | Australian Eastern Time | UTC+10 | Australia (East) |
| **ICT** | Indochina Time | UTC+7 | Thailand, Vietnam |
| **IST** | India Standard Time | UTC+5:30 | India |
| **GST** | Gulf Standard Time | UTC+4 | UAE, Oman |
| **CET** | Central European Time | UTC+1 | Germany, France, Italy, Poland |
| **EET** | Eastern European Time | UTC+2 | Eastern Europe |
| **EST** | Eastern Standard Time | UTC-5 | US East Coast |
| **AST** | Atlantic Standard Time | UTC-4 | Eastern Canada |
| **CST_US** | Central Standard Time | UTC-6 | US, Canada, Mexico Central |
| **MST** | Mountain Standard Time | UTC-7 | US Mountain |
| **PST** | Pacific Standard Time | UTC-8 | US West Coast |
| **AKST** | Alaska Standard Time | UTC-9 | Alaska |
| **HST** | Hawaii Standard Time | UTC-10 | Hawaii |
| **BRT** | Brasilia Time | UTC-3 | Brazil |
| **ART** | Argentina Time | UTC-3 | Argentina |

#### Format Tokens

Supports both uppercase and lowercase tokens:

| Token | Description | Example |
|-------|-------------|---------|
| `yyyy` or `YYYY` | 4-digit year | 2025 |
| `yy` or `YY` | 2-digit year | 25 |
| `MM` | 2-digit month | 01, 12 |
| `M` | Month (1-2 digits) | 1, 12 |
| `dd` or `DD` | 2-digit day | 01, 31 |
| `d` or `D` | Day (1-2 digits) | 1, 31 |
| `HH` | 2-digit hour (24h) | 00, 23 |
| `H` | Hour (1-2 digits) | 0, 23 |
| `mm` | 2-digit minute | 00, 59 |
| `m` | Minute (1-2 digits) | 0, 59 |
| `ss` | 2-digit second | 00, 59 |
| `s` | Second (1-2 digits) | 0, 59 |
| `SSS` | Milliseconds | 000, 999 |

#### Usage Examples

**1. Table Names with Timezone:**
```xml
<query id="backup_data" targetTable="users_backup_${DATE.UTC:yyyyMMdd}" enabled="true">
  <sourceQuery>SELECT * FROM users</sourceQuery>
</query>

<query id="log_migration" targetTable="migration_log_${DATE.KST:yyyy_MM_dd}" enabled="true">
  <sourceQuery>SELECT * FROM migration_data</sourceQuery>
</query>
```

**2. Column Overrides with Multiple Timezones:**
```xml
<columnOverrides>
  <override column="created_at_utc">${DATE.UTC:yyyy-MM-DD HH:mm:ss}</override>
  <override column="created_at_kst">${DATE.KST:yyyy-MM-DD HH:mm:ss}</override>
  <override column="created_at_est">${DATE.EST:yyyy-MM-DD HH:mm:ss}</override>
  <override column="migration_id">${DATE.UTC:yyyyMMddHHmmss}</override>
</columnOverrides>
```

**3. Local Time (Server Timezone):**
```xml
<columnOverrides>
  <override column="processed_at">${DATE:yyyy-MM-DD HH:mm:ss}</override>
  <override column="batch_id">${DATE:yyyyMMdd_HHmmss}</override>
</columnOverrides>
```

**4. WHERE Conditions with Timezone:**
```xml
<sourceQuery>
  <![CDATA[
    SELECT * FROM orders 
    WHERE order_date >= '${DATE.KST:yyyy-MM-DD}' 
      AND status = 'COMPLETED'
  ]]>
</sourceQuery>
```

**5. Global Column Overrides:**
```xml
<globalColumnOverrides>
  <override column="migration_date_utc">${DATE.UTC:yyyy-MM-DD}</override>
  <override column="migration_timestamp">${DATE.KST:yyyy-MM-DD HH:mm:ss}</override>
  <override column="created_by">MIGRATION_TOOL</override>
</globalColumnOverrides>
```

**6. Pre/Post Processing:**
```xml
<preProcess description="Backup with timestamp">
  <![CDATA[
    INSERT INTO backup_table_${DATE.UTC:yyyyMMdd} 
    SELECT *, '${DATE.UTC:yyyy-MM-DD HH:mm:ss}' as backup_time 
    FROM target_table;
  ]]>
</preProcess>

<postProcess description="Log completion">
  <![CDATA[
    INSERT INTO migration_log (table_name, completed_at_kst, completed_at_utc)
    VALUES ('target_table', '${DATE.KST:yyyy-MM-DD HH:mm:ss}', '${DATE.UTC:yyyy-MM-DD HH:mm:ss}');
  ]]>
</postProcess>
```

**7. Multi-Timezone Migration Example:**
```xml
<query id="global_migration" targetTable="users_${DATE.UTC:yyyyMMdd}" enabled="true">
  <sourceQuery>
    <![CDATA[
      SELECT user_id, user_name, email 
      FROM users 
      WHERE created_at >= '${DATE.KST:yyyy-MM-DD 00:00:00}'
    ]]>
  </sourceQuery>
  
  <columnOverrides>
    <override column="migration_timestamp_utc">${DATE.UTC:yyyy-MM-DD HH:mm:ss}</override>
    <override column="migration_timestamp_kst">${DATE.KST:yyyy-MM-DD HH:mm:ss}</override>
    <override column="migration_timestamp_est">${DATE.EST:yyyy-MM-DD HH:mm:ss}</override>
    <override column="migration_timestamp_cet">${DATE.CET:yyyy-MM-DD HH:mm:ss}</override>
  </columnOverrides>
</query>
```

#### Legacy Timestamp Functions

These functions are still supported for backward compatibility:

| Function | Description | Format |
|----------|-------------|--------|
| `${CURRENT_TIMESTAMP}` | Current timestamp | 2025-10-21 14:30:45 |
| `${CURRENT_DATETIME}` | Current datetime | 2025-10-21 14:30:45 |
| `${NOW}` | Current datetime | 2025-10-21 14:30:45 |
| `${CURRENT_DATE}` | Current date only | 2025-10-21 |
| `${CURRENT_TIME}` | Current time only | 14:30:45 |
| `${UNIX_TIMESTAMP}` | Unix timestamp (seconds) | 1729507845 |
| `${TIMESTAMP_MS}` | Unix timestamp (milliseconds) | 1729507845123 |
| `${ISO_TIMESTAMP}` | ISO 8601 format | 2025-10-21T14:30:45.123Z |
| `${GETDATE}` | SQL Server format | 2025-10-21 14:30:45 |

**Migration Example:**
```xml
<!-- Old Format (still works) -->
<override column="created_at">${CURRENT_TIMESTAMP}</override>

<!-- New Format (recommended) -->
<override column="created_at">${DATE.UTC:yyyy-MM-DD HH:mm:ss}</override>
<override column="created_at_kst">${DATE.KST:yyyy-MM-DD HH:mm:ss}</override>
```

### 2. Column Overrides
```xml
<columnOverrides>
  <override column="migration_flag">1</override>
  <override column="updated_by">MIGRATION_TOOL</override>
  <override column="processed_at">${DATE.UTC:yyyy-MM-DD HH:mm:ss}</override>
  <override column="migration_date">${DATE.KST:yyyy-MM-DD}</override>
</columnOverrides>
```

### 3. Global Column Overrides

Global column overrides allow you to define column values that apply to all queries. You can selectively apply these overrides using the `applyGlobalColumns` attribute.

#### Selective Application

**Available Values:**
- `all`: Apply all global column overrides (default) - only columns that actually exist in the data
- `none`: Don't apply any global column overrides
- `column_name`: Apply only a specific column (e.g., `created_by`)
- `column1,column2,...`: Apply multiple specific columns (e.g., `created_by,updated_by`)

#### Example Configuration

```xml
<!-- Define global column overrides -->
<globalColumnOverrides>
  <override column="created_by">SYSTEM</override>
  <override column="updated_by">SYSTEM</override>
  <override column="migration_date">${DATE.UTC:yyyy-MM-DD}</override>
  <override column="processed_at">${DATE.KST:yyyy-MM-DD HH:mm:ss}</override>
  <override column="data_version">2.1</override>
</globalColumnOverrides>

<!-- Apply all global columns - only columns present in actual data are overridden -->
<query id="migrate_users" applyGlobalColumns="all">
  <sourceQuery targetTable="users" ...>
    SELECT * FROM users WHERE status = 'ACTIVE'
  </sourceQuery>
  <!-- 
    If users table only has created_by, updated_by, migration_date:
    Log output: "Applying global column overrides: created_by, updated_by, migration_date"
    (processed_at, data_version are not applied)
  -->
</query>

<!-- Apply specific columns - only columns that exist in data are overridden -->
<query id="migrate_products" applyGlobalColumns="created_by,updated_by">
  <sourceQuery targetTable="products" ...>
    SELECT * FROM products WHERE status = 'ACTIVE'
  </sourceQuery>
  <!-- 
    If products table only has created_by:
    Log output: "Applying global column overrides: created_by"
    (updated_by is not in the table, so it's not applied)
  -->
</query>

<!-- No global column overrides -->
<query id="migrate_logs" applyGlobalColumns="none">
  <!-- Result: No global column overrides applied -->
</query>
```

**Important Notes:**
- If a specified column doesn't exist in the source data, it's automatically ignored
- Logs show only the column names that were actually overridden
- Column name matching is case-insensitive (e.g., `Created_By`, `created_by`, `CREATED_BY` are all treated the same)

#### JSON Mapping for Value Transformation

Global column overrides support JSON format for mapping source values to target values.

**Basic Syntax:**
```xml
<override column="column_name">{"source_value1":"target_value1", "source_value2":"target_value2"}</override>
```

**How It Works:**
- If the source column value exists in JSON keys → Transform to corresponding value
- If the source column value doesn't exist in JSON keys → **Keep original value** (no transformation)
- If the source column value is null/undefined/empty string → Keep original value
- Whitespace in values is automatically trimmed for matching

**Usage Examples:**

```xml
<globalColumnOverrides>
  <!-- Status code mapping -->
  <override column="status">{"COMPLETED":"FINISHED", "PENDING":"WAITING", "PROCESSING":"GOING"}</override>
  
  <!-- Company code mapping -->
  <override column="company_code">{"COMPANY01":"APPLE", "COMPANY02":"AMAZON", "COMPANY03":"GOOGLE"}</override>
  
  <!-- Payment method mapping -->
  <override column="payment_method">{"CreditCard":"[CC]Visa", "BankTransfer":"[BT]Chase"}</override>
  
  <!-- Email address mapping -->
  <override column="email">{"old@company.com":"new@company.com", "admin@old.com":"admin@new.com"}</override>
</globalColumnOverrides>
```

**Transformation Examples:**

| Column | Original Value | JSON Mapping | Result Value | Description |
|--------|----------------|--------------|--------------|-------------|
| status | `COMPLETED` | `{"COMPLETED":"FINISHED"}` | `FINISHED` | ✅ Mapping successful |
| status | `PENDING` | `{"COMPLETED":"FINISHED"}` | `PENDING` | ⚠️ No mapping, keep original |
| status | `ACTIVE ` | `{"ACTIVE":"ING"}` | `ING` | ✅ Auto-trim whitespace |
| status | `null` | `{"COMPLETED":"FINISHED"}` | `null` | ⚠️ null not transformed |
| company_code | `COMPANY01` | `{"COMPANY01":"APPLE"}` | `APPLE` | ✅ Mapping successful |
| company_code | `COMPANY99` | `{"COMPANY01":"APPLE"}` | `COMPANY99` | ⚠️ No mapping, keep original |

**Important Points:**
- ✅ **Preserve Original**: Values without mappings automatically keep their original value
- ✅ **Case-Sensitive**: JSON keys are case-sensitive
- ✅ **Whitespace Handling**: Leading/trailing whitespace in original values is automatically trimmed
- ⚠️ **null Handling**: null, undefined, and empty strings are not transformed and keep original value
- ⚠️ **No Default to First Value**: If mapping fails, it does NOT use the first JSON value, but keeps the original value

**Real-World Example:**

```xml
<!-- Source Data -->
<!-- 
  orders table:
  order_id | status      | payment_method | company_code
  1        | COMPLETED   | CreditCard     | COMPANY01
  2        | PENDING     | BankTransfer   | COMPANY02
  3        | SHIPPED     | Cash           | COMPANY99
-->

<globalColumnOverrides>
  <override column="status">{"COMPLETED":"FINISHED", "PENDING":"WAITING", "PROCESSING":"GOING"}</override>
  <override column="payment_method">{"CreditCard":"[CC]Visa", "BankTransfer":"[BT]Chase"}</override>
  <override column="company_code">{"COMPANY01":"APPLE", "COMPANY02":"AMAZON"}</override>
</globalColumnOverrides>

<!-- Result Data -->
<!--
  order_id | status    | payment_method | company_code
  1        | FINISHED  | [CC]Visa       | APPLE
  2        | WAITING   | [BT]Chase      | AMAZON
  3        | SHIPPED   | Cash           | COMPANY99
  
  Explanation:
  - order 1: All columns transformed (status, payment_method, company_code)
  - order 2: All columns transformed (status, payment_method, company_code)
  - order 3: All columns kept original values (no JSON mappings found)
-->
```

#### Use Cases
- Migration flags
- Environment-specific value changes (DEV → PROD)
- Audit information addition
- Status value updates
- Current timestamp addition
- **Code value mapping** (status codes, company codes, etc.)
- **Legacy data normalization** (converting old values to new standards)
- **Multi-language support** (language-specific value conversion)

### 4. Pre/Post Processing

#### Global Pre/Post Processing Groups
Executed before and after the entire migration process. Can be organized into multiple groups by functionality.

```xml
<globalProcesses>
  <!-- Pre-processing Groups -->
  <preProcessGroups>
    <group id="performance_setup" description="Performance optimization setup" enabled="true">
      <![CDATA[
        -- Disable indexes
        ALTER INDEX ALL ON users DISABLE;
        ALTER INDEX ALL ON products DISABLE;
        
        -- Disable constraints
        ALTER TABLE users NOCHECK CONSTRAINT ALL;
        ALTER TABLE products NOCHECK CONSTRAINT ALL;
      ]]>
    </group>
    
    <group id="logging" description="Initialize migration log" enabled="true">
      <![CDATA[
        -- Log migration start
        INSERT INTO migration_log (migration_date, status, description) 
        VALUES (GETDATE(), 'STARTED', 'Migration started');
      ]]>
    </group>
  </preProcessGroups>
  
  <!-- Post-processing Groups -->
  <postProcessGroups>
    <group id="performance_restore" description="Restore performance optimization" enabled="true">
      <![CDATA[
        -- Rebuild indexes
        ALTER INDEX ALL ON users REBUILD;
        ALTER INDEX ALL ON products REBUILD;
        
        -- Enable constraints
        ALTER TABLE users WITH CHECK CHECK CONSTRAINT ALL;
        ALTER TABLE products WITH CHECK CHECK CONSTRAINT ALL;
      ]]>
    </group>
    
    <group id="completion" description="Completion log" enabled="true">
      <![CDATA[
        -- Log migration completion
        INSERT INTO migration_log (migration_date, status, description) 
        VALUES (GETDATE(), 'COMPLETED', 'Data migration completed successfully');
      ]]>
    </group>
  </postProcessGroups>
</globalProcesses>
```

**Group Attributes:**
- `id`: Unique identifier for the group
- `description`: Group description
- `enabled`: Whether the group is active (true/false)

**Execution Order:**
1. Global pre-processing groups (in defined order)
2. Dynamic variable extraction
3. Individual query migrations
4. Global post-processing groups (in defined order)

**Error Handling:**
- **Pre-processing group errors**: Halt entire migration
- **Post-processing group errors**: Log warning and continue with next group

💡 **Detailed Group System**: See "Global Pre/Post Processing Groups" section later in this document for comprehensive examples.

#### Individual Query Pre/Post Processing
Executed only before/after specific query execution.

```xml
<preProcess description="Backup and cleanup">
  <![CDATA[
    -- Backup existing data
    INSERT INTO backup_table SELECT * FROM target_table;
    
    -- Clean up old data
    DELETE FROM target_table WHERE created_date < DATEADD(day, -30, GETDATE());
  ]]>
</preProcess>

<postProcess description="Validation and logging">
  <![CDATA[
    -- Validate migration
    IF (SELECT COUNT(*) FROM target_table) = 0
    BEGIN
      RAISERROR('Migration failed: No data found', 16, 1);
    END
    
    -- Log completion
    INSERT INTO migration_log (table_name, migrated_count, completed_at)
    SELECT 'target_table', COUNT(*), GETDATE() FROM target_table;
  ]]>
</postProcess>
```

### 4. Progress Tracking
```bash
# List all migrations
node src/progress-cli.js list

# Show specific migration details
node src/progress-cli.js show migration-2024-12-01-15-30-00

# Real-time monitoring
node src/progress-cli.js monitor migration-2024-12-01-15-30-00

# Resume information
node src/progress-cli.js resume migration-2024-12-01-15-30-00
```

### 5. SELECT * Auto Processing
When using `SELECT *`, the tool automatically:
- Detects the pattern
- Queries target table columns
- Excludes IDENTITY columns
- Transforms to explicit column list

```xml
<query id="migrate_users" targetTable="users" enabled="true">
  <sourceQuery>
    <![CDATA[SELECT * FROM users WHERE status = 'ACTIVE']]>
  </sourceQuery>
  <!-- targetColumns automatically set (IDENTITY columns excluded) -->
</query>
```

### 6. Global Pre/Post Processing Groups (Advanced)

You can organize global pre-processing and post-processing into multiple groups, managing them by functionality.

#### Group Definition

```xml
<globalProcesses>
  <!-- Pre-processing Groups -->
  <preProcessGroups>
    <group id="performance_setup" description="Performance optimization setup" enabled="true">
      <![CDATA[
        -- Disable indexes
        ALTER INDEX ALL ON users DISABLE;
        ALTER INDEX ALL ON products DISABLE;
        
        -- Disable constraints
        ALTER TABLE users NOCHECK CONSTRAINT ALL;
        ALTER TABLE products NOCHECK CONSTRAINT ALL;
      ]]>
    </group>
    
    <group id="logging" description="Initialize migration log" enabled="true">
      <![CDATA[
        -- Log migration start
        INSERT INTO migration_log (migration_date, status, description, user_name) 
        VALUES (GETDATE(), 'STARTED', 'Migration started', '${migrationUser}');
      ]]>
    </group>
    
    <group id="validation" description="Data validation" enabled="true">
      <![CDATA[
        -- Basic source data validation
        IF EXISTS (SELECT 1 FROM users_source WHERE username IS NULL OR email IS NULL)
        BEGIN
          INSERT INTO validation_errors (error_type, message, created_date)
          VALUES ('NULL_REQUIRED_FIELDS', 'Required fields contain NULL values', GETDATE());
        END
        
        -- Check for duplicate data
        IF EXISTS (SELECT user_id, COUNT(*) FROM users_source GROUP BY user_id HAVING COUNT(*) > 1)
        BEGIN
          RAISERROR('Duplicate user IDs found. Migration aborted.', 16, 1);
        END
      ]]>
    </group>
  </preProcessGroups>
  
  <!-- Post-processing Groups -->
  <postProcessGroups>
    <group id="performance_restore" description="Restore performance optimization" enabled="true">
      <![CDATA[
        -- Rebuild indexes
        ALTER INDEX ALL ON users REBUILD;
        ALTER INDEX ALL ON products REBUILD;
        
        -- Enable constraints
        ALTER TABLE users WITH CHECK CHECK CONSTRAINT ALL;
        ALTER TABLE products WITH CHECK CHECK CONSTRAINT ALL;
      ]]>
    </group>
    
    <group id="verification" description="Data verification" enabled="true">
      <![CDATA[
        -- Verify data counts after migration
        DECLARE @source_count INT, @target_count INT;
        SELECT @source_count = COUNT(*) FROM users_source;
        SELECT @target_count = COUNT(*) FROM users WHERE migration_date = '${migrationTimestamp}';
        
        IF @source_count != @target_count
        BEGIN
          INSERT INTO validation_errors (error_type, message, source_count, target_count, created_date)
          VALUES ('COUNT_MISMATCH', 'Source and target counts do not match', @source_count, @target_count, GETDATE());
        END
      ]]>
    </group>
    
    <group id="completion" description="Completion log" enabled="true">
      <![CDATA[
        -- Log migration completion
        INSERT INTO migration_log (migration_date, status, description, total_rows) 
        VALUES (GETDATE(), 'COMPLETED', 'Data migration completed successfully', 
                (SELECT COUNT(*) FROM users WHERE migration_date = '${migrationTimestamp}'));
      ]]>
    </group>
  </postProcessGroups>
</globalProcesses>
```

#### Group Attributes

- **id**: Unique identifier for the group
- **description**: Group description
- **enabled**: Whether the group is active (true/false)

#### Execution Order

1. **Global pre-processing groups** (in defined order)
2. Dynamic variable extraction
3. Individual query migrations
4. **Global post-processing groups** (in defined order)

#### Using Dynamic Variables

All dynamic variables can be used in group scripts:

```xml
<group id="audit_logging" description="Audit log" enabled="true">
  <![CDATA[
    -- Log active users (using dynamic variable)
    INSERT INTO migration_user_tracking (user_id, tracking_type)
    SELECT user_id, 'ACTIVE_USER'
    FROM users_source 
    WHERE user_id IN (${activeUserIds});
    
    -- Company statistics (key_value_pairs dynamic variable)
    INSERT INTO company_stats (company_code, company_name)
    SELECT 'COMP01', '${companyMapping.COMP01}'
    UNION ALL
    SELECT 'COMP02', '${companyMapping.COMP02}';
  ]]>
</group>
```

#### Error Handling

- **Pre-processing group errors**: Halt entire migration
- **Post-processing group errors**: Log warning and continue with next group

### 7. Advanced SQL Parsing and Comment Processing

Accurately processes complex SQL syntax and comments.

#### Supported Comment Types
```sql
-- Line comments
/* Block comments */
/* 
   Multi-line
   block comments
*/

-- Comments in strings are protected
INSERT INTO log VALUES ('-- This is not a comment');
INSERT INTO log VALUES ('/* This is also not a comment */');
```

#### Variable Processing Improvements
- **Processing Order**: Dynamic variables → Static variables → Timestamp functions → Environment variables
- **Conflict Prevention**: Higher priority variables are not overwritten by lower priority ones
- **Debugging**: Detailed variable substitution process tracking

#### Debugging Options
```bash
# Detailed variable substitution process logs
DEBUG_VARIABLES=true node src/migrate-cli.js migrate queries.xml

# Comment removal process verification
DEBUG_COMMENTS=true node src/migrate-cli.js migrate queries.xml

# Complete script processing verification
DEBUG_SCRIPTS=true node src/migrate-cli.js migrate queries.xml
```

## 🔧 Recent Improvements (Post v0.6)

### 1. Dynamic Variable Database Specification

You can now specify which database to extract data from in dynamic variables.

#### Key Improvements
- **Database Selection**: Use the `database` attribute to select source/target DB
- **Default Value**: Uses `sourceDB` as default when attribute is not specified
- **Cross-DB Utilization**: Extract conditions from source then query related data from target
- **All dbinfo.json DBs Supported**: Extract dynamic variables from all databases defined in dbinfo.json

#### Usage Examples

```xml
<!-- Extract dynamic variables from multiple databases -->
<dynamicVariables>
  <!-- Extract user list from source DB -->
  <dynamicVar variableName="sourceUsers" database="sourceDB">
    SELECT user_id FROM users WHERE status = 'ACTIVE'
  </dynamicVar>
  
  <!-- Extract department info from target DB -->
  <dynamicVar variableName="targetDepts" database="targetDB">
    SELECT dept_id FROM departments WHERE is_active = 1
  </dynamicVar>
  
  <!-- Extract company info from sample DB -->
  <dynamicVar variableName="companyInfo" database="sampleDB">
    SELECT company_code, company_name FROM companies
  </dynamicVar>
</dynamicVariables>
```

#### Usage Examples
```xml
<!-- Extract user IDs from source DB -->
<dynamicVar id="extract_source_users"
            variableName="sourceUserIds"
            extractType="single_column"
            columnName="user_id"
            database="sourceDB">
  <![CDATA[SELECT user_id FROM users WHERE status = 'ACTIVE']]>
</dynamicVar>

<!-- Extract mapping info from target DB -->
<dynamicVar id="extract_target_mapping"
            variableName="targetMapping"
            extractType="key_value_pairs"
            database="targetDB">
  <![CDATA[SELECT old_id, new_id FROM id_mapping]]>
</dynamicVar>
```

### 2. SELECT * Pattern Improvements

Fixed the issue where SQL keywords were incorrectly recognized as table aliases.

#### Improved Features
- **Accurate Alias Detection**: SQL keywords (WHERE, GROUP, HAVING, etc.) are not mistaken for aliases
- **Safe Pattern Matching**: More accurate regex pattern for table alias extraction
- **Error Prevention**: Prevents SQL errors caused by incorrect column name generation

#### Before and After Comparison
**Before (Problematic):**
```sql
-- Original query
SELECT * FROM products WHERE status = 'ACTIVE'

-- Incorrect transformation result
SELECT WHERE.product_name, WHERE.product_code, WHERE.category_id FROM products WHERE status = 'ACTIVE'
```

**After (Normal Operation):**
```sql
-- Original query
SELECT * FROM products WHERE status = 'ACTIVE'

-- Correct transformation result
SELECT product_name, product_code, category_id, price, cost FROM products WHERE status = 'ACTIVE'
```

### 3. DRY RUN Mode Enhancement

DRY RUN mode now actually extracts dynamic variables to provide more accurate simulation.

#### Enhanced Features
- **Actual Dynamic Variable Extraction**: Dynamic variables are actually extracted and stored during DRY RUN
- **Accurate Query Simulation**: Precise query validation using extracted dynamic variable values
- **Error Pre-detection**: Dynamic variable related errors are discovered during DRY RUN phase

#### Usage Example
```bash
# Validate queries with dynamic variables using DRY RUN
node src/migrate-cli.js migrate --query ./queries/migration-queries.xml --dry-run
```

**Output Example:**
```
🧪 DRY RUN Mode: Data Migration Simulation

🔍 Dynamic Variable Extraction Simulation: 3 items
  • extract_active_users: Active user ID extraction
    Query: SELECT user_id FROM users WHERE status = 'ACTIVE'
    Database: sourceDB
    Extracted values: [1001, 1002, 1003, 1005, 1008] (5 items)
  
  • extract_company_mapping: Company code mapping
    Query: SELECT company_code, company_name FROM companies
    Database: targetDB
    Extracted values: {"COMP01": "Samsung", "COMP02": "LG"} (2 pairs)

📊 Query Simulation Results:
  ✅ migrate_users: Expected 5 rows to process
  ✅ migrate_orders: Expected 25 rows to process
  ✅ migrate_products: Expected 150 rows to process
```

### 4. Error Handling and Stability Improvements

#### Key Improvements
- **Safe Variable Substitution**: Safely handles dynamic variables that haven't been extracted yet
- **Graceful Fallback**: Safely recovers to original data when features fail
- **Detailed Error Messages**: Provides clearer error information when problems occur

#### Debugging Support
```bash
# Detailed dynamic variable processing logs
DEBUG_VARIABLES=true node src/migrate-cli.js migrate queries.xml

# SELECT * processing verification
DEBUG_SCRIPTS=true node src/migrate-cli.js migrate queries.xml
```

## 📝 Examples

### Complete Migration Example

⚠️ **Important Note Before Starting**:
- The `CustomerID` in the example below is a **business key**, NOT an IDENTITY column
- If your table uses IDENTITY columns, you must use a different column (business key) for `identityColumns`
- See the Query Attributes section above for detailed explanation

```xml
<?xml version="1.0" encoding="UTF-8"?>
<migration>
  <settings>
    <sourceDatabase>sourceDB</sourceDatabase>
    <targetDatabase>targetDB</targetDatabase>
    <batchSize>500</batchSize>
    <logLevel>INFO</logLevel>
  </settings>
  
  <globalColumnOverrides>
    <override column="migration_source">LEGACY_SYSTEM</override>
    <override column="migration_date">${CURRENT_DATE}</override>
  </globalColumnOverrides>
  
  <dynamicVariables>
    <dynamicVar id="active_customers" description="Active customer list">
      <query>SELECT CustomerID FROM Customers WHERE IsActive = 1</query>
    </dynamicVar>
  </dynamicVariables>
  
  <queries>
    <query id="migrate_customers" 
           targetTable="customers" 
           identityColumns="CustomerID"
           enabled="true">
      <sourceQuery>
        <![CDATA[
          SELECT CustomerID, CustomerName, Email, Phone
          FROM customers_source 
          WHERE CustomerID IN (${active_customers.CustomerID})
        ]]>
      </sourceQuery>
      
      <columnOverrides>
        <override column="status">ACTIVE</override>
        <override column="created_by">MIGRATION_TOOL</override>
      </columnOverrides>
      
      <preProcess description="Backup existing customers">
        <![CDATA[
          INSERT INTO customers_backup 
          SELECT * FROM customers WHERE migration_source = 'LEGACY_SYSTEM';
        ]]>
      </preProcess>
      
      <postProcess description="Log migration completion">
        <![CDATA[
          INSERT INTO migration_log (table_name, record_count, completed_at)
          SELECT 'customers', COUNT(*), GETDATE() FROM customers;
        ]]>
      </postProcess>
    </query>
  </queries>
</migration>
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Errors
**Problem**: Cannot connect to database
**Solution**: 
- Check `config/dbinfo.json` configuration
- Verify network connectivity
- Ensure proper database permissions

#### 2. Column Mismatch Errors
**Problem**: Source and target table column count mismatch
**Solution**:
- Use explicit column lists in sourceQuery
- Check column data types
- Use column overrides for missing columns

#### 3. Dynamic Variable Errors
**Problem**: Dynamic variable not resolving
**Solution**:
- Check variable query syntax
- Verify variable name in usage
- Check database permissions for variable queries

#### 4. Dynamic Variable Database Errors
**Problem**: Unknown database specified in dynamic variable
**Solution**:
1. Verify the database exists in `config/dbinfo.json`
2. Check the `database` attribute in the dynamic variable
3. List available databases: `node src/migrate-cli.js list-dbs`

#### 4. Performance Issues
**Problem**: Slow migration performance
**Solution**:
- Reduce batch size
- Add appropriate indexes
- Use pre-processing to disable constraints

### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General information about migration progress
- **WARN**: Warning messages (non-critical issues)
- **ERROR**: Error messages (migration may continue)
- **FATAL**: Critical errors (migration stops)

### Error Recovery
1. **Check logs**: Review log files for error details
2. **Validate configuration**: Use `validate` command
3. **Test connections**: Use `list-dbs` command
4. **Resume migration**: Use `resume` command for interrupted migrations

## 🆕 Features and Attributes Added Since v0.9.1

### 1. Summary of Major Changes

| Version | Major Changes |
|---------|---------------|
| v0.10.1 | Added `docker-compose.yml` and SQL files for MSSQL testing |
| v0.10.2 | 3rd party library version updates |
| v0.11.1 | Improved data input speed, added target table auto-creation (`isCreateTable`) |
| v1.0.1 | Stabilization release |
| v1.0.2 | Added global `settings.isCreateTable` setting |
| v1.0.3 | Added `targetSchema` attribute (settings/query/sourceQuery) |
| v1.0.4 | Added `enabled`, `runInTransaction` attributes to pre/post processing |
| v1.0.5 | Primary Key and comments applied when creating tables |
| v1.0.6 | Table creation feature improvements |
| v1.0.7 | Improved `SELECT *` automatic expansion logic |
| v1.1.0 | Added `resources` section for procedure/function/view/trigger migration |
| v1.1.1 | Skip unnecessary PK deletion when target table is empty |
| v1.1.2 | `console.*` outputs are also written to log file |
| v1.1.3 | Added `ignoreUnitWorkError` attribute to control unit query error handling |

### 2. Summary of New XML Attributes

#### New `settings` Attributes
- `isCreateTable`: Whether to create target table automatically when missing (default: `false`)
- `targetSchema`: Default target schema
- `ignoreUnitWorkError`: Whether to continue with the next query when a unit query fails (default: `false`)

#### New `query` / `sourceQuery` Attributes
- `targetSchema`: Individual target schema
- `isCreateTable`: Individual table auto-creation flag
- `sourceQueryFile`: Path to an external SQL file
- `applyGlobalColumns`: Selectively apply global column overrides
- `deleteBeforeInsert`: Also available inside the `sourceQuery` element

#### `resource` Attributes
- `id`: Resource identifier
- `description`: Description
- `enabled`: Whether to execute (`true`/`false`)
- `type`: `procedure`, `function`, `view`, `trigger`
- `name`: Source resource name
- `schema`: Source schema
- `targetName`: Target resource name (defaults to `name`)
- `targetSchema`: Target schema
- `dropBeforeCreate`: Whether to drop existing resource before creating (`true`/`false`)

#### Pre/Post Processing Attributes
- `enabled`: Whether to execute pre/post processing (`true`/`false`)
- `runInTransaction`: Whether to run inside a transaction
- `database`: Target database (`source` or `target`)
- `applyGlobalColumns`: Apply column overrides to `SELECT *`/`INSERT` in the script

### 3. Using `targetSchema`

When `targetTable` does not include a schema, `targetSchema` is automatically combined.

```xml
<settings>
  <targetSchema>dbo</targetSchema>
</settings>

<queries>
  <query id="users" targetTable="users" enabled="true">
    <sourceQuery targetTable="users" identityColumns="user_id" deleteBeforeInsert="true">
      SELECT * FROM users
    </sourceQuery>
  </query>
</queries>
```

The target table is processed as `dbo.users`. If `targetTable` already includes a schema (e.g., `[dbo].[users]` or `schema.table`), it is not duplicated.

### 4. Using `isCreateTable`

When `isCreateTable="true"`, the tool creates the target table based on source metadata, applying Primary Key and comments.

```xml
<settings>
  <isCreateTable>true</isCreateTable>
  <targetSchema>dbo</targetSchema>
</settings>

<queries>
  <query id="new_table" targetTable="new_users" enabled="true">
    <sourceQuery targetTable="new_users" identityColumns="user_id">
      SELECT user_id, user_name FROM source_users
    </sourceQuery>
  </query>
</queries>
```

It can be overridden per query:

```xml
<query id="existing_table" targetTable="old_users" isCreateTable="false" enabled="true">
```

### 5. Using `ignoreUnitWorkError`

Set to `true` to continue the migration when a single query/table fails.

```xml
<settings>
  <ignoreUnitWorkError>true</ignoreUnitWorkError>
</settings>
```

- `true`: The failed query is recorded in `failedQueries` and the migration continues
- `false` or unset: The entire migration stops immediately on error

### 6. `resources` Migration

The `resources` section migrates stored procedures, functions, views, and triggers from the source to the target.

```xml
<resources>
  <resource id="usp_audit_log"
            description="Audit log stored procedure"
            enabled="true"
            type="procedure"
            name="usp_audit_log"
            schema="dbo"
            targetSchema="dbo"
            targetName="usp_audit_log"
            dropBeforeCreate="true"/>
</resources>
```

Supported `type` values: `procedure`, `function`, `view`, `trigger`.

### 7. Console Log to File

Starting with v1.1.2, `console.log`, `console.warn`, `console.error`, `console.info`, and `console.debug` outputs are written to both the console and `logs/migration-YYYY-MM-DD.log`. The `logger.js` module handles this automatically with no extra configuration.

### 8. Docker Compose Test Environment

Starting with v0.10.1, `docker-compose.yml` and test SQL files are included. Use the following command to set up a local MSSQL environment:

```bash
docker-compose up -d
```

The SQL files in the `test/` directory can be used to quickly configure test databases.

### 9. `SELECT *` Auto-Expansion Improvements

`SELECT *` in source queries and pre/post scripts is automatically expanded based on the target table's column metadata. IDENTITY columns are excluded, and `applyGlobalColumns` may automatically add global column override columns.

### 10. Pre/Post Processing Attributes

The following attributes can be applied to per-query `preProcess`/`postProcess` elements:

```xml
<query id="migrate_users" targetTable="users" enabled="true">
  <preProcess description="Backup users" enabled="true" runInTransaction="true" database="target" applyGlobalColumns="true">
    <![CDATA[INSERT INTO backup_users SELECT * FROM users]]>
  </preProcess>
  <sourceQuery targetTable="users" identityColumns="user_id">
    SELECT * FROM users WHERE status = 'ACTIVE'
  </sourceQuery>
</query>
```

---

## 📞 Support

- **Documentation**: Refer to project documentation
- **Issues**: Report issues via GitHub
- **Email**: sql2db.nodejs@gmail.com
- **Website**: sql2db.com

