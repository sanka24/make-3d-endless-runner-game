// Procedural 3D Mesh and Model Generators for 3D Endless Runner
// Built with Three.js

const SKINS = {
    striker: {
        id: 'striker',
        name: 'CYBER STRIKER',
        price: 0,
        unlocked: true,
        primary: 0x00f0ff,
        secondary: 0x0f172a,
        accent: 0x38bdf8,
        emissive: 0x00f0ff,
        glowHex: '#00f0ff'
    },
    crimson: {
        id: 'crimson',
        name: 'CRIMSON VALKYRIE',
        price: 250,
        unlocked: false,
        primary: 0xff0055,
        secondary: 0x1f0a14,
        accent: 0xf43f5e,
        emissive: 0xff0055,
        glowHex: '#ff0055'
    },
    solar: {
        id: 'solar',
        name: 'SOLAR VANGUARD',
        price: 600,
        unlocked: false,
        primary: 0xffb703,
        secondary: 0x1c1917,
        accent: 0xfbbf24,
        emissive: 0xffb703,
        glowHex: '#ffb703'
    },
    emerald: {
        id: 'emerald',
        name: 'EMERALD GHOST',
        price: 1000,
        unlocked: false,
        primary: 0x10b981,
        secondary: 0x062117,
        accent: 0x34d399,
        emissive: 0x10b981,
        glowHex: '#10b981'
    },
    void: {
        id: 'void',
        name: 'VOID PHANTOM',
        price: 1500,
        unlocked: false,
        primary: 0xa855f7,
        secondary: 0x130a21,
        accent: 0xc084fc,
        emissive: 0xa855f7,
        glowHex: '#a855f7'
    }
};

class ModelBuilder {
    constructor() {
        this.materials = {};
        this.initSharedMaterials();
    }

