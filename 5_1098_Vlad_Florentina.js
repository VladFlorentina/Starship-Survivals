// ==========================================
// 1. CONFIGURARE
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SHIP_SIZE = 20;
const SHIP_SPEED = 5;
const ROT_SPEED = 0.08;
const MISSILE_SPEED = 7; // Viteza rachetei
const MAX_MISSILES = 3;  // Maxim 3 rachete simultan

// Liste pentru obiecte
let asteroids = []; 
let missiles = []; // Lista pentru rachete

// Starea tastelor
const keys = {
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false,
    z: false, 
    c: false, 
    x: false  
};

// ==========================================
// 2. DEFINIRE NAVA
// ==========================================
const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    a: -Math.PI / 2, // Unghiul (-90 grade = sus)
    r: SHIP_SIZE
};

// ==========================================
// 3. GENERARE ASTEROIZI
// ==========================================
function createAsteroid() {
    const val = Math.floor(Math.random() * 4) + 1;
    let color, radius;
    if (val === 4) { color = "red"; radius = 50; }
    else if (val === 3) { color = "orange"; radius = 40; }
    else if (val === 2) { color = "yellow"; radius = 30; }
    else { color = "#00FF00"; radius = 20; }

    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const speed = Math.random() * 2 + 0.5;
    const angle = Math.random() * Math.PI * 2;

    asteroids.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: radius,
        color: color,
        val: val
    });
}

for (let i = 0; i < 5; i++) createAsteroid();

// ==========================================
// 4. FUNCTIE TRAGERE (NOU)
// ==========================================
function fireMissile() {
    // Verificam daca avem deja 3 rachete (Cerinta)
    if (missiles.length >= MAX_MISSILES) {
        return; // Iesim din functie, nu tragem
    }

    // Calculam varful navei (de unde pleaca racheta)
    // Folosim aceeasi matematica ca la desenare
    const noseX = ship.x + SHIP_SIZE * Math.cos(ship.a);
    const noseY = ship.y + SHIP_SIZE * Math.sin(ship.a);

    // Adaugam racheta in lista
    missiles.push({
        x: noseX,
        y: noseY,
        vx: Math.cos(ship.a) * MISSILE_SPEED, // Viteza pe X
        vy: Math.sin(ship.a) * MISSILE_SPEED  // Viteza pe Y
    });
}

// ==========================================
// 5. INPUT
// ==========================================
document.addEventListener("keydown", (ev) => {
    const key = ev.key.toLowerCase();
    
    if(["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        ev.preventDefault();
    }

    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }

    // TRAGERE: Doar cand apesi tasta (keydown), nu continuu
    if (key === "x") {
        fireMissile();
    }
});

document.addEventListener("keyup", (ev) => {
    const key = ev.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Touchscreen code
function bindTouch(btnId, keyName) {
    const btn = document.getElementById(btnId);
    if(!btn) return;
    
    // Pentru butoanele normale (directii)
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); keys[keyName] = true; });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[keyName] = false; });
    btn.addEventListener("mousedown", () => keys[keyName] = true);
    btn.addEventListener("mouseup", () => keys[keyName] = false);

    // SPECIAL PENTRU BUTONUL DE FOC (TOUCH)
    if (keyName === "x") {
        btn.addEventListener("touchstart", (e) => { 
            e.preventDefault(); 
            fireMissile(); // Trage direct cand atingi ecranul
        });
        btn.addEventListener("mousedown", () => fireMissile());
    }
}
bindTouch("btnUp", "arrowup");
bindTouch("btnDown", "arrowdown");
bindTouch("btnLeft", "arrowleft");
bindTouch("btnRight", "arrowright");
bindTouch("btnRotLeft", "z");
bindTouch("btnRotRight", "c");
bindTouch("btnFire", "x");

// ==========================================
// 6. UPDATE
// ==========================================
function update() {
    // Miscare Nava
    if (keys.arrowup && ship.y > SHIP_SIZE) ship.y -= SHIP_SPEED;
    if (keys.arrowdown && ship.y < canvas.height - SHIP_SIZE) ship.y += SHIP_SPEED;
    if (keys.arrowleft && ship.x > SHIP_SIZE) ship.x -= SHIP_SPEED;
    if (keys.arrowright && ship.x < canvas.width - SHIP_SIZE) ship.x += SHIP_SPEED;

    // Rotire Nava
    if (keys.z) ship.a -= ROT_SPEED;
    if (keys.c) ship.a += ROT_SPEED;

    // Miscare Asteroizi
    for (let i = 0; i < asteroids.length; i++) {
        let a = asteroids[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
        if (a.y < 0 || a.y > canvas.height) a.vy *= -1;
    }

    // MISCARE RACHETE (NOU)
    // Parcurgem lista invers ca sa putem sterge elemente
    for (let i = missiles.length - 1; i >= 0; i--) {
        let m = missiles[i];
        
        m.x += m.vx;
        m.y += m.vy;

        // Daca iese din ecran, o stergem
        if (m.x < 0 || m.x > canvas.width || m.y < 0 || m.y > canvas.height) {
            missiles.splice(i, 1);
        }
    }
}

// ==========================================
// 7. DRAW
// ==========================================
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Asteroizi
    for (let i = 0; i < asteroids.length; i++) {
        let a = asteroids[i];
        ctx.beginPath();
        ctx.fillStyle = a.color;
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(a.val, a.x, a.y);
    }

    // DESENARE RACHETE (NOU)
    ctx.fillStyle = "white"; // Culoare racheta
    for (let i = 0; i < missiles.length; i++) {
        let m = missiles[i];
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2); // Un punct alb mic
        ctx.fill();
    }

    // Nava
    drawShip();
}

function drawShip() {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.a);
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);            
    ctx.lineTo(-SHIP_SIZE, SHIP_SIZE);   
    ctx.lineTo(-SHIP_SIZE / 2, 0);       
    ctx.lineTo(-SHIP_SIZE, -SHIP_SIZE);  
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();