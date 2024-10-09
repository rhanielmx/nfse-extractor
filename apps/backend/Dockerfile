# Use the official Node.js LTS version as the base image
FROM node:lts-alpine

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Set the working directory inside the container
WORKDIR /app

# Set Python path for node-gyp
ENV python=/usr/bin/python3

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install dependencies including Poppler
RUN apk add --no-cache poppler-utils poppler-dev

# Install Python libraries
RUN pip3 install boto3==1.35.30 pdf2image==1.17.0 --break-system-packages

# Copy the rest of your application code
COPY . .

RUN npx prisma generate
#RUN npx prisma migrate dev

# Expose the port on which your Fastify app will run
EXPOSE 3333

ENV HOST=0.0.0.0 PORT=3333

# Command to run your Fastify app
CMD ["npm", "run", "dev"]