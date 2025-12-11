// ==========================================
// CONFIGURARE SI CONSTANTE
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Constante joc
const SHIP_SIZE = 20;
const SHIP_SPEED = 5;
const ROT_SPEED = 0.08;
const MISSILE_SPEED = 7;
const MAX_MISSILES = 3; 
const REGEN_SCORE = 500; // La cate puncte primesti o viata

// Variabile de stare
let ship = {};
let asteroids = [];
let missiles = [];
let score = 0;
let lives = 3;
let scoreBuffer = 0; // Contor intern pentru viata extra
let gameOver = false;

// Starea tastelor
const keys = {
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false,
    z: false, c: false, x: false
};

// ==========================================
// INITIALIZARE JOC
// ==========================================
function initGame() {
    // Resetam variabilele
    score = 0;
    lives = 3;
    scoreBuffer = 0;
    gameOver = false;
    asteroids = [];
    missiles = [];

    // Ascundem ecranul de Game Over daca e vizibil
    document.getElementById("gameOverScreen").style.display = "none";
    
    // Pozitionam nava la centru
    resetShip();

    // Generam 5 asteroizi initiali
    for(let i=0; i<5; i++) createAsteroid();

    // Afisam clasamentul existent
    displayHighScores();
    
    // Pornim bucla
    gameLoop();
}

function resetShip() {
    ship = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        a: -Math.PI / 2, // Sus
        r: SHIP_SIZE
    };
}

// ==========================================
// CREARE OBIECTE
// ==========================================
function createAsteroid(x, y) {
    // Daca nu dam pozitie, o generam random
    if (x === undefined) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        // Evitam sa apara fix peste nava
        if (Math.hypot(x - ship.x, y - ship.y) < 100) {
            x += 200; 
        }
    }

    const val = Math.floor(Math.random() * 4) + 1; // 1-4
    updateAsteroidVisuals({ x, y, val }); // Setam proprietatile vizuale
}

// Functie care calculeaza culoarea/raza in functie de valoare
function updateAsteroidVisuals(a, speedArg, angleArg) {
    // Pastram viteza daca exista, altfel generam una noua
    const speed = speedArg !== undefined ? speedArg : (Math.random() * 2 + 0.5);
    const angle = angleArg !== undefined ? angleArg : (Math.random() * Math.PI * 2);

    let color, radius;
    switch(a.val) {
        case 4: color = "red"; radius = 50; break;
        case 3: color = "orange"; radius = 40; break;
        case 2: color = "yellow"; radius = 30; break;
        default: color = "#00FF00"; radius = 20; // 1 - Verde
    }

    // Daca asteroidul exista deja, il actualizam, altfel cream unul nou
    if (a.vx) { // Exista deja
        a.color = color;
        a.r = radius;
    } else { // E nou
        asteroids.push({
            x: a.x, y: a.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: radius,
            color: color,
            val: a.val
        });
    }
}

function fireMissile() {
    if (missiles.length >= MAX_MISSILES) return;

    missiles.push({
        x: ship.x + SHIP_SIZE * Math.cos(ship.a),
        y: ship.y + SHIP_SIZE * Math.sin(ship.a),
        vx: Math.cos(ship.a) * MISSILE_SPEED,
        vy: Math.sin(ship.a) * MISSILE_SPEED
    });
}

