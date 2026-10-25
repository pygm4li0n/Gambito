/* ══════════════════════════════════════════════════════════
   GAMBITO LÁSER — app.js
   1) Engraving simulator (canvas)   2) Catalog + admin + Supabase
   3) Scroll / reveal / tilt / counters   4) Ambient sparks + cursor
   ══════════════════════════════════════════════════════════ */

/* ═════════════════ 1 · LIVE ENGRAVING SIMULATOR ═════════════════ */
(function engraveStage() {
  "use strict";
  var cv = document.getElementById("engraveCanvas");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 900, K = 1.25, R = W * K;
  function layer() { var c = document.createElement("canvas"); c.width = c.height = R; var x = c.getContext("2d"); x.scale(K, K); return [c, x]; }
  var pl = layer(), plate = pl[0], pc = pl[1];
  var bl = layer(), burn = bl[0], bc = bl[1];

  var CARD = { x: 120, y: 243, w: 660, h: 414, r: 26 };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  /* palettes ---------------------------------------------------- */
  var MATS = {
    steel:   { name: "ACERO", type: "brushed", base: ["#dfe5ec", "#a2abb7", "#cfd6de", "#8d96a3", "#c4ccd5"], cut: "#2b313b", hi: "#ffffff", bright: false, soft: false,
               glow: "168,222,255", spark: ["255,255,255", "170,220,255"], sparks: 1, smoke: 0.35, shake: 0.5, speed: 1, pow: 65 },
    alu:     { name: "ALUMINIO", type: "brushed", base: ["#2b3547", "#1a2130", "#2c3649", "#151b27", "#252e3f"], cut: "#eef3f9", hi: "#ffffff", bright: true, soft: false,
               glow: "190,230,255", spark: ["255,255,255", "190,230,255"], sparks: 0.8, smoke: 0.25, shake: 0.4, speed: 1.15, pow: 55 },
    wood:    { name: "MADERA", type: "wood", base: ["#c68c55", "#a9743f", "#bd8350", "#97642f", "#b97d49"], cut: "#24110a", hi: "#e1ae7e", bright: false, soft: true,
               glow: "255,150,60", spark: ["255,240,200", "255,150,50"], sparks: 0.55, smoke: 1.3, shake: 0.3, speed: 0.8, pow: 38 },
    leather: { name: "CUERO", type: "leather", base: ["#5a331d", "#46250f", "#573119", "#3d200d", "#4f2c16"], cut: "#150a05", hi: "#8d5a3a", bright: false, soft: true,
               glow: "255,120,40", spark: ["255,220,170", "255,120,40"], sparks: 0.35, smoke: 1.0, shake: 0.25, speed: 0.75, pow: 30 }
  };
  var mat = "steel";

  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  /* plate (material surface) ------------------------------------ */
  function paintPlate() {
    var m = MATS[mat], c = pc, i, x, y;
    c.clearRect(0, 0, W, W);
    c.save(); c.shadowColor = "rgba(0,0,0,.8)"; c.shadowBlur = 55; c.shadowOffsetY = 28;
    rr(c, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); c.fillStyle = m.base[0]; c.fill(); c.restore();

    c.save(); rr(c, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); c.clip();
    var g = c.createLinearGradient(0, CARD.y, 0, CARD.y + CARD.h);
    m.base.forEach(function (col, k) { g.addColorStop(k / (m.base.length - 1), col); });
    c.fillStyle = g; c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);

    if (m.type === "brushed") {
      for (i = 0; i < 1700; i++) {
        y = rnd(CARD.y, CARD.y + CARD.h); x = rnd(CARD.x - 60, CARD.x + CARD.w);
        c.strokeStyle = Math.random() > 0.5 ? "rgba(255,255,255," + rnd(0.03, 0.13) + ")" : "rgba(0,0,0," + rnd(0.03, 0.12) + ")";
        c.lineWidth = rnd(0.4, 1.1); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rnd(60, 420), y + rnd(-0.4, 0.4)); c.stroke();
      }
    } else if (m.type === "wood") {
      for (i = 0; i < 80; i++) {
        c.strokeStyle = "rgba(70,34,10," + rnd(0.1, 0.26) + ")"; c.lineWidth = rnd(0.6, 1.8); c.beginPath();
        for (x = CARD.x - 10; x <= CARD.x + CARD.w + 10; x += 10) {
          y = CARD.y + i * 5.4 + Math.sin(x * 0.018 + i * 0.7) * 4 + Math.sin(x * 0.005 + i * 2.1) * 9;
          x === CARD.x - 10 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
      }
    } else {
      for (i = 0; i < 6500; i++) {
        c.fillStyle = Math.random() > 0.3 ? "rgba(0,0,0,.2)" : "rgba(255,210,160,.05)";
        c.beginPath(); c.arc(rnd(CARD.x, CARD.x + CARD.w), rnd(CARD.y, CARD.y + CARD.h), rnd(0.4, 1.3), 0, 6.283); c.fill();
      }
      c.strokeStyle = "rgba(255,190,130,.28)"; c.lineWidth = 1.4; c.setLineDash([7, 6]);
      rr(c, CARD.x + 12, CARD.y + 12, CARD.w - 24, CARD.h - 24, CARD.r - 8); c.stroke(); c.setLineDash([]);
    }

    c.globalCompositeOperation = "screen";
    var sh = c.createLinearGradient(CARD.x, CARD.y, CARD.x + CARD.w, CARD.y + CARD.h);
    sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.32, "rgba(255,255,255,.2)"); sh.addColorStop(0.5, "rgba(255,255,255,.02)"); sh.addColorStop(0.7, "rgba(255,255,255,.14)"); sh.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = sh; c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
    c.globalCompositeOperation = "source-over";
    var vg = c.createRadialGradient(450, 450, 120, 450, 450, 460);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.38)");
    c.fillStyle = vg; c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
    c.restore();

    c.save(); rr(c, CARD.x + .75, CARD.y + .75, CARD.w - 1.5, CARD.h - 1.5, CARD.r); c.lineWidth = 1.5; c.strokeStyle = "rgba(255,255,255,.55)"; c.stroke();
    rr(c, CARD.x + 2.5, CARD.y + 2.5, CARD.w - 5, CARD.h - 5, CARD.r - 2); c.lineWidth = 1; c.strokeStyle = "rgba(0,0,0,.28)"; c.stroke(); c.restore();
  }

  /* design (card-local coordinates, 660 × 414) ------------------ */
  var SPADE = "M 330 100 C 280 150 250 180 250 215 C 250 245 280 258 306 244 C 303 266 292 284 272 300 L 388 300 C 368 284 357 266 354 244 C 380 258 410 245 410 215 C 410 180 380 150 330 100 Z";
  var diamond = function (cx, cy, s) { return "M " + cx + " " + (cy - s) + " L " + (cx + s) + " " + cy + " L " + cx + " " + (cy + s) + " L " + (cx - s) + " " + cy + " Z"; };
  var OUTLINES = [
    "M 40 22 L 620 22 Q 638 22 638 40 L 638 374 Q 638 392 620 392 L 40 392 Q 22 392 22 374 L 22 40 Q 22 22 40 22 Z",
    "M 36 36 L 624 36 L 624 378 L 36 378 Z",
    diamond(66, 66, 11), diamond(594, 66, 11), diamond(594, 348, 11), diamond(66, 348, 11),
    "M 330 80 A 120 120 0 1 0 330.01 80 Z",
    SPADE,
    "M 44 112 L 54 88 L 64 112 M 48 104 L 60 104",
    "M 616 302 L 606 326 L 596 302 M 612 310 L 600 310",
    "M 140 336 L 520 336 M 160 352 L 500 352 M 180 368 L 480 368",
    "M 560 340 A 10 10 0 1 0 560.01 340 Z M 590 340 A 10 10 0 1 0 590.01 340 Z"
  ];

  var jobs = [], total = 1;
  function buildJobs() {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
    document.body.appendChild(svg);
    jobs = [];
    // PASS 1 — raster hatch inside the spade
    var p2 = new Path2D(SPADE), row = 0, y, x, run, xs;
    for (y = 108; y <= 298; y += 5.5, row++) {
      xs = []; run = null;
      for (x = 244; x <= 416; x += 2) {
        var inside = p2.isPointInPath ? isIn(p2, x, y) : false;
        if (inside && run === null) run = x;
        if (!inside && run !== null) { if (x - run > 5) xs.push([run + 3, x - 5]); run = null; }
      }
      if (row % 2) xs.reverse();
      xs.forEach(function (s) {
        var a = [s[0] + CARD.x, y + CARD.y], b = [s[1] + CARD.x, y + CARD.y];
        jobs.push({ pts: row % 2 ? [b, a] : [a, b], speed: 1150, kind: 1, pass: 1 });
      });
    }
    // PASS 2 — vector outlines
    OUTLINES.forEach(function (d) {
      d.split(/(?=M)/).forEach(function (sub) {
        var p = document.createElementNS(NS, "path"); p.setAttribute("d", sub.trim()); svg.appendChild(p);
        var L = p.getTotalLength(), pts = [], l, q;
        for (l = 0; l < L; l += 3) { q = p.getPointAtLength(l); pts.push([q.x + CARD.x, q.y + CARD.y]); }
        q = p.getPointAtLength(L); pts.push([q.x + CARD.x, q.y + CARD.y]);
        if (pts.length > 1) jobs.push({ pts: pts, speed: 470, kind: 0, pass: 2 });
      });
    });
    document.body.removeChild(svg);
    total = 0;
    jobs.forEach(function (j) { j.len = 0; for (var i = 0; i < j.pts.length - 1; i++) j.len += Math.hypot(j.pts[i + 1][0] - j.pts[i][0], j.pts[i + 1][1] - j.pts[i][1]); total += j.len; });
  }
  var scratch = document.createElement("canvas").getContext("2d");
  function isIn(path, x, y) { return scratch.isPointInPath(path, x, y); }

  /* cutting ----------------------------------------------------- */
  function cut(x0, y0, x1, y1, kind) {
    var m = MATS[mat];
    bc.lineCap = "round"; bc.lineJoin = "round";
    if (m.bright) {
      bc.strokeStyle = m.cut; bc.globalAlpha = kind ? 0.82 : 1; bc.lineWidth = kind ? 1.9 : 2.8;
      bc.beginPath(); bc.moveTo(x0, y0); bc.lineTo(x1, y1); bc.stroke(); bc.globalAlpha = 1; return;
    }
    if (!kind) { bc.strokeStyle = m.hi; bc.globalAlpha = 0.55; bc.lineWidth = 2.4; bc.beginPath(); bc.moveTo(x0 + .8, y0 + 1); bc.lineTo(x1 + .8, y1 + 1); bc.stroke(); }
    bc.globalAlpha = kind ? 0.7 : 1; bc.strokeStyle = m.cut; bc.lineWidth = kind ? 2.1 : 2.7;
    if (m.soft) { bc.shadowColor = m.cut; bc.shadowBlur = 4; }
    bc.beginPath(); bc.moveTo(x0, y0); bc.lineTo(x1, y1); bc.stroke();
    bc.shadowBlur = 0; bc.globalAlpha = 1;
  }

  /* state ------------------------------------------------------- */
  var st, hot = [], sparks = [], smoke = [], now = 0, hudTick = 0, visible = true;
  function reset() {
    bc.clearRect(0, 0, W, W); hot = []; sparks = []; smoke = [];
    st = { state: "engrave", ji: 0, si: 0, sp: 0, travel: true, hx: 450, hy: 450, doneLen: 0, hold: 0, clearA: 1, sweep: 0, on: false, vel: 0 };
    if (jobs[0]) { st.hx = jobs[0].pts[0][0]; st.hy = jobs[0].pts[0][1] - 80; }
  }

  function spawn(x, y, dist, kind) {
    var m = MATS[mat], n = dist * (kind ? 0.1 : 0.19) * m.sparks, cnt = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0), i, a, sp, big;
    for (i = 0; i < cnt && sparks.length < 520; i++) {
      big = Math.random() < 0.14; a = rnd(0, 6.283); sp = big ? rnd(380, 700) : rnd(70, 360);
      sparks.push({ x: x, y: y, z: rnd(2, 10), px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.65, vz: rnd(70, big ? 420 : 280), life: 0, max: rnd(0.35, big ? 1.5 : 0.9), b: 0, big: big });
    }
    if (smoke.length < 70 && Math.random() < 0.22 * m.smoke * (dist / 3 + 0.3)) smoke.push({ x: x + rnd(-3, 3), y: y, vx: rnd(-8, 8), vy: rnd(-26, -10), r: rnd(5, 9), life: 0, max: rnd(1.2, 2.4) });
  }

  function advance(dt) {
    var t = dt, guard = 0, on = false, moved = 0;
    var m = MATS[mat], sp = m.speed;
    while (t > 0 && st.state === "engrave" && guard++ < 600) {
      var job = jobs[st.ji];
      if (st.travel) {
        var tx = job.pts[0][0], ty = job.pts[0][1], dx = tx - st.hx, dy = ty - st.hy, d = Math.hypot(dx, dy), need = d / 1900;
        if (need <= t) { st.hx = tx; st.hy = ty; t -= need; st.travel = false; st.si = 0; st.sp = 0; hot.push(null); }
        else { var f = t / need; st.hx += dx * f; st.hy += dy * f; t = 0; }
        continue;
      }
      on = true;
      var a = job.pts[st.si], b = job.pts[st.si + 1];
      var sl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.0001, left = sl - st.sp, spd = job.speed * sp;
      var step = Math.min(left, spd * t), f0 = st.sp / sl, f1 = (st.sp + step) / sl;
      var x0 = a[0] + (b[0] - a[0]) * f0, y0 = a[1] + (b[1] - a[1]) * f0, x1 = a[0] + (b[0] - a[0]) * f1, y1 = a[1] + (b[1] - a[1]) * f1;
      cut(x0, y0, x1, y1, job.kind);
      hot.push({ x: x1, y: y1, t: now });
      spawn(x1, y1, step, job.kind);
      st.hx = x1; st.hy = y1; st.sp += step; st.doneLen += step; moved += step; t -= step / spd; st.pass = job.pass;
      if (st.sp >= sl - 1e-4) {
        st.si++; st.sp = 0;
        if (st.si >= job.pts.length - 1) { st.ji++; st.travel = true; if (st.ji >= jobs.length) { st.state = "done"; st.hold = 0; st.sweep = 0; hot.push(null); } }
      }
    }
    st.on = on; st.vel = dt > 0 ? moved / dt : 0;
  }

  function step(dt) {
    now += dt;
    if (st.state === "engrave") advance(dt);
    else if (st.state === "done") { st.hold += dt; st.sweep += dt; st.on = false; st.vel = 0; if (st.hold > 5.2) { st.state = "clear"; st.hold = 0; } }
    else if (st.state === "clear") { st.hold += dt; st.clearA = Math.max(0, 1 - st.hold / 0.9); st.on = false; st.vel = 0; if (st.hold >= 0.9) { reset(); } }
    var i, s;
    for (i = sparks.length - 1; i >= 0; i--) {
      s = sparks[i]; s.life += dt; s.px = s.x; s.py = s.y - s.z * 0.55;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vz -= 950 * dt;
      var dr = 1 - 1.5 * dt; s.vx *= dr; s.vy *= dr;
      if (s.z < 0) { s.z = 0; s.vz = -s.vz * 0.38; s.vx *= 0.55; s.vy *= 0.55; s.b++; if (s.b > 2) s.life = s.max; }
      if (s.life >= s.max) sparks.splice(i, 1);
    }
    for (i = smoke.length - 1; i >= 0; i--) {
      s = smoke[i]; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += 16 * dt; s.vx += rnd(-6, 6) * dt;
      if (s.life >= s.max) smoke.splice(i, 1);
    }
    while (hot.length && (hot[0] === null || now - hot[0].t > 1)) hot.shift();
  }

  /* drawing ----------------------------------------------------- */
  var cw = 0;
  function fit() {
    var dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect();
    cv.width = Math.max(300, Math.round(r.width * dpr)); cv.height = cv.width; cw = cv.width;
  }

  function railGrad(c, x0, y0, x1, y1) {
    var g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "#5d6674"); g.addColorStop(0.35, "#e9eef4"); g.addColorStop(0.55, "#8d96a3"); g.addColorStop(1, "#3b424d"); return g;
  }

  function draw() {
    var m = MATS[mat], c = ctx, i, s, h, a;
    c.setTransform(cw / W, 0, 0, cw / W, 0, 0);
    c.clearRect(0, 0, W, W);
    var sx = 0, sy = 0;
    if (st.on && !reduce) { sx = rnd(-1, 1) * m.shake; sy = rnd(-1, 1) * m.shake; }
    c.translate(sx, sy);

    // Y rails
    c.fillStyle = railGrad(c, 20, 0, 46, 0); c.fillRect(20, 30, 22, 840);
    c.fillStyle = railGrad(c, 858, 0, 884, 0); c.fillRect(858, 30, 22, 840);
    c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(42, 30, 6, 840); c.fillRect(852, 30, 6, 840);

    c.drawImage(plate, 0, 0, W, W);

    // engraved layer
    c.save(); rr(c, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); c.clip(); c.globalAlpha = st.clearA; c.drawImage(burn, 0, 0, W, W);
    // finishing glint
    if (st.state === "done") {
      var p = Math.min(1, st.sweep / 1.7), gx = CARD.x - 200 + p * (CARD.w + 400);
      var gg = c.createLinearGradient(gx - 90, 0, gx + 90, 0);
      gg.addColorStop(0, "rgba(255,255,255,0)"); gg.addColorStop(0.5, "rgba(255,255,255," + (0.32 * (1 - Math.abs(p - 0.5) * 1.2)) + ")"); gg.addColorStop(1, "rgba(255,255,255,0)");
      c.globalCompositeOperation = "lighter"; c.fillStyle = gg; c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
    }
    c.restore();

    c.globalCompositeOperation = "lighter"; c.lineCap = "round";
    // hot trail
    if (hot.length > 1) {
      for (i = 1; i < hot.length; i++) {
        var p0 = hot[i - 1], p1 = hot[i]; if (!p0 || !p1) continue;
        a = 1 - (now - p1.t); if (a <= 0) continue; a = Math.pow(a, 1.8);
        c.strokeStyle = "rgba(" + m.glow + "," + (a * 0.55) + ")"; c.lineWidth = 7 * a + 2; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
        if (a > 0.25) { c.strokeStyle = "rgba(255,255,255," + a * 0.95 + ")"; c.lineWidth = 2.4 * a + 0.6; c.stroke(); }
      }
    }
    c.globalCompositeOperation = "source-over";

    // smoke
    for (i = 0; i < smoke.length; i++) {
      s = smoke[i]; a = Math.sin((s.life / s.max) * Math.PI) * 0.1 * (0.5 + m.smoke * 0.5);
      var sg = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      sg.addColorStop(0, "rgba(210,215,225," + a + ")"); sg.addColorStop(1, "rgba(210,215,225,0)");
      c.fillStyle = sg; c.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }

    // gantry X rail + carriage
    var hx = st.hx, hy = st.hy;
    c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(42, hy - 36, 816, 10);
    c.fillStyle = railGrad(c, 0, hy - 44, 0, hy - 30); c.fillRect(42, hy - 44, 816, 12);
    c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(42, hy - 44, 816, 1.5);
    c.fillStyle = railGrad(c, 18, 0, 46, 0); c.fillRect(18, hy - 52, 28, 28); c.fillRect(854, hy - 52, 28, 28);
    // carriage
    c.save(); c.shadowColor = "rgba(0,0,0,.7)"; c.shadowBlur = 16; c.shadowOffsetY = 12;
    rr(c, hx - 30, hy - 84, 60, 44, 8); c.fillStyle = railGrad(c, hx - 30, 0, hx + 30, 0); c.fill(); c.restore();
    c.fillStyle = "#12161d"; rr(c, hx - 22, hy - 76, 44, 20, 5); c.fill();
    c.fillStyle = st.on ? "#fff" : "#4a5260"; c.shadowColor = "rgba(" + m.glow + ",1)"; c.shadowBlur = st.on ? 14 : 0; c.beginPath(); c.arc(hx - 12, hy - 66, 2.6, 0, 6.283); c.fill(); c.shadowBlur = 0;
    // nozzle
    var ng = c.createLinearGradient(hx - 9, 0, hx + 9, 0); ng.addColorStop(0, "#4b525e"); ng.addColorStop(0.45, "#f3f6fa"); ng.addColorStop(1, "#3a404a");
    c.fillStyle = ng; c.beginPath(); c.moveTo(hx - 11, hy - 42); c.lineTo(hx + 11, hy - 42); c.lineTo(hx + 4, hy - 14); c.lineTo(hx - 4, hy - 14); c.closePath(); c.fill();

    // beam + head glow
    c.globalCompositeOperation = "lighter";
    if (st.on) {
      var fl = rnd(0.8, 1);
      var bgd = c.createLinearGradient(0, hy - 14, 0, hy); bgd.addColorStop(0, "rgba(" + m.glow + ",.0)"); bgd.addColorStop(1, "rgba(255,255,255," + fl + ")");
      c.strokeStyle = bgd; c.lineWidth = 3; c.beginPath(); c.moveTo(hx, hy - 14); c.lineTo(hx, hy); c.stroke();
      var hg = c.createRadialGradient(hx, hy, 0, hx, hy, 90); hg.addColorStop(0, "rgba(255,255,255," + 0.9 * fl + ")"); hg.addColorStop(0.12, "rgba(" + m.glow + "," + 0.65 * fl + ")"); hg.addColorStop(0.4, "rgba(" + m.glow + ",.14)"); hg.addColorStop(1, "rgba(" + m.glow + ",0)");
      c.fillStyle = hg; c.fillRect(hx - 90, hy - 90, 180, 180);
      c.fillStyle = "rgba(255,255,255,.95)"; c.beginPath(); c.arc(hx, hy, 3.2, 0, 6.283); c.fill();
      // anamorphic flare
      var fg = c.createLinearGradient(hx - 120, 0, hx + 120, 0); fg.addColorStop(0, "rgba(" + m.glow + ",0)"); fg.addColorStop(0.5, "rgba(255,255,255," + 0.5 * fl + ")"); fg.addColorStop(1, "rgba(" + m.glow + ",0)");
      c.fillStyle = fg; c.fillRect(hx - 120, hy - 0.9, 240, 1.8);
    } else {
      c.fillStyle = "rgba(" + m.glow + ",.5)"; c.beginPath(); c.arc(hx, hy, 2, 0, 6.283); c.fill();
    }

    // sparks (2.5D streaks)
    for (i = 0; i < sparks.length; i++) {
      s = sparks[i]; a = 1 - s.life / s.max; h = s.y - s.z * 0.55;
      var col = a > 0.55 ? m.spark[0] : m.spark[1];
      c.strokeStyle = "rgba(" + col + "," + Math.min(1, a * 1.3) + ")"; c.lineWidth = (s.big ? 1.9 : 1.2) * (0.5 + a);
      c.beginPath(); c.moveTo(s.px, s.py); c.lineTo(s.x, h); c.stroke();
      if (a > 0.7) { c.fillStyle = "rgba(255,255,255," + (a - 0.5) + ")"; c.beginPath(); c.arc(s.x, h, s.big ? 2 : 1.2, 0, 6.283); c.fill(); }
    }
    c.globalCompositeOperation = "source-over";
  }

  /* HUD ---------------------------------------------------------- */
  var hud = {};
  ["hudX", "hudY", "hudVel", "hudPow", "hudMat", "hudPass", "hudProg", "progFill"].forEach(function (id) { hud[id] = document.getElementById(id); });
  function updateHud() {
    var p = Math.min(100, st.state === "engrave" ? st.doneLen / total * 100 : 100);
    if (hud.hudX) hud.hudX.textContent = ((st.hx - CARD.x) / CARD.w * 86).toFixed(2).padStart(6, "0");
    if (hud.hudY) hud.hudY.textContent = ((st.hy - CARD.y) / CARD.h * 54).toFixed(2).padStart(6, "0");
    if (hud.hudVel) hud.hudVel.textContent = Math.round(st.vel / 7.7 * MATS[mat].speed);
    if (hud.hudPow) hud.hudPow.textContent = st.on ? MATS[mat].pow + Math.round(rnd(-1, 1)) : 0;
    if (hud.hudMat) hud.hudMat.textContent = MATS[mat].name;
    if (hud.hudPass) hud.hudPass.textContent = "0" + (st.state === "engrave" ? (st.pass || 1) : 2) + "/02";
    if (hud.hudProg) hud.hudProg.textContent = Math.round(p);
    if (hud.progFill) hud.progFill.style.width = p + "%";
  }

  /* loop --------------------------------------------------------- */
  var last = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!visible) { last = ts; return; }
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    step(dt); draw();
    if (++hudTick % 4 === 0) updateHud();
  }

  function setMaterial(k) {
    if (!MATS[k]) return; mat = k; paintPlate(); reset();
    document.querySelectorAll(".mat-btn").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-mat") === k); });
    if (reduce) renderStatic();
  }
  function renderStatic() {
    var g = 0; while (st.state === "engrave" && g++ < 4000) advance(0.05);
    sparks = []; smoke = []; hot = []; st.on = false; draw(); updateHud();
  }

  buildJobs(); paintPlate(); reset(); fit();
  window.addEventListener("resize", function () { fit(); if (reduce) draw(); });
  document.querySelectorAll(".mat-btn").forEach(function (b) { b.addEventListener("click", function () { setMaterial(b.getAttribute("data-mat")); }); });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(cv);
  if (reduce) renderStatic(); else requestAnimationFrame(frame);
})();

