/* ============================================================
   AI × Semiconductors module — ai.js
   Converter health monitor (streaming anomaly detection) ·
   wafer-map pattern classifier · test-limits explorer
   ============================================================ */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);

  /* ---------------- Converter health monitor ---------------- */
  (function health() {
    const scope = $("healthScope");
    if (!scope) return;
    const trace = $("healthTrace"), up = $("bandUpper"), lo = $("bandLower"), marks = $("healthMarks");
    const W = 440, H = 170, N = 220;          // N samples across width
    const base = 95, noise = 6;
    let data = [], isFault = [], flagged = [];
    let drift = 0, driftOn = false;
    let hits = 0, miss = 0, falses = 0;
    let spikeQueue = 0;

    function push(v, fault) {
      data.push(v); isFault.push(fault); flagged.push(false);
      if (data.length > N) { data.shift(); isFault.shift(); flagged.shift(); }
    }
    for (let i = 0; i < N; i++) push(base + (Math.random() - 0.5) * noise, false);

    function stats() {
      // "training window": first 60% of visible samples that aren't faulty
      const clean = data.filter((_, i) => !isFault[i]).slice(0, Math.floor(N * 0.6));
      const m = clean.reduce((a, b) => a + b, 0) / clean.length;
      const sd = Math.sqrt(clean.reduce((a, b) => a + (b - m) ** 2, 0) / clean.length);
      return { m, sd: Math.max(sd, 1.5) };
    }

    function step() {
      let fault = false;
      let v = base + (Math.random() - 0.5) * noise;
      if (driftOn) { drift += 0.09; v += drift; fault = drift > 3; }
      if (spikeQueue > 0) { v += 34 + Math.random() * 10; fault = true; spikeQueue--; }
      push(v, fault);

      const k = parseFloat($("inSigma").value);
      const { m, sd } = stats();
      const i = data.length - 1;
      const anomalous = Math.abs(data[i] - m) > k * sd;
      flagged[i] = anomalous;
      if (anomalous && fault) hits++;
      else if (anomalous && !fault) falses++;
      else if (!anomalous && fault) miss++;

      $("pillHits").textContent = hits;
      $("pillMiss").textContent = miss;
      $("pillFalse").textContent = falses;
      draw(m, sd, k);
    }

    function draw(m, sd, k) {
      const xs = (i) => (i / (N - 1)) * W;
      const ys = (v) => H - ((v - 40) / 110) * H;
      trace.setAttribute("points", data.map((v, i) => `${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(" "));
      up.setAttribute("points", `0,${ys(m + k * sd).toFixed(1)} ${W},${ys(m + k * sd).toFixed(1)}`);
      lo.setAttribute("points", `0,${ys(m - k * sd).toFixed(1)} ${W},${ys(m - k * sd).toFixed(1)}`);
      marks.innerHTML = "";
      data.forEach((v, i) => {
        if (!flagged[i]) return;
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", xs(i)); c.setAttribute("cy", ys(v)); c.setAttribute("r", 3);
        c.setAttribute("fill", "#f87171");
        marks.appendChild(c);
      });
    }

    $("btnSpike").addEventListener("click", () => { spikeQueue = 4; });
    $("btnDrift").addEventListener("click", function () {
      driftOn = !driftOn;
      this.textContent = driftOn ? "⏸ Stop drift" : "📈 Start cap-aging drift";
      if (!driftOn) drift = 0;
    });
    $("btnHealthReset").addEventListener("click", () => {
      data = []; isFault = []; flagged = [];
      for (let i = 0; i < N; i++) push(base + (Math.random() - 0.5) * noise, false);
      drift = 0; driftOn = false; hits = miss = falses = 0; spikeQueue = 0;
      $("btnDrift").textContent = "📈 Start cap-aging drift";
      $("pillHits").textContent = $("pillMiss").textContent = $("pillFalse").textContent = "0";
    });
    $("inSigma").addEventListener("input", () => {
      $("outSigma").textContent = parseFloat($("inSigma").value).toFixed(1) + " σ";
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setInterval(step, reduced ? 400 : 120);
  })();

  /* ---------------- Wafer-map pattern classifier ---------------- */
  (function patterns() {
    const svg = $("patternMap");
    if (!svg) return;
    const GRID = 26, R = 120, CX = 130, CY = 130, cell = (2 * R) / GRID;
    let cells = [];       // {x,y,gx,gy,fail}
    let currentPat = "random";

    function generate(pat) {
      currentPat = pat === "mystery" ? ["ring", "scratch", "center", "random"][Math.floor(Math.random() * 4)] : pat;
      svg.innerHTML = "";
      const outline = document.createElementNS(NS, "circle");
      outline.setAttribute("cx", CX); outline.setAttribute("cy", CY); outline.setAttribute("r", R + 5);
      outline.setAttribute("fill", "var(--bg-inset)"); outline.setAttribute("stroke", "var(--dgm-stroke)");
      svg.appendChild(outline);
      cells = [];
      // scratch params
      const ang = Math.random() * Math.PI, off = (Math.random() - 0.5) * 60;
      const sin = Math.sin(ang), cos = Math.cos(ang);
      for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
          const x = CX - R + gx * cell, y = CY - R + gy * cell;
          const dx = x + cell / 2 - CX, dy = y + cell / 2 - CY;
          const r = Math.hypot(dx, dy);
          if (r > R - 2) continue;
          let p = 0.04; // baseline
          if (currentPat === "ring") p += r > R * 0.72 ? 0.75 : 0;
          if (currentPat === "center") p += r < R * 0.32 ? 0.8 : 0;
          if (currentPat === "scratch") {
            const dist = Math.abs(dx * sin - dy * cos + off);
            p += dist < cell * 0.9 ? 0.85 : 0;
          }
          if (currentPat === "random") p = 0.13;
          const fail = Math.random() < p;
          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", x); rect.setAttribute("y", y);
          rect.setAttribute("width", cell - 0.8); rect.setAttribute("height", cell - 0.8);
          rect.setAttribute("rx", 1);
          rect.setAttribute("fill", fail ? "var(--bad)" : "var(--good)");
          rect.setAttribute("opacity", fail ? "0.95" : "0.55");
          svg.appendChild(rect);
          cells.push({ dx, dy, r, fail });
        }
      }
      $("classVerdict").style.display = "none";
      document.querySelectorAll("#patternBtns .litho-btn").forEach((b) => b.classList.remove("active"));
      const btn = document.querySelector(`#patternBtns [data-pat="${pat}"]`);
      if (btn) btn.classList.add("active");
    }

    function classify() {
      const fails = cells.filter((c) => c.fail);
      const total = cells.length, nf = fails.length;
      const failRate = nf / total;
      // features
      const outer = fails.filter((c) => c.r > R * 0.7).length / Math.max(1, cells.filter((c) => c.r > R * 0.7).length);
      const inner = fails.filter((c) => c.r < R * 0.35).length / Math.max(1, cells.filter((c) => c.r < R * 0.35).length);
      // line detection: best of sampled angles; score = densest 3-bin band of projected distances
      let bestLine = 0;
      for (let a = 0; a < Math.PI; a += Math.PI / 36) {
        const s = Math.sin(a), c2 = Math.cos(a);
        const hist = {};
        fails.forEach((c) => {
          const d = Math.round((c.dx * s - c.dy * c2) / cell);
          hist[d] = (hist[d] || 0) + 1;
        });
        for (const k in hist) {
          const d = parseInt(k, 10);
          const band = (hist[d - 1] || 0) + hist[d] + (hist[d + 1] || 0);
          bestLine = Math.max(bestLine, band / Math.max(1, nf));
        }
      }
      let label, cause, conf;
      if (bestLine > 0.45 && nf > 10) {
        label = "➖ SCRATCH pattern";
        cause = "Failures align on a straight line — the signature of mechanical damage. Suspects: wafer-handling robot, CMP pad debris, or a scribe during transport. Action: check handler logs for this lot, inspect CMP pads.";
        conf = 0.86 + bestLine * 0.1;
      } else if (outer > 0.5 && outer > inner * 2.5) {
        label = "⭕ EDGE-RING pattern";
        cause = "Failures concentrate in an outer annulus — a radial process non-uniformity. Suspects: etch/deposition chamber edge effects, resist spin edge-bead, or temperature gradient at wafer edge. Action: review chamber uniformity maps.";
        conf = 0.8 + outer * 0.15;
      } else if (inner > 0.5 && inner > outer * 2.5) {
        label = "🎯 CENTER-BLOB pattern";
        cause = "Failures cluster at the wafer center. Suspects: CVD/spin nozzle centering, chuck cooling at center, or dispense-volume drift. Action: check dispense calibration on the coater track.";
        conf = 0.8 + inner * 0.15;
      } else {
        label = "🎲 RANDOM defects";
        cause = "No spatial structure — this is baseline defect density (D₀) doing its statistical thing. No specific tool to blame; if the rate is above target, it's a cleanliness/particle program problem, not a single excursion.";
        conf = 0.75 + (1 - Math.abs(failRate - 0.13)) * 0.15;
      }
      conf = Math.min(0.99, conf);
      $("classTitle").textContent = label;
      $("classText").textContent = cause;
      $("classConf").style.width = (conf * 100).toFixed(0) + "%";
      $("classConfNum").textContent = (conf * 100).toFixed(0) + "%";
      $("classFeats").textContent =
        `fail ${(failRate * 100).toFixed(0)}% · edge ${(outer * 100).toFixed(0)}% · center ${(inner * 100).toFixed(0)}% · line-score ${(bestLine * 100).toFixed(0)}%`;
      $("classVerdict").style.display = "";
    }

    $("patternBtns").addEventListener("click", (e) => {
      const b = e.target.closest(".litho-btn");
      if (b) generate(b.dataset.pat);
    });
    $("btnClassify").addEventListener("click", classify);
    generate("ring");
  })();

  /* ---------------- Test-limits explorer ---------------- */
  (function limits() {
    const svg = $("limitPlot");
    if (!svg) return;
    const W = 420, H = 320, PAD = 40;
    // synthetic dies: x = leakage (0-100), y = speed (0-100)
    // true-good region: correlated ellipse — fast dies tolerate more leakage
    let dies = [];
    let seed = 7;
    function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    function gauss() { return (rand() + rand() + rand() + rand() - 2) / 2; }
    for (let i = 0; i < 260; i++) {
      const x = 45 + gauss() * 46;
      const y = 52 + gauss() * 44;
      // ground truth: elliptical good region tilted (speed compensates leakage)
      const u = (x - 38 + (y - 55) * 0.35) / 34;
      const v = (y - 58) / 40;
      const good = u * u + v * v < 1 && rand() > 0.02;
      dies.push({ x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)), good });
    }
    const px = (x) => PAD + (x / 100) * (W - PAD - 14);
    const py = (y) => H - PAD - (y / 100) * (H - PAD - 20);

    let mode = "box"; // or "ml"
    function mlPass(d) {
      const u = (d.x - 38 + (d.y - 55) * 0.35) / 34;
      const v = (d.y - 58) / 40;
      return u * u + v * v < 1;
    }
    function boxPass(d, lx, ly) { return d.x <= lx && d.y >= ly; }

    function draw() {
      const lx = parseInt($("inLimX").value, 10);
      const ly = parseInt($("inLimY").value, 10);
      $("outLimX").textContent = lx;
      $("outLimY").textContent = ly;
      svg.innerHTML = "";
      const el = (tag, attrs) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        svg.appendChild(e);
        return e;
      };
      // axes
      el("line", { x1: PAD, y1: H - PAD, x2: W - 8, y2: H - PAD, stroke: "var(--dgm-stroke)", "stroke-width": 2 });
      el("line", { x1: PAD, y1: H - PAD, x2: PAD, y2: 12, stroke: "var(--dgm-stroke)", "stroke-width": 2 });
      const tx = el("text", { x: (PAD + W) / 2, y: H - 10, "font-size": 10.5, "text-anchor": "middle", fill: "var(--dgm-label)" });
      tx.textContent = "leakage current →";
      const ty = el("text", { x: 14, y: (H - PAD) / 2, "font-size": 10.5, "text-anchor": "middle", fill: "var(--dgm-label)", transform: `rotate(-90 14 ${(H - PAD) / 2})` });
      ty.textContent = "speed →";

      // pass region
      if (mode === "box") {
        el("rect", {
          x: PAD, y: py(100), width: px(lx) - PAD, height: py(ly) - py(100),
          fill: "var(--accent)", opacity: 0.07
        });
        el("line", { x1: px(lx), y1: py(100), x2: px(lx), y2: H - PAD, stroke: "var(--accent)", "stroke-width": 2, "stroke-dasharray": "6 5" });
        el("line", { x1: PAD, y1: py(ly), x2: W - 8, y2: py(ly), stroke: "var(--accent)", "stroke-width": 2, "stroke-dasharray": "6 5" });
      } else {
        // ml ellipse boundary (parametric, matches mlPass)
        let pts = "";
        for (let t = 0; t <= Math.PI * 2 + 0.05; t += 0.08) {
          const u = Math.cos(t), v = Math.sin(t);
          const yv = 58 + v * 40;
          const xv = 38 + u * 34 - (yv - 55) * 0.35;
          pts += `${px(Math.max(0, Math.min(100, xv))).toFixed(1)},${py(Math.max(0, Math.min(100, yv))).toFixed(1)} `;
        }
        el("polyline", { points: pts.trim(), fill: "var(--accent-3)", "fill-opacity": 0.08, stroke: "var(--accent-3)", "stroke-width": 2.2, "stroke-dasharray": "7 5" });
        const lbl = el("text", { x: px(38), y: py(58), "font-size": 11, "text-anchor": "middle", fill: "var(--accent-3)", "font-weight": 600 });
        lbl.textContent = "learned boundary";
      }

      // dies
      let tp = 0, ok = 0, esc = 0;
      dies.forEach((d) => {
        const pass = mode === "box" ? boxPass(d, lx, ly) : mlPass(d);
        if (pass && d.good) tp++;
        if (!pass && d.good) ok++;
        if (pass && !d.good) esc++;
        const c = el("circle", { cx: px(d.x), cy: py(d.y), r: 3.4, fill: d.good ? "var(--good)" : "var(--bad)", opacity: 0.85 });
        if (pass !== d.good) {
          c.setAttribute("stroke", pass ? "var(--bad)" : "var(--accent-2)");
          c.setAttribute("stroke-width", "2");
          c.setAttribute("r", "4.2");
        }
      });
      const goodTotal = dies.filter((d) => d.good).length;
      $("pillTP").textContent = tp;
      $("pillOK").textContent = ok + " (" + ((ok / goodTotal) * 100).toFixed(0) + "%)";
      $("pillESC").textContent = esc;
      $("pillEY").textContent = ((tp / goodTotal) * 100).toFixed(0) + "%";
    }
    $("inLimX").addEventListener("input", () => { mode = "box"; draw(); });
    $("inLimY").addEventListener("input", () => { mode = "box"; draw(); });
    $("btnMLBoundary").addEventListener("click", () => { mode = "ml"; draw(); });
    $("btnBoxBoundary").addEventListener("click", () => { mode = "box"; draw(); });
    draw();
  })();
})();
