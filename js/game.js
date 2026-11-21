// 3D Endless Cyber Runner - Core Game Engine
// Built with Three.js and Web Audio API

class EndlessRunnerGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas = document.getElementById('webgl-canvas');

        // Game States: 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.state = 'MENU';

        // Lane configuration (3 lanes)
        this.LANES = [-3.2, 0, 3.2];
        this.currentLane = 1; // 0: Left, 1: Center, 2: Right
        this.targetX = 0;
        this.playerX = 0;
        this.playerY = 0;
        this.playerZ = 0;

        // Physics & Movement
        this.baseSpeed = 22; // units per second
        this.speed = this.baseSpeed;
        this.maxSpeed = 55;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -44;
        this.jumpProgress = 0;
        this.jumpDuration = 0.72;
        this.jumpTime = 0;
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;

        this.isSliding = false;
        this.slideDuration = 0.75;
        this.slideTimer = 0;
        this.slideProgress = 0;

        // Player Hitbox
        this.playerWidth = 0.85;
        this.playerHeight = 2.1;

        // Game Stats
        this.distance = 0;
        this.coins = 0;
        this.runCoins = 0;
        this.score = 0;
        this.highScore = 0;
        this.baseMultiplier = 1;
        this.activeMultiplier = 1;

        // Power-ups state
        this.powerups = {
            magnet: { active: false, timer: 0, duration: 10, level: 1 },
            shield: { active: false, hitsRemaining: 0, duration: 0, level: 1 },
            multiplier: { active: false, timer: 0, duration: 10, level: 1 },
            boost: { active: false, timer: 0, duration: 6, level: 1 }
        };
        this.invulnerableTimer = 0;

        // Object Tracking & Pooling
        this.trackChunks = [];
        this.chunkLength = 60;
        this.totalChunks = 11;
        this.obstacles = [];
        this.coinsList = [];
        this.powerupItems = [];
        this.cityBuildings = [];
        this.particles = [];
        this.speedLines = [];

        // Player model & skins
        this.activeSkin = 'striker';
        this.player = null;
        this.runPhase = 0;

        // Timing
        this.clock = new THREE.Clock();
        this.lastFrameTime = 0;

        // Local Storage Data
        this.loadPlayerData();

        // Initialize Three.js scene
        this.initThree();
        this.initEnvironment();
        this.initPlayer();
        this.initTrack();
        this.initSpeedLines();
        this.initControls();
        this.initUI();

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    // --- Persistence (Local Storage) ---
    loadPlayerData() {
        try {
            const data = JSON.parse(localStorage.getItem('cyber_runner_save')) || {};
            this.coins = data.coins || 0;
            this.highScore = data.highScore || 0;
            this.activeSkin = data.activeSkin || 'striker';
            this.unlockedSkins = data.unlockedSkins || ['striker'];
            this.upgrades = data.upgrades || {
                magnet: 1,
                shield: 1,
                multiplier: 1,
                boost: 1
            };
        } catch (e) {
            this.coins = 0;
            this.highScore = 0;
            this.activeSkin = 'striker';
            this.unlockedSkins = ['striker'];
            this.upgrades = { magnet: 1, shield: 1, multiplier: 1, boost: 1 };
        }
        this.applyUpgrades();
    }

    savePlayerData() {
        try {
            const data = {
                coins: this.coins,
                highScore: this.highScore,
                activeSkin: this.activeSkin,
                unlockedSkins: this.unlockedSkins,
                upgrades: this.upgrades
            };
            localStorage.setItem('cyber_runner_save', JSON.stringify(data));
        } catch (e) {}
    }

    applyUpgrades() {
        this.powerups.magnet.duration = 8 + this.upgrades.magnet * 2.5;
        this.powerups.multiplier.duration = 8 + this.upgrades.multiplier * 2.5;
        this.powerups.boost.duration = 5 + this.upgrades.boost * 1.5;
    }

    // --- Three.js Setup ---
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060914);
        this.scene.fog = new THREE.FogExp2(0x060914, 0.007);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 800);
        this.camera.position.set(0, 4.2, 7.5);
        this.cameraTarget = new THREE.Vector3(0, 1.8, -10);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x334466, 0.9);
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
        this.dirLight.position.set(15, 30, 20);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 100;
        this.dirLight.shadow.camera.left = -20;
        this.dirLight.shadow.camera.right = 20;
        this.dirLight.shadow.camera.top = 20;
        this.dirLight.shadow.camera.bottom = -20;
        this.scene.add(this.dirLight);

        // Accent backlight
        const backLight = new THREE.DirectionalLight(0xff0077, 0.8);
        backLight.position.set(-15, 20, -30);
        this.scene.add(backLight);

        // Window resize handler
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }

    // --- Environment & Scenery ---
    initEnvironment() {
        // Distant Cyber Moon / Sun
        const sunGeo = new THREE.CircleGeometry(40, 32);
        const sunMat = new THREE.MeshBasicMaterial({
            color: 0xff0066,
            side: THREE.DoubleSide
        });
        this.sun = new THREE.Mesh(sunGeo, sunMat);
        this.sun.position.set(0, 30, -380);
        this.scene.add(this.sun);

        // Grid Horizon Plane
        const horizonGrid = new THREE.GridHelper(600, 60, 0xff0055, 0x112244);
        horizonGrid.position.set(0, -0.5, -200);
        this.scene.add(horizonGrid);

        // Starfield Particles
        const starGeo = new THREE.BufferGeometry();
        const starCount = 600;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 400;
            starPos[i + 1] = Math.random() * 120 + 5;
            starPos[i + 2] = -Math.random() * 400;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 1.5,
            transparent: true,
            opacity: 0.8
        });
        this.starfield = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starfield);

        // Skyline Buildings
        this.spawnCitySkyline();
    }

    spawnCitySkyline() {
        const colors = [0x00f0ff, 0xff0055, 0xa855f7, 0x38bdf8, 0xffaa00];
        for (let side of [-1, 1]) {
            for (let i = 0; i < 28; i++) {
                const height = 25 + Math.random() * 55;
                const width = 10 + Math.random() * 8;
                const depth = 10 + Math.random() * 12;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const building = window.modelBuilder.createCityBuilding(height, width, depth, color);
                
                const posX = side * (16 + Math.random() * 35);
                const posZ = -i * 18 + 20;
                building.position.set(posX, 0, posZ);
                this.scene.add(building);
                this.cityBuildings.push(building);
            }
        }
    }

    // --- Warp Speed Lines Effect ---
    initSpeedLines() {
        const lineCount = 60;
        const lineGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(lineCount * 6); // 2 vertices per line

        for (let i = 0; i < lineCount; i++) {
            const x = (Math.random() - 0.5) * 18;
            const y = Math.random() * 6 + 0.5;
            const z = -Math.random() * 60;
            positions[i * 6] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;

            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y;
            positions[i * 6 + 5] = z - 3.5;
        }
        lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.0
        });
        this.speedLineMesh = new THREE.LineSegments(lineGeo, lineMat);
        this.scene.add(this.speedLineMesh);
    }

    // --- Player Setup ---
    initPlayer() {
        if (this.player && this.player.group) {
            this.scene.remove(this.player.group);
        }
        this.player = window.modelBuilder.createPlayer(this.activeSkin);
        this.player.group.position.set(0, 0, 0);
        this.scene.add(this.player.group);
    }

    switchSkin(skinId) {
        if (this.unlockedSkins.includes(skinId)) {
            this.activeSkin = skinId;
            this.initPlayer();
            this.savePlayerData();
            this.updateShopUI();
            return true;
        }
        return false;
    }

    // --- Track Management ---
    initTrack() {
        // Clear previous track objects if any
        this.trackChunks.forEach(chunk => this.scene.remove(chunk));
        this.trackChunks = [];

        this.clearObstaclesAndCollectibles();

        // Spawn initial sequence of track chunks
        for (let i = 0; i < this.totalChunks; i++) {
            const chunk = window.modelBuilder.createTrackChunk(this.chunkLength);
            chunk.position.z = -i * this.chunkLength + 30;
            this.scene.add(chunk);
            this.trackChunks.push(chunk);

            // Populate obstacles and coins after the first safe chunks
            if (i >= 2) {
                this.populateChunk(chunk.position.z);
            }
        }
    }

    clearObstaclesAndCollectibles() {
        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];

        this.coinsList.forEach(c => this.scene.remove(c));
        this.coinsList = [];

        this.powerupItems.forEach(p => this.scene.remove(p));
        this.powerupItems = [];
    }

    // Populate a track chunk with obstacles, coins, and power-ups
    populateChunk(chunkZ) {
        const laneX = [-3.2, 0, 3.2];
        const patternType = Math.floor(Math.random() * 7);

        // Dynamic difficulty calculation based on distance
        const diffRatio = Math.min(1.0, this.distance / 2000);

        // Pattern 0: Clear Coin Runway
        if (patternType === 0) {
            const lane = laneX[Math.floor(Math.random() * 3)];
            for (let i = 0; i < 7; i++) {
                this.spawnCoin(lane, 1.1, chunkZ - 20 + i * 3.5);
            }
            if (Math.random() < 0.25) {
                this.spawnPowerup(chunkZ - 35);
            }
        }
        // Pattern 1: Low Hurdle with Coin Arc to Jump Over
        else if (patternType === 1) {
            const targetLane = Math.floor(Math.random() * 3);
            const obstacleZ = chunkZ - 15;

            // Obstacle in target lane
            this.spawnObstacle('low', laneX[targetLane], obstacleZ);

            // Coin arc over hurdle
            this.spawnCoinArc(laneX[targetLane], obstacleZ - 6, obstacleZ + 6);

            // Another lane might have a block
            if (diffRatio > 0.3) {
                const otherLane = (targetLane + 1) % 3;
                this.spawnObstacle('block', laneX[otherLane], obstacleZ);
            }
        }
        // Pattern 2: High Laser Gate to Slide Under
        else if (patternType === 2) {
            const targetLane = Math.floor(Math.random() * 3);
            const obstacleZ = chunkZ - 15;

            this.spawnObstacle('high', laneX[targetLane], obstacleZ);

            // Low coins on the floor to slide through
            for (let i = -1; i <= 2; i++) {
                this.spawnCoin(laneX[targetLane], 0.6, obstacleZ + i * 2.5);
            }

            // Fill one of other lanes with a low hurdle or block
            const otherLane = (targetLane + 2) % 3;
            this.spawnObstacle('low', laneX[otherLane], obstacleZ);
        }
        // Pattern 3: Ramp Launch over Cyber Blockades
        else if (patternType === 3) {
            const rampLane = Math.floor(Math.random() * 3);
            const rampZ = chunkZ - 8;

            this.spawnObstacle('ramp', laneX[rampLane], rampZ);

            // High air coins
            for (let i = 1; i <= 5; i++) {
                this.spawnCoin(laneX[rampLane], 2.8 + Math.sin((i / 5) * Math.PI) * 2.2, rampZ - i * 4);
            }

            // Blockade behind ramp that you fly over!
            this.spawnObstacle('block', laneX[rampLane], rampZ - 14);

            // Other lanes blocked
            laneX.forEach((lx, idx) => {
                if (idx !== rampLane && Math.random() > 0.4) {
                    this.spawnObstacle('block', lx, rampZ - 6);
                }
            });
        }
        // Pattern 4: Moving Patrol Drone
        else if (patternType === 4 && diffRatio > 0.2) {
            const droneZ = chunkZ - 18;
            this.spawnObstacle('drone', 0, droneZ);

            // Surrounding coins
            for (let i = -2; i <= 2; i++) {
                this.spawnCoin(-3.2, 1.1, droneZ + i * 3);
                this.spawnCoin(3.2, 1.1, droneZ + i * 3);
            }
        }
        // Pattern 5: Zig-Zag Lane Switch Sequence
        else if (patternType === 5) {
            this.spawnObstacle('block', laneX[0], chunkZ - 10);
            this.spawnObstacle('block', laneX[1], chunkZ - 24);
            this.spawnObstacle('block', laneX[2], chunkZ - 38);

            // Coins guiding path
            this.spawnCoin(laneX[1], 1.1, chunkZ - 10);
            this.spawnCoin(laneX[2], 1.1, chunkZ - 24);
            this.spawnCoin(laneX[0], 1.1, chunkZ - 38);

            if (Math.random() < 0.3) {
                this.spawnPowerup(chunkZ - 32);
            }
        }
        // Pattern 6: High Intensity Mixed Hazard
        else {
            const openLane = Math.floor(Math.random() * 3);
            const hazardZ = chunkZ - 18;

            for (let i = 0; i < 3; i++) {
                if (i !== openLane) {
                    const type = Math.random() > 0.5 ? 'low' : 'block';
                    this.spawnObstacle(type, laneX[i], hazardZ);
                } else {
                    for (let j = 0; j < 4; j++) {
                        this.spawnCoin(laneX[i], 1.1, hazardZ - 4 + j * 3);
                    }
                }
            }
        }
    }

    spawnObstacle(type, x, z) {
        let obs;
        if (type === 'low') obs = window.modelBuilder.createLowHurdle();
        else if (type === 'high') obs = window.modelBuilder.createHighLaserGate();
        else if (type === 'block') obs = window.modelBuilder.createBlockContainer();
        else if (type === 'ramp') obs = window.modelBuilder.createRamp();
        else if (type === 'drone') obs = window.modelBuilder.createMovingDrone();

        if (obs) {
            obs.position.set(x, 0, z);
            this.scene.add(obs);
            this.obstacles.push(obs);
        }
    }

    spawnCoin(x, y, z) {
        const coin = window.modelBuilder.createCoin();
        coin.position.set(x, y, z);
        this.scene.add(coin);
        this.coinsList.push(coin);
    }

    spawnCoinArc(x, startZ, endZ) {
        const count = 5;
        const dz = (endZ - startZ) / (count - 1);
        for (let i = 0; i < count; i++) {
            const z = startZ + i * dz;
            const progress = i / (count - 1);
            const y = 1.1 + Math.sin(progress * Math.PI) * 2.2;
            this.spawnCoin(x, y, z);
        }
    }

    spawnPowerup(z) {
        const types = ['magnet', 'shield', 'multiplier', 'boost'];
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = this.LANES[Math.floor(Math.random() * 3)];

        const powerup = window.modelBuilder.createPowerup(type);
        powerup.position.set(lane, 1.4, z);
        this.scene.add(powerup);
        this.powerupItems.push(powerup);
    }

    // --- Controls & Input ---
    initControls() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.state === 'MENU') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.startGame();
                }
                return;
            }

            if (this.state === 'GAMEOVER') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.restartGame();
                }
                return;
            }

            if (this.state === 'PLAYING') {
                switch (e.code) {
                    case 'ArrowLeft':
                    case 'KeyA':
                        this.moveLane(-1);
                        break;
                    case 'ArrowRight':
                    case 'KeyD':
                        this.moveLane(1);
                        break;
                    case 'ArrowUp':
                    case 'KeyW':
                    case 'Space':
                        this.jump();
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        this.slide();
                        break;
                    case 'Escape':
                    case 'KeyP':
                        this.togglePause();
                        break;
                }
            } else if (this.state === 'PAUSED' && (e.code === 'Escape' || e.code === 'KeyP')) {
                this.togglePause();
            }
        });

        // Mobile Touch Gestures (Swipe Detection)
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 0) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            const duration = Date.now() - touchStartTime;

            // Handle Menu / Gameover tap
            if (this.state === 'MENU' && duration < 300 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
                return; // Buttons handle clicks
            }

            if (this.state !== 'PLAYING') return;

            const minSwipeDist = 28;
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal Swipe
                if (Math.abs(dx) > minSwipeDist) {
                    if (dx > 0) this.moveLane(1);
                    else this.moveLane(-1);
                }
            } else {
                // Vertical Swipe
                if (Math.abs(dy) > minSwipeDist) {
                    if (dy < 0) this.jump();
                    else this.slide();
                }
            }
        }, { passive: true });

        // Virtual On-Screen Controls for Mobile / Accessibility
        document.getElementById('btn-left')?.addEventListener('click', (e) => { e.stopPropagation(); this.moveLane(-1); });
        document.getElementById('btn-right')?.addEventListener('click', (e) => { e.stopPropagation(); this.moveLane(1); });
        document.getElementById('btn-jump')?.addEventListener('click', (e) => { e.stopPropagation(); this.jump(); });
        document.getElementById('btn-slide')?.addEventListener('click', (e) => { e.stopPropagation(); this.slide(); });
    }

    moveLane(dir) {
        if (this.state !== 'PLAYING') return;
        const newLane = this.currentLane + dir;
        if (newLane >= 0 && newLane <= 2) {
            this.currentLane = newLane;
            this.targetX = this.LANES[this.currentLane];
            window.soundEngine.playClick();
        }
    }

    jump(forced = false, customVel = null) {
        if (this.state !== 'PLAYING') return;

        // Ground Jump
        if (!this.isJumping || forced) {
            this.isJumping = true;
            this.isSliding = false; // Cancel slide when jumping
            this.slideTimer = 0;
            this.jumpVelocity = customVel !== null ? customVel : 17.5;
            this.jumpTime = 0;
            this.canDoubleJump = true;
            this.hasDoubleJumped = false;
            window.soundEngine.playJump();
        }
        // Double Jump Perk
        else if (this.canDoubleJump && !this.hasDoubleJumped) {
            this.hasDoubleJumped = true;
            this.jumpVelocity = 15.0;
            this.jumpTime = 0;
            this.spawnParticleBurst(this.playerX, this.playerY + 0.5, this.playerZ, 0x00f0ff, 12);
            window.soundEngine.playJump();
        }
    }

    slide() {
        if (this.state !== 'PLAYING') return;

        // Fast Dive if in air
        if (this.isJumping) {
            this.jumpVelocity = -30; // Slam down immediately
            window.soundEngine.playSlide();
            return;
        }

        // Ground Slide
        this.isSliding = true;
        this.slideTimer = this.slideDuration;
        window.soundEngine.playSlide();
        this.spawnSlideSparks();
    }

    // --- Game Lifecycle ---
    startGame() {
        this.state = 'PLAYING';
        this.resetGameStats();
        this.initTrack();

        // UI updates
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('shop-modal').classList.add('hidden');

        // Start Synthwave Music
        window.soundEngine.init();
        window.soundEngine.startMusic();
    }

    restartGame() {
        this.startGame();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pause-screen').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pause-screen').classList.add('hidden');
            this.clock.getDelta(); // flush clock delta to prevent jump
        }
    }

    resetGameStats() {
        this.currentLane = 1;
        this.targetX = 0;
        this.playerX = 0;
        this.playerY = 0;
        this.playerZ = 0;
        this.speed = this.baseSpeed;
        this.distance = 0;
        this.runCoins = 0;
        this.score = 0;
        this.activeMultiplier = 1;
        this.isJumping = false;
        this.isSliding = false;
        this.invulnerableTimer = 0;

        // Reset powerups
        Object.keys(this.powerups).forEach(k => {
            this.powerups[k].active = false;
            this.powerups[k].timer = 0;
        });

        if (this.player) {
            this.player.shieldMesh.visible = false;
            this.player.magnetRing.visible = false;
            this.player.group.position.set(0, 0, 0);
            this.player.group.rotation.set(0, 0, 0);
        }
    }

    gameOver() {
        this.state = 'GAMEOVER';
        window.soundEngine.playHit();

        // Update high score & totals
        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
        }
        this.coins += this.runCoins;
        this.savePlayerData();

        // Screen Shake
        this.triggerScreenShake(0.6);

        // Crash Debris
        this.spawnParticleBurst(this.playerX, this.playerY + 1, this.playerZ, 0xff0055, 35);

        // Update GameOver Screen UI
        document.getElementById('hud').classList.add('hidden');
        const goScreen = document.getElementById('gameover-screen');
        goScreen.classList.remove('hidden');

        document.getElementById('final-score').innerText = Math.floor(this.score).toLocaleString();
        document.getElementById('final-distance').innerText = Math.floor(this.distance) + 'm';
        document.getElementById('final-coins').innerText = this.runCoins;
        document.getElementById('best-score-display').innerText = Math.floor(this.highScore).toLocaleString();

        const badge = document.getElementById('new-highscore-badge');
        if (isNewHighScore) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // --- Power-Up Activation ---
    activatePowerup(type) {
        window.soundEngine.playPowerup();

        if (type === 'magnet') {
            this.powerups.magnet.active = true;
            this.powerups.magnet.timer = this.powerups.magnet.duration;
            if (this.player) this.player.magnetRing.visible = true;
        } else if (type === 'shield') {
            this.powerups.shield.active = true;
            this.powerups.shield.hitsRemaining = 1 + (this.upgrades.shield > 2 ? 1 : 0);
            if (this.player) this.player.shieldMesh.visible = true;
        } else if (type === 'multiplier') {
            this.powerups.multiplier.active = true;
            this.powerups.multiplier.timer = this.powerups.multiplier.duration;
            this.activeMultiplier = 2 + (this.upgrades.multiplier > 3 ? 1 : 0);
        } else if (type === 'boost') {
            this.powerups.boost.active = true;
            this.powerups.boost.timer = this.powerups.boost.duration;
            window.soundEngine.playBoost();
            this.triggerScreenShake(0.3);
        }

        this.updatePowerupHUD();
    }

    updatePowerupHUD() {
        const hud = document.getElementById('active-powerups-hud');
        if (!hud) return;

        let html = '';
        if (this.powerups.boost.active) {
            const pct = Math.max(0, (this.powerups.boost.timer / this.powerups.boost.duration) * 100);
            html += `<div class="powerup-badge boost"><span class="badge-icon">⚡</span> HYPER BOOST <div class="badge-bar"><div class="badge-fill" style="width:${pct}%"></div></div></div>`;
        }
        if (this.powerups.shield.active) {
            html += `<div class="powerup-badge shield"><span class="badge-icon">🛡️</span> SHIELD ACTIVE [${this.powerups.shield.hitsRemaining}]</div>`;
        }
        if (this.powerups.magnet.active) {
            const pct = Math.max(0, (this.powerups.magnet.timer / this.powerups.magnet.duration) * 100);
            html += `<div class="powerup-badge magnet"><span class="badge-icon">🧲</span> MAGNET <div class="badge-bar"><div class="badge-fill" style="width:${pct}%"></div></div></div>`;
        }
        if (this.powerups.multiplier.active) {
            const pct = Math.max(0, (this.powerups.multiplier.timer / this.powerups.multiplier.duration) * 100);
            html += `<div class="powerup-badge multiplier"><span class="badge-icon">✨</span> ${this.activeMultiplier}X SCORE <div class="badge-bar"><div class="badge-fill" style="width:${pct}%"></div></div></div>`;
        }
        hud.innerHTML = html;
    }

    // --- Particle Effects & Screen Shake ---
    spawnParticleBurst(x, y, z, color = 0x00f0ff, count = 16) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
            const mat = new THREE.MeshBasicMaterial({ color: color });
            const p = new THREE.Mesh(geo, mat);
            p.position.set(x, y, z);
            
            p.userData = {
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() * 6) + 1,
                vz: (Math.random() - 0.5) * 8,
                life: 0.6,
                maxLife: 0.6
            };
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    spawnSlideSparks() {
        for (let i = 0; i < 5; i++) {
            const geo = new THREE.BoxGeometry(0.08, 0.08, 0.2);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
            const p = new THREE.Mesh(geo, mat);
            p.position.set(this.playerX + (Math.random() - 0.5) * 0.4, 0.05, this.playerZ + 0.6);
            p.userData = {
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2,
                vz: Math.random() * 4 + 4,
                life: 0.35,
                maxLife: 0.35
            };
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    triggerScreenShake(duration = 0.3) {
        this.shakeTimer = duration;
    }

    // --- Main Game Update Loop ---
    update(dt) {
        if (this.state !== 'PLAYING') {
            // Idle showcase rotation in menu
            if (this.player && this.state === 'MENU') {
                this.player.group.rotation.y += dt * 0.8;
                this.runPhase += dt * 0.5;
                this.player.animate(this.runPhase, false, false, 0, 0, 1, false);
            }
            return;
        }

        // Cap dt to prevent clipping on huge hitches
        dt = Math.min(dt, 0.05);

        // Power-ups countdown
        if (this.powerups.boost.active) {
            this.powerups.boost.timer -= dt;
            if (this.powerups.boost.timer <= 0) {
                this.powerups.boost.active = false;
            }
        }
        if (this.powerups.magnet.active) {
            this.powerups.magnet.timer -= dt;
            if (this.powerups.magnet.timer <= 0) {
                this.powerups.magnet.active = false;
                if (this.player) this.player.magnetRing.visible = false;
            }
        }
        if (this.powerups.multiplier.active) {
            this.powerups.multiplier.timer -= dt;
            if (this.powerups.multiplier.timer <= 0) {
                this.powerups.multiplier.active = false;
                this.activeMultiplier = 1;
            }
        }
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            if (this.player) {
                // Flash player mesh during invulnerability
                this.player.group.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
            }
        } else if (this.player) {
            this.player.group.visible = true;
        }

        this.updatePowerupHUD();

        // Speed Progression
        const isBoosted = this.powerups.boost.active;
        const currentSpeedMultiplier = isBoosted ? 1.75 : 1.0;
        this.speed = Math.min(this.maxSpeed, this.baseSpeed + (this.distance / 120)) * currentSpeedMultiplier;
        window.soundEngine.setMusicTempo(this.speed / this.baseSpeed);

        // Forward Movement
        const deltaZ = this.speed * dt;
        this.playerZ -= deltaZ;
        this.distance += deltaZ;
        this.score += deltaZ * this.activeMultiplier;

        // Smooth Lane Switching (Lerp)
        const laneLerpSpeed = isBoosted ? 26 : 18;
        this.playerX += (this.targetX - this.playerX) * laneLerpSpeed * dt;

        // Jump Physics
        if (this.isJumping) {
            this.playerY += this.jumpVelocity * dt;
            this.jumpVelocity += this.gravity * dt;
            this.jumpTime += dt;
            this.jumpProgress = Math.min(1.0, this.jumpTime / this.jumpDuration);

            // Ground Touchdown
            if (this.playerY <= 0) {
                this.playerY = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
                this.jumpProgress = 0;
            }
        }

        // Slide Timer
        if (this.isSliding) {
            this.slideTimer -= dt;
            this.slideProgress = 1 - (this.slideTimer / this.slideDuration);
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.slideProgress = 0;
            } else if (Math.random() > 0.5) {
                this.spawnSlideSparks();
            }
        }

        // Update Player Mesh Position & Animation
        if (this.player) {
            this.player.group.position.set(this.playerX, this.playerY, this.playerZ);

            // Bank roll into lane switch
            const bankAngle = -(this.targetX - this.playerX) * 0.16;
            this.player.group.rotation.z = bankAngle;

            this.runPhase += dt * (this.speed / 5.5);
            this.player.animate(
                this.runPhase,
                this.isJumping,
                this.isSliding,
                this.jumpProgress,
                this.slideProgress,
                this.speed / this.baseSpeed,
                isBoosted
            );
        }

        // Dynamic Camera Follow
        const targetCamX = this.playerX * 0.55;
        const targetCamY = 3.6 + (this.playerY * 0.4);
        const targetCamZ = this.playerZ + (isBoosted ? 8.5 : 7.2);

        this.camera.position.x += (targetCamX - this.camera.position.x) * 12 * dt;
        this.camera.position.y += (targetCamY - this.camera.position.y) * 10 * dt;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 16 * dt;

        // Screen Shake offset
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const intensity = this.shakeTimer * 0.45;
            this.camera.position.x += (Math.random() - 0.5) * intensity;
            this.camera.position.y += (Math.random() - 0.5) * intensity;
        }

        this.cameraTarget.set(this.playerX * 0.3, 1.6 + this.playerY * 0.2, this.playerZ - 15);
        this.camera.lookAt(this.cameraTarget);

        // Directional Light follow player
        this.dirLight.position.set(this.playerX + 15, 30, this.playerZ + 20);
        this.dirLight.target = this.player.group;

        // Sun & Starfield follow forward progress
        this.sun.position.z = this.playerZ - 380;
        this.starfield.position.z = this.playerZ;

        // Update Speed Lines
        if (this.speedLineMesh) {
            this.speedLineMesh.position.z = this.playerZ;
            this.speedLineMesh.material.opacity = isBoosted ? 0.85 : Math.max(0, (this.speed - 30) / 25 * 0.4);
        }

        // Track Chunk Recycling
        this.updateTrackChunks();

        // City Skyline Recycling
        this.updateCitySkyline();

        // Moving Drone Obstacles Update
        this.updateMovingObstacles(dt);

        // Coin & Powerup Animations / Magnet Physics
        this.updateCollectibles(dt);

        // Collision Checks
        this.checkCollisions();

        // Particle System Update
        this.updateParticles(dt);

        // Update HUD
        this.updateHUD();
    }

    updateTrackChunks() {
        for (let i = 0; i < this.trackChunks.length; i++) {
            const chunk = this.trackChunks[i];
            // If chunk is safely behind player, recycle to front
            if (chunk.position.z > this.playerZ + 35) {
                // Find front-most chunk Z
                let frontZ = this.playerZ;
                this.trackChunks.forEach(c => {
                    if (c.position.z < frontZ) frontZ = c.position.z;
                });
                chunk.position.z = frontZ - this.chunkLength;

                // Populate new obstacles/coins on recycled chunk
                this.populateChunk(chunk.position.z);
            }
        }
    }

    updateCitySkyline() {
        this.cityBuildings.forEach(bldg => {
            if (bldg.position.z > this.playerZ + 30) {
                bldg.position.z -= 28 * 18;
            }
        });
    }

    updateMovingObstacles(dt) {
        this.obstacles.forEach(obs => {
            if (obs.userData && obs.userData.type === 'drone') {
                obs.position.x += obs.userData.patrolSpeed * obs.userData.dir * dt;
                if (obs.position.x > obs.userData.maxX) {
                    obs.position.x = obs.userData.maxX;
                    obs.userData.dir = -1;
                } else if (obs.position.x < obs.userData.minX) {
                    obs.position.x = obs.userData.minX;
                    obs.userData.dir = 1;
                }
            }
        });
    }

    updateCollectibles(dt) {
        const magnetActive = this.powerups.magnet.active;
        const boostActive = this.powerups.boost.active;
        const magnetRadius = magnetActive || boostActive ? 18.0 : 0;

        // Coins Update
        for (let i = this.coinsList.length - 1; i >= 0; i--) {
            const coin = this.coinsList[i];

            // Rotation & Hover animation
            coin.rotation.y += dt * 3.5;

            // Remove if far behind
            if (coin.position.z > this.playerZ + 20) {
                this.scene.remove(coin);
                this.coinsList.splice(i, 1);
                continue;
            }

            // Magnet Attraction Physics
            const dist = coin.position.distanceTo(new THREE.Vector3(this.playerX, this.playerY + 1.1, this.playerZ));
            if (magnetRadius > 0 && dist < magnetRadius) {
                // Accelerate coin towards player
                const dir = new THREE.Vector3(this.playerX, this.playerY + 1.1, this.playerZ).sub(coin.position).normalize();
                coin.position.add(dir.multiplyScalar(32 * dt));
            }

            // Collection Check
            if (dist < 1.4) {
                this.collectCoin(coin, i);
            }
        }

        // Power-ups Update
        for (let i = this.powerupItems.length - 1; i >= 0; i--) {
            const p = this.powerupItems[i];
            p.rotation.y += dt * 2.5;

            if (p.position.z > this.playerZ + 20) {
                this.scene.remove(p);
                this.powerupItems.splice(i, 1);
                continue;
            }

            const dist = p.position.distanceTo(new THREE.Vector3(this.playerX, this.playerY + 1.1, this.playerZ));
            if (dist < 1.6) {
                this.activatePowerup(p.userData.powerupType);
                this.spawnParticleBurst(p.position.x, p.position.y, p.position.z, 0x00f0ff, 20);
                this.scene.remove(p);
                this.powerupItems.splice(i, 1);
            }
        }
    }

    collectCoin(coin, index) {
        window.soundEngine.playCoin();
        this.runCoins++;
        this.score += 50 * this.activeMultiplier;
        this.spawnParticleBurst(coin.position.x, coin.position.y, coin.position.z, 0xffcc00, 8);
        this.scene.remove(coin);
        this.coinsList.splice(index, 1);
    }

    // --- Collision Detection Engine ---
    checkCollisions() {
        if (this.invulnerableTimer > 0) return;

        const isBoosted = this.powerups.boost.active;
        const playerCurrentHeight = this.isSliding ? 0.75 : this.playerHeight;
        const playerBottom = this.playerY;
        const playerTop = this.playerY + playerCurrentHeight;

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];

            // Despawn far behind
            if (obs.position.z > this.playerZ + 15) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
                continue;
            }

            const data = obs.userData;
            if (!data) continue;

            const dx = Math.abs(this.playerX - obs.position.x);
            const dz = Math.abs(this.playerZ - obs.position.z);

            // Bounding box checks
            const hitDepth = (data.depth || 1.0) / 2 + 0.35;
            const hitWidth = (data.width || 2.4) / 2 + (this.playerWidth / 2) - 0.2; // forgiving margin

            if (dx < hitWidth && dz < hitDepth) {
                // Type 1: Launch Ramp
                if (data.type === 'ramp') {
                    // Propel player up into the air
                    this.jump(true, 24.0);
                    window.soundEngine.playJump();
                    this.triggerScreenShake(0.15);
                    continue;
                }

                // If Hyper Boosted: Smash obstacle away!
                if (isBoosted) {
                    this.spawnParticleBurst(obs.position.x, obs.position.y + 1, obs.position.z, 0x00ffff, 25);
                    window.soundEngine.playShieldBreak();
                    this.scene.remove(obs);
                    this.obstacles.splice(i, 1);
                    this.triggerScreenShake(0.2);
                    continue;
                }

                // Type 2: Low Hurdle (must jump over)
                if (data.type === 'low') {
                    const hurdleHeight = 0.85;
                    if (playerBottom < hurdleHeight) {
                        this.handlePlayerCollision(obs, i);
                        return;
                    }
                }
                // Type 3: High Laser Gate (must slide under)
                else if (data.type === 'high') {
                    const gateClearance = 1.35;
                    // If player is standing (playerTop > gateClearance), collision!
                    if (playerTop > gateClearance) {
                        this.handlePlayerCollision(obs, i);
                        return;
                    }
                }
                // Type 4: Solid Block Crate
                else if (data.type === 'block') {
                    const crateHeight = data.height || 2.4;
                    if (playerBottom < crateHeight) {
                        this.handlePlayerCollision(obs, i);
                        return;
                    }
                }
                // Type 5: Moving Drone
                else if (data.type === 'drone') {
                    this.handlePlayerCollision(obs, i);
                    return;
                }
            }
        }
    }

    handlePlayerCollision(obstacle, index) {
        // Shield Protection Check
        if (this.powerups.shield.active) {
            this.powerups.shield.hitsRemaining--;
            window.soundEngine.playShieldBreak();
            this.spawnParticleBurst(this.playerX, this.playerY + 1, this.playerZ, 0x00f0ff, 25);
            this.triggerScreenShake(0.4);

            if (this.powerups.shield.hitsRemaining <= 0) {
                this.powerups.shield.active = false;
                if (this.player) this.player.shieldMesh.visible = false;
            }

            // Remove collided obstacle
            if (obstacle) {
                this.scene.remove(obstacle);
                this.obstacles.splice(index, 1);
            }

            // Brief invulnerability period
            this.invulnerableTimer = 1.6;
            this.updatePowerupHUD();
            return;
        }

        // Fatal crash: Game Over
        this.gameOver();
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const data = p.userData;

            p.position.x += data.vx * dt;
            p.position.y += data.vy * dt;
            p.position.z += data.vz * dt;
            data.vy -= 16 * dt; // gravity

            data.life -= dt;
            const progress = data.life / data.maxLife;
            p.scale.set(progress, progress, progress);

            if (data.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }

    updateHUD() {
        document.getElementById('hud-score').innerText = Math.floor(this.score).toLocaleString();
        document.getElementById('hud-distance').innerText = Math.floor(this.distance) + 'm';
        document.getElementById('hud-coins').innerText = this.runCoins;
        document.getElementById('hud-speed').innerText = Math.floor(this.speed * 2.8) + ' KM/H';

        const multiElem = document.getElementById('hud-multiplier');
        if (multiElem) {
            multiElem.innerText = this.activeMultiplier + 'X';
            if (this.activeMultiplier > 1) {
                multiElem.classList.add('glow');
            } else {
                multiElem.classList.remove('glow');
            }
        }
    }

    // --- UI & Shop Integration ---
    initUI() {
        // Start Button
        document.getElementById('btn-play')?.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.startGame();
        });

        // Restart Button
        document.getElementById('btn-restart')?.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.restartGame();
        });

        // Shop Buttons
        document.getElementById('btn-shop')?.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.openShop();
        });

        document.getElementById('btn-shop-go')?.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.openShop();
        });

        document.getElementById('btn-close-shop')?.addEventListener('click', () => {
            window.soundEngine.playClick();
            document.getElementById('shop-modal').classList.add('hidden');
        });

        // Pause Menu Buttons
        document.getElementById('btn-resume')?.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.togglePause();
        });

        document.getElementById('btn-quit')?.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.state = 'MENU';
            document.getElementById('pause-screen').classList.add('hidden');
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('menu-screen').classList.remove('hidden');
            window.soundEngine.stopMusic();
            this.initPlayer();
        });

        // Sound Toggles
        document.getElementById('btn-toggle-music')?.addEventListener('click', (e) => {
            const on = window.soundEngine.toggleMusic();
            e.currentTarget.innerText = on ? '🎵 MUSIC: ON' : '🎵 MUSIC: OFF';
            e.currentTarget.classList.toggle('muted', !on);
        });

        document.getElementById('btn-toggle-sfx')?.addEventListener('click', (e) => {
            const on = window.soundEngine.toggleSFX();
            e.currentTarget.innerText = on ? '🔊 SFX: ON' : '🔊 SFX: OFF';
            e.currentTarget.classList.toggle('muted', !on);
        });

        // Update Start Screen High Score & Coins
        document.getElementById('menu-highscore').innerText = Math.floor(this.highScore).toLocaleString();
        document.getElementById('menu-coins').innerText = this.coins;
    }

    openShop() {
        document.getElementById('shop-modal').classList.remove('hidden');
        this.updateShopUI();
    }

    updateShopUI() {
        document.getElementById('shop-total-coins').innerText = this.coins;
        document.getElementById('menu-coins').innerText = this.coins;

        // Render Skins
        const skinsListElem = document.getElementById('skins-container');
        if (skinsListElem) {
            let html = '';
            Object.values(SKINS).forEach(skin => {
                const isUnlocked = this.unlockedSkins.includes(skin.id);
                const isEquipped = this.activeSkin === skin.id;

                let btnHtml = '';
                if (isEquipped) {
                    btnHtml = `<button class="shop-item-btn equipped" disabled>EQUIPPED</button>`;
                } else if (isUnlocked) {
                    btnHtml = `<button class="shop-item-btn equip-btn" onclick="window.game.equipSkin('${skin.id}')">EQUIP</button>`;
                } else {
                    const canAfford = this.coins >= skin.price;
                    btnHtml = `<button class="shop-item-btn buy-btn ${canAfford ? '' : 'locked'}" onclick="window.game.buySkin('${skin.id}')">${skin.price} 🪙</button>`;
                }

                html += `
                    <div class="shop-card ${isEquipped ? 'active-card' : ''}" style="border-color:${skin.glowHex}">
                        <div class="skin-color-preview" style="background:${skin.glowHex}; box-shadow: 0 0 15px ${skin.glowHex}"></div>
                        <div class="shop-card-info">
                            <div class="shop-card-title">${skin.name}</div>
                            ${btnHtml}
                        </div>
                    </div>
                `;
            });
            skinsListElem.innerHTML = html;
        }

        // Render Upgrades
        const upgradesElem = document.getElementById('upgrades-container');
        if (upgradesElem) {
            const upgradeDefs = [
                { id: 'magnet', name: 'MAGNET BOOST', desc: 'Increases coin suction duration', cost: 150 * this.upgrades.magnet },
                { id: 'shield', name: 'ENERGY SHIELD', desc: 'Adds extra hit absorption charges', cost: 200 * this.upgrades.shield },
                { id: 'multiplier', name: '2X MULTIPLIER', desc: 'Extends score multiplier duration', cost: 180 * this.upgrades.multiplier },
                { id: 'boost', name: 'HYPER JET BOOSTER', desc: 'Extends supersonic rocket blast', cost: 250 * this.upgrades.boost }
            ];

            let upHtml = '';
            upgradeDefs.forEach(up => {
                const lvl = this.upgrades[up.id];
                const maxLvl = 5;
                const isMax = lvl >= maxLvl;
                const canAfford = this.coins >= up.cost;

                let actionHtml = '';
                if (isMax) {
                    actionHtml = `<button class="shop-item-btn equipped" disabled>MAX LEVEL</button>`;
                } else {
                    actionHtml = `<button class="shop-item-btn buy-btn ${canAfford ? '' : 'locked'}" onclick="window.game.buyUpgrade('${up.id}', ${up.cost})">UPGRADE: ${up.cost} 🪙</button>`;
                }

                upHtml += `
                    <div class="upgrade-card">
                        <div class="upgrade-info">
                            <div class="upgrade-name">${up.name} <span class="upgrade-lvl">LVL ${lvl}/${maxLvl}</span></div>
                            <div class="upgrade-desc">${up.desc}</div>
                        </div>
                        ${actionHtml}
                    </div>
                `;
            });
            upgradesElem.innerHTML = upHtml;
        }
    }

    buySkin(skinId) {
        const skin = SKINS[skinId];
        if (!skin || this.coins < skin.price) return;
        this.coins -= skin.price;
        this.unlockedSkins.push(skinId);
        this.activeSkin = skinId;
        this.savePlayerData();
        this.initPlayer();
        this.updateShopUI();
        window.soundEngine.playPowerup();
    }

    equipSkin(skinId) {
        if (this.switchSkin(skinId)) {
            window.soundEngine.playClick();
        }
    }

    buyUpgrade(upgradeId, cost) {
        if (this.coins < cost || this.upgrades[upgradeId] >= 5) return;
        this.coins -= cost;
        this.upgrades[upgradeId]++;
        this.applyUpgrades();
        this.savePlayerData();
        this.updateShopUI();
        window.soundEngine.playPowerup();
    }

    // --- Render Loop ---
    animate() {
        requestAnimationFrame(this.animate);
        const dt = this.clock.getDelta();
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

// Global bootstrap
window.addEventListener('DOMContentLoaded', () => {
    window.game = new EndlessRunnerGame();
});
