# Debater

A real-time debate application where users can engage in structured debates with an AI opponent.

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your OpenRouter API key:
```bash
cp .env.example .env
```
3. Run the application:
```bash
./start-dev.sh
```

The script will:
- Install dependencies
- Initialize logging system
- Start both frontend and backend servers
- Enable diagnostic logging

Your application will be running at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Diagnostic Logging

The application includes comprehensive diagnostic logging to help debug API interactions and scoring issues.

### Log Files
- Main diagnostic log: `server/logs/diagnostic.log`
- Startup log: `server/logs/startup.log`

### Viewing Logs
View logs in real-time:
```bash
cd server && npm run view-logs
```

Clear logs:
```bash
cd server && npm run clean-logs
```

### Log Contents
The diagnostic log captures:
- Server startup and configuration
- API requests and responses
- Message scoring calculations
- Error traces
- State changes

## Manual Start

If you prefer to start components manually:

1. Start frontend only:
```bash
npm run dev:frontend
```

2. Start backend only:
```bash
npm run dev:backend
```

3. Start both:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| CORS_ORIGIN | CORS origin URL | http://localhost:5173 |
| OPENROUTER_API_KEY | OpenRouter API key | (required) |
| ENABLE_DIAGNOSTIC_LOGGING | Enable detailed logging | false |

## Features

- Real-time debate with AI
- Dynamic scoring system
- Argument evaluation
- Hint generation
- Debate history tracking
- Performance analytics

## Architecture

The application uses a client-server architecture:

- Frontend: React + TypeScript
- Backend: Node.js + Express
- API: OpenRouter for AI interactions
- Logging: Custom diagnostic and API logging systems

## Scoring System

The debate scoring system:
1. Starts at 50/50 baseline for both players
2. Evaluates each message in context of the full debate
3. Updates scores based on argument strength
4. Maintains complementary scoring (player + AI = 100%)
5. Shows per-message impact on overall score

## Troubleshooting

If you encounter issues:

1. Check the diagnostic logs:
```bash
cd server && npm run view-logs
```

2. Verify environment variables:
```bash
cat .env
```

3. Ensure all dependencies are installed:
```bash
npm install
```

4. Check server status:
```bash
curl http://localhost:3000/api/debate/test-log
```

5. If logs aren't being created:
```bash
cd server && npm run init-logs
