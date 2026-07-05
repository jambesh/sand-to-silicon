/* ============================================================
   Power Electronics module — power.js
   Device map · linear-vs-switching tool · buck playground ·
   virtual breadboard lab (PWM dimmer + bridge rectifier)
   ============================================================ */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);

  /* ---------------- Device map ---------------- */
  (function deviceMap() {
    const map = $("deviceMap");
    if (!map) return;
    const infoTitle = document.querySelector("#devInfo .v-title");
    const infoText = $("devInfoText");
    const INFO = {
      igbt: ["🚆 IGBT — the heavy lifter",
        "A MOSFET gate welded onto a bipolar body: easy to drive, conducts huge currents at 1.2–6.5 kV, but switches slowly (≤ ~20 kHz). Found in trains, wind turbines, industrial motor drives and older EV inverters."],
      simos: ["🔧 Silicon MOSFET — the workhorse",
        "Cheap, rugged, everywhere. Rules below ~650 V: laptop adapters, motherboard VRMs, battery tools, car 12 V systems. Billions shipped per year; the default answer unless something forces an upgrade."],
      sic: ["🚗 SiC MOSFET — the EV muscle",
        "Silicon carbide's wide bandgap survives 1,200 V+ with low loss and 3× better heat conduction. The reason 800 V EVs gained ~5% range and fast chargers shrank. Grown at 2,400 °C on wafers so hard they're laser-cut."],
      gan: ["⚡ GaN — the speed demon",
        "Gallium nitride switches in nanoseconds with almost no gate charge, enabling MHz converters and the tiny 65–240 W chargers in your bag. Grown as a thin film on silicon wafers — a chip-fab product through and through."]
    };
    map.querySelectorAll(".dev-region").forEach((g) => {
      g.addEventListener("click", () => {
        const d = INFO[g.dataset.dev];
        infoTitle.textContent = d[0];
        infoText.textContent = d[1];
        map.querySelectorAll("ellipse").forEach((e) => (e.style.strokeWidth = 0));
        const el = g.querySelector("ellipse");
        el.style.stroke = "var(--accent)";
        el.style.strokeWidth = "2.5";
      });
    });
  })();

  /* ---------------- Linear vs switching tool ---------------- */
  (function linTool() {
    const inVin = $("inVin");
    if (!inVin) return;
    const inVout = $("inVout"), inI = $("inIload");
    function update() {
      let vin = parseFloat(inVin.value);
      let vout = Math.min(parseFloat(inVout.value), vin - 0.3);
      const i = parseFloat(inI.value);
      $("outVin").textContent = vin.toFixed(1) + " V";
      $("outVout").textContent = vout.toFixed(1) + " V";
      $("outIload").textContent = i.toFixed(1) + " A";

      const pout = vout * i;
      const effL = vout / vin;
      const heatL = (vin - vout) * i;
      const effS = 0.94;
      const heatS = pout * (1 / effS - 1);

      $("effLin").textContent = (effL * 100).toFixed(0) + "%";
      $("barLin").style.width = (effL * 100).toFixed(0) + "%";
      $("barLin").style.background = effL > 0.75 ? "var(--good)" : effL > 0.5 ? "var(--accent-2)" : "var(--bad)";
      $("heatLin").textContent = heatL.toFixed(1) + " W";
      $("heatLinNote").textContent = heatL > 5 ? "🔥 needs a serious heatsink" : heatL > 1.5 ? "♨️ warm — small heatsink" : "🙂 fine bare";

      $("effSw").textContent = (effS * 100).toFixed(0) + "%";
      $("barSw").style.width = "94%";
      $("heatSw").textContent = heatS.toFixed(1) + " W";
      $("heatSwNote").textContent = heatS > 5 ? "♨️ warm at this power" : "😎 barely warm";

      const vt = $("linVerdictText");
      if (effL > 0.8 && heatL < 1.5) {
        vt.innerHTML = "Small drop, modest current — a <strong>linear regulator wins here</strong>: simpler, cheaper, zero switching noise.";
      } else if (heatL < 4) {
        vt.innerHTML = "Borderline. Linear works with a heatsink, but a <strong>buck converter</strong> saves " + (heatL - heatS).toFixed(1) + " W. Battery-powered? Go switching.";
      } else {
        vt.innerHTML = "The LDO would burn <strong>" + heatL.toFixed(1) + " W</strong> to deliver " + pout.toFixed(1) + " W — that's " + (effL * 100).toFixed(0) + "% efficiency. This is firmly <strong>switching-converter territory</strong>.";
      }
    }
    [inVin, inVout, inI].forEach((el) => el.addEventListener("input", update));
    update();
  })();

  /* ---------------- Buck converter playground ---------------- */
  (function buck() {
    const inDuty = $("inDuty");
    if (!inDuty) return;
    const inBVin = $("inBVin");
    const swArm = $("buckSwArm"), led = $("buckLED"), glow = $("buckGlow");
    const pwmLine = $("scopePWM"), voutLine = $("scopeVout");

    let duty = 0.5, vin = 12;
    function redraw() {
      duty = parseInt(inDuty.value, 10) / 100;
      vin = parseInt(inBVin.value, 10);
      const vout = duty * vin;
      $("outDuty").textContent = Math.round(duty * 100) + "%";
      $("outBVin").textContent = vin + " V";
      $("buckVinLbl").textContent = vin + " V";
      $("buckVoutLbl").textContent = vout.toFixed(1) + " V";
      $("pillVout").textContent = vout.toFixed(1) + " V";
      const ripple = 0.04 * vin * duty * (1 - duty) * 4; // illustrative
      $("pillRipple").textContent = "±" + ripple.toFixed(2) + " V";
      led.setAttribute("opacity", (0.25 + 0.75 * duty).toFixed(2));
      glow.setAttribute("opacity", (0.05 + 0.3 * duty).toFixed(2));

      // scope traces: 4 PWM periods across 440px
      const periods = 4, W = 440, T = W / periods;
      const hi = 30, lo = 90;
      let pwm = "";
      for (let p = 0; p < periods; p++) {
        const x0 = p * T, xm = x0 + T * duty;
        pwm += `${x0},${lo} ${x0},${hi} ${xm},${hi} ${xm},${lo} ${x0 + T},${lo} `;
      }
      pwmLine.setAttribute("points", pwm.trim());
      // vout: line at level mapped between lo..hi with small triangle ripple
      const vy = lo - (hi ? (lo - hi) * duty : 0);
      let vo = "";
      const rippApx = Math.min(8, 26 * duty * (1 - duty));
      for (let p = 0; p < periods; p++) {
        const x0 = p * T, xm = x0 + T * duty;
        vo += `${x0},${(vy + rippApx / 2).toFixed(1)} ${xm},${(vy - rippApx / 2).toFixed(1)} ${(x0 + T).toFixed(1)},${(vy + rippApx / 2).toFixed(1)} `;
      }
      voutLine.setAttribute("points", vo.trim());
    }
    // animate the switch arm at slow-motion rate proportional to duty
    let on = true;
    function tick() {
      if (!swArm) return;
      on = !on;
      // closed: arm horizontal (connects), open: lifted
      swArm.setAttribute("x2", on ? "172" : "168");
      swArm.setAttribute("y2", on ? "60" : "38");
      $("buckSwLbl").textContent = on ? "MOSFET: ON" : "MOSFET: OFF";
      led.setAttribute("opacity", on ? (0.35 + 0.65 * duty).toFixed(2) : (0.2 + 0.6 * duty).toFixed(2));
      setTimeout(tick, on ? 250 + 900 * duty : 250 + 900 * (1 - duty));
    }
    [inDuty, inBVin].forEach((el) => el.addEventListener("input", redraw));
    redraw();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) tick();
  })();

  /* ---------------- Breadboard lab ---------------- */
  (function breadboard() {
    const svg = $("bbSvg");
    if (!svg) return;
    const tabs = $("bbTabs");
    const ctlDim = $("bbControlsDimmer"), ctlRect = $("bbControlsRect");
    const tr1 = $("bbTrace1"), tr2 = $("bbTrace2");
    const tr1Lbl = $("bbTr1Lbl"), tr2Lbl = $("bbTr2Lbl");
    let exp = "dimmer";

    /* ---- shared breadboard drawing ---- */
    function el(tag, attrs, parent) {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e);
      return e;
    }
    function drawBoard() {
      svg.innerHTML = "";
      el("rect", { x: 20, y: 40, width: 420, height: 220, rx: 14, fill: "var(--bg-inset)", stroke: "var(--line)", "stroke-width": 2 });
      // power rails
      el("line", { x1: 36, y1: 62, x2: 424, y2: 62, stroke: "var(--accent-4)", "stroke-width": 2, opacity: 0.6 });
      el("line", { x1: 36, y1: 76, x2: 424, y2: 76, stroke: "var(--dgm-si)", "stroke-width": 2, opacity: 0.55 });
      el("line", { x1: 36, y1: 224, x2: 424, y2: 224, stroke: "var(--accent-4)", "stroke-width": 2, opacity: 0.6 });
      el("line", { x1: 36, y1: 238, x2: 424, y2: 238, stroke: "var(--dgm-si)", "stroke-width": 2, opacity: 0.55 });
      // holes
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 26; c++) {
          el("circle", { cx: 42 + c * 15, cy: 104 + r * 22, r: 2.2, fill: "var(--text-faint)", opacity: 0.4 });
        }
      }
      el("text", { x: 30, y: 66, "font-size": 8, fill: "var(--accent-4)" }).textContent = "+";
      el("text", { x: 30, y: 80, "font-size": 8, fill: "var(--dgm-si)" }).textContent = "–";
    }
    function wire(pts, color, w) {
      el("polyline", { points: pts, fill: "none", stroke: color || "var(--dgm-label)", "stroke-width": w || 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" });
    }
    function label(x, y, txt, cls) {
      const t = el("text", { x, y, "font-size": 9.5, "text-anchor": "middle", fill: cls || "var(--dgm-label)" });
      t.textContent = txt;
      return t;
    }

    /* ---- experiment 1: PWM LED dimmer ---- */
    let dimLED;
    function drawDimmer() {
      drawBoard();
      // MCU
      el("rect", { x: 60, y: 108, width: 92, height: 70, rx: 6, fill: "var(--bg-card)", stroke: "var(--accent-3)", "stroke-width": 2 });
      label(106, 138, "MCU", "var(--accent-3)");
      label(106, 154, "PWM pin →", "var(--dgm-label)");
      // MOSFET (TO-220)
      el("rect", { x: 216, y: 104, width: 44, height: 56, rx: 5, fill: "var(--bg-card)", stroke: "var(--dgm-stroke)", "stroke-width": 2 });
      el("rect", { x: 224, y: 92, width: 28, height: 12, fill: "var(--dgm-stroke)" });
      label(238, 134, "MOSFET", "var(--text)");
      label(238, 176, "G   D   S");
      // LED
      dimLED = el("circle", { cx: 340, cy: 120, r: 13, fill: "#f5a623", opacity: 0.5 });
      el("circle", { cx: 340, cy: 120, r: 19, fill: "#f5a623", opacity: 0.12, id: "dimGlowRing" });
      label(340, 152, "LED");
      // resistor
      el("rect", { x: 366, y: 112, width: 34, height: 13, rx: 4, fill: "var(--accent-2)", opacity: 0.8 });
      label(383, 142, "220 Ω");
      // wires: mcu->gate, +rail->resistor->led->drain, source->gnd
      wire("152,140 200,140 200,148 224,148", "var(--accent-3)");
      wire("410,62 410,118 400,118");
      wire("366,118 353,120");
      wire("327,120 300,120 300,148 252,148");
      wire("238,160 238,224", "var(--dgm-si)");
      label(230, 76, "5 V supply on rails", "var(--text-faint)");
    }

    /* ---- experiment 2: bridge rectifier ---- */
    function drawRectifier() {
      drawBoard();
      // AC source
      el("circle", { cx: 84, cy: 140, r: 24, fill: "var(--bg-card)", stroke: "var(--accent-3)", "stroke-width": 2 });
      const s = el("path", { d: "M70 140 q7 -14 14 0 q7 14 14 0", fill: "none", stroke: "var(--accent-3)", "stroke-width": 2 });
      label(84, 180, "AC in (transformer)", "var(--accent-3)");
      // bridge: diamond of 4 diodes
      const bx = 200, by = 140, r = 34;
      el("rect", { x: bx - r - 8, y: by - r - 8, width: 2 * r + 16, height: 2 * r + 16, rx: 8, fill: "var(--bg-card)", stroke: "var(--dgm-stroke)", "stroke-width": 2, transform: `rotate(45 ${bx} ${by})` });
      label(bx, by - 48, "diode bridge", "var(--text)");
      // diode glyphs
      [[bx - 20, by - 20, 45], [bx + 20, by - 20, 135], [bx - 20, by + 20, -45], [bx + 20, by + 20, -135]].forEach(([x, y, rot]) => {
        el("path", { d: "M-6 -5 L6 0 L-6 5 Z M6 -5 L6 5", fill: "var(--dgm-label)", stroke: "var(--dgm-label)", "stroke-width": 1.4, transform: `translate(${x} ${y}) rotate(${rot})` });
      });
      // cap
      el("line", { x1: 300, y1: 112, x2: 300, y2: 132, stroke: "var(--dgm-label)", "stroke-width": 2.4 });
      el("line", { x1: 288, y1: 132, x2: 312, y2: 132, stroke: "var(--dgm-label)", "stroke-width": 3.2 });
      el("line", { x1: 288, y1: 141, x2: 312, y2: 141, stroke: "var(--dgm-label)", "stroke-width": 3.2 });
      el("line", { x1: 300, y1: 141, x2: 300, y2: 162, stroke: "var(--dgm-label)", "stroke-width": 2.4 });
      label(300, 182, "cap C", "var(--text)");
      // load
      el("rect", { x: 356, y: 108, width: 16, height: 52, rx: 5, fill: "var(--accent-2)", opacity: 0.8 });
      label(364, 182, "load R");
      // wires
      wire("108,132 148,132 166,140");
      wire("108,148 148,148 166,140", "var(--dgm-label)", 2);
      wire("234,140 260,124 300,124 300,112");
      wire("300,124 364,124 364,108");
      wire("234,140 260,158 300,158 300,162");
      wire("300,158 364,158 364,160");
      label(240, 250, "AC flips 50/60× a second — diodes fold it, C smooths it", "var(--text-faint)");
    }

    /* ---- traces & readouts ---- */
    function updateDimmer() {
      const duty = parseInt($("inBBduty").value, 10);
      const fr = parseInt($("inBBfreq").value, 10);
      $("outBBduty").textContent = duty + "%";
      $("outBBfreq").textContent = fr < 4 ? fr * 250 + " Hz" : (fr / 4).toFixed(1) + " kHz";
      $("ro1Label").textContent = "LED brightness";
      $("ro1Value").textContent = duty + "%";
      $("ro2Label").textContent = "avg current";
      $("ro2Value").textContent = (duty * 0.2).toFixed(0) + " mA";
      if (dimLED) {
        dimLED.setAttribute("opacity", (0.12 + 0.88 * duty / 100).toFixed(2));
        const ring = document.getElementById("dimGlowRing");
        if (ring) ring.setAttribute("opacity", (0.03 + 0.3 * duty / 100).toFixed(2));
      }
      // gate square wave + LED current (same shape, slight exponential edges implied)
      const W = 440, periods = Math.max(2, Math.min(10, fr + 1)), T = W / periods;
      const hi = 28, lo = 62;
      let p1 = "", p2 = "";
      for (let p = 0; p < periods; p++) {
        const x0 = p * T, xm = x0 + (T * duty) / 100;
        p1 += `${x0},${lo} ${x0},${hi} ${xm},${hi} ${xm},${lo} ${x0 + T},${lo} `;
        p2 += `${x0},${lo + 36} ${x0 + 2},${hi + 40} ${Math.max(xm - 2, x0 + 2)},${hi + 40} ${xm},${lo + 36} ${x0 + T},${lo + 36} `;
      }
      tr1.setAttribute("points", p1.trim());
      tr2.setAttribute("points", p2.trim());
      tr1Lbl.textContent = "gate drive (PWM)";
      tr2Lbl.textContent = "LED current";
    }
    function updateRect() {
      const c = parseInt($("inBBcap").value, 10);
      const rl = parseInt($("inBBload").value, 10);
      $("outBBcap").textContent = c + " µF";
      $("outBBload").textContent = rl + " Ω";
      // simple ripple model: Vr = Vpk / (2 f R C)
      const vpk = 12, f = 50;
      const vr = Math.min(vpk, vpk / (2 * f * rl * c * 1e-6));
      const vdc = vpk - vr / 2 - 1.4; // minus 2 diode drops
      $("ro1Label").textContent = "DC out";
      $("ro1Value").textContent = Math.max(0, vdc).toFixed(1) + " V";
      $("ro2Label").textContent = "ripple";
      $("ro2Value").textContent = (vr * 1000 < 1000 ? (vr * 1000).toFixed(0) + " mV" : vr.toFixed(1) + " V");
      // traces: |sin| + smoothed cap voltage
      const W = 440, cycles = 3, T = W / cycles;
      const base = 100, amp = 62;
      let p1 = "", p2 = "";
      for (let x = 0; x <= W; x += 2) {
        const ph = ((x % T) / T) * Math.PI;
        const rect = Math.abs(Math.sin(ph));
        p1 += `${x},${(base - amp * rect).toFixed(1)} `;
      }
      // cap trace: charge to peak, decay with tau ∝ R*C
      const decayPerPx = Math.min(0.9, 1 / (rl * c * 2e-5));
      let v = 1;
      for (let x = 0; x <= W; x += 2) {
        const ph = ((x % T) / T) * Math.PI;
        const rect = Math.abs(Math.sin(ph));
        v = Math.max(rect, v - decayPerPx * 0.02 * (440 / W) * 2);
        p2 += `${x},${(base - amp * v).toFixed(1)} `;
      }
      tr1.setAttribute("points", p1.trim());
      tr2.setAttribute("points", p2.trim());
      tr1Lbl.textContent = "rectified |AC|";
      tr2Lbl.textContent = "after capacitor";
    }

    function render() {
      if (exp === "dimmer") {
        ctlDim.style.display = "";
        ctlRect.style.display = "none";
        drawDimmer();
        updateDimmer();
        $("bbBuildNote").textContent = "Parts: any MCU (Arduino/Pi Pico), logic-level MOSFET (e.g. IRLZ44N), LED + 220 Ω resistor. PWM pin → gate, LED on the drain. Total cost: a few dollars.";
      } else {
        ctlDim.style.display = "none";
        ctlRect.style.display = "";
        drawRectifier();
        updateRect();
        $("bbBuildNote").textContent = "Parts: 12 V AC wall transformer (never mains directly!), 4× 1N4007 diodes or a bridge module, electrolytic capacitor, resistor. Watch polarity on the cap.";
      }
    }
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".litho-btn");
      if (!b) return;
      tabs.querySelectorAll(".litho-btn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      exp = b.dataset.exp;
      render();
    });
    ["inBBduty", "inBBfreq"].forEach((id) => $(id).addEventListener("input", updateDimmer));
    ["inBBcap", "inBBload"].forEach((id) => $(id).addEventListener("input", updateRect));
    render();
  })();
})();
