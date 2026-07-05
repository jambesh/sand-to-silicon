/* ============================================================
   Sand to Silicon — main.js
   Theme toggle · scroll effects · hero wafer · litho stepper ·
   yield lab (calculator + wafer map + curve) · probe map · quiz
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Theme toggle ---------------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.addEventListener("click", () => {
    const light = root.getAttribute("data-theme") === "light";
    if (light) {
      root.removeAttribute("data-theme");
      localStorage.setItem("s2s-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("s2s-theme", "light");
    }
  });

  /* ---------------- Scroll progress + back-to-top ---------------- */
  const progressBar = document.getElementById("progressBar");
  const toTop = document.getElementById("toTop");
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", h.scrollTop > 800);
    updateDots();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------------- Reveal on scroll ---------------- */
  const revealObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------------- Journey dots ---------------- */
  const stages = Array.from(document.querySelectorAll("section.stage[id^='stage-']"));
  const dotsNav = document.getElementById("journeyDots");
  stages.forEach((s) => {
    const a = document.createElement("a");
    a.href = "#" + s.id;
    a.title = s.querySelector("h2") ? s.querySelector("h2").textContent : s.id;
    dotsNav.appendChild(a);
  });
  const dotLinks = Array.from(dotsNav.children);
  function updateDots() {
    let active = 0;
    const mid = window.innerHeight * 0.45;
    stages.forEach((s, i) => {
      if (s.getBoundingClientRect().top < mid) active = i;
    });
    dotLinks.forEach((d, i) => d.classList.toggle("active", i === active));
  }

  /* ---------------- Hero wafer: animated dice ---------------- */
  (function heroWafer() {
    const g = document.getElementById("heroDice");
    if (!g) return;
    const R = 132, cx = 150, cy = 150, cell = 21, gap = 3;
    const cells = [];
    for (let y = -7; y <= 7; y++) {
      for (let x = -7; x <= 7; x++) {
        const px = cx + x * (cell + gap) - cell / 2;
        const py = cy + y * (cell + gap) - cell / 2;
        const corners = [[px, py], [px + cell, py], [px, py + cell], [px + cell, py + cell]];
        if (!corners.every(([a, b]) => (a - cx) ** 2 + (b - cy) ** 2 < R * R)) continue;
        const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        r.setAttribute("x", px); r.setAttribute("y", py);
        r.setAttribute("width", cell); r.setAttribute("height", cell);
        r.setAttribute("rx", 2.5);
        r.setAttribute("class", "die-cell");
        r.setAttribute("fill", "var(--dgm-fill)");
        r.setAttribute("stroke", "var(--dgm-stroke)");
        r.setAttribute("stroke-width", "0.7");
        g.appendChild(r);
        cells.push(r);
      }
    }
    // gentle twinkle: light up random dice
    setInterval(() => {
      const lit = cells[Math.floor(Math.random() * cells.length)];
      lit.setAttribute("fill", "var(--accent)");
      lit.setAttribute("opacity", "0.85");
      setTimeout(() => {
        lit.setAttribute("fill", "var(--dgm-fill)");
        lit.setAttribute("opacity", "1");
      }, 900);
    }, 220);
  })();

  /* ---------------- Litho step-through ---------------- */
  (function litho() {
    const controls = document.getElementById("lithoControls");
    if (!controls) return;
    const beams = document.getElementById("lithoBeams");
    const resist = document.getElementById("resistLayer");
    const dev = document.getElementById("devPattern");
    const cap = document.getElementById("lithoCaption");
    const sub = document.getElementById("lithoSub");
    const oxide = document.querySelector("#resistStack rect:nth-child(2)");

    const steps = {
      coat: {
        cap: "Coat: photoresist is spin-coated into a uniform film",
        sub: "a few drops + 3000 rpm = nanometre-uniform coating",
        fn() { beams.style.opacity = 0; resist.style.opacity = 0.75; dev.style.opacity = 0; oxide.setAttribute("opacity", "0.8"); }
      },
      expose: {
        cap: "Expose: UV light copies the mask pattern into the resist",
        sub: "smallest feature ∝ wavelength / numerical aperture",
        fn() { beams.style.opacity = 1; resist.style.opacity = 0.75; dev.style.opacity = 0; oxide.setAttribute("opacity", "0.8"); }
      },
      develop: {
        cap: "Develop: exposed resist dissolves, leaving a stencil",
        sub: "positive resist: what the light touched washes away",
        fn() { beams.style.opacity = 0; resist.style.opacity = 0; dev.style.opacity = 1; oxide.setAttribute("opacity", "0.8"); }
      },
      etch: {
        cap: "Etch: plasma carves the oxide wherever resist is missing",
        sub: "the resist islands shield the film beneath them",
        fn() { beams.style.opacity = 0; resist.style.opacity = 0; dev.style.opacity = 1; oxide.setAttribute("opacity", "0.25"); }
      },
      strip: {
        cap: "Strip: resist is removed — the pattern now lives in the oxide",
        sub: "one layer done; repeat ~100× for a full chip",
        fn() { beams.style.opacity = 0; resist.style.opacity = 0; dev.style.opacity = 0; oxide.setAttribute("opacity", "0.25"); }
      }
    };
    controls.addEventListener("click", (e) => {
      const btn = e.target.closest(".litho-btn");
      if (!btn) return;
      controls.querySelectorAll(".litho-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const s = steps[btn.dataset.step];
      cap.textContent = s.cap;
      sub.textContent = s.sub;
      s.fn();
    });
  })();

  /* ---------------- Yield math helpers ---------------- */
  const WAFER_D = 300;      // mm
  const EDGE_EXCL = 3;      // mm
  function diesPerWafer(dieMM) {
    const d = WAFER_D - 2 * EDGE_EXCL;
    const A = dieMM * dieMM;
    return Math.max(0, Math.floor((Math.PI * (d / 2) ** 2) / A - (Math.PI * d) / Math.sqrt(2 * A)));
  }
  function yieldPoisson(areaCM2, d0) { return Math.exp(-areaCM2 * d0); }
  function yieldMurphy(areaCM2, d0) {
    const ad = areaCM2 * d0;
    if (ad < 1e-9) return 1;
    return Math.pow((1 - Math.exp(-ad)) / ad, 2);
  }

  /* ---------------- Yield Lab ---------------- */
  (function yieldLab() {
    const inDie = document.getElementById("inDie");
    if (!inDie) return;
    const inD0 = document.getElementById("inD0");
    const inWCost = document.getElementById("inWCost");
    const outDie = document.getElementById("outDie");
    const outD0 = document.getElementById("outD0");
    const outWCost = document.getElementById("outWCost");
    const resDPW = document.getElementById("resDPW");
    const resYield = document.getElementById("resYield");
    const resPoisson = document.getElementById("resPoisson");
    const resGood = document.getElementById("resGood");
    const resCost = document.getElementById("resCost");
    const mapSvg = document.getElementById("waferMap");
    const curveLow = document.getElementById("yieldCurveLow");
    const curveHigh = document.getElementById("yieldCurveHigh");
    const yieldDot = document.getElementById("yieldDot");

    // static yield-vs-area curves (die 0→800 mm²)
    function curvePath(d0) {
      const pts = [];
      for (let a = 0; a <= 800; a += 10) {
        const y = yieldMurphy(a / 100, d0); // mm²→cm²
        const px = 55 + (a / 800) * 375;
        const py = 250 - y * 224;
        pts.push((a === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1));
      }
      return pts.join(" ");
    }
    if (curveLow) {
      curveLow.setAttribute("d", curvePath(0.1));
      curveHigh.setAttribute("d", curvePath(0.5));
    }

    let seed = 42;
    function rand() { // deterministic-ish PRNG so map doesn't flicker wildly per input event
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    function drawWaferMap(dieMM, yieldFrac) {
      const NS = "http://www.w3.org/2000/svg";
      mapSvg.innerHTML = "";
      const R = 150, cx = 160, cy = 160;
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", R + 6);
      circle.setAttribute("fill", "var(--bg-inset)");
      circle.setAttribute("stroke", "var(--dgm-stroke)");
      circle.setAttribute("stroke-width", "2");
      mapSvg.appendChild(circle);

      // scale: wafer 300mm → 2R px
      const pxPerMM = (2 * R) / WAFER_D;
      const cellPx = Math.max(3, dieMM * pxPerMM);
      const gapPx = Math.max(0.6, cellPx * 0.08);
      const pitch = cellPx + gapPx;
      const n = Math.ceil(R / pitch) + 1;
      const innerR = R - EDGE_EXCL * pxPerMM;
      seed = 42 + Math.round(dieMM * 7) + Math.round(yieldFrac * 997);

      let good = 0, bad = 0;
      for (let gy = -n; gy <= n; gy++) {
        for (let gx = -n; gx <= n; gx++) {
          const x = cx + gx * pitch - cellPx / 2;
          const y = cy + gy * pitch - cellPx / 2;
          const corners = [[x, y], [x + cellPx, y], [x, y + cellPx], [x + cellPx, y + cellPx]];
          const insideFull = corners.every(([a, b]) => (a - cx) ** 2 + (b - cy) ** 2 < innerR * innerR);
          const insideAny = corners.some(([a, b]) => (a - cx) ** 2 + (b - cy) ** 2 < R * R);
          if (!insideAny) continue;
          const r = document.createElementNS(NS, "rect");
          r.setAttribute("x", x); r.setAttribute("y", y);
          r.setAttribute("width", cellPx); r.setAttribute("height", cellPx);
          r.setAttribute("rx", Math.min(2, cellPx * 0.15));
          if (!insideFull) {
            r.setAttribute("fill", "var(--text-faint)");
            r.setAttribute("opacity", "0.28");
          } else if (rand() < yieldFrac) {
            r.setAttribute("fill", "var(--good)");
            r.setAttribute("opacity", "0.9");
            good++;
          } else {
            r.setAttribute("fill", "var(--bad)");
            r.setAttribute("opacity", "0.9");
            bad++;
          }
          mapSvg.appendChild(r);
        }
      }
      // notch
      const notch = document.createElementNS(NS, "circle");
      notch.setAttribute("cx", cx); notch.setAttribute("cy", cy + R + 6);
      notch.setAttribute("r", 7);
      notch.setAttribute("fill", "var(--bg)");
      notch.setAttribute("stroke", "var(--dgm-stroke)");
      mapSvg.appendChild(notch);
      return { good, bad };
    }

    function fmtMoney(x) {
      if (!isFinite(x)) return "—";
      return x >= 100 ? "$" + Math.round(x).toLocaleString() : "$" + x.toFixed(2);
    }

    function update() {
      const dieMM = parseFloat(inDie.value);
      const d0 = parseFloat(inD0.value);
      const wcost = parseFloat(inWCost.value);
      outDie.textContent = dieMM + " × " + dieMM + " mm";
      outD0.textContent = d0.toFixed(2) + " /cm²";
      outWCost.textContent = "$" + wcost.toLocaleString();

      const areaCM2 = (dieMM * dieMM) / 100;
      const dpw = diesPerWafer(dieMM);
      const yM = yieldMurphy(areaCM2, d0);
      const yP = yieldPoisson(areaCM2, d0);
      const goodDies = Math.round(dpw * yM);

      resDPW.textContent = dpw.toLocaleString();
      resYield.textContent = (yM * 100).toFixed(1) + "%";
      resPoisson.textContent = (yP * 100).toFixed(1) + "%";
      resGood.textContent = goodDies.toLocaleString();
      resCost.textContent = goodDies > 0 ? fmtMoney(wcost / goodDies) : "∞";

      drawWaferMap(dieMM, yM);

      if (yieldDot) {
        const a = Math.min(800, dieMM * dieMM);
        yieldDot.setAttribute("cx", 55 + (a / 800) * 375);
        yieldDot.setAttribute("cy", 250 - yM * 224);
      }
    }
    [inDie, inD0, inWCost].forEach((el) => el.addEventListener("input", update));
    update();
  })();

  /* ---------------- Probe-section mini wafer map ---------------- */
  (function probeMap() {
    const g = document.getElementById("probeMapG");
    if (!g) return;
    const NS = "http://www.w3.org/2000/svg";
    const cols = 20, rows = 9, cell = 15, gap = 2;
    const w = cols * (cell + gap), h = rows * (cell + gap);
    const cx = w / 2, cy = h / 2, R = Math.min(cx, cy) + 8;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * (cell + gap), py = y * (cell + gap);
        const dx = px + cell / 2 - cx, dy = (py + cell / 2 - cy) * 1.9;
        if (dx * dx + dy * dy > R * R * 1.05) continue;
        const r = document.createElementNS(NS, "rect");
        r.setAttribute("x", px + 40); r.setAttribute("y", py);
        r.setAttribute("width", cell); r.setAttribute("height", cell);
        r.setAttribute("rx", 2);
        r.setAttribute("fill", Math.random() < 0.88 ? "var(--good)" : "var(--bad)");
        r.setAttribute("opacity", "0.85");
        g.appendChild(r);
      }
    }
  })();

  /* ---------------- Quiz ---------------- */
  (function quiz() {
    const panel = document.getElementById("quizPanel");
    if (!panel) return;
    const scoreEl = document.getElementById("quizScore");
    const QA = [
      {
        q: "Why is beach sand usually NOT used for chip-grade silicon?",
        opts: ["It contains too many impurities", "It's the wrong colour", "It melts at too low a temperature", "It's too expensive"],
        a: 0,
        why: "Fabs start from high-purity quartzite; beach sand carries too many contaminants."
      },
      {
        q: "What does the Czochralski process produce?",
        opts: ["Polysilicon chunks", "A single-crystal silicon ingot", "Photomasks", "Trichlorosilane gas"],
        a: 1,
        why: "A rotating seed crystal is slowly pulled from molten silicon, growing one perfect crystal."
      },
      {
        q: "EUV lithography uses light with a wavelength of…",
        opts: ["193 nm", "365 nm", "13.5 nm", "1.35 µm"],
        a: 2,
        why: "EUV = extreme ultraviolet at 13.5 nm, made by blasting tin droplets with a laser."
      },
      {
        q: "Doubling die area does what to yield (roughly)?",
        opts: ["Nothing", "Halves the defect density", "Doubles it", "Squares it (e.g. 80% → 64%)"],
        a: 3,
        why: "Yield falls exponentially with area: Y = e^(−A·D₀), so 2× area squares the yield."
      },
      {
        q: "Wafer probing happens…",
        opts: ["After packaging", "Before the wafer is diced", "During crystal growth", "Only on failed chips"],
        a: 1,
        why: "Every die is tested on-wafer so money isn't wasted packaging bad dies."
      }
    ];
    let score = 0, answered = 0;
    QA.forEach((item, qi) => {
      const div = document.createElement("div");
      div.className = "quiz-q";
      const qt = document.createElement("div");
      qt.className = "q-text";
      qt.textContent = (qi + 1) + ". " + item.q;
      div.appendChild(qt);
      const opts = document.createElement("div");
      opts.className = "quiz-opts";
      item.opts.forEach((o, oi) => {
        const b = document.createElement("button");
        b.className = "quiz-opt";
        b.textContent = o;
        b.addEventListener("click", () => {
          if (div.dataset.done) return;
          div.dataset.done = "1";
          answered++;
          if (oi === item.a) { b.classList.add("correct"); score++; }
          else {
            b.classList.add("wrong");
            opts.children[item.a].classList.add("correct");
          }
          const why = document.createElement("p");
          why.style.cssText = "font-size:0.82rem;color:var(--text-soft);margin:8px 2px 0;";
          why.textContent = "→ " + item.why;
          div.appendChild(why);
          scoreEl.textContent = score + " / " + answered;
          if (answered === QA.length) {
            const done = document.createElement("p");
            done.style.cssText = "font-weight:700;color:var(--accent);margin-top:6px;font-size:1rem;";
            done.textContent =
              score === QA.length ? "🏆 Perfect — you're ready for the fab floor!" :
              score >= 3 ? "👏 Solid! Revisit the stages you missed." :
              "📚 Scroll back up and take the journey again!";
            panel.appendChild(done);
          }
        });
        opts.appendChild(b);
      });
      div.appendChild(opts);
      panel.appendChild(div);
    });
  })();

  onScroll();
})();
