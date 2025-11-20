# JobMug

A full-stack job application platform with separate client and server applications.

## Repository Structure

This repository contains two main applications:

- **client/** - React frontend application (Vite + Tailwind CSS)
- **server/** - Node.js/Express backend API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (for the server)
- npm or yarn

### Client Setup

```bash
cd client
npm install
npm run dev
```

The client will run at http://localhost:5173

See [client/README.md](client/README.md) for more details.

### Server Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

The server will run at http://localhost:3000

See [server/README.md](server/README.md) for more details.

## Development

For development, run both applications in separate terminal windows:

1. Terminal 1: `cd client && npm run dev`
2. Terminal 2: `cd server && npm run dev`

The client is configured to proxy API requests to the server automatically.

## License

See individual applications for license information.
