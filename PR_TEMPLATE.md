# 🎮 Add Complete Web Pac-Man Game

This PR introduces a fully functional web version of the classic Pac-Man game with modern features and responsive design.

## 🚀 Features Added

### Core Gameplay
- **Pac-Man Character**: Animated yellow character with opening/closing mouth
- **4 Ghost Enemies**: Red, Pink, Cyan, and Orange ghosts with chase AI
- **Classic Maze**: Traditional Pac-Man style maze layout
- **Pellet Collection**: Small dots (10 points) and power pellets (50 points)
- **Power Mode**: Ghosts become vulnerable when power pellets are eaten

### Game Mechanics
- **Arrow Key Controls**: Smooth movement with direction queuing
- **Screen Wrapping**: Horizontal tunnel functionality
- **Collision Detection**: Pac-Man vs ghosts and pellet collection
- **Lives System**: 3 lives, lose one when caught by ghost
- **Scoring System**: 10/50/200 points for pellets/power pellets/ghosts
- **Level Progression**: Advance when all pellets collected

### UI/UX Features
- **Modern Design**: Dark gradient background with neon borders
- **Responsive Layout**: Works on desktop and mobile devices
- **Game Info Display**: Real-time score, lives, and level counters
- **Win Screen**: Celebration screen with next level/restart options
- **Game Over Screen**: Final score display with restart option

### Technical Implementation
- **HTML5 Canvas**: Smooth 2D graphics rendering
- **Game Loop**: Consistent ~10 FPS for classic arcade feel
- **State Management**: Proper game state handling
- **Ghost AI**: Simple pathfinding and behavior modes

## 🐛 Bug Fixes
- Fixed automatic level progression bug
- Proper win condition handling
- Correct game state management

## 📁 Files Added
- `index.html` - Main game page with canvas and UI
- `style.css` - Modern responsive styling
- `script.js` - Complete game logic and rendering

## 🎯 How to Play
1. Open `index.html` in any modern web browser
2. Use arrow keys to move Pac-Man
3. Collect all pellets while avoiding ghosts
4. Eat power pellets to make ghosts vulnerable
5. Complete levels to increase difficulty

## 📸 Screenshots
The game features:
- Classic Pac-Man maze layout with blue walls
- Yellow Pac-Man with animated mouth
- Colorful ghosts (Red, Pink, Cyan, Orange)
- Modern UI with score, lives, and level display
- Celebration screen when level is completed

## ✅ Testing
- [x] Pac-Man movement in all directions
- [x] Ghost AI and collision detection
- [x] Pellet collection and scoring
- [x] Power pellet functionality
- [x] Level completion and progression
- [x] Game over conditions
- [x] Responsive design on different screen sizes

The game is fully functional and ready to play immediately!