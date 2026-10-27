// cuckoo.day home: fit every artboard to the window, condense each page when it
// arrives, and wire the small hands-on moments (tear, flip, stamp, tick,
// weather, festivals, charts). No third-party requests.
(function () {
  var root = document.documentElement;

  /* ---------- fit: the artboard always covers the whole window ---------- */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var portrait = w < 760 || w / h < 0.8;
    root.classList.toggle("portrait", portrait);
    var cw0 = portrait ? 390 : 1440, ch0 = portrait ? 844 : 900;
    var s = Math.min(w / cw0, h / ch0);
    var W = w / s, H = h / s;
    var cw = Math.min(W, portrait ? 560 : 1760);
    var pad = portrait ? 22 : 96;
    var top = portrait ? 66 : 120;
    var set = function (k, v) { root.style.setProperty(k, String(Math.round(v * 1000) / 1000)); };
    set("--s", s); set("--W", W); set("--H", H);
    set("--px", (W - cw) / 2 + pad); set("--bw", cw - pad * 2);
    set("--bt", top + Math.max(0, H - ch0) / 2);
    window.dispatchEvent(new Event("demo:fit"));
  }
  fit();
  window.addEventListener("resize", fit);

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var EN = (root.getAttribute("lang") || "").indexOf("en") === 0;
  var T = function (zh, en) { return EN ? en : zh; };
  var WEEK = EN ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] : ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  var MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var md = function (d) { return EN ? MONTH[d.getMonth()] + " " + d.getDate() : (d.getMonth() + 1) + "月" + d.getDate() + "日"; };

  document.addEventListener("DOMContentLoaded", function () {
    var now = new Date();
    var today = now.toLocaleDateString(EN ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    $$("[data-today]").forEach(function (n) { n.textContent = today; });

    /* ---------- generated bars and sparklines ---------- */
    function bars(el, values, cls) {
      var max = Math.max.apply(null, values);
      values.forEach(function (v, i) {
        var b = document.createElement("i");
        b.style.setProperty("--h", Math.max(2, (v / max) * 100) + "%");
        b.style.setProperty("--i", i);
        if (cls && cls(i)) b.className = cls(i);
        b.title = String(v);
        el.appendChild(b);
      });
    }
    var daily = $("[data-daily]");
    if (daily) bars(daily, daily.dataset.daily.split(",").map(Number), function (i) {
      var d = new Date(2026, 9, i + 1).getDay(); return d === 0 || d === 6 ? "we" : "";
    });
    $$("[data-week]").forEach(function (el) { bars(el, el.dataset.week.split(",").map(Number)); });
    $$("[data-hours]").forEach(function (el) { bars(el, el.dataset.hours.split(",").map(Number)); });
    $$("[data-ticks]").forEach(function (el) {
      for (var i = 0; i < +el.dataset.ticks; i++) { var t = document.createElement("i"); t.style.setProperty("--i", i); el.appendChild(t); }
    });
    $$("svg[data-spark]").forEach(function (svg) {
      var v = svg.dataset.spark.split(",").map(Number);
      var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), span = hi - lo || 1;
      var d = v.map(function (y, i) { return (i ? "L" : "M") + (i / (v.length - 1) * 80).toFixed(1) + " " + (21 - (y - lo) / span * 18).toFixed(1); }).join("");
      var up = v[v.length - 1] >= v[0];
      svg.innerHTML = '<path d="' + d + '" stroke="currentColor"/>';
    });

    /* ---------- market chart with a reading crosshair ---------- */
    var chart = $("[data-chart]");
    if (chart) {
      var svg = $(".chart-svg", chart), line = $(".line", svg), area = $(".area", svg), cross = $(".cross", svg);
      var price = $("[data-chart-price]", chart), at = $("[data-chart-at]", chart);
      var days = [];
      for (var t = new Date(2026, 9, 16); days.length < 22; t.setDate(t.getDate() - 1)) if (t.getDay() % 6) days.unshift(new Date(t));
      var seed = 7, walk = [0];
      for (var k = 1; k < days.length; k++) { seed = (seed * 9301 + 49297) % 233280; walk.push(walk[k - 1] + (seed / 233280 - 0.42) * 2.6); }
      var start = 238.48, end = 252.31, drift = walk[walk.length - 1];
      var series = walk.map(function (wv, i) { return start + (end - start) * (i / (walk.length - 1)) + (wv - drift * i / (walk.length - 1)); });
      var lo = Math.min.apply(null, series) - 2, hi = Math.max.apply(null, series) + 2;
      var W = 800, Hc = 300;
      var px = function (i) { return i / (series.length - 1) * W; };
      var py = function (v) { return Hc - 16 - (v - lo) / (hi - lo) * (Hc - 40); };
      var draw = function () {
        W = Math.max(200, svg.getBoundingClientRect().width / (parseFloat(getComputedStyle(root).getPropertyValue("--s")) || 1));
        svg.setAttribute("viewBox", "0 0 " + W.toFixed(0) + " " + Hc);
        var d = series.map(function (v, i) { return (i ? "L" : "M") + px(i).toFixed(1) + " " + py(v).toFixed(1); }).join("");
        line.setAttribute("d", d);
        area.setAttribute("d", d + "L" + W + " " + Hc + "L0 " + Hc + "Z");
        $$(".grid path", svg).forEach(function (p, i) { p.setAttribute("d", "M0 " + (60 + i * 80) + "H" + W); });
        line.style.setProperty("--len", Math.ceil(line.getTotalLength()) + "px");
      };
      draw();
      window.addEventListener("demo:fit", draw);
      var label = function (i) { return md(days[i]) + T(" 收盘", " close"); };
      var show = function (i) {
        cross.setAttribute("transform", "translate(" + px(i) + ",0)");
        $(".cd", cross).setAttribute("cy", py(series[i]));
        price.textContent = series[i].toFixed(2);
        at.textContent = label(i);
      };
      svg.addEventListener("pointermove", function (e) {
        var r = svg.getBoundingClientRect();
        var i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (series.length - 1));
        chart.classList.add("hovering"); show(i);
      });
      svg.addEventListener("pointerleave", function () { chart.classList.remove("hovering"); price.textContent = end.toFixed(2); at.textContent = label(series.length - 1); });
    }

    /* ---------- weather: five states, one figure ---------- */
    var WX = EN ? {
      sun: ["Today · Sunny", "18°", "Clear and still.<br>A good day for a walk."],
      clear: ["Clearing later", "15°", "Clouds part after lunch,<br>with a sunset to follow."],
      rain: ["Rain this afternoon", "12°", "Showers from three o'clock.<br>Take an umbrella."],
      snow: ["Snow tonight", '<span class="minus">−</span>1°', "Light snow overnight.<br>Roads may be icy by morning."],
      frost: ["First frost tonight", '<span class="minus">−</span>4°', "The coldest night this autumn.<br>Wear an extra layer tomorrow."]
    } : {
      sun: ["今天 · 晴", "18°", "晴朗无风，<br>适合出门走走。"],
      clear: ["午后转晴", "15°", "云层午后散开，<br>傍晚能看到晚霞。"],
      rain: ["午后有雨", "12°", "下午三点起有雨，<br>出门记得带伞。"],
      snow: ["夜里有雪", '<span class="minus">−</span>1°', "夜里有小雪，<br>明早路面可能结冰。"],
      frost: ["今夜初霜", '<span class="minus">−</span>4°', "入秋以来最冷的一夜。<br>明早出门，多穿一件外套。"]
    };
    var wx = $(".wx");
    function setWx(key) {
      if (!wx) return;
      wx.dataset.wx = key;
      var temp = $("[data-wx-temp]", wx), note = $("[data-wx-note]", wx);
      temp.innerHTML = WX[key][1]; note.innerHTML = WX[key][2];
      [temp, note].forEach(function (n) { n.classList.remove("swp"); void n.offsetWidth; n.classList.add("swp"); });
      $$("[data-wx-set]", wx).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.wxSet === key)); });
    }
    if (wx) {
      $$("[data-wx-set]", wx).forEach(function (b) { b.addEventListener("click", function () { setWx(b.dataset.wxSet); }); });
      $$("[data-wx-set]", wx).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.wxSet === wx.dataset.wx)); });
    }

    /* ---------- festivals: the coming year laid out as a wheel ----------
       CAL packs festival dates as MMDD strings, one per year from CAL.from;
       清明 and 冬至 ride the solar terms (term index 6 and 23). */
    var CAL = window.CUCKOO_CALENDAR;
    var LANG = EN ? "en" : "zh";
    var FEST = {
      zh: { order: ["spring", "lantern", "qingming", "dragonboat", "qixi", "midautumn", "chongyang", "dongzhi"],
        f: { spring: ["春节", "春节", "回家的车票，记得提前抢。"], lantern: ["元宵节", "元宵", "汤圆煮上，晚上去看灯。"], qingming: ["清明节", "清明", "踏青，也回去看看。"], dragonboat: ["端午节", "端午", "粽子备好，看一场龙舟。"], qixi: ["七夕节", "七夕", "今晚的星星，留给两个人。"], midautumn: ["中秋节", "中秋", "月饼和团圆饭，记得早点订位。"], chongyang: ["重阳节", "重阳", "登高、赏菊，给长辈打个电话。"], dongzhi: ["冬至", "冬至", "一碗饺子，一年里最长的夜。"] } },
      en: { order: ["newyear", "valentine", "easter", "halloween", "thanksgiving", "xmas"],
        f: { newyear: ["New Year's Day", "New Year", "A clean page for the year."], valentine: ["Valentine's Day", "Valentine's", "Book the table before it fills."], easter: ["Easter", "Easter", "Hide the eggs before breakfast."], halloween: ["Halloween", "Halloween", "Sweets by the door, and mind the pumpkins."], thanksgiving: ["Thanksgiving", "Thanksgiving", "Set an extra place at the table."], xmas: ["Christmas", "Christmas", "Time to start the gift list."] } }
    };
    var day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var Y0 = day0.getFullYear(), i;
    function festDate(key, yi) {
      if (key === "qingming" || key === "dongzhi") {
        var ti = key === "qingming" ? 6 : 23, td = CAL.termDays[yi];
        return td ? new Date(CAL.from + yi, ti >> 1, +td.substr(ti * 2, 2)) : null;
      }
      var s = CAL[LANG][key];
      return s && yi >= 0 && yi * 4 + 4 <= s.length ? new Date(CAL.from + yi, +s.substr(yi * 4, 2) - 1, +s.substr(yi * 4 + 2, 2)) : null;
    }
    function nextFestDate(key) {
      for (var yi = Math.max(0, Y0 - CAL.from); yi < CAL.termDays.length; yi++) {
        var d = festDate(key, yi);
        if (!d) return null;
        if (d >= day0) return d;
      }
      return null;
    }
    var fest = $(".fest"), wheel = $("[data-wheel]"), festAuto = null, festToday = null;
    var F = FEST[LANG].f;
    FEST[LANG].order.forEach(function (k) {
      F[k].d = nextFestDate(k);
      if (F[k].d && +F[k].d === +day0) festToday = k;
      if (F[k].d && (!festAuto || F[k].d < F[festAuto].d)) festAuto = k;
    });
    /* ring markers: zh reads each of the 24 solar terms at its next
       occurrence (the last year's position once the data runs out),
       en the twelve months at their first day */
    var RING = [];
    if (LANG === "zh") {
      for (i = 0; i < 24; i++) {
        var d = null, up = false, yi = Math.max(0, Y0 - CAL.from);
        for (; yi < CAL.termDays.length; yi++) {
          var td = new Date(CAL.from + yi, i >> 1, +CAL.termDays[yi].substr(i * 2, 2));
          if (td >= day0) { d = td; up = true; break; }
        }
        if (!d) { var tdc = CAL.termDays[Math.max(0, Y0 - CAL.from)]; if (tdc) d = new Date(Y0, i >> 1, +tdc.substr(i * 2, 2)); }
        if (d) RING.push({ d: d, n: CAL.terms[i], up: up, i: i });
      }
    } else {
      for (i = 0; i < 12; i++) {
        var m0 = new Date(Y0, i, 1);
        if (m0 < day0) m0 = new Date(Y0 + 1, i, 1);
        RING.push({ d: m0, n: MONTH[i], up: true });
      }
    }
    var RINGHOT = {};
    RING.filter(function (t) { return t.up; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 4).forEach(function (t) { RINGHOT[t.n] = 1; });
    /* a festival whose dates have run out still sits on the wheel at this
       year's position — only the countdown has nothing left to count */
    function wheelDate(k) { return F[k].d || festDate(k, Math.max(0, Y0 - CAL.from)); }
    var daysIn = function (y) { return Math.round((new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / 864e5); };
    var angOf = function (d) { return (d - new Date(d.getFullYear(), 0, 1)) / 864e5 / daysIn(d.getFullYear()) * Math.PI * 2; };

    /* the wheel: rim, ticks and arc in SVG; labels and festival dots as
       HTML so they sit crisply in the site's own type */
    var svgNS = "http://www.w3.org/2000/svg";
    var WHS = { box: 640, rim: 232, rim2: 226, tk0: 236, tk1: 244, today: 6, art: 220, step: 24, gap: 10 };
    var WHP = { box: 346, rim: 128, rim2: 122, tk0: 132, tk1: 138, today: 4, art: 110, step: 14, gap: 7 };
    var PREF_RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var wg = null, arcEl = null, prevEl = null, whP = null, festSel = null;
    var arcSpan = 0, numShown = 0, arcTween = 0, arrT0 = 0;
    var easeExpo = function (p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); };
    var easeInOut = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    var adelay = function (a, off) { return Math.round(150 + a / Math.PI / 2 * 1100 + (off || 0)) + "ms"; };
    var wheelGeom = function () { return root.classList.contains("portrait") ? WHP : WHS; };
    function buildWheel() {
      if (!wheel) return;
      if (!wg) { wg = document.createElement("div"); wg.className = "wh-g"; wheel.appendChild(wg); }
      var P = wheelGeom(), c = P.box / 2;
      var pol = function (r, a) { return [c + r * Math.sin(a), c - r * Math.cos(a)]; };
      wg.innerHTML = "";
      var svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 " + P.box + " " + P.box);
      svg.setAttribute("class", "wh-svg");
      svg.setAttribute("aria-hidden", "true");
      var mk = function (tag, at) {
        var e = document.createElementNS(svgNS, tag);
        for (var k in at) e.setAttribute(k, at[k]);
        svg.appendChild(e); return e;
      };
      var rim = mk("circle", { class: "wh-rim", cx: c, cy: c, r: P.rim, transform: "rotate(-90 " + c + " " + c + ")" });
      var rim2 = mk("circle", { class: "wh-rim2", cx: c, cy: c, r: P.rim2, transform: "rotate(-90 " + c + " " + c + ")" });
      rim.style.strokeDasharray = 2 * Math.PI * P.rim;
      rim.style.setProperty("--c", 2 * Math.PI * P.rim);
      rim2.style.strokeDasharray = 2 * Math.PI * P.rim2;
      rim2.style.setProperty("--c", 2 * Math.PI * P.rim2);
      /* every label is measured (unscaled CSS px) and seated by a support
         function: its edge in the outward direction u(θ) stays a gap inside
         the inner rim — or a gap outside the ticks for ring labels */
      var sup = function (a, w, h) { return Math.abs(Math.sin(a)) * w / 2 + Math.abs(Math.cos(a)) * h / 2; };
      var placed = [];
      var meets = function (b, p) { return Math.min(b.r, p.r) - Math.max(b.l, p.l) > 0.5 && Math.min(b.b, p.b) - Math.max(b.t, p.t) > 0.5; };
      var hit = function (b) { return placed.some(function (p) { return meets(b, p); }); };
      RING.forEach(function (t) {
        var a = angOf(t.d), p0 = pol(P.tk0, a), p1 = pol(P.tk1, a);
        var tk = mk("line", { class: "wh-tick", x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1] });
        tk.style.setProperty("--ad", adelay(a));
        /* 清明 and 冬至 are solar terms AND festivals: the outer term label
           is the festival's button, no inner duplicate */
        var tf = LANG === "zh" && (t.i === 6 || t.i === 23);
        var l = tf ? document.createElement("button") : document.createElement("span");
        if (tf) { l.type = "button"; l.dataset.festSet = t.i === 6 ? "qingming" : "dongzhi"; l.setAttribute("aria-pressed", "false"); }
        l.className = "wh-tl" + (tf ? " wh-tf" : "") + (RINGHOT[t.n] && !tf ? " hot" : "");
        l.textContent = t.n;
        l.style.setProperty("--ad", adelay(a));
        l.style.setProperty("--dx", (6 * Math.sin(a)).toFixed(1) + "px");
        l.style.setProperty("--dy", (-6 * Math.cos(a)).toFixed(1) + "px");
        wg.appendChild(l);
        var w = l.offsetWidth, h = l.offsetHeight;
        var rc = P.tk1 + P.gap + sup(a, w, h), q = pol(rc, a);
        l.style.left = q[0] + "px"; l.style.top = q[1] + "px";
        placed.push({ l: q[0] - w / 2, r: q[0] + w / 2, t: q[1] - h / 2, b: q[1] + h / 2 });
      });
      var tp = pol(P.rim, angOf(day0));
      mk("circle", { class: "wh-ripple", cx: tp[0], cy: tp[1], r: P.today });
      mk("circle", { class: "wh-today", cx: tp[0], cy: tp[1], r: P.today });
      arcEl = mk("path", { class: "wh-arc", fill: "none" });
      prevEl = mk("path", { class: "wh-prev", fill: "none" });
      wg.appendChild(svg);
      var flabs = [];
      FEST[LANG].order.forEach(function (k) {
        var wd = wheelDate(k);
        if (!wd) return;
        var a = angOf(wd), q = pol(P.rim, a);
        var dot = document.createElement("button");
        dot.type = "button"; dot.className = "wh-dot"; dot.dataset.festSet = k;
        dot.title = F[k][0]; dot.setAttribute("aria-label", F[k][0]); dot.setAttribute("aria-pressed", "false");
        dot.style.left = q[0] + "px"; dot.style.top = q[1] + "px";
        dot.style.setProperty("--ad", adelay(a));
        wg.appendChild(dot);
        if (LANG === "zh" && (k === "qingming" || k === "dongzhi")) return;
        var b = document.createElement("button");
        b.type = "button"; b.className = "wh-fl"; b.dataset.festSet = k;
        b.textContent = F[k][1]; b.setAttribute("aria-pressed", "false");
        b.style.setProperty("--ad", adelay(a, 120));
        wg.appendChild(b);
        flabs.push({ el: b, a: a });
      });
      /* seat each label by the support function, then keep its corners
         inside rim2-4 and clear of the illustration box (inflated by the
         gap); label collisions step inward, a seat inside the art cone
         slips outward into the pocket beside the illustration */
      var ah = P.art / 2 + P.gap, artB = { l: c - ah, r: c + ah, t: c - ah, b: c + ah };
      flabs.sort(function (x, y) { return x.a - y.a; });
      flabs.forEach(function (f) {
        var w = f.el.offsetWidth, h = f.el.offsetHeight;
        var ext = sup(f.a, w, h);
        /* largest radius whose box corners still sit inside rim2-4 */
        var rMax = -ext + Math.sqrt(ext * ext + (P.rim2 - 5) * (P.rim2 - 5) - (w * w + h * h) / 4);
        var r0 = Math.min(P.rim2 - P.gap - ext, rMax);
        if (LANG === "en" && f.el.dataset.festSet === "newyear") r0 -= P.step;
        var q = null, box = null;
        var tryR = function (r) {
          var p2 = pol(r, f.a);
          var b = { l: p2[0] - w / 2, r: p2[0] + w / 2, t: p2[1] - h / 2, b: p2[1] + h / 2 };
          if (meets(b, artB)) return -1;
          if (!hit(b)) { q = p2; box = b; return 1; }
          return 0;
        };
        var r = r0;
        for (; r > 0; r -= 1) if (tryR(r) !== 0) break;
        if (!box) for (r = r0 + 1; r <= rMax; r += 1) if (tryR(r) === 1) break;
        if (!box) { q = pol(r0, f.a); box = { l: q[0] - w / 2, r: q[0] + w / 2, t: q[1] - h / 2, b: q[1] + h / 2 }; }
        f.el.style.left = q[0] + "px"; f.el.style.top = q[1] + "px";
        placed.push(box);
      });
    }
    function spanOf(k) {
      var wd = F[k] && wheelDate(k);
      if (!wd) return 0;
      var dt = angOf(wd) - angOf(day0);
      while (dt < 0) dt += Math.PI * 2;
      return dt;
    }
    function arcD(span, rad) {
      var P = wheelGeom(), c = P.box / 2, r = rad || P.rim;
      var a0 = angOf(day0), a1 = a0 + span;
      var p0 = [c + r * Math.sin(a0), c - r * Math.cos(a0)];
      var p1 = [c + r * Math.sin(a1), c - r * Math.cos(a1)];
      return "M" + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + " A" + r + " " + r + " 0 " + (span > Math.PI ? 1 : 0) + " 1 " + p1[0].toFixed(1) + " " + p1[1].toFixed(1);
    }
    function drawArc(span) {
      if (!arcEl || (wheel && !wheel.classList.contains("on"))) return;
      arcEl.setAttribute("d", span < 0.02 ? "" : arcD(span));
    }
    /* arc span and countdown are one tween: a mid-tween click restarts
       from whatever is on screen */
    function tweenArc(to, dur, ease, numTo) {
      cancelAnimationFrame(arcTween);
      var s0 = arcSpan, n0 = numShown, t0 = performance.now();
      var numEl = fest && $("[data-fest-num]", fest);
      (function fr() {
        var p = Math.min(1, (performance.now() - t0) / dur), e = ease(p);
        arcSpan = s0 + (to - s0) * e;
        drawArc(arcSpan);
        if (numTo != null && numEl) { numShown = Math.round(n0 + (numTo - n0) * e); numEl.textContent = String(numShown); }
        if (p < 1) arcTween = requestAnimationFrame(fr);
      })();
    }
    /* each shape of the active illustration draws itself, .acc accents last */
    function drawEgg(svg, dur, stag) {
      if (!svg || PREF_RM) return;
      var seq = [], acc = [];
      Array.prototype.forEach.call(svg.querySelectorAll("path,circle,ellipse,rect,line,polyline,polygon"), function (s2) {
        (s2.classList.contains("acc") ? acc : seq).push(s2);
      });
      seq = seq.concat(acc);
      var n = seq.length || 1, st = stag == null ? 70 : stag, dd = dur || 900;
      seq.forEach(function (s2, i) {
        var L = s2.getTotalLength();
        s2.style.strokeDasharray = L; s2.style.strokeDashoffset = L;
        void s2.getBoundingClientRect();
        s2.style.transition = "stroke-dashoffset " + dd + "ms ease-out " + (i * st) + "ms";
        s2.style.strokeDashoffset = "0";
      });
      Array.prototype.forEach.call(svg.querySelectorAll("text"), function (s2) {
        s2.style.opacity = "0";
        s2.style.transition = "opacity .5s ease " + (n * st) + "ms";
        s2.style.opacity = "1";
      });
      setTimeout(function () {
        seq.forEach(function (s2) { s2.style.strokeDasharray = s2.style.strokeDashoffset = s2.style.transition = ""; });
        Array.prototype.forEach.call(svg.querySelectorAll("text"), function (s2) { s2.style.opacity = s2.style.transition = ""; });
      }, dd + n * st + 550);
    }
    function sw(el) { if (el) { el.classList.remove("rv", "swp"); void el.offsetWidth; el.classList.add("swp"); } }
    function fillDays(sel) {
      var ol = $("[data-days]");
      if (!ol) return;
      var evts = [];
      FEST[LANG].order.forEach(function (k) { if (F[k].d) evts.push({ d: F[k].d, n: F[k][0] }); });
      if (LANG === "zh") RING.forEach(function (t) { if (t.up) evts.push({ d: t.d, n: t.n }); });
      evts.sort(function (a, b) { return a.d - b.d; });
      var seen = {}, out = [], lead = sel ? F[sel][0] : null;
      evts.forEach(function (e) {
        var k = e.d.getFullYear() + "-" + e.d.getMonth() + "-" + e.d.getDate() + "|" + e.n;
        if (seen[k] || (lead && e.n === lead)) return;
        seen[k] = 1; out.push(e);
      });
      ol.innerHTML = out.slice(0, root.classList.contains("portrait") ? 3 : 4).map(function (e) {
        return "<li><time>" + md(e.d) + "</time><b>" + e.n + "</b><span>" + WEEK[e.d.getDay()] + "</span></li>";
      }).join("");
      var later = wheel && wheel.classList.contains("on") && !PREF_RM;
      Array.prototype.forEach.call(ol.children, function (li, i) {
        if (later) { li.classList.add("swp"); li.style.animationDelay = i * 50 + "ms"; }
        else { li.classList.add("rv"); li.style.setProperty("--d", 3520 + i * 160 + "ms"); }
      });
    }
    function setFest(key) {
      if (!fest || !F[key]) return;
      festSel = key;
      var f = F[key], d = f.d;
      var live = wheel && wheel.classList.contains("on") && !PREF_RM;
      var nameEl = $("[data-fest-name]", fest);
      if (nameEl.textContent !== f[0]) { nameEl.textContent = f[0]; if (live) inkReplay(nameEl); }
      var lineEl = $("[data-fest-line]", fest);
      lineEl.textContent = f[2];
      var whenEl = $("[data-fest-when]", fest);
      if (wheel) {
        var oldK = wheel.dataset.show;
        var oldS = oldK && oldK !== key ? $(".egg-" + oldK, wheel) : null;
        if (oldS && live) {
          oldS.style.transition = "opacity .18s"; oldS.style.opacity = "1";
          void oldS.offsetWidth;
          wheel.dataset.show = key;
          oldS.style.opacity = "0";
          setTimeout(function () { oldS.style.opacity = ""; oldS.style.transition = ""; }, 250);
        } else wheel.dataset.show = key;
        var nw = $(".egg-" + key, wheel);
        if (nw) { nw.style.opacity = ""; nw.style.transition = ""; if (live) { wheel.classList.add("egg-in"); drawEgg(nw, 500, Math.min(70, Math.max(6, Math.round(200 / Math.max(1, nw.querySelectorAll("path,circle,ellipse,rect,line,polyline,polygon").length))))); } }
      }
      if (d) {
        var diff = Math.round((d - day0) / 864e5);
        $(".fest-count", fest).classList.toggle("today", diff === 0);
        var numEl = $("[data-fest-num]", fest);
        $("[data-fest-unit]", fest).textContent = diff === 0 ? "" : T("天", diff === 1 ? "day" : "days");
        whenEl.textContent = EN ? WEEK[d.getDay()] + ", " + md(d) : md(d) + " " + WEEK[d.getDay()];
        var seal = $(".seal", fest);
        if (diff === 0) {
          numShown = 0; numEl.textContent = T("今天", "Today");
          if (!seal) { seal = document.createElement("b"); seal.className = "seal"; $(".fest-count", fest).appendChild(seal); }
          seal.textContent = f[1];
          seal.style.setProperty("--sd", arrT0 ? Math.max(0, 2500 - (performance.now() - arrT0)) + "ms" : "2400ms");
        } else if (seal) seal.remove();
        if (live) {
          if (diff > 0) tweenArc(spanOf(key), 700, easeInOut, diff);
          else { tweenArc(spanOf(key), 700, easeInOut, null); sw(numEl); }
          [whenEl, lineEl].forEach(sw);
          var unit = $("[data-fest-unit]", fest); if (unit) sw(unit);
        } else {
          numShown = diff; numEl.textContent = diff === 0 ? T("今天", "Today") : String(diff);
          arcSpan = spanOf(key); drawArc(arcSpan);
        }
      } else {
        $(".fest-count", fest).classList.remove("today");
        var seal2 = $(".seal", fest); if (seal2) seal2.remove();
        numShown = 0;
        $("[data-fest-num]", fest).textContent = "";
        $("[data-fest-unit]", fest).textContent = "";
        whenEl.textContent = "";
        arcSpan = spanOf(key); drawArc(arcSpan);
      }
      $$("[data-fest-set]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.festSet === key)); });
      fillDays(key);
    }
    function showPrev(k) {
      if (!prevEl || !F[k]) return;
      var span = spanOf(k);
      if (span < 0.02) return;
      var P2 = wheelGeom();
      prevEl.setAttribute("d", arcD(span, (P2.rim + P2.rim2) / 2));
      prevEl.classList.add("on");
    }
    function hidePrev() { if (prevEl) prevEl.classList.remove("on"); }
    if (fest) {
      buildWheel();
      if (PREF_RM && wheel) wheel.classList.add("on", "done", "egg-in");
      if (wheel) {
        wheel.addEventListener("click", function (e) {
          var b = e.target.closest("[data-fest-set]");
          if (b && wheel.contains(b)) setFest(b.dataset.festSet);
        });
        wheel.addEventListener("pointerover", function (e) {
          var b = e.target.closest("[data-fest-set]");
          if (b && wheel.contains(b)) showPrev(b.dataset.festSet);
        });
        wheel.addEventListener("pointerout", function (e) {
          var b = e.target.closest("[data-fest-set]");
          if (b && !(e.relatedTarget && b.contains(e.relatedTarget))) hidePrev();
        });
        wheel.addEventListener("focusin", function (e) {
          var b = e.target.closest("[data-fest-set]");
          if (b) showPrev(b.dataset.festSet);
        });
        wheel.addEventListener("focusout", function (e) {
          if (e.target.closest("[data-fest-set]")) hidePrev();
        });
      }
      /* the left column's pieces reveal on their own delays once in view */
      var num0 = $("[data-fest-num]", fest), unt0 = $("[data-fest-unit]", fest),
          whn0 = $("[data-fest-when]", fest), lin0 = $("[data-fest-line]", fest);
      if (num0) { num0.classList.add("rv"); num0.style.setProperty("--d", "2800ms"); }
      if (unt0) { unt0.classList.add("rv"); unt0.style.setProperty("--d", "4600ms"); }
      if (whn0) { whn0.classList.add("rv"); whn0.style.setProperty("--d", "3200ms"); }
      if (lin0) { lin0.classList.add("rv"); lin0.style.setProperty("--d", "3360ms"); }
      setFest(festToday || festAuto);
      var season = document.getElementById("season");
      function arrive() {
        if (!wheel) return;
        arrT0 = performance.now();
        if (PREF_RM) { wheel.classList.add("on", "done", "egg-in"); drawArc(arcSpan); return; }
        wheel.classList.add("on");
        var key = festSel, diff = F[key] && F[key].d ? Math.round((F[key].d - day0) / 864e5) : 0;
        setTimeout(function () { tweenArc(spanOf(key), 1000, easeExpo, diff > 0 ? diff : null); }, 1400);
        setTimeout(function () { wheel.classList.add("egg-in"); var s = $(".egg-" + key, wheel); if (s) drawEgg(s, 900, 70); }, 1400);
        setTimeout(function () { wheel.classList.add("done"); }, 2900);
      }
      if (season && "MutationObserver" in window) {
        var mo = new MutationObserver(function () {
          if (season.classList.contains("in")) { mo.disconnect(); arrive(); }
        });
        mo.observe(season, { attributes: true, attributeFilter: ["class"] });
        if (season.classList.contains("in")) { mo.disconnect(); arrive(); }
      } else if (season && season.classList.contains("in")) arrive();
      whP = root.classList.contains("portrait");
      window.addEventListener("demo:fit", function () {
        var p = root.classList.contains("portrait");
        if (p !== whP) {
          whP = p; buildWheel();
          arcSpan = spanOf(festSel); drawArc(arcSpan);
        }
        fillDays(festSel);
      });
      var slot = $("[data-egg-slot]");
      if (festToday && slot && wheel) {
        var art = $(".egg-" + festToday, wheel);
        if (art) { var c = art.cloneNode(true); c.setAttribute("class", "egg-art egg-" + festToday); slot.appendChild(c); slot.classList.add("on"); }
      }
    }
    /* ---------- boarding pass: hover lifts the stub, drag or click tears it ---------- */
    $$(".pass").forEach(function (pass) {
      var stub = $(".pass-stub", pass), x0 = null, dx = 0;
      var tear = function () { pass.classList.add("torn"); stub.style.transform = ""; stub.setAttribute("aria-label", T("副券已撕下", "Stub torn off")); };
      stub.addEventListener("pointerdown", function (e) { if (pass.classList.contains("torn")) return; x0 = e.clientX; dx = 0; stub.setPointerCapture(e.pointerId); });
      stub.addEventListener("pointermove", function (e) {
        if (x0 === null) return;
        dx = Math.max(0, e.clientX - x0);
        stub.style.transition = "none";
        stub.style.transform = "rotate(" + Math.min(14, dx * 0.12) + "deg) translateX(" + Math.min(40, dx * 0.4) + "px)";
        if (dx > 70) { x0 = null; stub.style.transition = ""; tear(); }
      });
      var end = function () {
        if (x0 === null) return;
        x0 = null; stub.style.transition = "";
        if (dx < 5) tear(); else stub.style.transform = "";
      };
      stub.addEventListener("pointerup", end);
      stub.addEventListener("pointercancel", end);
      stub.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tear(); } });
      pass.closest(".page").addEventListener("demo:reset", function () { pass.classList.remove("torn"); stub.style.transform = ""; stub.setAttribute("aria-label", T("沿虚线撕下副券", "Tear the stub along the dashes")); });
    });

    /* ---------- desk calendar: click turns the leaf ---------- */
    $$(".leafs").forEach(function (leafs) {
      $(".leaf.top", leafs).addEventListener("click", function () { leafs.classList.add("flipped"); });
      leafs.closest(".page").addEventListener("demo:reset", function () { leafs.classList.remove("flipped"); });
    });

    /* ---------- statement: stamp it again ---------- */
    $$(".statement").forEach(function (st) {
      st.addEventListener("click", function () { st.classList.remove("thump"); void st.offsetWidth; st.classList.add("thump"); });
    });

    /* ---------- agenda: tick with ink ---------- */
    $$(".agenda li").forEach(function (li) {
      var initial = li.classList.contains("done");
      var btn = $("button", li);
      btn.addEventListener("click", function () { var on = li.classList.toggle("done"); btn.setAttribute("aria-pressed", String(on)); });
      li.closest(".page").addEventListener("demo:reset", function () { li.classList.toggle("done", initial); btn.setAttribute("aria-pressed", String(initial)); });
    });

    /* ---------- the folio's refresh icon restores the page ---------- */
    $$(".reset").forEach(function (btn) {
      var page = btn.closest(".page");
      btn.addEventListener("click", function () {
        btn.classList.remove("spin"); void btn.offsetWidth; btn.classList.add("spin");
        page.dispatchEvent(new Event("demo:reset"));
        if (wx && page.contains(wx)) setWx("frost");
        if (fest && page.contains(fest)) setFest(festToday || festAuto);
        $$(".statement", page).forEach(function (st) { st.classList.remove("thump"); void st.offsetWidth; st.classList.add("thump"); });
      });
    });

    /* ---------- download: a real archive when one is published ---------- */
    var cfg = window.CUCKOO_SITE || {};
    var as = cfg.appStore || {};
    $$("[data-appstore]").forEach(function (r) {
      var u = as[r.dataset.appstore];
      if (u) { r.setAttribute("href", u); var st = r.querySelector("i"); if (st) st.textContent = T("前往 App Store", "View in App Store"); }
    });
    if (cfg.macDownload) $$("[data-download]").forEach(function (btn) {
      var a = document.createElement("a");
      a.className = btn.className; a.href = cfg.macDownload;
      a.innerHTML = btn.querySelector("svg") ? btn.querySelector("svg").outerHTML : "";
      a.appendChild(document.createTextNode(T("下载 Mac 版", "Download for Mac")));
      btn.replaceWith(a);
      var note = a.parentNode.querySelector(".cta-note");
      if (note) note.textContent = T("macOS 14 或更新", "macOS 14 or later");
    });
    $$("[data-lang-to]").forEach(function (link) {
      link.addEventListener("click", function () { try { localStorage.setItem("cuckoo-lang", link.dataset.langTo); } catch (e) {} });
    });

    /* ---------- ink condensing: a paper-coloured canvas veil covers each
       [data-ink] element; per-pixel alpha follows two precomputed arrival-
       time fields, so the crisp content underneath appears as paper, then a
       light wash, then full ink along two organic fronts ---------- */
    var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var testCv = document.createElement("canvas");
    var inkOK = !reduceMotion && "IntersectionObserver" in window && !!(testCv.getContext && testCv.getContext("2d"));
    var inkEls = $$("[data-ink]");
    var inkRecs = [], recOf = new Map(), playing = [], rafOn = false;
    var MAXPX = 450000, WASH_W = 0.76;

    if (!inkOK) inkEls.forEach(function (el) { el.classList.add("ink-on"); });

    function mulberry(seed) {
      var a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function vhash(ix, iy, s) {
      var h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 2246822519);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function vnoise(x, y, s) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      var a = vhash(ix, iy, s), b = vhash(ix + 1, iy, s), c = vhash(ix, iy + 1, s), d = vhash(ix + 1, iy + 1, s);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
    function fbm(x, y, s) {
      return (vnoise(x, y, s) + 0.5 * vnoise(x * 2, y * 2, s + 101) + 0.25 * vnoise(x * 4, y * 4, s + 211)) / 1.75;
    }
    function paperRGB() {
      var m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(document.body).backgroundColor);
      var p = m ? m[1].split(",") : ["243", "238", "228"];
      return [+p[0] | 0, +p[1] | 0, +p[2] | 0];
    }

    /* arrival-time fields, computed once per element on a half-resolution
       grid in artboard px (resolution independent), then bilinearly
       sampled at canvas resolution each frame */
    function inkField(rec) {
      var gw = Math.max(2, Math.ceil(rec.cw / 2)), gh = Math.max(2, Math.ceil(rec.ch / 2));
      var w = rec.w, h = rec.h, pad = rec.pad, dur = rec.dur, seed = rec.seed;
      var ew = w - pad[3] - pad[1], eh = h - pad[0] - pad[2];
      var rng = mulberry(seed);
      var n = Math.max(2, Math.min(7, Math.round(ew / (eh * 1.8))));
      var horiz = ew >= eh, seeds = [];
      for (var i = 0; i < n; i++) {
        var fa = (i + 0.5) / n + (rng() - 0.5) * 0.5 / n;
        var fb = 0.5 + (rng() - 0.5) * 0.6;
        seeds.push({ x: pad[3] + (horiz ? fa * ew : fb * ew), y: pad[0] + (horiz ? fb * eh : fa * eh), st: rng() });
      }
      var est = Math.sqrt(ew * ew + eh * eh) * 0.5;
      for (i = 0; i < n; i++) seeds[i].st *= 0.25 * est;
      var f = 1 / rec.grain, D = rec.grain * 0.55, J = 0.08 * est, drop = 0.12 * est;
      var rough = rec.grain * 0.35, dot = rec.grain * 0.15, wash = rec.grain * 1.5;
      var tI = new Float32Array(gw * gh), tW = new Float32Array(gw * gh);
      var mn = Infinity, mx = -Infinity, idx = 0, u, v, ax, ay;
      for (v = 0; v < gh; v++) {
        ay = (v + 0.5) * h / gh;
        for (u = 0; u < gw; u++, idx++) {
          ax = (u + 0.5) * w / gw;
          var wx = ax + D * (2 * fbm(ax * f, ay * f, seed) - 1);
          var wy = ay + D * (2 * fbm(ax * f + 31.7, ay * f + 17.3, seed + 97) - 1);
          var T = Infinity;
          for (var k = 0; k < n; k++) {
            var dx = wx - seeds[k].x, dy = wy - seeds[k].y;
            var d = seeds[k].st + Math.sqrt(dx * dx + dy * dy);
            if (d < T) T = d;
          }
          T += J * (2 * fbm(ax / rough, ay / rough, seed + 211) - 1);
          if (vnoise(ax / dot, ay / dot, seed + 307) > 0.82) T -= drop;
          tI[idx] = T;
          if (T < mn) mn = T;
          if (T > mx) mx = T;
        }
      }
      var range = mx - mn || 1, lead = 0.22 * dur;
      idx = 0;
      for (v = 0; v < gh; v++) {
        ay = (v + 0.5) * h / gh;
        for (u = 0; u < gw; u++, idx++) {
          ax = (u + 0.5) * w / gw;
          var ti = (tI[idx] - mn) / range * dur;
          tI[idx] = ti;
          tW[idx] = ti - lead * (0.55 + 0.9 * fbm(ax / wash, ay / wash, seed + 401));
        }
      }
      /* the temporal edge width aa maps back to ~1.2 artboard px so fronts
         stay crisp (~2 device px on a 2x screen) */
      rec.aa = Math.max(1.5, 1.2 * dur / range);
      rec.gw = gw; rec.gh = gh; rec.tI = tI; rec.tW = tW;
      rec.u0 = new Int32Array(rec.cw); rec.uf = new Float32Array(rec.cw);
      rec.v0 = new Int32Array(rec.ch); rec.vf = new Float32Array(rec.ch);
      var fu, fv, i0;
      for (i = 0; i < rec.cw; i++) {
        fu = (i + 0.5) * gw / rec.cw - 0.5; i0 = Math.floor(fu);
        if (i0 < 0) i0 = 0; else if (i0 > gw - 2) i0 = gw - 2;
        rec.u0[i] = i0; rec.uf[i] = fu - i0;
      }
      for (i = 0; i < rec.ch; i++) {
        fv = (i + 0.5) * gh / rec.ch - 0.5; i0 = Math.floor(fv);
        if (i0 < 0) i0 = 0; else if (i0 > gh - 2) i0 = gh - 2;
        rec.v0[i] = i0; rec.vf[i] = fv - i0;
      }
    }

    function inkPrepare(el) {
      var page = el.closest(".page"), art = page && page.querySelector(".art");
      if (!art) { el.classList.add("ink-on"); return; }
      var cs = getComputedStyle(el);
      var s = parseFloat(getComputedStyle(root).getPropertyValue("--s")) || 1;
      var pv = (cs.getPropertyValue("--ink-pad") || "").trim().split(/\s+/).map(parseFloat).filter(function (n) { return !isNaN(n); });
      var pad = [pv[0] || 0, pv.length > 1 ? pv[1] : pv[0] || 0, pv.length > 2 ? pv[2] : pv[0] || 0, pv.length > 3 ? pv[3] : pv.length > 1 ? pv[1] : pv[0] || 0];
      var ar = art.getBoundingClientRect(), er = el.getBoundingClientRect();
      var x = (er.left - ar.left) / s - pad[3], y = (er.top - ar.top) / s - pad[0];
      var w = er.width / s + pad[3] + pad[1], h = er.height / s + pad[0] + pad[2];
      if (!(w > 4 && h > 4)) { el.classList.add("ink-on"); return; }
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var q = Math.min(1, Math.sqrt(MAXPX / (w * s * dpr * h * s * dpr)));
      var cw = Math.max(2, Math.round(w * s * dpr * q)), ch = Math.max(2, Math.round(h * s * dpr * q));
      var cv = document.createElement("canvas");
      cv.className = "ink-veil"; cv.setAttribute("aria-hidden", "true");
      cv.style.left = x + "px"; cv.style.top = y + "px";
      cv.style.width = w + "px"; cv.style.height = h + "px";
      cv.width = cw; cv.height = ch;
      var ctx = cv.getContext("2d");
      var rgb = paperRGB();
      ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      ctx.fillRect(0, 0, cw, ch);
      art.appendChild(cv);
      el.classList.add("ink-on");
      var at = el.getAttribute("data-ink");
      var rec = {
        el: el, page: page, cv: cv, ctx: ctx, rgb: rgb, pad: pad, w: w, h: h,
        cw: cw, ch: ch, dur: parseFloat(cs.getPropertyValue("--ink-dur")) || 1100,
        grain: parseFloat(cs.getPropertyValue("--ink-grain")) || 40,
        delay: at ? +at : 100, seed: (inkEls.indexOf(el) + 1) * 2654435761 >>> 0, state: "prepared"
      };
      inkField(rec);
      rec.img = ctx.createImageData(cw, ch);
      rec.u32 = new Uint32Array(rec.img.data.buffer);
      inkRecs.push(rec); recOf.set(el, rec);
    }

    function preparePage(page) {
      $$("[data-ink]", page).forEach(function (el) { if (!recOf.has(el)) inkPrepare(el); });
    }

    function inkPaint(rec, t) {
      var cw = rec.cw, ch = rec.ch, gw = rec.gw, tI = rec.tI, tW = rec.tW;
      var u32 = rec.u32, u0 = rec.u0, uf = rec.uf, v0 = rec.v0, vf = rec.vf;
      var iaa = 1 / rec.aa, base = rec.rgb[0] | (rec.rgb[1] << 8) | (rec.rgb[2] << 16);
      var idx = 0;
      for (var j = 0; j < ch; j++) {
        var r0 = v0[j] * gw, r1 = r0 + gw, fv = vf[j];
        for (var i = 0; i < cw; i++, idx++) {
          var c0 = r0 + u0[i], c1 = r1 + u0[i], fu = uf[i];
          var a0 = tI[c0] + (tI[c0 + 1] - tI[c0]) * fu;
          var a1 = tI[c1] + (tI[c1 + 1] - tI[c1]) * fu;
          var ik = (a0 + (a1 - a0) * fv - t) * iaa + 0.5;
          if (ik <= 0) { u32[idx] = base; continue; }
          if (ik > 1) ik = 1;
          a0 = tW[c0] + (tW[c0 + 1] - tW[c0]) * fu;
          a1 = tW[c1] + (tW[c1 + 1] - tW[c1]) * fu;
          var wk = (a0 + (a1 - a0) * fv - t) * iaa + 0.5;
          if (wk < 0) wk = 0; else if (wk > 1) wk = 1;
          u32[idx] = base | (((ik * (WASH_W + (1 - WASH_W) * wk) * 255 + 0.5) | 0) << 24);
        }
      }
      rec.ctx.putImageData(rec.img, 0, 0);
    }

    function inkFinish(rec) {
      rec.cv.remove();
      rec.tI = rec.tW = rec.u32 = rec.img = rec.u0 = rec.uf = rec.v0 = rec.vf = null;
      rec.state = "done";
    }
    function inkTick(now) {
      for (var i = playing.length - 1; i >= 0; i--) {
        var rec = playing[i];
        var t = now - rec.t0 - rec.delay;
        if (t >= rec.dur + rec.aa) { inkFinish(rec); playing.splice(i, 1); continue; }
        if (t > -rec.aa) inkPaint(rec, t);
      }
      if (playing.length) requestAnimationFrame(inkTick); else rafOn = false;
    }
    function inkStart(page) {
      var t0 = performance.now();
      inkRecs.forEach(function (rec) {
        if (rec.page === page && rec.state === "prepared") { rec.state = "playing"; rec.t0 = t0; playing.push(rec); }
      });
      if (playing.length && !rafOn) { rafOn = true; requestAnimationFrame(inkTick); }
    }

    /* re-condense one element after its text changed (e.g. festival name) */
    function inkReplay(el) {
      if (!inkOK || !el) return;
      var rec = recOf.get(el);
      if (rec) {
        var i = playing.indexOf(rec);
        if (i > -1) playing.splice(i, 1);
        rec.cv.remove();
        inkRecs.splice(inkRecs.indexOf(rec), 1);
        recOf.delete(el);
        el.classList.remove("ink-on");
      }
      inkPrepare(el);
      var nr = recOf.get(el);
      if (nr && nr.state === "prepared") { nr.state = "playing"; nr.t0 = performance.now(); playing.push(nr); }
      if (playing.length && !rafOn) { rafOn = true; requestAnimationFrame(inkTick); }
    }

    window.addEventListener("demo:fit", function () {
      inkRecs.slice().forEach(function (rec) {
        if (rec.state === "playing") {
          inkFinish(rec);
          var i = playing.indexOf(rec);
          if (i > -1) playing.splice(i, 1);
        } else if (rec.state === "prepared") {
          rec.cv.remove();
          rec.el.classList.remove("ink-on");
          inkRecs.splice(inkRecs.indexOf(rec), 1);
          recOf.delete(rec.el);
        }
      });
    });

    /* ---------- each page condenses once it is the page in view ---------- */
    var pages = $$(".page");
    if (!("IntersectionObserver" in window)) { pages.forEach(function (p) { p.classList.add("in"); }); return; }
    var prepIO = null;
    if (inkOK) {
      prepIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { prepIO.unobserve(e.target); preparePage(e.target); } });
      }, { rootMargin: "100% 0px" });
      pages.forEach(function (p) { prepIO.observe(p); });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.intersectionRatio >= 0.55) {
          e.target.classList.add("in"); io.unobserve(e.target);
          if (inkOK) { preparePage(e.target); inkStart(e.target); }
        }
      });
    }, { threshold: [0.55] });
    pages.forEach(function (p) { io.observe(p); });
  });
})();
