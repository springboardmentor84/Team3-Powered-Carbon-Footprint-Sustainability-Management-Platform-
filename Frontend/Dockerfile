# Stage 1: Build Angular app
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
RUN npm install

# Build arguments for Railway / Docker production build
ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ARG PROD_API_BASE_URL
ENV PROD_API_BASE_URL=$PROD_API_BASE_URL

# Copy source and build for production
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built Angular files
COPY --from=build /app/dist/eco-track-app/browser /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
