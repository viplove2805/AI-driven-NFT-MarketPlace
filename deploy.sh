#!/bin/bash

echo "🚀 Starting AstraNode Art Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build and start the containers
echo "📦 Building and starting containers..."
docker compose up --build -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize..."
MAX_RETRIES=10
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:3001/api/health | grep "ok" > /dev/null; then
    echo "✅ Backend is UP!"
    break
  fi
  echo "..."
  sleep 2
  COUNT=$((COUNT + 1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "⚠️ Warning: Backend health check timed out. Checking logs..."
  docker logs astranode-art-backend-1 | tail -n 20
fi

echo ""
echo "🎉 AstraNode Art is now running!"
echo "--------------------------------------"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "--------------------------------------"
echo "Treasury: $(grep TREASURY_ADDRESS frontend/src/constants/config.ts | cut -d'"' -f2)"
echo "--------------------------------------"

# Optional: Start ngrok if available
if command -v ngrok &> /dev/null; then
  echo "🌐 Starting ngrok tunnel for frontend..."
  ngrok http 3000 --log=stdout > /dev/null &
  sleep 3
  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app')
  echo "🌍 Public URL: $NGROK_URL"
fi
