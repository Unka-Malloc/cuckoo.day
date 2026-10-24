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

    /* ---------- headlines condense character by character ---------- */
    $$(".ink").forEach(function (title) {
      var i = 0;
      title.setAttribute("aria-label", title.textContent.replace(/\s+/g, ""));
      $$("*", title).concat([title]).forEach(function (el) {
        Array.prototype.slice.call(el.childNodes).forEach(function (node) {
          if (node.nodeType !== 3 || !node.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          (node.textContent.match(/[A-Za-z0-9'’.,:;!?()\-–$%#&+]+|\s+|./gu) || []).forEach(function (tok) {
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
            var word = document.createElement("span");
            word.className = "w";
            Array.from(tok).forEach(function (ch) {
              var span = document.createElement("span");
              span.className = "c";
              span.setAttribute("aria-hidden", "true");
              span.textContent = ch;
              span.style.setProperty("--d", 100 + i * (EN ? 22 : 34) + ((i * 7919) % 11) * 30 + "ms");
              word.appendChild(span);
              i++;
            });
            frag.appendChild(word);
          });
          el.replaceChild(frag, node);
        });
      });
    });

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
      svg.innerHTML = '<path d="' + d + '" stroke="var(' + (up ? "--teal" : "--red") + ')"/>';
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
      $("[data-wx-label]", wx).textContent = WX[key][0];
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
    var FEST = {
      chongyang: [T("重阳节", "Double Ninth"), T("登高、赏菊，给长辈打个电话。", "Climb a hill, admire the chrysanthemums, call your grandparents."), ["2026-10-18", "2027-10-08", "2028-10-26"]],
      midautumn: [T("中秋节", "Mid-Autumn"), T("月饼和团圆饭，记得早点订位。", "Mooncakes and a family dinner. Book the table early."), ["2026-09-25", "2027-09-15", "2028-10-03"]],
      spring: [T("春节", "Lunar New Year"), T("回家的车票，记得提前抢。", "Tickets home sell out fast. Book them now."), ["2026-02-17", "2027-02-06", "2028-01-26"]],
      halloween: [T("万圣节", "Halloween"), T("门口备好糖，小心南瓜灯。", "Sweets by the door, and mind the pumpkins."), "10-31"],
      xmas: [T("圣诞节", "Christmas"), T("礼物清单，可以开始写了。", "Time to start the gift list."), "12-25"]
    };
    var day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    function nextDate(rule) {
      var list = typeof rule === "string" ? [0, 1].map(function (y) { return (now.getFullYear() + y) + "-" + rule; }) : rule;
      for (var i = 0; i < list.length; i++) {
        var p = list[i].split("-").map(Number), d = new Date(p[0], p[1] - 1, p[2]);
        if (d >= day0) return d;
      }
      return null;
    }
    var fest = $(".fest"), auto = null;
    Object.keys(FEST).forEach(function (k) {
      var d = nextDate(FEST[k][2]);
      FEST[k].next = d;
      if (d && (!auto || d < FEST[auto].next)) auto = k;
    });
    function setFest(key) {
      if (!fest || !FEST[key]) return;
      var f = FEST[key], d = f.next;
      fest.dataset.show = key;
      $("[data-fest-name]", fest).textContent = f[0];
      $("[data-fest-line]", fest).textContent = f[1];
      if (d) {
        var diff = Math.round((d - day0) / 864e5);
        $("[data-fest-when]", fest).textContent = (diff === 0 ? T("就是今天", "Today") : T("还有 " + diff + " 天", "In " + diff + (diff === 1 ? " day" : " days"))) + " · " + (EN ? WEEK[d.getDay()] + ", " + md(d) : md(d) + " " + WEEK[d.getDay()]);
      }
      $$("[data-fest-set]", fest).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.festSet === key)); });
    }
    if (fest) {
      $$("[data-fest-set]", fest).forEach(function (b) { b.addEventListener("click", function () { setFest(b.dataset.festSet); }); });
      setFest(auto || "chongyang");
      var slot = $("[data-egg-slot]");
      if (auto && slot && (FEST[auto].next - day0) / 864e5 <= 7) {
        var art = $(".egg-" + auto, fest);
        if (art) { var c = art.cloneNode(true); c.removeAttribute("class"); c.setAttribute("class", "egg-art egg-" + auto); slot.appendChild(c); slot.classList.add("on"); slot.dataset.show = auto; }
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
        if (fest && page.contains(fest)) setFest(auto || "chongyang");
        $$(".statement", page).forEach(function (st) { st.classList.remove("thump"); void st.offsetWidth; st.classList.add("thump"); });
      });
    });

    /* ---------- download: a real archive when one is published ---------- */
    var cfg = window.CUCKOO_SITE || {};
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

    /* ---------- each page condenses once it is the page in view ---------- */
    var pages = $$(".page");
    if (!("IntersectionObserver" in window)) { pages.forEach(function (p) { p.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.intersectionRatio >= 0.55) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: [0.55] });
    pages.forEach(function (p) { io.observe(p); });
  });
})();
