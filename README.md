# Debate Master

A debate practice application with AI opponents powered by OpenRouter API.

## Architecture

The application uses a secure client-server architecture:
- Frontend: React/TypeScript application using Vite
- Backend: Express/TypeScript server that securely proxies OpenRouter API calls
- API keys and sensitive operations are handled server-side
- Rate limiting and security middleware implemented

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```
Then edit `.env` and add your OpenRouter API key and other configuration.

3. Start the development servers:
```bash
npm run dev
```
This will start both the frontend (port 5173) and backend (port 3000) servers.

## Development

- Frontend code is in `src/`
- Backend code is in `server/src/`
- API routes are in `server/src/routes/`
- Environment configuration in `.env`

## Security Features

- API keys stored securely on backend
- CORS protection
- Rate limiting
- Helmet security headers
- Input validation
- Error handling

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build both frontend and backend
- `npm run start` - Start production server
- `npm test` - Run tests

## API Endpoints

All debate-related endpoints are prefixed with `/api/debate`:

- POST `/topic` - Generate debate topic
- POST `/response` - Get AI response
- POST `/evaluate` - Evaluate argument
- POST `/hint` - Get debate hint
- POST `/evaluate-debate` - Get final debate evaluation

## Environment Variables

See `.env.example` for all available configuration options:

- `PORT` - Backend server port
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `CORS_ORIGIN` - Allowed frontend origin
- Model configuration options
