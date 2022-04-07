import { Circle } from "./circle";

const config = {
  background: {
    color: "rgba(0, 0, 0, 0.1)",
  },
  score: {
    survive: 1,
    hit: 500,
    destroy: 1000,
  },
  player: {
    color: "white",
  },
  projectile: {
    radius: 3,
    speed: 5,
  },
  enemy: {
    randomizedSizeThreshold: 10000,
    radiusReductionPerHit: 10,
    minRadius: 10,
    maxRadius: 30,
  },
  explosionParticle: {
    maxRadius: 3,
    velocityReductionRate: 0.02,
    maxExplosionSize: 9,
  },
  backgroundParticle: {
    colors: ["white", "royalblue", "lightyellow", "coral"],
    maxRadius: 1,
    total: 1000,
    initialAlpha: 0.1,
  },
};

const defer = (fn: () => void) => setTimeout(fn, 0);

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
canvas.width = innerWidth;
canvas.height = innerHeight;

const context = canvas.getContext("2d") as CanvasRenderingContext2D;

let score = 0;
const scoreElement = document.querySelector("#score") as Element;

let bestScore = Number(localStorage.getItem("bestScore")) || 0;
const bestScoreElement = document.querySelector("#best-score") as Element;
bestScoreElement.innerHTML = bestScore.toString();

const projectiles: Circle[] = [];
const enemies: Circle[] = [];
const explosionParticles: Circle[] = [];

const backgroundParticles = Array.from(
  {
    length: config.backgroundParticle.total,
  },
  () => {
    return new Circle(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      config.backgroundParticle.maxRadius * Math.random(),
      config.backgroundParticle.colors[
        Math.floor(Math.random() * config.backgroundParticle.colors.length)
      ],
      undefined,
      config.backgroundParticle.initialAlpha
    );
  }
);

const player = new Circle(
  canvas.width / 2,
  canvas.height / 2,
  10,
  config.player.color,
  undefined,
  undefined
);
player.draw(context);

const generateEnemy = () => {
  // Initially the size of each enemy is fixed.
  // If score >= config.enemy.randomizedSizeThreshold, then the size is randomized.
  const radius =
    score > config.enemy.randomizedSizeThreshold
      ? Math.max(Math.random() * config.enemy.minRadius, config.enemy.maxRadius)
      : (config.enemy.minRadius + config.enemy.maxRadius) / 2;

  const randX = Math.random();
  const randY = Math.random();

  let x = randX * canvas.width;
  let y = randY * canvas.height;

  if (Math.random() < 0.5) {
    x = randX < 0.5 ? 0 - radius : canvas.width + radius;
  } else {
    y = randY < 0.5 ? 0 - radius : canvas.height + radius;
  }

  const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
  const velocity = {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };

  const enemy = new Circle(
    x,
    y,
    radius,
    `hsl(${Math.random() * 360}, 50% ,50%`,
    velocity,
    undefined
  );
  enemies.push(enemy);
};

const detectCollision = (a: Circle, b: Circle) => {
  const distance = Math.hypot(a.x - b.x, a.y - b.y);
  return distance - (a.radius + b.radius) < 1;
};

const handleGameOver = (animationId: number, score: number) => {
  cancelAnimationFrame(animationId);
  localStorage.setItem("bestScore", score.toString());
};

const handleProjectile = (projectile: Circle, index: number) => {
  projectile.move(context);

  // To reduce unnecessary computation, remove projectiles when they reach end of canvas
  if (
    projectile.x + projectile.radius < 0 ||
    projectile.x - projectile.radius > canvas.width ||
    projectile.y + projectile.radius < 0 ||
    projectile.y - projectile.radius > canvas.height
  ) {
    defer(() => {
      projectiles.splice(index, 1);
    });
  }
};

const handleEnemy =
  (animationId: number) => (enemy: Circle, enemyIndex: number) => {
    enemy.move(context);

    if (detectCollision(player, enemy)) {
      handleGameOver(animationId, score);
    }

    projectiles.forEach((projectile, projectileIndex) => {
      if (detectCollision(projectile, enemy)) {
        const isEnemyGreaterThanMin = enemy.radius > config.enemy.minRadius;

        // Render explosion effect.
        for (let i = 0; i < enemy.radius * 2; i++) {
          explosionParticles.push(
            new Circle(
              projectile.x,
              projectile.y,
              Math.random() * config.explosionParticle.maxRadius,
              enemy.color,
              {
                x:
                  (Math.random() - 0.5) *
                  (Math.random() * config.explosionParticle.maxExplosionSize),
                y:
                  (Math.random() - 0.5) *
                  (Math.random() * config.explosionParticle.maxExplosionSize),
              },
              undefined
            )
          );
        }

        if (isEnemyGreaterThanMin) {
          score += config.score.hit;
          enemy.radius -= config.enemy.radiusReductionPerHit;
        } else {
          score += config.score.destroy;
          defer(() => {
            enemies.splice(enemyIndex, 1);
          });
        }

        scoreElement.innerHTML = score.toString();

        defer(() => {
          projectiles.splice(projectileIndex, 1);
        });
      }
    });
  };

const handleExplosionParticle = (particle: Circle, index: number) => {
  if (particle.alpha <= 0) {
    defer(() => {
      explosionParticles.splice(index, 1);
    });
  } else {
    particle.fadeOut(context, config.explosionParticle.velocityReductionRate);
  }
};

const animate = () => {
  score += config.score.survive;
  scoreElement.innerHTML = score.toString();

  const animationId = requestAnimationFrame(animate);

  context.fillStyle = config.background.color;
  context.fillRect(0, 0, canvas.width, canvas.height);

  player.draw(context);
  projectiles.forEach(handleProjectile);
  enemies.forEach(handleEnemy(animationId));
  explosionParticles.forEach(handleExplosionParticle);
  backgroundParticles.forEach((particle: Circle) => particle.draw(context));
};

window.addEventListener("pointerdown", (event) => {
  const angle = Math.atan2(
    event.clientY - canvas.height / 2,
    event.clientX - canvas.width / 2
  );

  const p = new Circle(
    canvas.width / 2,
    canvas.height / 2,
    config.projectile.radius,
    config.player.color,
    {
      x: Math.cos(angle) * config.projectile.speed,
      y: Math.sin(angle) * config.projectile.speed,
    },
    undefined
  );
  projectiles.push(p);
});

animate();
setInterval(() => {
  generateEnemy();
}, 1000);
