#!/bin/bash

# Start the JSON server for logging in the background
json-server --watch db.json --port 3001 --static ./public &

# Start the development server
npm run dev
