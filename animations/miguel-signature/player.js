(() => {
  const BASE_W = 2172;
  const BASE_H = 724;
  const state = { config: null, animations: [], speed: 1, paused: false, parallax: true, glow: true, layers: new Map(), raf: 0 };
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const scene = $('#scene');
  const stageShell = $('#stage-shell');
  const layerPanel = $('#layer-panel');
  const status = $('#status');
  const particleCanvas = $('#particles');
  const ctx = particleCanvas.getContext('2d');

  function spriteStyle(spriteName, rect, sourceRect = rect) {
    const a = state.config.atlas;
    const sprite = a.sprites[spriteName];
    if (!sprite) throw new Error(`Sprite ausente: ${spriteName}`);

    const [ax, ay] = sprite.atlas;
    const [bx0, by0] = sprite.bbox;
    const [x0, y0, x1, y1] = rect;
    const [sx0, sy0, sx1, sy1] = sourceRect;

    const destW = Math.max(1, x1 - x0);
    const destH = Math.max(1, y1 - y0);
    const sourceW = Math.max(1, sx1 - sx0);
    const sourceH = Math.max(1, sy1 - sy0);

    // O atlas guarda cada sprite reduzido por atlas.scale. Convertemos de volta
    // ao espaço lógico da arte e depois escalamos o recorte de origem para o
    // retângulo de destino. Assim sourceRect e rect podem ter tamanhos diferentes.
    const scaleX = destW / sourceW;
    const scaleY = destH / sourceH;
    const atlasLogicalW = a.width / a.scale;
    const atlasLogicalH = a.height / a.scale;
    const sourceX = ax / a.scale + (sx0 - bx0);
    const sourceY = ay / a.scale + (sy0 - by0);

    return {
      left: `${x0}px`,
      top: `${y0}px`,
      width: `${destW}px`,
      height: `${destH}px`,
      backgroundImage: `url("${a.src}")`,
      backgroundSize: `${atlasLogicalW * scaleX}px ${atlasLogicalH * scaleY}px`,
      backgroundPosition: `${-sourceX * scaleX}px ${-sourceY * scaleY}px`
    };
  }

  function makeLayer(layer) {
    const wrap = document.createElement('div');
    wrap.className = 'layer-wrap';
    wrap.dataset.layer = layer.id;
    wrap.style.zIndex = layer.z ?? 0;
    wrap.style.setProperty('--px', '0px');
    wrap.style.setProperty('--py', '0px');
    Object.assign(wrap.style, spriteStyle(layer.sprite, layer.rect, layer.sourceRect || layer.rect));
    const motion = document.createElement('div');
    motion.className = 'layer-motion';
    motion.style.backgroundImage = wrap.style.backgroundImage;
    motion.style.backgroundSize = wrap.style.backgroundSize;
    motion.style.backgroundPosition = wrap.style.backgroundPosition;
    motion.style.transformOrigin = layer.origin || '50% 50%';
    motion.style.mixBlendMode = layer.blend || 'normal';
    wrap.style.backgroundImage = 'none';
    wrap.appendChild(motion);
    scene.appendChild(wrap);
    state.layers.set(layer.id, { wrap, motion, layer });

    const a = layer.animation;
    if (a && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const anim = motion.animate(a.keyframes, {
        duration: a.duration,
        delay: a.delay || 0,
        easing: a.easing || 'linear',
        direction: a.direction || 'normal',
        iterations: Infinity,
        fill: 'both'
      });
      anim.playbackRate = state.speed;
      state.animations.push(anim);
    }
  }

  function buildLayerControls() {
    layerPanel.innerHTML = '';
    for (const layer of state.config.layers) {
      const label = document.createElement('label');
      label.className = 'layer-check';
      label.innerHTML = `<input type="checkbox" checked data-id="${layer.id}"><span>${layer.label}</span>`;
      layerPanel.appendChild(label);
    }
    layerPanel.addEventListener('change', e => {
      const input = e.target.closest('input[data-id]');
      if (!input) return;
      const entry = state.layers.get(input.dataset.id);
      if (entry) entry.wrap.hidden = !input.checked;
    });
  }

  function resize() {
    const width = Math.max(1, stageShell.clientWidth);
    const scale = width / BASE_W;
    scene.style.transform = `scale(${scale})`;
    stageShell.style.height = `${BASE_H * scale}px`;
    particleCanvas.width = Math.max(1, Math.round(width * devicePixelRatio));
    particleCanvas.height = Math.max(1, Math.round(BASE_H * scale * devicePixelRatio));
    particleCanvas.style.width = `${width}px`;
    particleCanvas.style.height = `${BASE_H * scale}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function installParallax() {
    stageShell.addEventListener('pointermove', e => {
      if (!state.parallax || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const r = stageShell.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - .5) * 2;
      const ny = ((e.clientY - r.top) / r.height - .5) * 2;
      for (const { wrap, layer } of state.layers.values()) {
        const p = layer.parallax || {x:0,y:0};
        wrap.style.setProperty('--px', `${nx * (p.x || 0)}px`);
        wrap.style.setProperty('--py', `${ny * (p.y || 0)}px`);
      }
    });
    stageShell.addEventListener('pointerleave', () => {
      for (const { wrap } of state.layers.values()) {
        wrap.style.setProperty('--px', '0px');
        wrap.style.setProperty('--py', '0px');
      }
    });
  }

  function seeded(seed) {
    let s = seed >>> 0;
    return () => ((s = Math.imul(1664525, s) + 1013904223 >>> 0) / 4294967296);
  }

  function startParticles() {
    const cfg = state.config.procedural?.particles;
    if (!cfg?.enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rnd = seeded(cfg.seed || 1);
    const particles = Array.from({length: cfg.count || 24}, () => ({
      x: rnd(), y: .18 + rnd() * .66, size: .7 + rnd() * 2.4, phase: rnd() * Math.PI * 2,
      drift: (rnd() - .5) * .00022, speed: .45 + rnd() * 1.25
    }));
    const start = performance.now();
    const tick = now => {
      const w = particleCanvas.clientWidth, h = particleCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      if (!state.paused) {
        const t = (now - start) * .001 * state.speed;
        ctx.globalCompositeOperation = 'lighter';
        for (const p of particles) {
          const x = ((p.x + t * p.drift + 1) % 1) * w;
          const y = p.y * h + Math.sin(t * p.speed + p.phase) * 6;
          const pulse = .45 + .55 * Math.sin(t * (1.2 + p.speed) + p.phase) ** 2;
          const r = p.size * (1 + pulse * .9);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5);
          g.addColorStop(0, `rgba(255,245,245,${(cfg.opacity || .7) * pulse})`);
          g.addColorStop(.18, `rgba(255,60,50,${.75 * pulse})`);
          g.addColorStop(1, 'rgba(255,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x, y, r * 4.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
  }

  function buildProcedural() {
    const p = state.config.procedural || {};
    const sweep = $('#sweep');
    sweep.hidden = !p.sweep?.enabled;
    if (p.sweep?.enabled) {
      sweep.style.animationDuration = `${p.sweep.duration || 6000}ms`;
      sweep.style.animationDelay = `${p.sweep.delay || 0}ms`;
    }
    const scan = $('#scanlines');
    scan.hidden = !p.scanlines?.enabled;
    if (p.scanlines?.enabled) scan.style.opacity = p.scanlines.opacity ?? .05;
  }

  function setPlaybackRate(rate) {
    state.speed = rate;
    for (const anim of state.animations) anim.playbackRate = rate;
    $('#speed-value').textContent = `${rate.toFixed(2)}×`;
  }

  function setPaused(paused) {
    state.paused = paused;
    for (const anim of state.animations) paused ? anim.pause() : anim.play();
    $('#pause').textContent = paused ? '▶ Reproduzir' : 'Ⅱ Pausar';
    document.body.classList.toggle('paused', paused);
  }

  function installControls() {
    $('#pause').addEventListener('click', () => setPaused(!state.paused));
    $('#speed').addEventListener('input', e => setPlaybackRate(Number(e.target.value)));
    $('#parallax').addEventListener('change', e => state.parallax = e.target.checked);
    $('#glow').addEventListener('change', e => {
      state.glow = e.target.checked;
      scene.classList.toggle('no-glow', !state.glow);
    });
    $('#all-on').addEventListener('click', () => {
      $$('#layer-panel input').forEach(i => { i.checked = true; i.dispatchEvent(new Event('change', {bubbles:true})); });
    });
    $('#reset').addEventListener('click', () => {
      setPlaybackRate(1);
      $('#speed').value = 1;
      if (state.paused) setPaused(false);
      $('#parallax').checked = true; state.parallax = true;
      $('#glow').checked = true; scene.classList.remove('no-glow');
      $$('#layer-panel input').forEach(i => { i.checked = true; i.dispatchEvent(new Event('change', {bubbles:true})); });
    });
  }

  async function init() {
    try {
      const res = await fetch('animation.json?v=2.1.0', {cache:'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.config = await res.json();
      document.title = `${state.config.title} · Anima Pack`;
      for (const layer of state.config.layers) makeLayer(layer);
      buildLayerControls();
      buildProcedural();
      installParallax();
      installControls();
      resize();
      addEventListener('resize', resize, {passive:true});
      startParticles();
      if (state.config.interaction?.autoPauseWhenHidden) {
        document.addEventListener('visibilitychange', () => setPaused(document.hidden));
      }
      status.textContent = `${state.config.layers.length} camadas independentes · JSON + Web Animations API`;
    } catch (err) {
      console.error(err);
      status.textContent = `Erro ao carregar animation.json: ${err.message}`;
      status.classList.add('error');
    }
  }
  init();
})();