    initSharedMaterials() {
        // Shared road & obstacle materials for fast rendering
        this.materials.road = new THREE.MeshStandardMaterial({
            color: 0x0a0d18,
            roughness: 0.7,
            metalness: 0.3
        });

        this.materials.roadGrid = new THREE.MeshStandardMaterial({
            color: 0x11162b,
            roughness: 0.5,
            metalness: 0.6,
            emissive: 0x002244,
            emissiveIntensity: 0.4
        });

        this.materials.curbRail = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });

        this.materials.laneDivider = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.9
        });

        this.materials.goldCoin = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            emissive: 0xff9900,
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.9
        });

        this.materials.hazardStripe = new THREE.MeshStandardMaterial({
            color: 0xff2244,
            emissive: 0xff0033,
            emissiveIntensity: 0.7,
            roughness: 0.3
        });

        this.materials.laserBeam = new THREE.MeshBasicMaterial({
            color: 0xff0044,
            transparent: true,
            opacity: 0.85
        });

        this.materials.highLaserBeam = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.85
        });

        this.materials.cyberMetal = new THREE.MeshStandardMaterial({
            color: 0x1e2438,
            metalness: 0.8,
            roughness: 0.3
        });

        this.materials.cyberAccent = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x00a8cc,
            emissiveIntensity: 0.6
        });
    }

    createPlayer(skinId = 'striker') {
        const skin = SKINS[skinId] || SKINS.striker;
        const playerGroup = new THREE.Group();

        // Primary suit material
        const suitMat = new THREE.MeshStandardMaterial({
            color: skin.secondary,
            metalness: 0.7,
            roughness: 0.3
        });

        // Armor plating material
        const armorMat = new THREE.MeshStandardMaterial({
            color: skin.primary,
            emissive: skin.emissive,
            emissiveIntensity: 0.4,
            metalness: 0.5,
            roughness: 0.2
        });

        // Glowing visor & accents
        const glowMat = new THREE.MeshStandardMaterial({
            color: skin.primary,
            emissive: skin.emissive,
            emissiveIntensity: 1.2,
            roughness: 0.1
        });

        // Thruster flame material
        const thrusterFlameMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9
        });

        // Root container for animations
        const bodyRoot = new THREE.Group();
        playerGroup.add(bodyRoot);

        // --- Torso & Chestplate ---
        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = 1.35;
        bodyRoot.add(torsoGroup);

        const chestGeo = new THREE.BoxGeometry(0.7, 0.75, 0.45);
        const chest = new THREE.Mesh(chestGeo, suitMat);
        chest.castShadow = true;
        torsoGroup.add(chest);

        // Armor plate on chest
        const plateGeo = new THREE.BoxGeometry(0.55, 0.5, 0.15);
        const plate = new THREE.Mesh(plateGeo, armorMat);
        plate.position.set(0, 0.05, 0.2);
        torsoGroup.add(plate);

        // Arc reactor / Glowing Core
        const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
        coreGeo.rotateX(Math.PI / 2);
        const core = new THREE.Mesh(coreGeo, glowMat);
        core.position.set(0, 0.08, 0.26);
        torsoGroup.add(core);

        // --- Jetpack / Thrusters on Back ---
        const jetpackGeo = new THREE.BoxGeometry(0.5, 0.55, 0.22);
        const jetpack = new THREE.Mesh(jetpackGeo, suitMat);
        jetpack.position.set(0, 0.05, -0.3);
        torsoGroup.add(jetpack);

        // Dual Thruster Nozzles
        const nozzleGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.25, 12);
        const leftNozzle = new THREE.Mesh(nozzleGeo, armorMat);
        leftNozzle.position.set(-0.16, -0.25, -0.3);
        torsoGroup.add(leftNozzle);

        const rightNozzle = leftNozzle.clone();
        rightNozzle.position.x = 0.16;
        torsoGroup.add(rightNozzle);

        // Jet Flames
        const flameGeo = new THREE.ConeGeometry(0.08, 0.4, 8);
        flameGeo.rotateX(Math.PI);
        const leftFlame = new THREE.Mesh(flameGeo, thrusterFlameMat);
        leftFlame.position.set(-0.16, -0.42, -0.3);
        torsoGroup.add(leftFlame);

        const rightFlame = leftFlame.clone();
        rightFlame.position.x = 0.16;
        torsoGroup.add(rightFlame);

        // --- Head & Helmet ---
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.55, 0);
        torsoGroup.add(headGroup);

        const helmetGeo = new THREE.BoxGeometry(0.48, 0.48, 0.5);
        const helmet = new THREE.Mesh(helmetGeo, suitMat);
        helmet.castShadow = true;
        headGroup.add(helmet);

        // Top fin
        const finGeo = new THREE.BoxGeometry(0.08, 0.15, 0.35);
        const fin = new THREE.Mesh(finGeo, armorMat);
        fin.position.set(0, 0.28, -0.05);
        headGroup.add(fin);

        // Futuristic Visor Strip
        const visorGeo = new THREE.BoxGeometry(0.44, 0.16, 0.12);
        const visor = new THREE.Mesh(visorGeo, glowMat);
        visor.position.set(0, 0.02, 0.24);
        headGroup.add(visor);

        // --- Arms (Left & Right) ---
        const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
        
        // Left Arm
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.46, 0.28, 0);
        torsoGroup.add(leftArmGroup);

        const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
        leftArmMesh.position.y = -0.28;
        leftArmMesh.castShadow = true;
        leftArmGroup.add(leftArmMesh);

        // Right Arm
        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(0.46, 0.28, 0);
        torsoGroup.add(rightArmGroup);

        const rightArmMesh = new THREE.Mesh(armGeo, suitMat);
        rightArmMesh.position.y = -0.28;
        rightArmMesh.castShadow = true;
        rightArmGroup.add(rightArmMesh);

        // --- Legs (Hips & Knees) ---
        const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.26);

        // Left Leg
        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.2, 0.75, 0);
        bodyRoot.add(leftLegGroup);

        const leftLegMesh = new THREE.Mesh(legGeo, suitMat);
        leftLegMesh.position.y = -0.38;
        leftLegMesh.castShadow = true;
        leftLegGroup.add(leftLegMesh);

        // Left Boot accent
        const bootGeo = new THREE.BoxGeometry(0.26, 0.22, 0.34);
        const leftBoot = new THREE.Mesh(bootGeo, armorMat);
        leftBoot.position.set(0, -0.66, 0.04);
        leftLegGroup.add(leftBoot);

        // Right Leg
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.2, 0.75, 0);
        bodyRoot.add(rightLegGroup);

        const rightLegMesh = new THREE.Mesh(legGeo, suitMat);
        rightLegMesh.position.y = -0.38;
        rightLegMesh.castShadow = true;
        rightLegGroup.add(rightLegMesh);

        const rightBoot = new THREE.Mesh(bootGeo, armorMat);
        rightBoot.position.set(0, -0.66, 0.04);
        rightLegGroup.add(rightBoot);

        // --- Shield Visual Effect Bubble ---
        const shieldGeo = new THREE.IcosahedronGeometry(1.6, 2);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.35,
            wireframe: true
        });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.y = 1.1;
        shieldMesh.visible = false;
        playerGroup.add(shieldMesh);

        // --- Magnet Visual Energy Ring ---
        const magnetRingGeo = new THREE.TorusGeometry(0.8, 0.08, 8, 24);
        magnetRingGeo.rotateX(Math.PI / 2);
        const magnetMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
            transparent: true,
            opacity: 0.8
        });
        const magnetRing = new THREE.Mesh(magnetRingGeo, magnetMat);
        magnetRing.position.y = 2.1;
        magnetRing.visible = false;
        playerGroup.add(magnetRing);

        return {
            group: playerGroup,
            bodyRoot,
            torsoGroup,
            headGroup,
            leftArmGroup,
            rightArmGroup,
            leftLegGroup,
            rightLegGroup,
            shieldMesh,
            magnetRing,
            leftFlame,
            rightFlame,
            skinId,
            // Animation update function
            animate: function(runPhase, isJumping, isSliding, jumpProgress, slideProgress, speedRatio, isBoosted) {
                // Thruster flames flicker
                const flameScale = isBoosted ? 2.5 : 1.0 + Math.sin(runPhase * 6) * 0.25;
                leftFlame.scale.set(1, flameScale, 1);
                rightFlame.scale.set(1, flameScale, 1);

                if (shieldMesh.visible) {
                    shieldMesh.rotation.y += 0.04;
                    shieldMesh.rotation.x += 0.02;
                }
                if (magnetRing.visible) {
                    magnetRing.rotation.y += 0.06;
                    magnetRing.position.y = 2.1 + Math.sin(runPhase * 4) * 0.1;
                }

                if (isSliding) {
                    // Slide posture: low slide, leaning back, legs forward
                    torsoGroup.position.y = 0.5;
                    torsoGroup.rotation.x = -0.7;
                    headGroup.rotation.x = 0.6;
                    leftLegGroup.position.y = 0.35;
                    rightLegGroup.position.y = 0.35;
                    leftLegGroup.rotation.x = -1.2;
                    rightLegGroup.rotation.x = -1.2;
                    leftArmGroup.rotation.x = 0.8;
                    rightArmGroup.rotation.x = 0.8;
                } else if (isJumping) {
                    // Jump pose: tucked athletic jump or ninja flip
                    const flipAngle = jumpProgress * Math.PI * 2;
                    torsoGroup.position.y = 1.35;
                    torsoGroup.rotation.x = flipAngle > 0.2 && flipAngle < 6.0 ? flipAngle * 0.25 : 0;
                    headGroup.rotation.x = -0.2;
                    leftLegGroup.position.y = 0.75;
                    rightLegGroup.position.y = 0.75;
                    leftLegGroup.rotation.x = -0.6;
                    rightLegGroup.rotation.x = 0.4;
                    leftArmGroup.rotation.x = -1.2;
                    rightArmGroup.rotation.x = -1.2;
                } else {
                    // Standard dynamic run cycle
                    const legSwing = Math.sin(runPhase * 10) * 0.75;
                    const armSwing = Math.sin(runPhase * 10) * 0.85;
                    const bounce = Math.abs(Math.sin(runPhase * 10)) * 0.12;

                    torsoGroup.position.y = 1.35 + bounce;
                    torsoGroup.rotation.x = 0.15; // slight forward lean
                    torsoGroup.rotation.y = Math.sin(runPhase * 10) * 0.08;
                    headGroup.rotation.x = -0.15;

                    leftLegGroup.position.y = 0.75 + bounce;
                    rightLegGroup.position.y = 0.75 + bounce;
                    leftLegGroup.rotation.x = legSwing;
                    rightLegGroup.rotation.x = -legSwing;

                    leftArmGroup.rotation.x = -armSwing;
                    rightArmGroup.rotation.x = armSwing;
                }
            }
        };
    }

    // --- Track Chunk Builder ---
    createTrackChunk(chunkLength = 60, roadWidth = 11.5) {
        const chunkGroup = new THREE.Group();

        // Base Road Surface
        const roadGeo = new THREE.PlaneGeometry(roadWidth, chunkLength, 1, 1);
        roadGeo.rotateX(-Math.PI / 2);
        const road = new THREE.Mesh(roadGeo, this.materials.road);
        road.receiveShadow = true;
        chunkGroup.add(road);

        // High-tech Road Grid lines & border
        const gridGeo = new THREE.PlaneGeometry(roadWidth - 0.2, chunkLength, 3, 10);
        gridGeo.rotateX(-Math.PI / 2);
        gridGeo.translate(0, 0.01, 0);
        const grid = new THREE.Mesh(gridGeo, this.materials.roadGrid);
        grid.receiveShadow = true;
        chunkGroup.add(grid);

        // Neon Lane Dividers (Lanes at x = -3.2, 0, 3.2; dividers at x = -1.6 and +1.6)
        [-1.6, 1.6].forEach(xPos => {
            const numDashes = Math.floor(chunkLength / 6);
            for (let i = 0; i < numDashes; i++) {
                const dashGeo = new THREE.BoxGeometry(0.12, 0.02, 3);
                const dash = new THREE.Mesh(dashGeo, this.materials.laneDivider);
                dash.position.set(xPos, 0.02, -chunkLength / 2 + 3 + i * 6);
                chunkGroup.add(dash);
            }
        });

        // Glowing Neon Curbs on Left and Right
        [-roadWidth / 2, roadWidth / 2].forEach((xPos, idx) => {
            // Curb barrier
            const barrierGeo = new THREE.BoxGeometry(0.6, 0.6, chunkLength);
            const barrier = new THREE.Mesh(barrierGeo, this.materials.cyberMetal);
            barrier.position.set(xPos, 0.3, 0);
            chunkGroup.add(barrier);

            // Glowing LED neon strip
            const stripGeo = new THREE.BoxGeometry(0.15, 0.15, chunkLength);
            const strip = new THREE.Mesh(stripGeo, this.materials.curbRail);
            strip.position.set(xPos + (idx === 0 ? 0.3 : -0.3), 0.5, 0);
            chunkGroup.add(strip);
        });

        return chunkGroup;
    }

    // --- Obstacle Builders ---

    // Low obstacle (JUMP OVER)
    createLowHurdle() {
        const group = new THREE.Group();
        group.userData = { type: 'low', height: 1.0, width: 2.6, depth: 0.8 };

        // Left and right support posts
        const postGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
        const leftPost = new THREE.Mesh(postGeo, this.materials.cyberMetal);
        leftPost.position.set(-1.2, 0.45, 0);
        group.add(leftPost);

        const rightPost = leftPost.clone();
        rightPost.position.x = 1.2;
        group.add(rightPost);

        // Neon warning laser crossbeam
        const laserGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8);
        laserGeo.rotateZ(Math.PI / 2);
        const laser = new THREE.Mesh(laserGeo, this.materials.laserBeam);
        laser.position.set(0, 0.65, 0);
        group.add(laser);

        // Base hazard barrier
        const barGeo = new THREE.BoxGeometry(2.4, 0.3, 0.2);
        const bar = new THREE.Mesh(barGeo, this.materials.hazardStripe);
        bar.position.set(0, 0.25, 0);
        group.add(bar);

        return group;
    }

    // High obstacle (SLIDE UNDER)
    createHighLaserGate() {
        const group = new THREE.Group();
        group.userData = { type: 'high', height: 3.5, width: 2.8, depth: 0.8, clearHeight: 1.3 };

        // Tall side posts
        const postGeo = new THREE.BoxGeometry(0.35, 3.5, 0.35);
        const leftPost = new THREE.Mesh(postGeo, this.materials.cyberMetal);
        leftPost.position.set(-1.25, 1.75, 0);
        group.add(leftPost);

        const rightPost = leftPost.clone();
        rightPost.position.x = 1.25;
        group.add(rightPost);

        // Overhead cyber archway
        const archGeo = new THREE.BoxGeometry(2.8, 0.5, 0.5);
        const arch = new THREE.Mesh(archGeo, this.materials.cyberMetal);
        arch.position.set(0, 3.25, 0);
        group.add(arch);

        // Lethal high plasma beam (positioned at y = 1.9 to 2.8, player standing is 2.0 tall, sliding is 0.7 tall)
        const beamGeo = new THREE.BoxGeometry(2.5, 0.9, 0.15);
        const beam = new THREE.Mesh(beamGeo, this.materials.highLaserBeam);
        beam.position.set(0, 2.3, 0);
        group.add(beam);

        // Hazard warning sign
        const signGeo = new THREE.BoxGeometry(1.2, 0.35, 0.1);
        const sign = new THREE.Mesh(signGeo, this.materials.hazardStripe);
        sign.position.set(0, 3.25, 0.26);
        group.add(sign);

        return group;
    }

    // Full obstacle (CHANGE LANE)
    createBlockContainer() {
        const group = new THREE.Group();
        group.userData = { type: 'block', height: 2.6, width: 2.7, depth: 2.2 };

        // Main industrial tech crate
        const boxGeo = new THREE.BoxGeometry(2.6, 2.4, 2.0);
        const box = new THREE.Mesh(boxGeo, this.materials.cyberMetal);
        box.position.y = 1.2;
        box.castShadow = true;
        group.add(box);

        // Front glowing hazard cross/stripes
        const stripeGeo = new THREE.BoxGeometry(2.4, 0.4, 0.05);
        const stripe = new THREE.Mesh(stripeGeo, this.materials.hazardStripe);
        stripe.position.set(0, 1.2, 1.03);
        group.add(stripe);

        // Top warning beacon
        const beaconGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.25, 8);
        const beacon = new THREE.Mesh(beaconGeo, this.materials.laserBeam);
        beacon.position.set(0, 2.5, 0);
        group.add(beacon);

        return group;
    }

    // Launch Ramp (Launches player high up into the air)
    createRamp() {
        const group = new THREE.Group();
        group.userData = { type: 'ramp', height: 1.4, width: 2.6, depth: 4.5 };

        // Sloped wedge geometry
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(4.5, 0);
        shape.lineTo(4.5, 1.4);
        shape.closePath();

        const extrudeSettings = { depth: 2.6, bevelEnabled: false };
        const rampGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        rampGeo.rotateY(-Math.PI / 2);
        rampGeo.translate(1.3, 0, 2.25);

        const rampMesh = new THREE.Mesh(rampGeo, this.materials.cyberMetal);
        rampMesh.receiveShadow = true;
        group.add(rampMesh);

        // Glowing speed chevrons along ramp
        const chevronGeo = new THREE.BoxGeometry(1.8, 0.05, 0.4);
        for (let i = 0; i < 3; i++) {
            const chevron = new THREE.Mesh(chevronGeo, this.materials.cyberAccent);
            chevron.position.set(0, 0.35 * (i + 1), -1.2 + i * 1.2);
            chevron.rotation.x = -Math.atan2(1.4, 4.5);
            group.add(chevron);
        }

        return group;
    }

    // Moving Drone Obstacle
    createMovingDrone() {
        const group = new THREE.Group();
        group.userData = { 
            type: 'drone', 
            height: 2.2, 
            width: 2.0, 
            depth: 1.5,
            patrolSpeed: 2.5,
            minX: -3.2,
            maxX: 3.2,
            dir: 1
        };

        const droneBodyGeo = new THREE.BoxGeometry(1.4, 0.5, 1.2);
        const droneBody = new THREE.Mesh(droneBodyGeo, this.materials.cyberMetal);
        droneBody.position.y = 1.3;
        group.add(droneBody);

        // Glowing eye
        const eyeGeo = new THREE.SphereGeometry(0.22, 12, 12);
        const eye = new THREE.Mesh(eyeGeo, this.materials.hazardStripe);
        eye.position.set(0, 1.3, 0.6);
        group.add(eye);

        // 4 Quad-rotors
        [-0.7, 0.7].forEach(x => {
            [-0.6, 0.6].forEach(z => {
                const rotorGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 8);
                const rotor = new THREE.Mesh(rotorGeo, this.materials.cyberAccent);
                rotor.position.set(x, 1.5, z);
                group.add(rotor);
            });
        });

        return group;
    }

    // --- Collectibles ---

    createCoin() {
        const group = new THREE.Group();
        group.userData = { type: 'coin', radius: 0.5, collected: false };

        const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 12);
        coinGeo.rotateZ(Math.PI / 2);
        const coinMesh = new THREE.Mesh(coinGeo, this.materials.goldCoin);
        group.add(coinMesh);

        // Inner glowing core
        const coreGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        group.position.y = 1.1;
        return group;
    }

    createPowerup(type) {
        const group = new THREE.Group();
        group.userData = { type: 'powerup', powerupType: type, collected: false };

        if (type === 'magnet') {
            // Horseshoe Magnet
            const magnetGeo = new THREE.TorusGeometry(0.45, 0.14, 8, 16, Math.PI * 1.3);
            const magnetMat = new THREE.MeshStandardMaterial({
                color: 0xff0044,
                emissive: 0xff0044,
                emissiveIntensity: 0.8
            });
            const mesh = new THREE.Mesh(magnetGeo, magnetMat);
            group.add(mesh);
        } else if (type === 'shield') {
            // Energy Sphere with Saturn Ring
            const sphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
            const sphereMat = new THREE.MeshStandardMaterial({
                color: 0x00f0ff,
                emissive: 0x00f0ff,
                emissiveIntensity: 0.8
            });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            group.add(sphere);

            const ringGeo = new THREE.TorusGeometry(0.55, 0.06, 6, 20);
            ringGeo.rotateX(Math.PI / 3);
            const ring = new THREE.Mesh(ringGeo, sphereMat);
            group.add(ring);
        } else if (type === 'multiplier') {
            // "2X" Crystal Prism
            const prismGeo = new THREE.OctahedronGeometry(0.48, 0);
            const prismMat = new THREE.MeshStandardMaterial({
                color: 0xa855f7,
                emissive: 0x9333ea,
                emissiveIntensity: 1.0
            });
            const prism = new THREE.Mesh(prismGeo, prismMat);
            group.add(prism);
        } else if (type === 'boost') {
            // Jet Engine Boost Canister
            const canGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.7, 12);
            const canMat = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff7700,
                emissiveIntensity: 0.9
            });
            const canister = new THREE.Mesh(canGeo, canMat);
            canister.rotation.z = Math.PI / 4;
            group.add(canister);
        }

        group.position.y = 1.3;
        return group;
    }

    // --- Sci-Fi City Skyline Buildings ---
    createCityBuilding(height = 30, width = 12, depth = 12, neonColor = 0x00f0ff) {
        const group = new THREE.Group();

        // Dark monolithic tower
        const bldgGeo = new THREE.BoxGeometry(width, height, depth);
        const bldgMat = new THREE.MeshStandardMaterial({
            color: 0x080b14,
            roughness: 0.8,
            metalness: 0.2
        });
        const building = new THREE.Mesh(bldgGeo, bldgMat);
        building.position.y = height / 2;
        group.add(building);

        // Glowing neon window strips
        const windowGeo = new THREE.BoxGeometry(width + 0.1, 0.4, depth + 0.1);
        const windowMat = new THREE.MeshStandardMaterial({
            color: neonColor,
            emissive: neonColor,
            emissiveIntensity: 0.7
        });

        const floors = Math.floor(height / 4);
        for (let i = 1; i < floors; i++) {
            if (Math.random() > 0.4) {
                const strip = new THREE.Mesh(windowGeo, windowMat);
                strip.position.y = i * 4;
                group.add(strip);
            }
        }

        // Rooftop antenna
        const antGeo = new THREE.CylinderGeometry(0.1, 0.2, 5, 6);
        const ant = new THREE.Mesh(antGeo, windowMat);
        ant.position.set(0, height + 2.5, 0);
        group.add(ant);

        return group;
    }
}

window.modelBuilder = new ModelBuilder();
