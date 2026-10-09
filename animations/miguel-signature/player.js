(() => {
  const BASE_W = 2172;
  const BASE_H = 724;
  const REDUCED = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const state = {
    config: null,
    layers: new Map(),
    animations: [],
    proceduralEnabled: true,
    speed: 1,
    paused: false,
    parallax: true,
    glow: true,
    raf: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 }
  };

  const scene = $('#scene');
  const stageShell = $('#stage-shell');
  const layerPanel = $('#layer-panel');
  const status = $('#status');
  const fxCanvas = $('#fx-canvas');
  const fxCtx = fxCanvas.getContext('2d');

  function spriteMetrics(spriteName, rect, sourceRect = rect) {
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
    const scaleX = destW / sourceW;
    const scaleY = destH / sourceH;
    const atlasLogicalW = a.width / a.scale;
    const atlasLogicalH = a.height / a.scale;
    const sourceX = ax / a.scale + (sx0 - bx0);
    const sourceY = ay / a.scale + (sy0 - by0);
    return {
      left: `${x0}px`, top: `${y0}px`, width: `${destW}px`, height: `${destH}px`,
      backgroundImage: `url("${a.src}")`,
      backgroundSize: `${atlasLogicalW * scaleX}px ${atlasLogicalH * scaleY}px`,
      backgroundPosition: `${-sourceX * scaleX}px ${-sourceY * scaleY}px`
    };
  }

  function applySprite(el, layer) {
    Object.assign(el.style, spriteMetrics(layer.sprite, layer.rect, layer.sourceRect || layer.rect));
    el.style.backgroundRepeat = 'no-repeat';
  }

  function createNode(className, layer, clip = false) {
    const el = document.createElement('div');
    el.className = className;
    if (clip) el.style.overflow = 'hidden';
    applySprite(el, layer);
    return el;
  }

  function addAnimation(target, track) {
    if (!track || REDUCED()) return null;
    const anim = target.animate(track.keyframes, {
      duration: track.duration,
      delay: track.delay || 0,
      easing: track.easing || 'linear',
      direction: track.direction || 'normal',
      iterations: track.iterations ?? Infinity,
      fill: track.fill || 'both',
      composite: track.composite || 'replace'
    });
    anim.playbackRate = state.speed;
    if (state.paused) anim.pause();
    state.animations.push(anim);
    return anim;
  }

  function makeLayer(layer) {
    const wrap = document.createElement('div');
    wrap.className = 'layer-wrap';
    wrap.dataset.layer = layer.id;
    wrap.style.zIndex = layer.z ?? 0;
    wrap.style.setProperty('--px', '0px');
    wrap.style.setProperty('--py', '0px');
    wrap.style.left = `${layer.rect[0]}px`;
    wrap.style.top = `${layer.rect[1]}px`;
    wrap.style.width = `${layer.rect[2] - layer.rect[0]}px`;
    wrap.style.height = `${layer.rect[3] - layer.rect[1]}px`;

    const shell = document.createElement('div');
    shell.className = 'layer-shell';
    const motion = createNode('layer-motion', layer);
    motion.style.left = '0'; motion.style.top = '0';
    motion.style.width = '100%'; motion.style.height = '100%';
    motion.style.transformOrigin = layer.origin || '50% 50%';
    motion.style.mixBlendMode = layer.blend || 'normal';
    shell.appendChild(motion);

    const nodes = { wrap, shell, motion };

    if (layer.fx?.glow) {
      const glow = createNode('layer-glow', layer);
      glow.style.left = '0'; glow.style.top = '0'; glow.style.width = '100%'; glow.style.height = '100%';
      glow.style.transformOrigin = layer.origin || '50% 50%';
      glow.style.opacity = String(layer.fx.glow.opacity ?? .12);
      glow.style.filter = `blur(${layer.fx.glow.blur ?? 5}px) brightness(${layer.fx.glow.brightness ?? 1.25}) saturate(${layer.fx.glow.saturation ?? 1.1})`;
      shell.appendChild(glow);
      nodes.glow = glow;
    }

    if (layer.fx?.echo) {
      const count = layer.fx.echo.count ?? 2;
      nodes.echoes = [];
      for (let i = 0; i < count; i++) {
        const echo = createNode('layer-echo', layer);
        echo.style.left = '0'; echo.style.top = '0'; echo.style.width = '100%'; echo.style.height = '100%';
        echo.style.transformOrigin = layer.origin || '50% 50%';
        echo.style.opacity = '0';
        echo.style.filter = `blur(${1 + i * 1.6}px) brightness(${1.1 + i * .15}) saturate(1.2)`;
        shell.appendChild(echo);
        nodes.echoes.push(echo);
      }
    }

    if (layer.fx?.shine) {
      const shine = document.createElement('div');
      shine.className = 'layer-shine';
      shine.style.left = '0'; shine.style.top = '0'; shine.style.width = '100%'; shine.style.height = '100%';
      shine.style.opacity = '0';
      shell.appendChild(shine);
      nodes.shine = shine;
    }

    wrap.appendChild(shell);
    scene.appendChild(wrap);
    state.layers.set(layer.id, { layer, nodes, tracks: [] });

    if (layer.tracks) {
      for (const track of layer.tracks) {
        const target = track.target || 'motion';
        const node = target.startsWith('echo') ? nodes.echoes?.[Number(target.replace('echo', '')) || 0] : nodes[target];
        if (node) addAnimation(target === 'shine' ? node.firstElementChild || node : node, track);
      }
    } else if (layer.animation) {
      addAnimation(motion, layer.animation);
    }

    if (nodes.shine && layer.fx?.shine) {
      const pseudo = document.createElement('div');
      pseudo.style.position = 'absolute';
      pseudo.style.inset = '-18% -30%';
      pseudo.style.background = layer.fx.shine.gradient || 'linear-gradient(112deg, transparent 0 35%, rgba(255,255,255,0) 40%, rgba(255,255,255,.18) 47%, rgba(255,50,50,.34) 54%, rgba(255,255,255,.10) 60%, transparent 70%)';
      pseudo.style.transform = 'translateX(-135%) skewX(-18deg)';
      nodes.shine.appendChild(pseudo);
      addAnimation(nodes.shine, {
        duration: layer.fx.shine.duration || 3600,
        delay: layer.fx.shine.delay || 0,
        easing: 'linear',
        iterations: Infinity,
        keyframes: [
          { opacity: 0, offset: 0 },
          { opacity: layer.fx.shine.opacity ?? .0, offset: .08 },
          { opacity: layer.fx.shine.opacity ?? .45, offset: .2 },
          { opacity: 0, offset: .38 },
          { opacity: 0, offset: 1 }
        ]
      });
      addAnimation(pseudo, {
        duration: layer.fx.shine.duration || 3600,
        delay: layer.fx.shine.delay || 0,
        easing: 'linear',
        iterations: Infinity,
        keyframes: [
          { transform: 'translateX(-135%) skewX(-18deg)' },
          { transform: 'translateX(145%) skewX(-18deg)' }
        ]
      });
    }

    if (nodes.echoes?.length && layer.fx?.echo) {
      nodes.echoes.forEach((echo, i) => {
        const amp = (layer.fx.echo.offset || 7) * (i + 1);
        const dur = (layer.fx.echo.duration || 2200) + i * 250;
        const delay = (layer.fx.echo.delay || 0) + i * 120;
        addAnimation(echo, {
          duration: dur,
          delay,
          easing: 'ease-out',
          iterations: Infinity,
          keyframes: [
            { opacity: 0, transform: 'translate(0px,0px) scale(1)', offset: 0 },
            { opacity: (layer.fx.echo.opacity || .18) / (i + 1), transform: `translate(${amp * .45}px, ${-amp * .22}px) scale(${1 + amp * .003})`, offset: .12 },
            { opacity: 0, transform: `translate(${amp}px, ${-amp * .5}px) scale(${1 + amp * .005})`, offset: .28 },
            { opacity: 0, transform: 'translate(0px,0px) scale(1)', offset: 1 }
          ]
        });
      });
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
      if (entry) entry.nodes.wrap.hidden = !input.checked;
    });
  }

  function resize() {
    const width = Math.max(1, stageShell.clientWidth);
    const scale = width / BASE_W;
    scene.style.transform = `scale(${scale})`;
    stageShell.style.height = `${BASE_H * scale}px`;
    fxCanvas.width = Math.max(1, Math.round(width * devicePixelRatio));
    fxCanvas.height = Math.max(1, Math.round(BASE_H * scale * devicePixelRatio));
    fxCanvas.style.width = `${width}px`;
    fxCanvas.style.height = `${BASE_H * scale}px`;
    fxCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function installParallax() {
    const p = state.pointer;
    stageShell.addEventListener('pointermove', e => {
      if (!state.parallax || REDUCED()) return;
      const r = stageShell.getBoundingClientRect();
      p.tx = ((e.clientX - r.left) / r.width - .5) * 2;
      p.ty = ((e.clientY - r.top) / r.height - .5) * 2;
    });
    stageShell.addEventListener('pointerleave', () => { p.tx = 0; p.ty = 0; });
  }

  function tickParallax() {
    const p = state.pointer;
    p.x += (p.tx - p.x) * .12;
    p.y += (p.ty - p.y) * .12;
    for (const { layer, nodes } of state.layers.values()) {
      const pr = layer.parallax || { x: 0, y: 0 };
      nodes.wrap.style.setProperty('--px', `${p.x * (pr.x || 0)}px`);
      nodes.wrap.style.setProperty('--py', `${p.y * (pr.y || 0)}px`);
    }
  }

  function seeded(seed) {
    let s = seed >>> 0;
    return () => ((s = Math.imul(1664525, s) + 1013904223 >>> 0) / 4294967296);
  }

  function drawProcedural() {
    const cfg = state.config.procedural || {};
    if (REDUCED()) return;
    const rnd = seeded(cfg.seed || 123);
    const embers = Array.from({ length: cfg.embers?.count || 26 }, () => ({
      x: rnd(), y: .2 + rnd() * .7, r: .8 + rnd() * 2.8, vy: .04 + rnd() * .08, vx: (rnd() - .5) * .02, phase: rnd() * Math.PI * 2
    }));
    const orbits = (cfg.orbits || []).map(o => ({ ...o, angle: rnd() * Math.PI * 2 }));
    const arcs = cfg.arcs || [];
    const flares = cfg.flares || [];
    const pulses = cfg.pulses || [];
    const start = performance.now();

    const linePoint = (pts, t) => {
      if (pts.length < 2) return pts[0] || { x: 0, y: 0 };
      const seg = (pts.length - 1) * t;
      const i = Math.min(pts.length - 2, Math.floor(seg));
      const f = seg - i;
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
      };
    };

    const frame = now => {
      const w = fxCanvas.clientWidth;
      const h = fxCanvas.clientHeight;
      fxCtx.clearRect(0, 0, w, h);
      tickParallax();
      if (!state.proceduralEnabled) {
        state.raf = requestAnimationFrame(frame);
        return;
      }
      if (!state.paused) {
        const t = (now - start) * .001 * state.speed;
        fxCtx.globalCompositeOperation = 'lighter';

        // Embers
        for (const p of embers) {
          const x = ((p.x + p.vx * t * .6 + 1) % 1) * w;
          const y = ((p.y - p.vy * t * .05 + 1.2) % 1.2) * h;
          const pulse = .3 + .7 * Math.sin(t * 1.5 + p.phase) ** 2;
          const rr = p.r * (1 + pulse * .8);
          const g = fxCtx.createRadialGradient(x, y, 0, x, y, rr * 5.5);
          g.addColorStop(0, `rgba(255,255,255,${.2 * pulse})`);
          g.addColorStop(.18, `rgba(255,86,64,${.5 * pulse})`);
          g.addColorStop(.48, `rgba(255,20,20,${.24 * pulse})`);
          g.addColorStop(1, 'rgba(255,0,0,0)');
          fxCtx.fillStyle = g;
          fxCtx.beginPath();
          fxCtx.arc(x, y, rr * 5.5, 0, Math.PI * 2);
          fxCtx.fill();
        }

        // Orbit sparks
        for (const o of orbits) {
          const cx = o.cx / BASE_W * w;
          const cy = o.cy / BASE_H * h;
          const count = o.count || 10;
          for (let i = 0; i < count; i++) {
            const a = t * (o.speed || .8) + i / count * Math.PI * 2 + o.angle;
            const rx = (o.rx || 28) * (w / BASE_W);
            const ry = (o.ry || 18) * (h / BASE_H);
            const x = cx + Math.cos(a) * rx;
            const y = cy + Math.sin(a * (o.twist || 1.1)) * ry;
            const alpha = .08 + .16 * (Math.sin(a * 1.7) * .5 + .5);
            const r = (o.size || 1.8) * (1 + .7 * Math.sin(a * 2.1));
            fxCtx.fillStyle = `rgba(255,60,45,${alpha})`;
            fxCtx.beginPath(); fxCtx.arc(x, y, r, 0, Math.PI * 2); fxCtx.fill();
          }
        }

        // Energy arcs following guide paths
        for (const arc of arcs) {
          const phase = (t * (arc.speed || .25) + (arc.offset || 0)) % 1;
          const length = arc.length || .18;
          const steps = arc.steps || 18;
          fxCtx.lineWidth = (arc.width || 5) * (w / BASE_W);
          fxCtx.strokeStyle = `rgba(255,${arc.tintGreen || 50},${arc.tintBlue || 42},${arc.opacity || .18})`;
          fxCtx.shadowBlur = 12;
          fxCtx.shadowColor = 'rgba(255,30,30,.45)';
          fxCtx.beginPath();
          for (let i = 0; i <= steps; i++) {
            let tt = phase - length + (i / steps) * length;
            while (tt < 0) tt += 1;
            tt = tt % 1;
            const pt = linePoint(arc.points, tt);
            const x = pt.x / BASE_W * w;
            const y = pt.y / BASE_H * h + Math.sin((i / steps + t * 2) * Math.PI * 2) * (arc.jitter || 2);
            if (i === 0) fxCtx.moveTo(x, y); else fxCtx.lineTo(x, y);
          }
          fxCtx.stroke();
          fxCtx.shadowBlur = 0;
        }

        // Flares
        for (const fl of flares) {
          const cx = fl.x / BASE_W * w;
          const cy = fl.y / BASE_H * h;
          const pulse = .4 + .6 * Math.sin(t * (fl.speed || 1.2) + (fl.phase || 0)) ** 2;
          const r = (fl.radius || 22) * (w / BASE_W) * (1 + pulse * .32);
          const g = fxCtx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.8);
          g.addColorStop(0, `rgba(255,255,255,${.24 * pulse})`);
          g.addColorStop(.18, `rgba(255,50,35,${.45 * pulse})`);
          g.addColorStop(.45, `rgba(255,0,0,${.16 * pulse})`);
          g.addColorStop(1, 'rgba(255,0,0,0)');
          fxCtx.fillStyle = g;
          fxCtx.beginPath(); fxCtx.arc(cx, cy, r * 2.8, 0, Math.PI * 2); fxCtx.fill();
        }

        // Pulse rings
        for (const p of pulses) {
          const cx = p.x / BASE_W * w;
          const cy = p.y / BASE_H * h;
          const cycle = (t / (p.duration || 2.5) + (p.offset || 0)) % 1;
          const rr = (p.min || 10) + cycle * ((p.max || 65) - (p.min || 10));
          fxCtx.strokeStyle = `rgba(255,36,36,${(1 - cycle) * (p.opacity || .22)})`;
          fxCtx.lineWidth = (p.width || 2) * (w / BASE_W);
          fxCtx.beginPath(); fxCtx.arc(cx, cy, rr * (w / BASE_W), 0, Math.PI * 2); fxCtx.stroke();
        }
      }
      state.raf = requestAnimationFrame(frame);
    };
    state.raf = requestAnimationFrame(frame);
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
    $('#backglow').style.opacity = String(p.backglow?.opacity ?? .78);
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
    $('#fx-toggle').addEventListener('change', e => state.proceduralEnabled = e.target.checked);
    $('#all-on').addEventListener('click', () => {
      $$('#layer-panel input').forEach(i => { i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); });
    });
    $('#reset').addEventListener('click', () => {
      setPlaybackRate(1);
      $('#speed').value = 1;
      if (state.paused) setPaused(false);
      $('#parallax').checked = true; state.parallax = true;
      $('#glow').checked = true; scene.classList.remove('no-glow');
      $('#fx-toggle').checked = true; state.proceduralEnabled = true;
      $$('#layer-panel input').forEach(i => { i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); });
    });
  }

  async function init() {
    try {
      try {
        const res = await fetch('animation.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        state.config = await res.json();
      } catch (fetchErr) {
        const inline = document.getElementById('animation-inline');
        if (!inline) throw fetchErr;
        state.config = JSON.parse(inline.textContent);
      }
      document.title = `${state.config.title} · Anima Pack`;
      for (const layer of state.config.layers) makeLayer(layer);
      buildLayerControls();
      buildProcedural();
      installParallax();
      installControls();
      resize();
      addEventListener('resize', resize, { passive: true });
      drawProcedural();
      if (state.config.interaction?.autoPauseWhenHidden) {
        document.addEventListener('visibilitychange', () => setPaused(document.hidden));
      }
      const tracksCount = state.config.layers.reduce((sum, layer) => sum + ((layer.tracks && layer.tracks.length) || (layer.animation ? 1 : 0)), 0);
      status.textContent = `${state.config.layers.length} camadas · ${tracksCount} tracks independentes · FX procedurais dirigidos por JSON`;
    } catch (err) {
      console.error(err);
      status.textContent = `Erro ao carregar animation.json: ${err.message}`;
      status.classList.add('error');
    }
  }

  init();
})();