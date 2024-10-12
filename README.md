# Debater Project

This project appears to be a web application built with Vite, TypeScript, and Tailwind CSS.

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

## Project Structure

- `src/`: Contains the source code for the application
- `public/`: Contains static assets that will be served directly
- `index.html`: The main HTML file
- `vite.config.ts`: Vite configuration file
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.app.json`: TypeScript configuration files
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `eslint.config.js`: ESLint configuration

## Additional Information

For more detailed information about using Vite, refer to the [Vite documentation](https://vitejs.dev/).
For TypeScript, see the [TypeScript documentation](https://www.typescriptlang.org/docs/).
For Tailwind CSS, check out the [Tailwind CSS documentation](https://tailwindcss.com/docs).
