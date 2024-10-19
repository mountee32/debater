# Debater Project

This project is a web application for an AI-powered debate game, built with Vite, React, TypeScript, and Tailwind CSS.

## Features

- AI-powered debate game (DebateGame component)
- Difficulty slider for adjusting game complexity
- Category selection for diverse debate topics
- Leaderboard to track top debaters
- AI personalities for varied opponent styles
- Compact leaderboard view

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

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run preview`: Locally preview the production build.
- `npm test`: Runs the test suite using Jest.

## Project Structure

- `src/`: Contains the source code for the application
  - `api/`: API-related code (e.g., openRouterApi.ts)
  - `components/`: React components (e.g., DebateGame.tsx, DifficultySlider.tsx)
  - `data/`: Data files (e.g., debateQuestions.json, aiPersonalities.ts)
  - `utils/`: Utility functions
- `public/`: Contains static assets that will be served directly
- `assets/`: SVG images for AI avatars
- `index.html`: The main HTML file
- `vite.config.ts`: Vite configuration file
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.app.json`, `tsconfig.test.json`: TypeScript configuration files
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `eslint.config.js`: ESLint configuration
- `jest.config.cjs`: Jest configuration for testing

## Testing

The project uses Jest for testing. You can find test files with the `.test.tsx` extension, such as `DebateGame.test.tsx`.

## Additional Information

For more detailed information about the technologies used:
- Vite: [Vite documentation](https://vitejs.dev/)
- React: [React documentation](https://reactjs.org/docs/getting-started.html)
- TypeScript: [TypeScript documentation](https://www.typescriptlang.org/docs/)
- Tailwind CSS: [Tailwind CSS documentation](https://tailwindcss.com/docs)
- Jest: [Jest documentation](https://jestjs.io/docs/getting-started)