/* ═════════════════ 2 · CATALOG + ADMIN + SUPABASE ═════════════════ */
(function () {
  "use strict";
  /* NOTE: credentials checked in the browser are NOT secure. See README note. */
  const WA_NUMBER = "543462415932";
  const ADMIN_USER = "ADMIN";
  const ADMIN_PASS = "153045";
  const DEFAULT_PRICE = 18000;
  const VARIANTS = ["ACERO", "ALUMINIO", "MADERA", "CUERO", "ACRÍLICO"];

  const SUPABASE_URL = "https://zzrmqidzfjqrmrictels.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_6b27IFeNHruaWcIO5mP_yg_lwn79eZ5";
  const SUPABASE_TABLE = "milimars_content";
  const SUPABASE_BUCKET = "milimars";

  const LS_KEY = "gambito_works_v1";
  const PRICE_KEY = "gambito_price_v1";
  const FLOW_KEY = "gambito_flow_v1";
  const SESSION_KEY = "gambito_admin_session";
  const DRAFT_KEY = "gambito_form_draft";
  const MAX_IMG_WIDTH = 900;
  const JPEG_QUALITY = 0.8;

  function xmlEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function svgArt(cfg) {
    cfg = cfg || {};
    const title = xmlEsc(cfg.title || "G");
    const sub = xmlEsc(cfg.sub || "");
    const rot = (cfg.rot == null) ? -18 : cfg.rot;
    const size = title.length > 2 ? 150 : 250;
    let grid = "";
    for (let x = 60; x < 900; x += 60) grid += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="900"/>';
    for (let y = 60; y < 900; y += 60) grid += '<line x1="0" y1="' + y + '" x2="900" y2="' + y + '"/>';
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">' +
        '<defs>' +
          '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1d24"/><stop offset=".5" stop-color="#08090c"/><stop offset="1" stop-color="#1a1d24"/></linearGradient>' +
          '<linearGradient id="ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#eef3f8"/><stop offset=".48" stop-color="#788499"/><stop offset=".56" stop-color="#ffffff"/><stop offset=".72" stop-color="#8d94a0"/><stop offset="1" stop-color="#eef3f8"/></linearGradient>' +
          '<radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#A8DEFF" stop-opacity=".55"/><stop offset="1" stop-color="#A8DEFF" stop-opacity="0"/></radialGradient>' +
          '<radialGradient id="ru" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#4FA9E8" stop-opacity=".35"/><stop offset="1" stop-color="#4FA9E8" stop-opacity="0"/></radialGradient>' +
          '<filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>' +
        '</defs>' +
        '<rect width="900" height="900" fill="url(#bg)"/>' +
        '<circle cx="450" cy="450" r="380" fill="url(#gl)" opacity=".5"/>' +
        '<circle cx="120" cy="780" r="220" fill="url(#ru)" opacity=".5"/>' +
        '<circle cx="800" cy="120" r="180" fill="url(#ru)" opacity=".35"/>' +
        '<g stroke="#a8b0bd" stroke-opacity=".12" stroke-width="1">' + grid + '</g>' +
        '<circle cx="450" cy="450" r="300" fill="none" stroke="url(#ch)" stroke-width="2.5" stroke-opacity=".5"/>' +
        '<circle cx="450" cy="450" r="262" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="2" stroke-dasharray="4 12"/>' +
        '<g transform="rotate(' + rot + ' 450 450)"><rect x="-120" y="440" width="1140" height="16" fill="#A8DEFF" opacity=".4" filter="url(#bl)"/><rect x="-120" y="446" width="1140" height="5" fill="#ffffff" opacity=".95"/></g>' +
        '<text x="450" y="' + (size > 200 ? 530 : 505) + '" text-anchor="middle" font-family="Impact, Haettenschweiler, \'Arial Black\', sans-serif" font-size="' + size + '" fill="url(#ch)" letter-spacing="8">' + title + '</text>' +
        '<text x="450" y="642" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="24" letter-spacing="12" fill="#ffffff" opacity=".9">' + sub + '</text>' +
        '<text x="450" y="812" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="17" letter-spacing="11" fill="#a8b0bd" opacity=".7">GAMBITO LÁSER</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const DEFAULT_FLOW = [
    svgArt({ title: "01", sub: "BOCETO", rot: -12 }),
    svgArt({ title: "02", sub: "GRABADO", rot: 14 }),
    svgArt({ title: "03", sub: "ACABADO", rot: -22 })
  ];

  const DEFAULT_WORKS = [
    { id: "g1", title: "As de Espadas", desc: "Acero inoxidable · Grabado profundo · 8,6 × 5,4 cm", tag: "NEW", img: svgArt({ title: "A", sub: "ACERO INOX", rot: -18 }) },
    { id: "g2", title: "Rey de Tréboles", desc: "Aluminio anodizado · Acabado mate", tag: "HOT", img: svgArt({ title: "K", sub: "ALUMINIO", rot: 12 }) },
    { id: "g3", title: "Reina de Diamantes", desc: "Cuero grabado · Borde quemado a mano", tag: "LTD", img: svgArt({ title: "Q", sub: "CUERO", rot: -26 }) },
    { id: "g4", title: "Joker Negro", desc: "Acero pulido espejo · Numeración grabada", tag: "EPIC", img: svgArt({ title: "J", sub: "ESPEJO", rot: 8 }) },
    { id: "g5", title: "Baraja Cromada", desc: "Acero al carbono · Pátina forzada", tag: "NEW", img: svgArt({ title: "01", sub: "CROMO", rot: -14 }) },
    { id: "g6", title: "Ficha Lunar", desc: "Acrílico cristal · Grabado interior", tag: "HOT", img: svgArt({ title: "02", sub: "ACRÍLICO", rot: 20 }) },
    { id: "g7", title: "Llavero Gambito", desc: "Acero 2 mm · Corte y grabado a medida", tag: "LTD", img: svgArt({ title: "G", sub: "ACERO 2MM", rot: -8 }) },
    { id: "g8", title: "Placa Conmemorativa", desc: "Madera noble · Grabado profundo · Serie 2026", tag: "EPIC", img: svgArt({ title: "03", sub: "MADERA", rot: 16 }) }
  ];

  let sb = null;
  const hasSupabase = SUPABASE_URL && !/YOUR_/.test(SUPABASE_URL) && SUPABASE_ANON_KEY && !/YOUR_/.test(SUPABASE_ANON_KEY);
  if (hasSupabase && window.supabase && window.supabase.createClient) {
    try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
    catch (err) { console.warn("Supabase init error:", err); }
  }

  let works = [];
  let price = DEFAULT_PRICE;
  let flowImages = DEFAULT_FLOW.slice();
  let selectedVars = {};
  let editingId = null;
  let currentImageData = "";
  let confirmResolver = null;
  let loginMsgTimer = null;
  let adminStatusTimer = null;

  const $ = (id) => document.getElementById(id);
  function escapeHtml(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function formatPrice(n) { return "$" + Number(n || 0).toLocaleString("es-AR"); }
  function waLink(text) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text); }

  function loginMsg(msg, type) {
    const el = $("loginError");
    el.textContent = msg; el.className = "login-error show " + (type || "info");
    clearTimeout(loginMsgTimer); loginMsgTimer = setTimeout(clearLoginMsg, 4000);
  }
  function clearLoginMsg() { const el = $("loginError"); el.className = "login-error"; el.textContent = ""; clearTimeout(loginMsgTimer); }
  function adminStatus(msg, type) {
    const el = $("adminStatus");
    el.textContent = msg; el.className = "admin-status show " + (type || "info");
    clearTimeout(adminStatusTimer);
    adminStatusTimer = setTimeout(function () { el.className = "admin-status"; el.textContent = ""; }, 3500);
  }

  async function loadWorks() {
    if (sb) {
      try {
        const { data, error } = await sb.from(SUPABASE_TABLE).select("value").eq("key", "gambito_works").maybeSingle();
        if (error) throw error;
        if (data && Array.isArray(data.value) && data.value.length) return data.value;
        const seed = JSON.parse(JSON.stringify(DEFAULT_WORKS));
        await sb.from(SUPABASE_TABLE).upsert({ key: "gambito_works", value: seed });
        return seed;
      } catch (err) { console.warn("Supabase loadWorks failed → localStorage", err); }
    }
    try { const raw = localStorage.getItem(LS_KEY); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) return parsed; } } catch (err) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_WORKS));
  }
  async function persistWorks() {
    if (sb) {
      try { const { error } = await sb.from(SUPABASE_TABLE).upsert({ key: "gambito_works", value: works }); if (error) throw error; return true; }
      catch (err) { adminStatus("Error guardando en Supabase: " + (err.message || err), "error"); return false; }
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify(works)); return true; }
    catch (err) { adminStatus("No se pudo guardar: almacenamiento lleno", "error"); return false; }
  }
  async function loadPrice() {
    if (sb) {
      try { const { data, error } = await sb.from(SUPABASE_TABLE).select("value").eq("key", "gambito_price").maybeSingle(); if (error) throw error; if (data && typeof data.value === "number") return data.value; }
      catch (err) { console.warn("Supabase loadPrice failed → localStorage", err); }
    }
    try { const raw = localStorage.getItem(PRICE_KEY); if (raw != null) { const n = parseInt(raw, 10); if (Number.isFinite(n) && n >= 0) return n; } } catch (err) { /* ignore */ }
    return DEFAULT_PRICE;
  }
  async function persistPrice() {
    if (sb) {
      try { const { error } = await sb.from(SUPABASE_TABLE).upsert({ key: "gambito_price", value: price }); if (error) throw error; return true; }
      catch (err) { adminStatus("Error guardando precio: " + (err.message || err), "error"); return false; }
    }
    try { localStorage.setItem(PRICE_KEY, String(price)); return true; }
    catch (err) { adminStatus("No se pudo guardar el precio", "error"); return false; }
  }
  async function loadFlow() {
    if (sb) {
      try {
        const { data, error } = await sb.from(SUPABASE_TABLE).select("value").eq("key", "gambito_flow").maybeSingle();
        if (error) throw error;
        if (data && Array.isArray(data.value) && data.value.length === 3) return data.value;
        const seed = DEFAULT_FLOW.slice();
        await sb.from(SUPABASE_TABLE).upsert({ key: "gambito_flow", value: seed });
        return seed;
      } catch (err) { console.warn("Supabase loadFlow failed → localStorage", err); }
    }
    try { const raw = localStorage.getItem(FLOW_KEY); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length === 3) return parsed; } } catch (err) { /* ignore */ }
    return DEFAULT_FLOW.slice();
  }
  async function persistFlow() {
    if (sb) {
      try { const { error } = await sb.from(SUPABASE_TABLE).upsert({ key: "gambito_flow", value: flowImages }); if (error) throw error; return true; }
      catch (err) { adminStatus("Error guardando proceso: " + (err.message || err), "error"); return false; }
    }
    try { localStorage.setItem(FLOW_KEY, JSON.stringify(flowImages)); return true; }
    catch (err) { adminStatus("No se pudo guardar el proceso", "error"); return false; }
  }

  async function uploadImageIfNeeded(dataUrl) {
    if (!sb || !SUPABASE_BUCKET || !dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const path = "works/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
    const { error } = await sb.storage.from(SUPABASE_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  function isLoggedIn() { try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch (err) { return false; } }
  function setLoggedIn(v) { try { if (v) sessionStorage.setItem(SESSION_KEY, "1"); else sessionStorage.removeItem(SESSION_KEY); } catch (err) { /* private mode */ } }

  function renderWorks() {
    const grid = $("worksGrid");
    if (!works.length) { grid.innerHTML = '<div class="works-empty">Todavía no hay piezas cargadas. Volvé pronto.</div>'; return; }
    grid.innerHTML = works.map(function (w) {
      const title = escapeHtml(w.title), desc = escapeHtml(w.desc), tag = escapeHtml(w.tag), pid = escapeHtml(w.id);
      if (!selectedVars[w.id]) selectedVars[w.id] = "ACERO";
      const varButtons = VARIANTS.map(function (v) {
        const active = selectedVars[w.id] === v ? " active" : "";
        return '<button type="button" class="var-btn' + active + '" data-var="' + escapeHtml(v) + '" data-pid="' + pid + '">' + escapeHtml(v) + '</button>';
      }).join("");
      return '' +
        '<article class="work-card" data-open="' + pid + '" tabindex="0" role="button" aria-label="Ver ' + title + '">' +
          '<div class="work-media">' +
            '<img src="' + escapeHtml(w.img) + '" alt="' + title + '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.parentElement.classList.add(\'img-error\')">' +
            (tag ? '<span class="work-tag">' + tag + '</span>' : '') +
          '</div>' +
          '<div class="work-body">' +
            '<h3 class="work-title">' + title + '</h3>' +
            (desc ? '<p class="work-desc">' + desc + '</p>' : '') +
            '<div class="var-row" data-pid="' + pid + '">' + varButtons + '</div>' +
            '<div class="work-price">' + formatPrice(price) + '<span>ARS</span></div>' +
          '</div>' +
        '</article>';
    }).join("");
    grid.querySelectorAll("[data-open]").forEach(function (card) {
      card.addEventListener("click", function () { openLightbox(card.getAttribute("data-open")); });
      card.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") { ev.preventDefault(); openLightbox(card.getAttribute("data-open")); } });
      initTilt(card);
    });
    grid.querySelectorAll(".var-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        selectedVars[btn.getAttribute("data-pid")] = btn.getAttribute("data-var");
        renderWorks();
      });
    });
  }

  /* 3D tilt on cards */
  function initTilt(card) {
    if (window.matchMedia("(hover: none)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    card.addEventListener("mousemove", function (e) {
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", (px * 9).toFixed(2) + "deg"); card.style.setProperty("--rx", (-py * 9).toFixed(2) + "deg");
    });
    card.addEventListener("mouseleave", function () { card.style.setProperty("--ry", "0deg"); card.style.setProperty("--rx", "0deg"); });
  }

  function applyFlowImages() { const a = $("flowImg1"), b = $("flowImg2"), c = $("flowImg3"); if (a) a.src = flowImages[0] || ""; if (b) b.src = flowImages[1] || ""; if (c) c.src = flowImages[2] || ""; }
  function renderFlowAdmin() { [0, 1, 2].forEach(function (i) { const img = $("flowThumbImg" + (i + 1)); if (img) img.src = flowImages[i] || ""; }); }

  async function handleFlowFileChange(index, file) {
    if (!file) return;
    adminStatus("Procesando imagen…", "info");
    try {
      let dataURL = await compressImage(file);
      if (sb && SUPABASE_BUCKET) dataURL = await uploadImageIfNeeded(dataURL);
      const snapshot = flowImages.slice();
      flowImages[index] = dataURL;
      const ok = await persistFlow();
      if (!ok) { flowImages = snapshot; return; }
      renderFlowAdmin(); applyFlowImages();
      adminStatus("Imagen actualizada", "success");
    } catch (err) { adminStatus(err && err.message ? err.message : "No se pudo procesar", "error"); }
  }

  function openLightbox(id) {
    const work = works.filter(function (w) { return String(w.id) === String(id); })[0];
    if (!work) return;
    const variant = selectedVars[work.id] || "ACERO";
    $("lbImg").src = work.img || ""; $("lbImg").alt = work.title || "";
    $("lbTitle").textContent = work.title || ""; $("lbDesc").textContent = work.desc || "";
    $("lbPrice").textContent = formatPrice(price) + " ARS";
    $("lbVar").textContent = "Material seleccionado: " + variant;
    const tagEl = $("lbTag"); tagEl.textContent = work.tag || ""; tagEl.style.display = work.tag ? "" : "none";
    $("lbWa").href = waLink('Hola GAMBITO LÁSER, me interesa "' + (work.title || "") + '" en ' + variant + ' (' + formatPrice(price) + '). ¿Está disponible?');
    $("lightbox").classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeLightbox() { $("lightbox").classList.remove("open"); document.body.style.overflow = ""; }

  function openAdmin() {
    $("adminOverlay").classList.add("open"); document.body.style.overflow = "hidden"; clearLoginMsg();
    if (isLoggedIn()) showPanel(); else showLogin();
  }
  function closeAdmin() { $("adminOverlay").classList.remove("open"); document.body.style.overflow = ""; $("loginForm").reset(); clearLoginMsg(); }
  function showLogin() { $("loginCard").style.display = ""; $("adminPanel").style.display = "none"; setTimeout(function () { $("loginUser").focus(); }, 50); }
  function showPanel() {
    $("loginCard").style.display = "none"; $("adminPanel").style.display = "";
    renderAdminList(); updatePriceInput(); renderFlowAdmin();
    const draft = loadFormDraft();
    if (draft && (draft.title || draft.desc || draft.tag || draft.img)) restoreDraft(draft); else resetForm();
  }
  function handleLogin(ev) {
    ev.preventDefault();
    const user = $("loginUser").value.trim().toUpperCase(), pass = $("loginPass").value.trim();
    if (user === ADMIN_USER && pass === ADMIN_PASS) { setLoggedIn(true); clearLoginMsg(); showPanel(); adminStatus("Bienvenido", "success"); }
    else { loginMsg("Usuario o contraseña incorrectos", "error"); $("loginPass").value = ""; $("loginPass").focus(); }
  }
  function updatePriceInput() { const el = $("priceInput"); if (el) el.value = price; }
  async function savePrice() {
    const v = parseInt($("priceInput").value, 10);
    if (!Number.isFinite(v) || v < 0) { adminStatus("Precio inválido", "error"); return; }
    price = v;
    if (await persistPrice()) { adminStatus("Precio actualizado", "success"); renderWorks(); }
  }

  function renderAdminList() {
    const list = $("adminList");
    if (!works.length) { list.innerHTML = '<p class="admin-empty">Sin piezas cargadas.</p>'; return; }
    list.innerHTML = works.map(function (w, i) {
      const title = escapeHtml(w.title), tag = escapeHtml(w.tag), id = escapeHtml(w.id);
      return '' +
        '<div class="admin-item" data-id="' + id + '">' +
          '<div class="admin-thumb"><img src="' + escapeHtml(w.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"></div>' +
          '<div class="admin-item-info"><strong>' + title + '</strong>' + (tag ? '<span>' + tag + '</span>' : '') + '</div>' +
          '<div class="admin-item-actions">' +
            '<button type="button" data-up="' + id + '" title="Subir"' + (i === 0 ? " disabled" : "") + '>↑</button>' +
            '<button type="button" data-down="' + id + '" title="Bajar"' + (i === works.length - 1 ? " disabled" : "") + '>↓</button>' +
            '<button type="button" class="btn-edit" data-edit="' + id + '">Editar</button>' +
            '<button type="button" class="btn-del" data-del="' + id + '" title="Eliminar">✕</button>' +
          '</div>' +
        '</div>';
    }).join("");
    list.querySelectorAll("[data-up]").forEach(function (btn) { btn.addEventListener("click", function () { moveWork(btn.getAttribute("data-up"), -1); }); });
    list.querySelectorAll("[data-down]").forEach(function (btn) { btn.addEventListener("click", function () { moveWork(btn.getAttribute("data-down"), 1); }); });
    list.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-edit");
        const work = works.filter(function (w) { return String(w.id) === String(id); })[0];
        if (work) loadIntoForm(work);
      });
    });
    list.querySelectorAll("[data-del]").forEach(function (btn) { btn.addEventListener("click", function () { deleteWork(btn.getAttribute("data-del")); }); });
  }

  function resetForm() {
    editingId = null; currentImageData = "";
    $("workForm").reset(); $("wFile").value = "";
    $("formTitle").textContent = "Agregar pieza"; $("saveBtn").textContent = "Guardar"; $("cancelEditBtn").style.display = "none";
    $("wPreview").style.display = "none"; $("wPreviewImg").src = "";
    $("wUploadBtn").classList.remove("has-image"); $("wUploadText").textContent = "Subir imagen";
    $("wFileStatus").textContent = "JPG, PNG o WebP. Se ajusta automáticamente.";
    clearFormDraft();
  }

  function loadIntoForm(w) {
    editingId = w.id; currentImageData = w.img || "";
    $("wTitle").value = w.title || ""; $("wDesc").value = w.desc || ""; $("wTag").value = w.tag || ""; $("wFile").value = "";
    if (currentImageData) {
      $("wPreviewImg").src = currentImageData; $("wPreview").style.display = "block";
      $("wUploadBtn").classList.add("has-image"); $("wUploadText").textContent = "Cambiar imagen"; $("wFileStatus").textContent = "Imagen cargada ✓";
    } else {
      $("wPreview").style.display = "none"; $("wUploadBtn").classList.remove("has-image");
      $("wUploadText").textContent = "Subir imagen"; $("wFileStatus").textContent = "JPG, PNG o WebP. Se ajusta automáticamente.";
    }
    $("formTitle").textContent = "Editar pieza"; $("saveBtn").textContent = "Guardar cambios"; $("cancelEditBtn").style.display = "";
    saveFormDraft();
    $("workForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveWork(ev) {
    ev.preventDefault();
    const title = $("wTitle").value.trim(), desc = $("wDesc").value.trim(), tag = $("wTag").value.trim();
    if (!title) { adminStatus("El título es obligatorio", "error"); $("wTitle").focus(); return; }
    if (!currentImageData) { adminStatus("Subí una imagen", "error"); return; }
    let img = currentImageData;
    if (sb && SUPABASE_BUCKET && img.startsWith("data:")) {
      try { img = await uploadImageIfNeeded(img); }
      catch (err) { adminStatus("Error subiendo imagen: " + (err.message || err), "error"); return; }
    }
    const snapshot = JSON.parse(JSON.stringify(works));
    const wasEditing = !!editingId;
    if (editingId) {
      const work = works.filter(function (w) { return String(w.id) === String(editingId); })[0];
      if (work) { work.img = img; work.title = title; work.desc = desc; work.tag = tag; }
    } else {
      works.unshift({ id: "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), img: img, title: title, desc: desc, tag: tag });
    }
    const ok = await persistWorks();
    if (!ok) { works = snapshot; renderWorks(); renderAdminList(); return; }
    adminStatus(wasEditing ? "Pieza actualizada" : "Pieza agregada", "success");
    renderWorks(); renderAdminList(); resetForm();
  }

  async function moveWork(id, dir) {
    const idx = works.findIndex(function (w) { return String(w.id) === String(id); });
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= works.length) return;
    const snapshot = JSON.parse(JSON.stringify(works));
    const tmp = works[idx]; works[idx] = works[target]; works[target] = tmp;
    const ok = await persistWorks();
    if (!ok) works = snapshot;
    renderWorks(); renderAdminList();
  }

  async function deleteWork(id) {
    const work = works.filter(function (w) { return String(w.id) === String(id); })[0];
    if (!work) return;
    const confirmed = await showConfirm({
      title: "Eliminar pieza",
      message: '¿Eliminar <strong>"' + escapeHtml(work.title) + '"</strong>?<br>Esta acción no se puede deshacer.',
      confirmText: "Eliminar", cancelText: "Cancelar"
    });
    if (!confirmed) return;
    const snapshot = JSON.parse(JSON.stringify(works));
    works = works.filter(function (x) { return String(x.id) !== String(id); });
    if (String(editingId) === String(id)) resetForm();
    const ok = await persistWorks();
    if (!ok) works = snapshot;
    renderWorks(); renderAdminList();
    if (ok) adminStatus("Pieza eliminada", "success");
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error("El archivo no es una imagen válida")); return; }
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
          let w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) { reject(new Error("No se pudo leer la imagen")); return; }
          if (w > MAX_IMG_WIDTH) { h = Math.round(h * MAX_IMG_WIDTH / w); w = MAX_IMG_WIDTH; }
          const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d"); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
          try { resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY)); } catch (e) { reject(new Error("No se pudo procesar la imagen")); }
        };
        img.onerror = function () { reject(new Error("No se pudo leer la imagen")); };
        img.src = ev.target.result;
      };
      reader.onerror = function () { reject(new Error("No se pudo leer el archivo")); };
      reader.readAsDataURL(file);
    });
  }

  function handleFileChange(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    adminStatus("Procesando imagen…", "info");
    compressImage(file).then(function (dataURL) {
      currentImageData = dataURL;
      $("wPreviewImg").src = dataURL; $("wPreview").style.display = "block";
      $("wUploadBtn").classList.add("has-image"); $("wUploadText").textContent = "Cambiar imagen"; $("wFileStatus").textContent = "Imagen cargada ✓";
      saveFormDraft(); adminStatus("Imagen lista", "success");
    }).catch(function (err) { adminStatus(err && err.message ? err.message : "No se pudo procesar la imagen", "error"); });
  }

  function saveFormDraft() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ editingId: editingId, title: $("wTitle").value, desc: $("wDesc").value, tag: $("wTag").value, img: currentImageData })); } catch (err) { /* quiet */ } }
  function loadFormDraft() { try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) : null; } catch (err) { return null; } }
  function clearFormDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (err) { /* quiet */ } }

  function restoreDraft(draft) {
    editingId = draft.editingId || null;
    if (editingId && !works.some(function (w) { return String(w.id) === String(editingId); })) editingId = null;
    $("wTitle").value = draft.title || ""; $("wDesc").value = draft.desc || ""; $("wTag").value = draft.tag || "";
    currentImageData = draft.img || ""; $("wFile").value = "";
    if (currentImageData) {
      $("wPreviewImg").src = currentImageData; $("wPreview").style.display = "block";
      $("wUploadBtn").classList.add("has-image"); $("wUploadText").textContent = "Cambiar imagen"; $("wFileStatus").textContent = "Imagen cargada ✓";
    } else {
      $("wPreview").style.display = "none"; $("wPreviewImg").src = "";
      $("wUploadBtn").classList.remove("has-image"); $("wUploadText").textContent = "Subir imagen"; $("wFileStatus").textContent = "JPG, PNG o WebP. Se ajusta automáticamente.";
    }
    $("formTitle").textContent = editingId ? "Editar pieza" : "Agregar pieza";
    $("saveBtn").textContent = editingId ? "Guardar cambios" : "Guardar";
    $("cancelEditBtn").style.display = editingId ? "" : "none";
  }

  function showConfirm(opts) {
    return new Promise(function (resolve) {
      $("confirmTitle").textContent = opts.title || "Confirmar";
      $("confirmMessage").innerHTML = opts.message || "";
      $("confirmDeleteBtn").textContent = opts.confirmText || "Confirmar";
      $("confirmCancelBtn").textContent = opts.cancelText || "Cancelar";
      $("confirmOverlay").classList.add("open"); confirmResolver = resolve;
      setTimeout(function () { $("confirmCancelBtn").focus(); }, 50);
    });
  }
  function closeConfirm(result) { $("confirmOverlay").classList.remove("open"); if (confirmResolver) { const r = confirmResolver; confirmResolver = null; r(result); } }

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* hero counters */
  function initCounters() {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        const el = en.target, end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || "0", 10), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "", t0 = performance.now();
        (function tick(t) {
          const p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + (end * e).toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* scroll progress */
  function initScrollBar() {
    const bar = $("scrollBar"); if (!bar) return;
    let tick = false;
    function upd() { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")"; tick = false; }
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }

  function bindEvents() {
    $("year").textContent = new Date().getFullYear();
    $("lbClose").addEventListener("click", closeLightbox);
    $("lightbox").addEventListener("click", function (ev) { if (ev.target === $("lightbox")) closeLightbox(); });
    $("adminTrigger").addEventListener("click", openAdmin);
    $("loginForm").addEventListener("submit", handleLogin);
    $("loginCancel").addEventListener("click", closeAdmin);
    $("logoutBtn").addEventListener("click", function () { setLoggedIn(false); showLogin(); loginMsg("Sesión cerrada", "info"); });
    $("closePanelBtn").addEventListener("click", closeAdmin);
    $("workForm").addEventListener("submit", saveWork);
    $("wFile").addEventListener("change", handleFileChange);
    $("cancelEditBtn").addEventListener("click", resetForm);
    $("savePriceBtn").addEventListener("click", savePrice);
    $("priceInput").addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); savePrice(); } });
    [1, 2, 3].forEach(function (n, i) {
      const input = $("flowFile" + n); if (!input) return;
      input.addEventListener("change", function (ev) { handleFlowFileChange(i, ev.target.files && ev.target.files[0]); ev.target.value = ""; });
    });
    $("confirmCancelBtn").addEventListener("click", function () { closeConfirm(false); });
    $("confirmDeleteBtn").addEventListener("click", function () { closeConfirm(true); });
    $("confirmOverlay").addEventListener("click", function (ev) { if (ev.target === $("confirmOverlay")) closeConfirm(false); });
    ["wTitle", "wDesc", "wTag"].forEach(function (id) { $(id).addEventListener("input", saveFormDraft); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        if ($("confirmOverlay").classList.contains("open")) closeConfirm(false);
        else if ($("lightbox").classList.contains("open")) closeLightbox();
        else if ($("adminOverlay").classList.contains("open")) closeAdmin();
        return;
      }
      if (ev.ctrlKey && ev.shiftKey && (ev.key === "A" || ev.key === "a")) { ev.preventDefault(); openAdmin(); }
    });
  }

  async function init() {
    bindEvents(); initReveal(); initCounters(); initScrollBar();
    works = await loadWorks(); price = await loadPrice(); flowImages = await loadFlow();
    works.forEach(function (w) { if (!selectedVars[w.id]) selectedVars[w.id] = "ACERO"; });
    renderWorks(); applyFlowImages(); renderFlowAdmin(); updatePriceInput();
    if (isLoggedIn()) renderAdminList();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* ═════════════════ 4 · AMBIENT SPARKS (page background) ═════════════════ */
(function () {
  "use strict";
  var canvas = document.getElementById("mm-fx-particles");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ctx = canvas.getContext("2d"), W = 0, H = 0, sparks = [], COLOR = "168, 222, 255";
  function seed() {
    var count = Math.min(60, Math.round((W * H) / 34000)); sparks = [];
    for (var i = 0; i < count; i++) sparks.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .35, vx: (Math.random() - .5) * .24, vy: -(Math.random() * .45 + .1), o: Math.random() * .45 + .15, f: Math.random() * 6.28 });
  }
  function resize() {
    var dpr = window.devicePixelRatio || 1; W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < sparks.length; i++) {
      var p = sparks[i]; p.x += p.vx; p.y += p.vy; p.f += .06; p.vx += (Math.random() - .5) * .02;
      if (p.vx > .4) p.vx = .4; if (p.vx < -.4) p.vx = -.4;
      if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; } if (p.x < -12) p.x = W + 12; if (p.x > W + 12) p.x = -12;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = "rgba(" + COLOR + "," + (p.o * (.65 + Math.sin(p.f) * .35)) + ")"; ctx.shadowColor = "rgba(" + COLOR + ",.9)"; ctx.shadowBlur = 12; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  addEventListener("resize", resize); resize(); requestAnimationFrame(draw);
})();

/* ═════════════════ 4b · LASER CROSSHAIR CURSOR ═════════════════ */
(function () {
  "use strict";
  var cursor = document.getElementById("mm-cursor");
  if (!cursor || window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;
  var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; cursor.classList.add("is-active"); });
  document.addEventListener("mouseleave", function () { cursor.classList.remove("is-active"); });
  document.addEventListener("mouseover", function (e) {
    var t = e.target; if (!t || typeof t.closest !== "function") return;
    cursor.classList.toggle("is-hot", !!t.closest("a, button, .work-card, .social-icon, .step, .flow-step, .admin-item, .var-btn, .mat-btn"));
  });
  (function loop() {
    cx += (mx - cx) * .18; cy += (my - cy) * .18;
    cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%)";
    requestAnimationFrame(loop);
  })();
})();
