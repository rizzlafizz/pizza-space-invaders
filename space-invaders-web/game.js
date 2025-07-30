const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// === Load Images === //
const playerImage = new Image();
playerImage.src = 'images/player.png';

const enemyImage = new Image();
enemyImage.src = 'images/enemy.png';

const bossImage = new Image();
bossImage.src = 'images/boss.png';

let imagesLoadedCount = 0;
const totalImages = 3;

function imageLoaded() {
  imagesLoadedCount++;
  if (imagesLoadedCount === totalImages) {
    startGame();
  }
}

playerImage.onload = imageLoaded;
enemyImage.onload = imageLoaded;
bossImage.onload = imageLoaded;

// === Load Sounds === //
const bgMusic = new Audio('sounds/1.mp3');
const laserSound = new Audio('sounds/2.mp3');
const explosionSound = new Audio('sounds/3.mp3');

// === Player Setup === //
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 40,
  height: 0,  // will calculate dynamically
  speed: 7,
  movingLeft: false,
  movingRight: false,
  bullets: []
};

// === Controls === //
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') player.movingLeft = true;
  if (e.key === 'ArrowRight' || e.key === 'd') player.movingRight = true;
  if (e.key === ' ' || e.key === 'Spacebar') shootBullet();
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') player.movingLeft = false;
  if (e.key === 'ArrowRight' || e.key === 'd') player.movingRight = false;
});

// === Bullet Setup === //
const bulletSpeed = 10;
const bulletWidth = 4;
const bulletHeight = 10;

function shootBullet() {
  player.bullets.push({
    x: player.x + player.width / 2 - bulletWidth / 2,
    y: player.y,
    width: bulletWidth,
    height: bulletHeight,
    speed: bulletSpeed
  });
  laserSound.currentTime = 0;
  laserSound.play();
}

// === Enemy Setup === //
let enemies = [];
let waveNumber = 1;

function createEnemyWave() {
  enemies = [];
  const count = 5 + waveNumber * 2;
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 40),  // random x within canvas minus enemy width
      y: -30 - Math.random() * 100,             // start above screen
      width: 40,
      height: 0, // will calculate dynamically
      alive: true,
      speedX: (Math.random() - 0.5) * 0.5,      // small horizontal sway
      speedY: 1 + waveNumber * 0.3              // speed increases with wave
    });
  }
  waveNumber++;
}

function allEnemiesDestroyed() {
  return enemies.every(e => !e.alive);
}

function updateEnemies() {
  if (allEnemiesDestroyed()) {
    createEnemyWave();
  }

  enemies.forEach(enemy => {
    if (enemy.alive) {
      enemy.x += enemy.speedX;
      enemy.y += enemy.speedY;

      if (enemy.x <= 0) {
        enemy.x = 0;
        enemy.speedX *= -1;
      }
      if (enemy.x + enemy.width >= canvas.width) {
        enemy.x = canvas.width - enemy.width;
        enemy.speedX *= -1;
      }

      if (enemy.y > canvas.height + enemy.height) {
        enemy.alive = false;
      }
    }
  });
}

// === Boss Setup === //
let boss = {
  x: canvas.width / 2 - 50,
  y: 10,
  width: 100,
  height: 0,  // will calculate dynamically
  speedX: 3,
  visible: false,
  health: 5
};

let bossCooldown = 0;
const bossCooldownMax = 1200;

function updateBoss() {
  if (!boss.visible) {
    bossCooldown++;
    if (bossCooldown >= bossCooldownMax) {
      boss.visible = true;
      boss.x = 0;
      boss.health = 5;
      bossCooldown = 0;
      boss.speedX = 3;
    }
  } else {
    boss.x += boss.speedX;

    if (boss.x <= 0) {
      boss.x = 0;
      boss.speedX *= -1;
    }
    if (boss.x + boss.width >= canvas.width) {
      boss.x = canvas.width - boss.width;
      boss.speedX *= -1;
    }
  }
}

// === Drawing with aspect ratio preservation === //

function drawEnemy(enemy) {
  if (enemyImage.complete) {
    if (enemy.height === 0) {
      // calculate height based on aspect ratio
      const scale = enemy.width / enemyImage.naturalWidth;
      enemy.height = enemyImage.naturalHeight * scale;
    }
    ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
  } else {
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height || 30);
  }
}

function drawEnemies() {
  enemies.forEach(enemy => {
    if (enemy.alive) {
      drawEnemy(enemy);
    }
  });
}

function drawPlayer() {
  if (playerImage.complete) {
    if (player.height === 0) {
      const scale = player.width / playerImage.naturalWidth;
      player.height = playerImage.naturalHeight * scale;
    }
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = 'lime';
    ctx.fillRect(player.x, player.y, player.width, player.height || 20);
  }

  ctx.fillStyle = 'yellow';
  player.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawBoss() {
  if (boss.visible) {
    if (bossImage.complete) {
      if (boss.height === 0) {
        const scale = boss.width / bossImage.naturalWidth;
        boss.height = bossImage.naturalHeight * scale;
      }
      ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
    } else {
      ctx.fillStyle = 'purple';
      ctx.fillRect(boss.x, boss.y, boss.width, boss.height || 60);
    }
    // Health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
    ctx.fillStyle = 'green';
    ctx.fillRect(boss.x, boss.y - 10, boss.width * (boss.health / 5), 5);
  }
}

// === Player Update === //
function updatePlayer() {
  if (player.movingLeft && player.x > 0) player.x -= player.speed;
  if (player.movingRight && player.x < canvas.width - player.width) player.x += player.speed;

  player.bullets = player.bullets.filter(bullet => bullet.y + bullet.height > 0);
  player.bullets.forEach(bullet => {
    bullet.y -= bullet.speed;
  });
}

// === Collision Detection === //
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function checkBulletCollisions() {
  player.bullets.forEach((bullet, bIndex) => {
    enemies.forEach(enemy => {
      if (enemy.alive && isColliding(bullet, enemy)) {
        enemy.alive = false;
        player.bullets.splice(bIndex, 1);
        explosionSound.currentTime = 0;
        explosionSound.play();
      }
    });

    if (boss.visible && isColliding(bullet, boss)) {
      boss.health--;
      player.bullets.splice(bIndex, 1);
      explosionSound.currentTime = 0;
      explosionSound.play();
      if (boss.health <= 0) {
        boss.visible = false;
      }
    }
  });
}

// === Main Game Loop === //
function update() {
  updatePlayer();
  updateEnemies();
  updateBoss();
  checkBulletCollisions();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawEnemies();
  drawBoss();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// === Start the game only after images are loaded === //
function startGame() {
  createEnemyWave();
  gameLoop();
}

// === Start background music on first user interaction === //
let bgMusicStarted = false;
function startBackgroundMusic() {
  if (!bgMusicStarted) {
    bgMusicStarted = true;
    bgMusic.loop = true;
    bgMusic.volume = 0.4;
    bgMusic.play();
  }
}
document.addEventListener('keydown', startBackgroundMusic, { once: true });
document.addEventListener('click', startBackgroundMusic, { once: true });









