export function fireConfetti(
  originX = window.innerWidth / 2,
  originY = window.innerHeight / 2,
  colors = ["#e84393", "#6c5ce7", "#0984e3", "#00b894", "#fdcb6e", "#e5484d", "#f5a623"]
) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:99999;pointer-events:none";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const particles: {
    x: number; y: number;
    vx: number; vy: number;
    w: number; h: number;
    color: string;
    rot: number; rotV: number;
    life: number;
  }[] = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: originX + (Math.random() - 0.5) * 200,
      y: originY,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }

  let frame = 0;
  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.vy += 0.25;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      p.life -= 0.008;
      if (p.life <= 0) continue;
      alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (alive && frame < 300) {
      requestAnimationFrame(loop);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(loop);
}

export function fireExplosion(
  originX = window.innerWidth / 2,
  originY = window.innerHeight / 2,
) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:99999;pointer-events:none";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;

  // Brief white flash + vignette fade
  let flash = 1;
  // Scattered debris: small rectangles that fall from the origin
  const debris: {
    x: number; y: number;
    vx: number; vy: number;
    w: number; h: number;
    rot: number; rotV: number;
    life: number;
    shade: string;
  }[] = [];

  const shades = ["#888", "#666", "#999", "#555", "#777"];
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 2;
    debris.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      w: Math.random() * 6 + 2,
      h: Math.random() * 4 + 1,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.4,
      life: 1,
      shade: shades[Math.floor(Math.random() * shades.length)],
    });
  }

  let frame = 0;
  const loop = () => {
    ctx.clearRect(0, 0, w, h);
    let alive = false;

    // Flash overlay (fades quickly)
    if (flash > 0) {
      ctx.globalAlpha = flash * 0.25;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      flash -= 0.06;
      alive = true;
    }

    // Debris particles
    for (const d of debris) {
      d.vy += 0.18;
      d.x += d.vx;
      d.y += d.vy;
      d.rot += d.rotV;
      d.life -= 0.012;
      if (d.life <= 0) continue;
      alive = true;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.globalAlpha = d.life;
      ctx.fillStyle = d.shade;
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    frame++;
    if (alive && frame < 200) {
      requestAnimationFrame(loop);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(loop);
}
