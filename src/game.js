class Bird {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width * 0.2;
    this.y = canvas.height / 2;
    this.velocity = 0;
    this.gravity = 0.3;    // Reduced gravity further
    this.lift = -8;        // Reduced lift force
    this.size = 25;
    this.rotation = 0;
    this.terminalVelocity = 10; // Reduced terminal velocity
  }

  update() {
    this.velocity += this.gravity;
    this.velocity = Math.min(this.velocity, this.terminalVelocity);
    this.velocity *= 0.97; // Increased air resistance
    this.y += this.velocity;

    this.rotation = Math.min(Math.PI / 3, Math.max(-Math.PI / 3, this.velocity * 0.1)); // Smoother rotation

    if (this.y + this.size > this.canvas.height) {
      this.y = this.canvas.height - this.size;
      this.velocity = 0;
    }
    if (this.y < this.size) {
      this.y = this.size;
      this.velocity = 0;
    }
  }

  flap() {
    const upwardBoost = this.velocity < 0 ? 1.1 : 1; // Reduced boost
    this.velocity = this.lift * upwardBoost;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Bird body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(-5, 0, this.size * 0.5, this.size * 0.3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.size * 0.3, -this.size * 0.2, this.size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupil
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.size * 0.4, -this.size * 0.2, this.size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.moveTo(this.size * 0.7, 0);
    ctx.lineTo(this.size * 1.2, -this.size * 0.1);
    ctx.lineTo(this.size * 1.2, this.size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}

class Pipe {
  constructor(canvas, x) {
    this.canvas = canvas;
    this.x = x;
    this.width = 80;
    this.gap = 200;
    this.topHeight = Math.random() * (canvas.height - this.gap - 150) + 50;
    this.bottomY = this.topHeight + this.gap;
    this.speed = 2.5;     // Reduced pipe speed
    this.scored = false;
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx) {
    const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
    gradient.addColorStop(0, '#2ecc71');
    gradient.addColorStop(1, '#27ae60');

    // Top pipe
    this.drawPipe(ctx, this.x, 0, this.width, this.topHeight, true);
    // Bottom pipe
    this.drawPipe(ctx, this.x, this.bottomY, this.width, this.canvas.height - this.bottomY, false);
  }

  drawPipe(ctx, x, y, width, height, isTop) {
    const pipeColor = '#2ecc71';
    const lipHeight = 30;
    const lipWidth = 10;

    ctx.fillStyle = pipeColor;
    // Main pipe body
    ctx.fillRect(x, y, width, height);
    
    // Pipe lip
    ctx.fillStyle = '#27ae60';
    if (isTop) {
      ctx.fillRect(x - lipWidth, y + height - lipHeight, width + lipWidth * 2, lipHeight);
    } else {
      ctx.fillRect(x - lipWidth, y, width + lipWidth * 2, lipHeight);
    }
  }

  offscreen() {
    return this.x < -this.width;
  }

  hits(bird) {
    const hitBox = 0.7;
    if (bird.x + bird.size * hitBox > this.x && bird.x - bird.size * hitBox < this.x + this.width) {
      if (bird.y - bird.size * hitBox < this.topHeight || bird.y + bird.size * hitBox > this.bottomY) {
        return true;
      }
    }
    return false;
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.bird = new Bird(this.canvas);
    this.pipes = [];
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    this.gameOver = false;
    this.frameCount = 0;
    this.started = false;

    const handleInput = () => {
      if (!this.started) {
        this.started = true;
      } else if (this.gameOver) {
        this.reset();
      } else {
        this.bird.flap();
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
      }
    });

    window.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleInput();
    });
  }

  reset() {
    this.bird = new Bird(this.canvas);
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.frameCount = 0;
    this.started = false;
  }

  update() {
    if (!this.started) return;
    if (this.gameOver) return;

    this.frameCount++;
    if (this.frameCount % 100 === 0) { // Increased pipe spawn interval
      this.pipes.push(new Pipe(this.canvas, this.canvas.width));
    }

    this.bird.update();

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      this.pipes[i].update();

      if (!this.pipes[i].scored && this.pipes[i].x + this.pipes[i].width < this.bird.x) {
        this.score++;
        this.pipes[i].scored = true;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('highScore', this.highScore);
        }
      }

      if (this.pipes[i].hits(this.bird)) {
        this.gameOver = true;
      }

      if (this.pipes[i].offscreen()) {
        this.pipes.splice(i, 1);
      }
    }
  }

  draw() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#4CA1AF');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.pipes.forEach(pipe => pipe.draw(this.ctx));
    this.bird.draw(this.ctx);

    this.ctx.fillStyle = '#fff';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    
    if (!this.started) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '48px Arial';
      this.ctx.fillText('Flappy Bird', this.canvas.width/2, this.canvas.height/2 - 50);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press Space or Tap to Start', this.canvas.width/2, this.canvas.height/2 + 20);
    } else {
      this.ctx.strokeText(`Score: ${this.score}`, this.canvas.width/2, 50);
      this.ctx.fillText(`Score: ${this.score}`, this.canvas.width/2, 50);
      
      this.ctx.font = 'bold 24px Arial';
      this.ctx.strokeText(`High Score: ${this.highScore}`, this.canvas.width/2, 90);
      this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width/2, 90);
    }

    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '48px Arial';
      this.ctx.fillText('Game Over!', this.canvas.width/2, this.canvas.height/2 - 50);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2);
      this.ctx.fillText('Press Space or Tap to Restart', this.canvas.width/2, this.canvas.height/2 + 40);
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new Game();
game.gameLoop();
