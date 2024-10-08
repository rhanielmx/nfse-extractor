# Use a lightweight Node.js image
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# Expose the port on which your app runs
EXPOSE 5173

# Command to run your app
CMD ["npm", "run", "dev"]