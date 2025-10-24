# Lorcana Proxy Print

Web app / Node.js server for printing proxies for TCG Lorcana.

## ✨ Features
- REST API for generating printable sheets
- Static UI (optional) under `/public`
- Environment-based configuration

## 🧱 Tech Stack
- Node.js + Express
- (Add: TypeScript/Jest/Docker/etc.)

## 🚀 Quick Start

```bash
# 1) Install
npm install

# 2) Configure env
cp .env.example .env
# edit .env with your values

# 3) Run dev
npm run dev

# 4) Production build (if TS)
npm run build && npm start
