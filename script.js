class FlyingObject {
    constructor(speed, x, y, src, type = 'enemy', width = 50, height = 50, className = '') {
        this.speed = speed;
        this.x = x;
        this.y = y;
        this.src = src;
        this.type = type;
        this.width = width;
        this.height = height;
        this.className = className;
        this.element = new Image();
        this.element.src = this.src;
        this.element.classList.add(this.className);
        this.element.style.position = "absolute";
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        document.querySelector("#board").appendChild(this.element);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.updatePosition();
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    remove() {
        document.querySelector("#board").removeChild(this.element);
    }

    checkCollision(other) {
        const thisRect = this.element.getBoundingClientRect();
        const otherRect = other.element.getBoundingClientRect();
        return !(thisRect.right < otherRect.left || 
                 thisRect.left > otherRect.right || 
                 thisRect.bottom < otherRect.top || 
                 thisRect.top > otherRect.bottom);
    }
}

class Game {
    constructor() {
        this.player = null;
        this.fire = null;
        this.bullets = [];
        this.bottles = [];
        this.time = 0;
        this.hp = 150;
        this.gameInterval = null;
        this.bulletInterval = null;
        this.fireInterval = null;
        this.bottleInterval = null;
        this.keysPressed = [0, 0, 0, 0];
        this.bestTime = localStorage.getItem('bestTime') ? parseInt(localStorage.getItem('bestTime')) : 0; // Load best time from localStorage
        this.init();
    }

    init() {
        this.hp = 150;
        this.time = 0;
        this.bullets = [];
        this.bottles = [];

        document.querySelector("#board").innerHTML = '';

        document.getElementById('time').textContent = this.time;
        document.getElementById('best-time').textContent = this.bestTime;
        document.getElementById('hp').value = this.hp;

        this.player = new FlyingObject(10, 100, 80, "woda.webp", "player", 200, 200, 'woda');
        this.fire = new FlyingObject(0.01, 300, 300, "ogien.webp", "enemy", 200, 200, 'ogien');

        this.startTimer();
        this.startShooting();
        this.startFireMovement();
        this.startBottleSpawn();

        document.getElementById('gameOverScreen').style.display = 'none';

        this.addKeyListeners();
    }

    startTimer() {
        const timeDisplay = document.getElementById('time');
        this.gameInterval = setInterval(() => {
            this.time += 1;
            timeDisplay.textContent = this.time;

            if (this.time > this.bestTime) {
                this.bestTime = this.time;
                document.getElementById('best-time').textContent = this.bestTime;
                localStorage.setItem('bestTime', this.bestTime); 
            }
        }, 1000);
    }

    startShooting() {
        this.bulletInterval = setInterval(() => {
            const dx = (this.player.x - this.fire.x) * 0.05;
            const dy = (this.player.y - this.fire.y) * 0.07;

            const bullet = new FlyingObject(15, this.fire.x + 0, this.fire.y + 0, "pocisk.webp", 'bullet', 40, 40, 'pocisk');
            this.bullets.push({ bullet, direction: { dx, dy } });
        }, 500);
    }

    startFireMovement() {
        this.fireInterval = setInterval(() => {
            const dx = (this.player.x - this.fire.x) * 0.04;
            const dy = (this.player.y - this.fire.y) * 0.04;
            this.fire.move(dx, dy);
        }, 20);
    }

    startBottleSpawn() {
        this.bottleInterval = setInterval(() => {
            this.spawnBottle();
        }, 10000);
    }

    spawnBottle() {
        const x = Math.random() * (window.innerWidth - 100);
        const y = Math.random() * (window.innerHeight - 100);
        const bottle = new FlyingObject(0, x, y, "butelka.webp", 'bottle', 50, 50, 'bottle');
        this.bottles.push(bottle);
    }

    handlePlayerMovement() {
        if (this.keysPressed[2] == 1 && this.player.x > 0) {
            this.player.move(-1 * this.player.speed, 0);
        }

        if (this.keysPressed[0] == 1 && this.player.y > 0) {
            this.player.move(0, -1 * this.player.speed);
        }

        if (this.keysPressed[1] == 1 && this.player.y + this.player.height * 0.8 < window.innerHeight) {
            this.player.move(0, this.player.speed);
        }

        if (this.keysPressed[3] == 1 && this.player.x + this.player.width / 4 < window.innerWidth) {
            this.player.move(this.player.speed, 0);
        }
    }

    checkCollisions() {
        this.bullets.forEach((bullet, index) => {
            if (this.player.checkCollision(bullet.bullet)) {
                this.hp -= 10;
                this.updateHealthBar();
                bullet.bullet.remove();
                this.bullets.splice(index, 1);
            }
        });

        if (this.player.checkCollision(this.fire)) {
            this.hp -= 1;
            this.updateHealthBar();
        }

        this.bottles.forEach((bottle, index) => {
            if (this.player.checkCollision(bottle)) {
                this.hp += 10;
                this.updateHealthBar();
                bottle.remove();
                this.bottles.splice(index, 1);
            }
        });
    }

    updateHealthBar() {
        const hpBar = document.getElementById('hp');
        hpBar.value = this.hp;
        if (this.hp <= 0) {
            this.endGame();
        }
    }

    endGame() {
        clearInterval(this.gameInterval);
        clearInterval(this.bulletInterval);
        clearInterval(this.fireInterval);
        clearInterval(this.bottleInterval);

        document.getElementById('gameOverScreen').style.display = 'block';
    }

    moveBullets() {
        this.bullets.forEach((bullet, index) => {
            bullet.bullet.move(bullet.direction.dx, bullet.direction.dy);
            if (bullet.bullet.x < 0 || bullet.bullet.x > window.innerWidth || bullet.bullet.y < 0 || bullet.bullet.y > window.innerHeight) {
                bullet.bullet.remove();
                this.bullets.splice(index, 1);
            }
        });
    }

    gameLoop() {
        this.moveBullets();
        this.checkCollisions();
        this.handlePlayerMovement();
    }

    addKeyListeners() {
        document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowUp") this.keysPressed[0] = 1;
            if (event.key === "ArrowDown") this.keysPressed[1] = 1;
            if (event.key === "ArrowLeft") this.keysPressed[2] = 1;
            if (event.key === "ArrowRight") this.keysPressed[3] = 1;
        });

        document.addEventListener("keyup", (event) => {
            if (event.key === "ArrowUp") this.keysPressed[0] = 0;
            if (event.key === "ArrowDown") this.keysPressed[1] = 0;
            if (event.key === "ArrowLeft") this.keysPressed[2] = 0;
            if (event.key === "ArrowRight") this.keysPressed[3] = 0;
        });
    }

    setupRestartButton() {
        document.getElementById('restartButton').addEventListener('click', () => {
            this.init();
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const game = new Game();
    setInterval(() => game.gameLoop(), 20);

    game.setupRestartButton();
});
