/* Pac‑Man (Web) — HTML5 Canvas implementation */

(function () {
  const TILE_SIZE = 22;
  const GRID_WIDTH = 28;
  const GRID_HEIGHT = 31;
  const CANVAS_PADDING = 0;

  const PACMAN_SPEED_TILES_PER_SEC = 6.2;
  const GHOST_SPEED_TILES_PER_SEC = 5.7;
  const FRIGHTENED_SPEED_TILES_PER_SEC = 3.6;

  const FRIGHTENED_DURATION_MS = 6000;

  const PELLET_SCORE = 10;
  const POWER_PELLET_SCORE = 50;
  const GHOST_EAT_SCORE = 200;

  const COLOR_WALL = "#0033cc";
  const COLOR_PELLET = "#ffe6a7";
  const COLOR_POWER = "#ffd166";
  const COLOR_PACMAN = "#ffeb00";
  const COLOR_GHOSTS = ["#ff3b30", "#ff2d55", "#5ac8fa", "#34c759"]; // red, pink, blue, green

  const KEY_TO_DIR = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyW: { x: 0, y: -1 },
    KeyS: { x: 0, y: 1 },
    KeyA: { x: -1, y: 0 },
    KeyD: { x: 1, y: 0 },
  };

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const hudScore = document.getElementById("score");
  const hudLives = document.getElementById("lives");
  const hudLevel = document.getElementById("level");
  const overlay = document.getElementById("overlay");

  canvas.width = GRID_WIDTH * TILE_SIZE + CANVAS_PADDING * 2;
  canvas.height = GRID_HEIGHT * TILE_SIZE + CANVAS_PADDING * 2;

  function now() {
    return performance.now();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function tileToPixels(tile) {
    return tile * TILE_SIZE + TILE_SIZE / 2;
  }

  function pixelsToTileCenterCoord(pixels) {
    return Math.floor(pixels / TILE_SIZE);
  }

  function positionsAreClose(ax, ay, bx, by, tolerance = 0.5) {
    return Math.abs(ax - bx) <= tolerance && Math.abs(ay - by) <= tolerance;
  }

  function directionEquals(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  const oppositeDirection = (dir) => (dir ? { x: -dir.x, y: -dir.y } : null);

  class Input {
    constructor() {
      this.queuedDirection = null;
      window.addEventListener("keydown", (e) => {
        if (KEY_TO_DIR[e.code]) {
          e.preventDefault();
          this.queuedDirection = KEY_TO_DIR[e.code];
        }
      });
    }

    consumeDirection() {
      const dir = this.queuedDirection;
      this.queuedDirection = null;
      return dir;
    }

    peekDirection() {
      return this.queuedDirection;
    }
  }

  class Grid {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.walls = this.#generateWalls();
      this.pellets = this.#generatePellets();
      this.powerPellets = this.#generatePowerPellets();
      this.totalPelletCount = this.pellets.size + this.powerPellets.size;
    }

    key(x, y) {
      return `${x},${y}`;
    }

    #generateWalls() {
      const set = new Set();

      const isTunnelRow = Math.floor(this.height / 2);

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const isBorder = x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
          if (isBorder) {
            const isTunnel = (y === isTunnelRow && (x === 0 || x === this.width - 1));
            if (!isTunnel) set.add(this.key(x, y));
          }
        }
      }

      const addRect = (x, y, w, h) => {
        for (let yy = y; yy < y + h; yy++) {
          for (let xx = x; xx < x + w; xx++) {
            set.add(this.key(xx, yy));
          }
        }
      };

      const mirrorRect = (x, y, w, h) => {
        addRect(x, y, w, h);
        const mx = this.width - (x + w);
        addRect(mx, y, w, h);
      };

      mirrorRect(2, 2, 4, 2);
      mirrorRect(2, 6, 4, 2);
      mirrorRect(2, 10, 4, 2);
      mirrorRect(2, 14, 4, 2);
      mirrorRect(2, 18, 4, 2);
      mirrorRect(2, 22, 4, 2);

      mirrorRect(8, 4, 3, 2);
      mirrorRect(8, 8, 3, 2);
      mirrorRect(8, 12, 3, 2);
      mirrorRect(8, 16, 3, 2);
      mirrorRect(8, 20, 3, 2);

      addRect(12, 6, 4, 2);
      addRect(12, 10, 4, 2);
      addRect(12, 14, 4, 2);
      addRect(12, 18, 4, 2);

      const houseX = Math.floor(this.width / 2) - 3;
      const houseY = Math.floor(this.height / 2) - 2;
      addRect(houseX, houseY, 6, 4);
      for (let i = 0; i < 2; i++) set.delete(this.key(houseX + 2 + i, houseY));

      const doorX = houseX + 2;
      const doorY = houseY - 1;
      set.add(this.key(doorX, doorY));
      set.add(this.key(doorX + 1, doorY));

      return set;
    }

    #generatePellets() {
      const pellets = new Set();
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if (!this.isWall(x, y) && !this.#isInsideGhostHouse(x, y)) {
            pellets.add(this.key(x, y));
          }
        }
      }
      return pellets;
    }

    #generatePowerPellets() {
      const power = new Set();
      const candidates = [
        [1, 1],
        [this.width - 2, 1],
        [1, this.height - 2],
        [this.width - 2, this.height - 2],
      ];
      for (const [x, y] of candidates) {
        if (!this.isWall(x, y)) power.add(this.key(x, y));
      }
      return power;
    }

    #isInsideGhostHouse(x, y) {
      const hx = Math.floor(this.width / 2) - 3;
      const hy = Math.floor(this.height / 2) - 2;
      return x >= hx && x < hx + 6 && y >= hy && y < hy + 4;
    }

    isWall(x, y) {
      return this.walls.has(this.key(x, y));
    }

    hasPellet(x, y) {
      return this.pellets.has(this.key(x, y));
    }

    hasPowerPellet(x, y) {
      return this.powerPellets.has(this.key(x, y));
    }

    eatAt(x, y) {
      const k = this.key(x, y);
      if (this.pellets.delete(k)) return "pellet";
      if (this.powerPellets.delete(k)) return "power";
      return null;
    }

    pelletsRemaining() {
      return this.pellets.size + this.powerPellets.size;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(CANVAS_PADDING, CANVAS_PADDING);

      ctx.fillStyle = "#000814";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = COLOR_WALL;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.isWall(x, y)) {
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;
            ctx.fillStyle = "#00194d";
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "#0a3dff";
            ctx.strokeRect(px + 1.5, py + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
          }
        }
      }

      for (const key of this.pellets) {
        const [xStr, yStr] = key.split(",");
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;
        ctx.fillStyle = COLOR_PELLET;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const key of this.powerPellets) {
        const [xStr, yStr] = key.split(",");
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;
        ctx.fillStyle = COLOR_POWER;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  class Entity {
    constructor(x, y, speedTilesPerSec) {
      this.x = x;
      this.y = y;
      this.speedTilesPerSec = speedTilesPerSec;
      this.direction = { x: 0, y: 0 };
      this.nextDirection = null;
    }

    setDirection(dir) {
      this.nextDirection = dir;
    }

    tryApplyNextDirection(grid) {
      if (!this.nextDirection) return;
      if (this.canMoveInDirection(grid, this.nextDirection)) {
        this.direction = this.nextDirection;
        this.nextDirection = null;
      }
    }

    canMoveInDirection(grid, dir) {
      const nextX = this.x + dir.x * 0.5;
      const nextY = this.y + dir.y * 0.5;
      return !this.#collidesWithWall(grid, nextX, nextY, dir);
    }

    #collidesWithWall(grid, nextX, nextY, dir) {
      const centerX = tileToPixels(nextX);
      const centerY = tileToPixels(nextY);

      const tileX = pixelsToTileCenterCoord(centerX);
      const tileY = pixelsToTileCenterCoord(centerY);

      if (tileY === Math.floor(GRID_HEIGHT / 2) && (tileX < 0 || tileX >= GRID_WIDTH)) {
        return false;
      }

      const targetTileX = Math.round(nextX + dir.x * 0.5);
      const targetTileY = Math.round(nextY + dir.y * 0.5);

      if (targetTileX < 0 || targetTileX >= GRID_WIDTH || targetTileY < 0 || targetTileY >= GRID_HEIGHT) {
        return true;
      }

      return grid.isWall(targetTileX, targetTileY);
    }

    update(grid, dtSeconds) {
      const speedTilesPerSecond = this.speedTilesPerSec;
      const move = speedTilesPerSecond * dtSeconds;
      this.tryApplyNextDirection(grid);

      const newX = this.x + this.direction.x * move;
      const newY = this.y + this.direction.y * move;

      const portalRow = Math.floor(GRID_HEIGHT / 2);
      if (this.y >= portalRow - 0.25 && this.y <= portalRow + 0.25) {
        if (newX < -0.5) {
          this.x = GRID_WIDTH - 0.5;
          this.y = portalRow;
          return;
        } else if (newX > GRID_WIDTH - 0.5) {
          this.x = -0.5;
          this.y = portalRow;
          return;
        }
      }

      if (!this.#collidesWithWall(grid, newX, newY, this.direction)) {
        this.x = newX;
        this.y = newY;
      } else {
        const targetTileX = Math.round(this.x + this.direction.x * 0.5);
        const targetTileY = Math.round(this.y + this.direction.y * 0.5);
        const tileCenterX = targetTileX + 0.5 - 0.5;
        const tileCenterY = targetTileY + 0.5 - 0.5;
        if (this.direction.x !== 0) this.y = clamp(this.y, tileCenterY - 0.49, tileCenterY + 0.49);
        if (this.direction.y !== 0) this.x = clamp(this.x, tileCenterX - 0.49, tileCenterX + 0.49);
      }
    }
  }

  class Pacman extends Entity {
    constructor(x, y) {
      super(x, y, PACMAN_SPEED_TILES_PER_SEC);
      this.mouthAngle = 0;
      this.mouthOpening = true;
    }

    draw(ctx) {
      const px = this.x * TILE_SIZE + TILE_SIZE / 2;
      const py = this.y * TILE_SIZE + TILE_SIZE / 2;
      const radius = TILE_SIZE * 0.45;

      const speed = 8;
      const t = (Math.sin(now() / 100 * speed) + 1) / 2;
      const maxOpen = Math.PI / 4;
      this.mouthAngle = maxOpen * t;

      let angleOffset = 0;
      if (this.direction.x === 1) angleOffset = 0;
      else if (this.direction.x === -1) angleOffset = Math.PI;
      else if (this.direction.y === -1) angleOffset = -Math.PI / 2;
      else if (this.direction.y === 1) angleOffset = Math.PI / 2;

      ctx.fillStyle = COLOR_PACMAN;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, radius, this.mouthAngle + angleOffset, (Math.PI * 2) - this.mouthAngle + angleOffset);
      ctx.closePath();
      ctx.fill();
    }
  }

  const GhostState = {
    Chase: "chase",
    Frightened: "frightened",
    Eaten: "eaten",
  };

  class Ghost extends Entity {
    constructor(x, y, color, id) {
      super(x, y, GHOST_SPEED_TILES_PER_SEC);
      this.color = color;
      this.id = id;
      this.state = GhostState.Chase;
      this.frightenedUntil = 0;
      this.homeX = x;
      this.homeY = y;
      this.scatterTarget = this.#computeScatterTarget();
    }

    #computeScatterTarget() {
      const corners = [
        [1, 1],
        [GRID_WIDTH - 2, 1],
        [1, GRID_HEIGHT - 2],
        [GRID_WIDTH - 2, GRID_HEIGHT - 2],
      ];
      return { x: corners[this.id % corners.length][0], y: corners[this.id % corners.length][1] };
    }

    setFrightened() {
      this.state = GhostState.Frightened;
      this.frightenedUntil = now() + FRIGHTENED_DURATION_MS;
    }

    updateStateTimers() {
      if (this.state === GhostState.Frightened && now() > this.frightenedUntil) {
        this.state = GhostState.Chase;
        this.speedTilesPerSec = GHOST_SPEED_TILES_PER_SEC;
      }
    }

    chooseDirection(grid, pacman) {
      if (this.state === GhostState.Frightened) {
        this.speedTilesPerSec = FRIGHTENED_SPEED_TILES_PER_SEC;
        return this.#randomDirection(grid);
      }

      if (this.state === GhostState.Eaten) {
        const target = { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
        return this.#bestDirectionTowards(grid, target);
      }

      if (this.id === 0) {
        return this.#bestDirectionTowards(grid, pacman);
      }

      if (this.id === 1) {
        const ahead = {
          x: Math.round(pacman.x + pacman.direction.x * 3),
          y: Math.round(pacman.y + pacman.direction.y * 3),
        };
        return this.#bestDirectionTowards(grid, ahead);
      }

      if (this.id === 2) {
        return this.#bestDirectionTowards(grid, this.scatterTarget);
      }

      const target = Math.random() < 0.5 ? pacman : this.scatterTarget;
      return this.#bestDirectionTowards(grid, target);
    }

    #validDirections(grid) {
      const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      const result = [];
      for (const d of dirs) {
        if (directionEquals(d, oppositeDirection(this.direction))) continue;
        if (this.canMoveInDirection(grid, d)) result.push(d);
      }
      return result;
    }

    #randomDirection(grid) {
      const options = this.#validDirections(grid);
      if (options.length === 0) return oppositeDirection(this.direction) || { x: 0, y: 0 };
      return options[Math.floor(Math.random() * options.length)];
    }

    #bestDirectionTowards(grid, target) {
      const options = this.#validDirections(grid);
      if (options.length === 0) return oppositeDirection(this.direction) || { x: 0, y: 0 };
      let best = options[0];
      let bestDist = Infinity;
      for (const d of options) {
        const nx = this.x + d.x;
        const ny = this.y + d.y;
        const dist = Math.hypot(target.x - nx, target.y - ny);
        if (dist < bestDist) {
          bestDist = dist;
          best = d;
        }
      }
      return best;
    }

    draw(ctx) {
      const px = this.x * TILE_SIZE + TILE_SIZE / 2;
      const py = this.y * TILE_SIZE + TILE_SIZE / 2;
      const w = TILE_SIZE * 0.9;
      const h = TILE_SIZE * 0.9;
      const r = w / 2;

      let bodyColor = this.color;
      if (this.state === GhostState.Frightened) bodyColor = "#2b6cff";
      if (this.state === GhostState.Eaten) bodyColor = "#8e8e93";

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(px - r, py + r * 0.8);
      ctx.quadraticCurveTo(px - r, py - r, px, py - r);
      ctx.quadraticCurveTo(px + r, py - r, px + r, py + r * 0.8);
      for (let i = 0; i < 4; i++) {
        const spikeX = px + r - (i * (w / 3));
        const spikeY = py + r * 0.8;
        const nextX = px + r - ((i + 1) * (w / 3));
        const nextY = py + r * 0.8;
        const midX = (spikeX + nextX) / 2;
        const midY = spikeY + (i % 2 === 0 ? r * 0.3 : 0);
        ctx.quadraticCurveTo(midX, midY, nextX, nextY);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fff";
      const eyeOffsetX = this.direction.x * 2;
      const eyeOffsetY = this.direction.y * 2;
      for (const sign of [-1, 1]) {
        const ex = px + sign * 6 + eyeOffsetX;
        const ey = py - 2 + eyeOffsetY;
        ctx.beginPath();
        ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(ex + eyeOffsetX * 0.8, ey + eyeOffsetY * 0.8, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
      }
    }
  }

  class Game {
    constructor() {
      this.grid = new Grid(GRID_WIDTH, GRID_HEIGHT);
      this.input = new Input();
      this.resetEntities();
      this.score = 0;
      this.level = 1;
      this.lives = 3;
      this.lastTime = now();
      this.running = true;
      this.message = "Ready!";
      this.messageUntil = now() + 1200;
    }

    resetEntities() {
      this.pacman = new Pacman(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT * 0.75));
      this.pacman.direction = { x: -1, y: 0 };

      this.ghosts = [
        new Ghost(Math.floor(GRID_WIDTH / 2) - 3, Math.floor(GRID_HEIGHT / 2) - 1, COLOR_GHOSTS[0], 0),
        new Ghost(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2) - 1, COLOR_GHOSTS[1], 1),
        new Ghost(Math.floor(GRID_WIDTH / 2) + 3, Math.floor(GRID_HEIGHT / 2) - 1, COLOR_GHOSTS[2], 2),
        new Ghost(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2) + 1, COLOR_GHOSTS[3], 3),
      ];
      for (const g of this.ghosts) g.direction = { x: 1, y: 0 };
    }

    restartLevel() {
      this.resetEntities();
      this.grid = new Grid(GRID_WIDTH, GRID_HEIGHT);
      this.updateHud();
      this.message = "Ready!";
      this.messageUntil = now() + 1000;
    }

    nextLevel() {
      this.level += 1;
      this.grid = new Grid(GRID_WIDTH, GRID_HEIGHT);
      this.resetEntities();
      this.pacman.speedTilesPerSec += 0.3;
      for (const g of this.ghosts) g.speedTilesPerSec += 0.25;
      this.updateHud();
      this.message = `Level ${this.level}`;
      this.messageUntil = now() + 1200;
    }

    updateHud() {
      hudScore.textContent = String(this.score);
      hudLives.textContent = String(this.lives);
      hudLevel.textContent = String(this.level);
    }

    handleInput() {
      const dir = this.input.peekDirection();
      if (dir) this.pacman.setDirection(dir);
    }

    update(dt) {
      if (!this.running) return;

      this.handleInput();
      this.pacman.update(this.grid, dt);

      for (const g of this.ghosts) {
        g.updateStateTimers();
        const desired = g.chooseDirection(this.grid, this.pacman);
        g.setDirection(desired);
        g.update(this.grid, dt);
      }

      const pacTileX = Math.round(this.pacman.x);
      const pacTileY = Math.round(this.pacman.y);
      const ate = this.grid.eatAt(pacTileX, pacTileY);
      if (ate === "pellet") this.addScore(PELLET_SCORE);
      if (ate === "power") {
        this.addScore(POWER_PELLET_SCORE);
        for (const g of this.ghosts) g.setFrightened();
      }

      for (const g of this.ghosts) {
        if (positionsAreClose(this.pacman.x, this.pacman.y, g.x, g.y, 0.5)) {
          if (g.state === GhostState.Frightened) {
            g.state = GhostState.Eaten;
            g.speedTilesPerSec = GHOST_SPEED_TILES_PER_SEC + 1.0;
            this.addScore(GHOST_EAT_SCORE);
          } else if (g.state !== GhostState.Eaten) {
            this.loseLife();
            return;
          }
        }
      }

      if (this.grid.pelletsRemaining() === 0) {
        this.nextLevel();
      }

      if (now() < this.messageUntil) {
        overlay.classList.remove("hidden");
        overlay.textContent = this.message;
      } else {
        overlay.classList.add("hidden");
      }
    }

    addScore(amount) {
      this.score += amount;
      this.updateHud();
    }

    loseLife() {
      this.lives -= 1;
      this.updateHud();
      if (this.lives <= 0) {
        this.running = false;
        overlay.classList.remove("hidden");
        overlay.textContent = "Game Over — Press R to Restart";
        return;
      }
      this.message = "Ouch!";
      this.messageUntil = now() + 800;
      this.resetEntities();
    }

    draw() {
      this.grid.draw(ctx);
      for (const g of this.ghosts) g.draw(ctx);
      this.pacman.draw(ctx);
    }
  }

  const game = new Game();

  function frame() {
    const t = now();
    const dt = Math.min(32, t - game.lastTime) / 1000;
    game.lastTime = t;

    game.update(dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw();

    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyR") {
      game.score = 0;
      game.level = 1;
      game.lives = 3;
      game.running = true;
      game.restartLevel();
    }
    if (e.code === "KeyN") {
      game.nextLevel();
    }
  });

  game.updateHud();
  requestAnimationFrame(frame);
})();