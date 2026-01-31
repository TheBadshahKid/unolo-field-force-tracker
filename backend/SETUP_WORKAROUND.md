# Quick Setup Guide (No Build Tools Needed)

Since `better-sqlite3` requires C++ build tools to install, here's a **quick workaround** to get you testing immediately:

## Option 1: Use Pre-built Database (FASTEST - 1 minute)

I've created the `manual-init.sql` file. You can use a SQLite GUI tool or command-line to create the database:

### Using SQLite Command Line:
1. Download SQLite from: https://www.sqlite.org/download.html (sqlite-tools-win-x64)
2. Extract it
3. Run in PowerShell:
```bash
cd d:\Desktop\SWITCH_PLAN\UNOLO\CODE\starter-code\backend
sqlite3.exe database.sqlite < manual-init.sql
```

But you'll need to manually hash passwords and insert the data...

## Option 2: Install C++ Build Tools (BETTER - 5-10 min)

Run PowerShell **as Administrator**:
```powershell
npm install --global windows-build-tools
```

Then:
```bash
npm install
node scripts\init-db-fixed.js
```

## Option 3: Use Node.js LTS (EASIEST if you have nvm)

Install Node Version Manager (nvm-windows):
1. Download from: https://github.com/coreybutler/nvm-windows/releases
2. Install it
3. Run:
```bash
nvm install 20
nvm use 20
cd d:\Desktop\SWITCH_PLAN\UNOLO\CODE\starter-code\backend
npm install
node scripts\init-db-fixed.js
```

## Option 4: Manual Database Creation (TEDIOUS)

Since automated methods are blocked, I'll create a Python script to build the database:

