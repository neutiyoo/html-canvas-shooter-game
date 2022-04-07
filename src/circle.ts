export class Circle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: { x: number; y: number };
  alpha: number;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity = { x: 0, y: 0 },
    alpha = 1
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = alpha;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
  move(ctx: CanvasRenderingContext2D) {
    this.draw(ctx);
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
  fadeOut(ctx: CanvasRenderingContext2D, reductionRate: number) {
    this.move(ctx);
    this.velocity.x *= 1 - reductionRate;
    this.velocity.y *= 1 - reductionRate;

    if (this.alpha > 0) {
      this.alpha -= 0.01;
    }
  }
}
