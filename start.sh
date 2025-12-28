#!/bin/bash

echo "🚀 Starting HyperStack Development Environment..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running!"
    echo "Starting MongoDB..."
    brew services start mongodb-community 2>/dev/null || sudo systemctl start mongodb 2>/dev/null
    sleep 2
fi

# Start the backend server
echo "📦 Starting Backend Server..."
cd server
npm install 2>/dev/null
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 3

# Start the frontend
echo "🎮 Starting Frontend..."
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
elif command -v http-server &> /dev/null; then
    http-server -p 8000 &
    FRONTEND_PID=$!
else
    echo "⚠️  Please install http-server: npm install -g http-server"
    echo "Or use Python 3"
    kill $SERVER_PID
    exit 1
fi

echo ""
echo "✅ HyperStack is running!"
echo ""
echo "🌐 Frontend: http://localhost:8000"
echo "🔌 Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "kill $SERVER_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
