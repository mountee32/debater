# Debater Project

An interactive AI-powered debate game where users can engage in structured debates with AI opponents. The game features multiple AI personalities, each with unique debate styles and perspectives, allowing players to practice their argumentation skills in a gamified environment.

## Quick Start

1. Install dependencies:
   ```
   npm install
   ```

2. Start both the development server and logging server with a single command:
   ```
   npm start
   ```

3. Access:
   - Game: http://localhost:5173
   - Log Viewer: http://localhost:3001/log-viewer.html

## Game Overview

Players can:
- Choose debate topics from various categories or create custom topics
- Select AI opponents with different personalities and debate styles
- Engage in turn-based debates with structured arguments and rebuttals
- Adjust difficulty levels to match their skill level
- Track their performance on the leaderboard
- View their debate history and progress

## Features

- **Dynamic AI Opponents**: Multiple AI personalities powered by OpenRouter API, each with unique characteristics and debate styles
- **Customizable Difficulty**: Adjustable difficulty slider that affects AI response complexity and argumentation depth
- **Rich Topic Selection**: Pre-created debate subjects across various categories including politics, philosophy, technology, and more
- **Custom Topics**: Ability to create and debate custom topics
- **Avatar System**: Diverse collection of avatars representing different AI personalities
- **Performance Tracking**: 
  - Real-time scoring system
  - Global leaderboard showing top debaters
  - Compact leaderboard view for quick rankings
- **Responsive Design**: Built with Tailwind CSS for a seamless experience across devices
- **API Communication Logging**: Comprehensive logging system for debugging and monitoring AI interactions

## Prerequisites

Before running the project, make sure you have the following installed:
- Node.js (preferably the latest LTS version)
- npm (comes with Node.js)

## Environment Setup

1. Create a `.env` file in the root directory of the project.
2. Add your OpenRouter API key to the `.env` file:
   ```
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```
   Replace `your_api_key_here` with your actual OpenRouter API key.

Note: The `.env` file is included in `.gitignore` to prevent sensitive information from being committed to the repository.

## API Communication Logging

The project includes a comprehensive logging system with a user-friendly interface for monitoring and debugging AI communications:

1. **Interactive Log Viewer**: 
   - Access at http://localhost:3001/log-viewer.html
   - Clean, collapsible interface for viewing API logs
   - One-line summaries with expandable details
   - Auto-refresh capability

2. **Log Viewer Features**:
   - Summary view showing:
     - Timestamp
     - HTTP method
     - Endpoint
     - Status (Success/Error)
     - Request duration
   - Expandable details showing:
     - Full request data
     - Full response data or error details
     - Formatted JSON for easy reading
   - Auto-refresh options:
     - Configurable refresh intervals (1s, 2s, 5s, 10s)
     - Manual refresh button
   - Color-coded status indicators
   - Chronological ordering (newest first)

3. **Using the Log Viewer**:
   1. Start the application with `npm start`
   2. Open the game in one browser tab
   3. Open http://localhost:3001/log-viewer.html in another tab
   4. Click any log entry to view its details
   5. Enable auto-refresh for real-time updates

## Available Scripts

In the project directory, you can run:

- `npm start`: Starts both the development server and logging server
- `npm run dev`: Runs only the development server
- `npm run logs`: Runs only the logging server
- `npm run build`: Builds the app for production
- `npm run preview`: Locally preview production build
- `npm test`: Runs the test suite

## Project Structure

- `src/`: Contains the source code for the application
  - `api/`: API-related code (e.g., openRouterApi.ts)
  - `components/`: React components (e.g., DebateGame.tsx, DifficultySlider.tsx)
  - `data/`: Data files (e.g., debateQuestions.json, aiPersonalities.ts)
  - `utils/`: Utility functions and logging system
- `public/`: Static files
  - `assets/`: SVG images for AI avatars
  - `log-viewer.html`: Interactive log viewer interface
- `db.json`: Local database file for storing API logs
- `index.html`: The main HTML file
- `vite.config.ts`: Vite configuration file
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.app.json`, `tsconfig.test.json`: TypeScript configuration files
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `eslint.config.js`: ESLint configuration
- `jest.config.cjs`: Jest configuration for testing

## Testing

The project uses Jest for testing. Test files use the `.test.tsx` extension and are located alongside their corresponding components. Run tests using `npm test`.

## Leaderboard System

The leaderboard tracks:
- Player rankings
- Total debates participated
- Win/loss ratio
- Average difficulty level
- Best debate topics
- Recent activity

Players can view their standings in both detailed and compact views, with regular updates to reflect recent debate performances.

## Technologies Used

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Testing**: Jest
- **AI Integration**: OpenRouter API
- **State Management**: React Context
- **Logging**: JSON Server with custom viewer interface

## Additional Resources

- Vite: [Documentation](https://vitejs.dev/)
- React: [Documentation](https://reactjs.org/docs/getting-started.html)
- TypeScript: [Documentation](https://www.typescriptlang.org/docs/)
- Tailwind CSS: [Documentation](https://tailwindcss.com/docs)
- Jest: [Documentation](https://jestjs.io/docs/getting-started)
- JSON Server: [Documentation](https://github.com/typicode/json-server)
