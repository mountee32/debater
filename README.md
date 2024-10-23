# Debater Project

An interactive AI-powered debate game where users can engage in structured debates with AI opponents. The game features multiple AI personalities, each with unique debate styles and perspectives, allowing players to practice their argumentation skills in a gamified environment.

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

## Running the Project

To run the project, follow these steps:

1. Open a terminal and navigate to the project directory:
   ```
   cd ~/debater
   ```

2. Install the project dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Once the development server starts, it will display a local URL (usually http://localhost:5173). Open this URL in your web browser to view the application.

## Game Mechanics

1. **Topic Selection**: Choose from pre-defined categories or create a custom topic
2. **Opponent Selection**: Pick an AI personality to debate against
3. **Difficulty Setting**: Adjust the debate difficulty using the slider
4. **Debate Flow**:
   - Take turns presenting arguments
   - Respond to opponent's points
   - Provide evidence and reasoning
   - Conclude with final statements
5. **Scoring**: Performance is evaluated based on:
   - Argument coherence
   - Response relevance
   - Overall debate structure
   - Difficulty level

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode
- `npm run build`: Builds the app for production to the `dist` folder
- `npm run preview`: Locally preview the production build
- `npm test`: Runs the test suite using Jest

## Project Structure

- `src/`: Contains the source code for the application
  - `api/`: API-related code (e.g., openRouterApi.ts)
  - `components/`: React components (e.g., DebateGame.tsx, DifficultySlider.tsx)
  - `data/`: Data files (e.g., debateQuestions.json, aiPersonalities.ts)
  - `utils/`: Utility functions
- `assets/`: SVG images for AI avatars
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

## Additional Resources

- Vite: [Documentation](https://vitejs.dev/)
- React: [Documentation](https://reactjs.org/docs/getting-started.html)
- TypeScript: [Documentation](https://www.typescriptlang.org/docs/)
- Tailwind CSS: [Documentation](https://tailwindcss.com/docs)
- Jest: [Documentation](https://jestjs.io/docs/getting-started)
