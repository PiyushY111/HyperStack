# Quick Setup Guide

## 🚀 Fast Track Setup (Recommended)

### Step 1: Install MongoDB
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Step 2: Install Server Dependencies
```bash
cd server
npm install
cd ..
```

### Step 3: Start Everything
```bash
# Option 1: Using the start script
./start.sh

# Option 2: Manual start
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
python3 -m http.server 8000
# OR
npx http-server -p 8000
```

### Step 4: Access the Game
Open http://localhost:8000 in your browser

---

## 📝 What You Need to Know

### Default Ports
- Frontend: `http://localhost:8000`
- Backend API: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

### Environment Variables
Located in `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hyperstack
NODE_ENV=development
```

### Testing the Setup

1. **Check MongoDB:**
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongodb
   ```

2. **Check Backend API:**
   Visit http://localhost:5000/api/health
   Should return: `{"status":"ok","message":"HyperStack server is running",...}`

3. **Check Frontend:**
   Visit http://localhost:8000
   Should show the login screen

---

## 🔧 Common Issues

### MongoDB not starting
```bash
# macOS - Reinstall and restart
brew services stop mongodb-community
brew services start mongodb-community

# Check if running
ps aux | grep mongod
```

### Port 5000 already in use
Edit `server/.env` and change PORT to another number (e.g., 5001)
Then update `script.js` line with `API_URL` to match

### Port 8000 already in use
Use a different port when starting the frontend:
```bash
python3 -m http.server 3000
# or
npx http-server -p 3000
```

### CORS errors in browser console
Make sure:
1. Backend server is running on port 5000
2. `API_URL` in script.js is set to `http://localhost:5000/api`
3. CORS is enabled in server (it already is by default)

---

## 🎮 Game Features

### Authentication
- Username-based login (3-20 characters)
- Persistent sessions via localStorage
- User data stored in MongoDB

### Leaderboard
- Top 10 scores displayed
- Real-time updates
- Gold/Silver/Bronze medals for top 3
- Personal score highlighting

### API Endpoints Available

**Auth:**
- `POST /api/auth/login` - Create/login user
- `GET /api/auth/check/:username` - Check username

**Leaderboard:**
- `POST /api/leaderboard/save` - Save score
- `GET /api/leaderboard/top/10` - Get top 10
- `GET /api/leaderboard/user/:username` - User scores
- `GET /api/leaderboard/rank/:username` - User rank

---

## 📦 Project Structure

```
HyperStack/
├── server/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Score.js             # Score schema
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   └── leaderboard.js       # Leaderboard endpoints
│   ├── .env                     # Environment config
│   ├── server.js                # Express server
│   └── package.json             # Dependencies
├── index.html                   # Game UI
├── script.js                    # Game logic + API calls
├── styles.css                   # Styling
├── start.sh                     # Quick start script
└── README.md                    # Full documentation
```

---

## 💡 Development Tips

### Backend Development
```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
Just refresh the browser after making changes to:
- `index.html`
- `script.js`
- `styles.css`

### Database Management

**View all users:**
```bash
mongosh hyperstack
db.users.find()
```

**View all scores:**
```bash
mongosh hyperstack
db.scores.find().sort({score: -1}).limit(10)
```

**Clear all data:**
```bash
mongosh hyperstack
db.users.deleteMany({})
db.scores.deleteMany({})
```

---

## ✅ Verification Checklist

- [ ] MongoDB is installed and running
- [ ] Server dependencies installed (`cd server && npm install`)
- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:8000
- [ ] Can create a username and login
- [ ] Can play the game
- [ ] Can save scores
- [ ] Leaderboard displays correctly

---

Need help? Check the full [README.md](README.md) for detailed documentation.
