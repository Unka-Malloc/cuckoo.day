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
      [temp, note].forEach(function (n) { n.classList.remove("wx-swap"); void n.offsetWidth; n.classList.add("wx-swap"); });
      $$("[data-wx-set]", wx).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.wxSet === key)); });
    }
    if (wx) {
      $$("[data-wx-set]", wx).forEach(function (b) { b.addEventListener("click", function () { setWx(b.dataset.wxSet); }); });
      $$("[data-wx-set]", wx).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.wxSet === wx.dataset.wx)); });
    }

    /* ---------- festivals: the next one decides the cover's easter egg ---------- */
    var CAL = {"zh":{"spring":["2026-02-17","2027-02-06","2028-01-26","2029-02-13","2030-02-03"],"lantern":["2026-03-03","2027-02-20","2028-02-09","2029-02-27","2030-02-17"],"dragonboat":["2026-06-19","2027-06-09","2028-05-28","2029-06-16","2030-06-05"],"qixi":["2026-08-19","2027-08-08","2028-08-26","2029-08-16","2030-08-05"],"midautumn":["2026-09-25","2027-09-15","2028-10-03","2029-09-22","2030-09-12"],"chongyang":["2026-10-18","2027-10-08","2028-10-26","2029-10-16","2030-10-05"],"qingming":["2026-04-05","2027-04-05","2028-04-04","2029-04-04","2030-04-05"],"dongzhi":["2026-12-22","2027-12-22","2028-12-21","2029-12-21","2030-12-22"]},"terms":[["2026-01-05","小寒"],["2026-01-20","大寒"],["2026-02-04","立春"],["2026-02-18","雨水"],["2026-03-05","惊蛰"],["2026-03-20","春分"],["2026-04-05","清明"],["2026-04-20","谷雨"],["2026-05-05","立夏"],["2026-05-21","小满"],["2026-06-05","芒种"],["2026-06-21","夏至"],["2026-07-07","小暑"],["2026-07-23","大暑"],["2026-08-07","立秋"],["2026-08-23","处暑"],["2026-09-07","白露"],["2026-09-23","秋分"],["2026-10-08","寒露"],["2026-10-23","霜降"],["2026-11-07","立冬"],["2026-11-22","小雪"],["2026-12-07","大雪"],["2026-12-22","冬至"],["2027-01-05","小寒"],["2027-01-20","大寒"],["2027-02-04","立春"],["2027-02-19","雨水"],["2027-03-06","惊蛰"],["2027-03-21","春分"],["2027-04-05","清明"],["2027-04-20","谷雨"],["2027-05-06","立夏"],["2027-05-21","小满"],["2027-06-06","芒种"],["2027-06-21","夏至"],["2027-07-07","小暑"],["2027-07-23","大暑"],["2027-08-08","立秋"],["2027-08-23","处暑"],["2027-09-08","白露"],["2027-09-23","秋分"],["2027-10-08","寒露"],["2027-10-23","霜降"],["2027-11-07","立冬"],["2027-11-22","小雪"],["2027-12-07","大雪"],["2027-12-22","冬至"],["2028-01-06","小寒"],["2028-01-20","大寒"],["2028-02-04","立春"],["2028-02-19","雨水"],["2028-03-05","惊蛰"],["2028-03-20","春分"],["2028-04-04","清明"],["2028-04-19","谷雨"],["2028-05-05","立夏"],["2028-05-20","小满"],["2028-06-05","芒种"],["2028-06-21","夏至"],["2028-07-06","小暑"],["2028-07-22","大暑"],["2028-08-07","立秋"],["2028-08-22","处暑"],["2028-09-07","白露"],["2028-09-22","秋分"],["2028-10-08","寒露"],["2028-10-23","霜降"],["2028-11-07","立冬"],["2028-11-22","小雪"],["2028-12-06","大雪"],["2028-12-21","冬至"],["2029-01-05","小寒"],["2029-01-20","大寒"],["2029-02-03","立春"],["2029-02-18","雨水"],["2029-03-05","惊蛰"],["2029-03-20","春分"],["2029-04-04","清明"],["2029-04-20","谷雨"],["2029-05-05","立夏"],["2029-05-21","小满"],["2029-06-05","芒种"],["2029-06-21","夏至"],["2029-07-07","小暑"],["2029-07-22","大暑"],["2029-08-07","立秋"],["2029-08-23","处暑"],["2029-09-07","白露"],["2029-09-23","秋分"],["2029-10-08","寒露"],["2029-10-23","霜降"],["2029-11-07","立冬"],["2029-11-22","小雪"],["2029-12-07","大雪"],["2029-12-21","冬至"],["2030-01-05","小寒"],["2030-01-20","大寒"],["2030-02-04","立春"],["2030-02-18","雨水"],["2030-03-05","惊蛰"],["2030-03-20","春分"],["2030-04-05","清明"],["2030-04-20","谷雨"],["2030-05-05","立夏"],["2030-05-21","小满"],["2030-06-05","芒种"],["2030-06-21","夏至"],["2030-07-07","小暑"],["2030-07-23","大暑"],["2030-08-07","立秋"],["2030-08-23","处暑"],["2030-09-07","白露"],["2030-09-23","秋分"],["2030-10-08","寒露"],["2030-10-23","霜降"],["2030-11-07","立冬"],["2030-11-22","小雪"],["2030-12-07","大雪"],["2030-12-22","冬至"]],"en":{"newyear":["2026-01-01","2027-01-01","2028-01-01","2029-01-01","2030-01-01"],"valentine":["2026-02-14","2027-02-14","2028-02-14","2029-02-14","2030-02-14"],"easter":["2026-04-05","2027-03-28","2028-04-16","2029-04-01","2030-04-21"],"halloween":["2026-10-31","2027-10-31","2028-10-31","2029-10-31","2030-10-31"],"thanksgiving":["2026-11-26","2027-11-25","2028-11-23","2029-11-22","2030-11-28"],"xmas":["2026-12-25","2027-12-25","2028-12-25","2029-12-25","2030-12-25"]}};
    var LANG = EN ? "en" : "zh";
    var FEST = {
      zh: { order: ["spring", "lantern", "qingming", "dragonboat", "qixi", "midautumn", "chongyang", "dongzhi"],
        f: { spring: ["春节", "春节", "回家的车票，记得提前抢。"], lantern: ["元宵节", "元宵", "汤圆煮上，晚上去看灯。"], qingming: ["清明节", "清明", "踏青，也回去看看。"], dragonboat: ["端午节", "端午", "粽子备好，看一场龙舟。"], qixi: ["七夕节", "七夕", "今晚的星星，留给两个人。"], midautumn: ["中秋节", "中秋", "月饼和团圆饭，记得早点订位。"], chongyang: ["重阳节", "重阳", "登高、赏菊，给长辈打个电话。"], dongzhi: ["冬至", "冬至", "一碗饺子，一年里最长的夜。"] } },
      en: { order: ["newyear", "valentine", "easter", "halloween", "thanksgiving", "xmas"],
        f: { newyear: ["New Year's Day", "New Year", "A clean page for the year."], valentine: ["Valentine's Day", "Valentine's", "Book the table before it fills."], easter: ["Easter", "Easter", "Hide the eggs before breakfast."], halloween: ["Halloween", "Halloween", "Sweets by the door, and mind the pumpkins."], thanksgiving: ["Thanksgiving", "Thanksgiving", "Set an extra place at the table."], xmas: ["Christmas", "Christmas", "Time to start the gift list."] } }
    };
    var day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    function nextFestDate(key) {
      var list = CAL[LANG][key];
      if (!list) return null;
      for (var i = 0; i < list.length; i++) {
        var p = list[i].split("-").map(Number), d = new Date(p[0], p[1] - 1, p[2]);
        if (d >= day0) return d;
      }
      return null;
    }
    var fest = $(".fest"), festAuto = null, festToday = null;
    var F = FEST[LANG].f;
    FEST[LANG].order.forEach(function (k) {
      F[k].d = nextFestDate(k);
      if (F[k].d && +F[k].d === +day0) festToday = k;
      if (F[k].d && (!festAuto || F[k].d < F[festAuto].d)) festAuto = k;
    });
    function setFest(key) {
      if (!fest || !F[key]) return;
      var f = F[key], d = f.d;
      fest.dataset.show = key;
      $("[data-fest-name]", fest).textContent = f[0];
      $("[data-fest-line]", fest).textContent = f[2];
      if (d) {
        var diff = Math.round((d - day0) / 864e5);
        $("[data-fest-when]", fest).textContent = (diff === 0 ? T("今天", "Today") : T("还有 " + diff + " 天", "In " + diff + (diff === 1 ? " day" : " days"))) + " · " + (EN ? WEEK[d.getDay()] + ", " + md(d) : md(d) + " " + WEEK[d.getDay()]);
      }
      $$("[data-fest-set]", fest).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.festSet === key)); });
    }
    function fillDays() {
      var ol = $("[data-days]");
      if (!ol) return;
      var evts = [];
      FEST[LANG].order.forEach(function (k) { if (F[k].d) evts.push({ d: F[k].d, n: F[k][0] }); });
      if (LANG === "zh") CAL.terms.forEach(function (t) {
        var p = t[0].split("-").map(Number), d = new Date(p[0], p[1] - 1, p[2]);
        if (d >= day0) evts.push({ d: d, n: t[1] });
      });
      evts.sort(function (a, b) { return a.d - b.d; });
      var seen = {}, out = [], lead = F[festToday || festAuto];
      evts.forEach(function (e) {
        var k = e.d.toISOString() + "|" + e.n;
        if (seen[k] || (lead && e.n === lead[0])) return;
        seen[k] = 1; out.push(e);
      });
      ol.innerHTML = out.slice(0, 5).map(function (e) {
        return "<li><time>" + md(e.d) + "</time><b>" + e.n + "</b><span>" + WEEK[e.d.getDay()] + "</span></li>";
      }).join("");
    }
    if (fest) {
      $$("[data-fest-set]", fest).forEach(function (b) { b.addEventListener("click", function () { setFest(b.dataset.festSet); }); });
      setFest(festToday || festAuto);
      fillDays();
      var slot = $("[data-egg-slot]");
      if (festToday && slot) {
        var art = $(".egg-" + festToday, fest);
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
      var ew = w - 2 * pad, eh = h - 2 * pad;
      var rng = mulberry(seed);
      var n = Math.max(2, Math.min(7, Math.round(ew / (eh * 1.8))));
      var horiz = ew >= eh, seeds = [];
      for (var i = 0; i < n; i++) {
        var fa = (i + 0.5) / n + (rng() - 0.5) * 0.5 / n;
        var fb = 0.5 + (rng() - 0.5) * 0.6;
        seeds.push({ x: pad + (horiz ? fa * ew : fb * ew), y: pad + (horiz ? fb * eh : fa * eh), st: rng() });
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
      var pad = parseFloat(cs.getPropertyValue("--ink-pad")) || 0;
      var ar = art.getBoundingClientRect(), er = el.getBoundingClientRect();
      var x = (er.left - ar.left) / s - pad, y = (er.top - ar.top) / s - pad;
      var w = er.width / s + 2 * pad, h = er.height / s + 2 * pad;
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