// ==========================================
// INPUT
// ==========================================
document.addEventListener("keydown", (ev) => {
    const key = ev.key.toLowerCase();
    if(["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) ev.preventDefault();
    if (keys.hasOwnProperty(key)) keys[key] = true;
    if (key === "x" && !gameOver) fireMissile();
});

document.addEventListener("keyup", (ev) => {
    const key = ev.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// Touchscreen
function bindTouch(btnId, keyName) {
    const btn = document.getElementById(btnId);
    if(!btn) return;
    const action = (e) => {
        if(e.cancelable) e.preventDefault();
        if (keyName === "x") fireMissile();
        else keys[keyName] = true;
    };
    const stopAction = (e) => {
        if(e.cancelable) e.preventDefault();
        if (keyName !== "x") keys[keyName] = false;
    };
    
    btn.addEventListener("touchstart", action, {passive: false});
    btn.addEventListener("touchend", stopAction);
    btn.addEventListener("mousedown", action);
    btn.addEventListener("mouseup", stopAction);
}
bindTouch("btnUp", "arrowup");
bindTouch("btnDown", "arrowdown");
bindTouch("btnLeft", "arrowleft");
bindTouch("btnRight", "arrowright");
bindTouch("btnRotLeft", "z");
bindTouch("btnRotRight", "c");
bindTouch("btnFire", "x");

// Butonul de Restart din meniul Game Over
document.getElementById("restartBtn").addEventListener("click", () => {
    saveScore();
    initGame();
});

// ==========================================
// UPDATE (FIZICA & LOGICA)
// ==========================================
function update() {
    if (gameOver) return;

    // 1. Miscare Nava
    if (keys.arrowup && ship.y > SHIP_SIZE) ship.y -= SHIP_SPEED;
    if (keys.arrowdown && ship.y < canvas.height - SHIP_SIZE) ship.y += SHIP_SPEED;
    if (keys.arrowleft && ship.x > SHIP_SIZE) ship.x -= SHIP_SPEED;
    if (keys.arrowright && ship.x < canvas.width - SHIP_SIZE) ship.x += SHIP_SPEED;

    // 2. Rotire Nava
    if (keys.z) ship.a -= ROT_SPEED;
    if (keys.c) ship.a += ROT_SPEED;

    // 3. Miscare Asteroizi
    for (let i = 0; i < asteroids.length; i++) {
        let a = asteroids[i];
        a.x += a.vx;
        a.y += a.vy;
        
        // Ricoșeu pereti
        if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
        if (a.y < 0 || a.y > canvas.height) a.vy *= -1;
    }

    // 4. Miscare Rachete
    for (let i = missiles.length - 1; i >= 0; i--) {
        let m = missiles[i];
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < 0 || m.x > canvas.width || m.y < 0 || m.y > canvas.height) {
            missiles.splice(i, 1);
        }
    }

    checkCollisions();
    updateUI();
}

// ==========================================
// COLIZIUNI (PARTEA IMPORTANTA)
// ==========================================
function checkCollisions() {
    // A. Racheta vs Asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
        let a = asteroids[i];
        for (let j = missiles.length - 1; j >= 0; j--) {
            let m = missiles[j];
            // Distanta dintre puncte (Pitagora)
            if (Math.hypot(a.x - m.x, a.y - m.y) < a.r) {
                // Lovit!
                missiles.splice(j, 1); // Stergem racheta
                a.val--; // Scadem viata asteroidului
                
                if (a.val <= 0) {
                    asteroids.splice(i, 1); // Stergem asteroidul
                    addScore(100);
                    // Generam altul imediat
                    setTimeout(createAsteroid, 1000);
                } else {
                    // Actualizam culoarea/marimea
                    updateAsteroidVisuals(a, Math.hypot(a.vx, a.vy)); 
                }
                break;
            }
        }
    }

    // B. Nava vs Asteroid (1p)
    for (let i = 0; i < asteroids.length; i++) {
        let a = asteroids[i];
        // Verificam distanta
        if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.r + ship.r) {
            lives--;
            if (lives <= 0) {
                doGameOver();
            } else {
                resetShip();
                // Indepartam asteroidul periculos
                asteroids.splice(i, 1);
                createAsteroid(); 
            }
            break; 
        }
    }

    // C. Asteroid vs Asteroid (0.5p) - Ricoșeu
    for (let i = 0; i < asteroids.length; i++) {
        for (let j = i + 1; j < asteroids.length; j++) {
            let a1 = asteroids[i];
            let a2 = asteroids[j];
            
            // Daca se ating
            if (Math.hypot(a1.x - a2.x, a1.y - a2.y) < a1.r + a2.r) {
                // Simplu: Inversam directiile (schimbam vitezele intre ei)
                let tempVx = a1.vx; let tempVy = a1.vy;
                a1.vx = a2.vx; a1.vy = a2.vy;
                a2.vx = tempVx; a2.vy = tempVy;
                
                // Ii impingem putin ca sa nu ramana lipiti
                a1.x += a1.vx; a1.y += a1.vy;
            }
        }
    }
}

// Logica Scor si Regenerare vieti (1p)
function addScore(points) {
    score += points;
    scoreBuffer += points;
    if (scoreBuffer >= REGEN_SCORE) {
        lives++;
        scoreBuffer -= REGEN_SCORE; // Pastram restul
    }
}

function updateUI() {
    document.getElementById("scoreDisplay").innerText = score;
    document.getElementById("livesDisplay").innerText = lives;
}

// ==========================================
// GAME OVER & SALVARE (1p)
// ==========================================
function doGameOver() {
    gameOver = true;
    document.getElementById("gameOverScreen").style.display = "block";
    document.getElementById("finalScore").innerText = score;
}

function saveScore() {
    const name = document.getElementById("playerName").value || "Anonim";
    // Luam lista veche sau lista goala
    let highScores = JSON.parse(localStorage.getItem("asteroidsScores")) || [];
    
    // Adaugam scorul curent
    highScores.push({ name: name, score: score });
    
    // Sortam descrescator
    highScores.sort((a, b) => b.score - a.score);
    
    // Pastram doar top 5
    highScores = highScores.slice(0, 5);
    
    // Salvam inapoi in browser
    localStorage.setItem("asteroidsScores", JSON.stringify(highScores));
}

function displayHighScores() {
    const list = JSON.parse(localStorage.getItem("asteroidsScores")) || [];
    const container = document.getElementById("highScores");
    container.innerHTML = "<h3>Top 5 Clasament</h3>";
    list.forEach(s => {
        container.innerHTML += `<div style="margin:5px;">${s.name}: ${s.score}</div>`;
    });
}

// ==========================================
// DESENARE
// ==========================================
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Asteroizi
    asteroids.forEach(a => {
        ctx.beginPath();
        ctx.fillStyle = a.color;
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(a.val, a.x, a.y);
    });

    // Rachete
    ctx.fillStyle = "white";
    missiles.forEach(m => {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Nava (daca nu e game over)
    if (!gameOver) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.a);
        ctx.beginPath();
        ctx.moveTo(SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE, SHIP_SIZE);
        ctx.lineTo(-SHIP_SIZE/2, 0);
        ctx.lineTo(-SHIP_SIZE, -SHIP_SIZE);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

function gameLoop() {
    if (!gameOver) update();
    draw(); // Desenam si la game over ca sa ramana imaginea pe fundal
    requestAnimationFrame(gameLoop);
}

// Start
initGame();