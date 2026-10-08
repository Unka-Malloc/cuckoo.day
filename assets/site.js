// Language, edition and the live day rule. No analytics, cookies or third-party requests.
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("cuckoo-lang"); } catch (e) {}
  var lang = saved || ((navigator.language || "en").toLowerCase().indexOf("zh") === 0 ? "zh" : "en");
  function apply(next) {
    lang = next;
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang === "zh" ? "zh-Hans" : "en");
    var title = document.querySelector("meta[name='title-" + lang + "']");
    if (title) document.title = title.content;
    renderImages();
    renderDate();
  }
  function renderImages() {
    document.querySelectorAll("img[data-src-en]").forEach(function (image) {
      image.alt = image.getAttribute("data-alt-" + lang);
      var source = image.getAttribute("data-src-" + lang);
      if (image.getAttribute("src") !== source) image.setAttribute("src", source);
    });
  }
  window.cuckooToggleLanguage = function () {
    var next = lang === "zh" ? "en" : "zh";
    try { localStorage.setItem("cuckoo-lang", next); } catch (e) {}
    apply(next);
  };

  var now = new Date();
  var hour = now.getHours() + now.getMinutes() / 60;
  var dusk = hour >= 18 || hour < 6;
  if (dusk) root.classList.add("dusk");

  function renderDate() {
    var locale = lang === "zh" ? "zh-CN" : "en-US";
    document.querySelectorAll("[data-today]").forEach(function (node) {
      node.textContent = now.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    });
    document.querySelectorAll("[data-edition]").forEach(function (node) {
      node.textContent = lang === "zh" ? (dusk ? "晚　报" : "晨　报") : (dusk ? "Evening edition" : "Morning edition");
    });
    document.querySelectorAll(".dayrule .now").forEach(function (node) {
      node.textContent = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    });
  }

  function renderRule() {
    document.querySelectorAll(".dayrule").forEach(function (rule) {
      var start = dusk ? 18 : 6;
      var pct = function (h) { return (h / 24 * 100) + "%"; };
      var lit = rule.querySelector(".lit"), sun = rule.querySelector(".sun"), label = rule.querySelector(".now");
      var from = hour >= start ? start : 0;
      lit.style.left = pct(from); lit.style.width = "calc(" + pct(hour) + " - " + pct(from) + ")";
      sun.style.left = pct(hour);
      label.style.left = "min(" + pct(hour) + ", calc(100% - 120px))";
    });
  }

  function renderStores() {
    var config = window.CUCKOO_SITE || { appStore: {} };
    document.querySelectorAll("[data-store]").forEach(function (node) {
      var url = (config.appStore || {})[node.getAttribute("data-store")];
      if (url) { node.href = url; node.hidden = false; }
    });
    var any = Object.keys(config.appStore || {}).some(function (k) { return config.appStore[k]; });
    document.querySelectorAll("[data-soon]").forEach(function (node) { node.hidden = any; });
    document.querySelectorAll("[data-contact]").forEach(function (node) {
      if (config.contactEmail) { node.href = "mailto:" + config.contactEmail; node.textContent = config.contactEmail; node.closest("[data-contact-row]").hidden = false; }
    });
  }

  apply(lang);
  document.addEventListener("DOMContentLoaded", function () { renderImages(); renderRule(); renderDate(); renderStores(); });
})();
