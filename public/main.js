/* ============================================================================
   AiJ Labs — Rediseño V2 · main.js
   Vanilla JS, sin dependencias.
   - Masthead: glassmorphism al hacer scroll (.is-stuck)
   - Drawer móvil accesible
   - Hero: entrada del título palabra por palabra (preserva el <em> de acento)
   - Ticker infinito (duplicado del track)
   - Reveal on-scroll con IntersectionObserver + red de seguridad
   - Panel de chat de Jaia (carga diferida del iframe)
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Masthead ─────────────────────────────────────────────────────── */
  var masthead = document.getElementById("masthead");
  var onScroll = function () {
    if (masthead) masthead.classList.toggle("is-stuck", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── 2. Drawer móvil ─────────────────────────────────────────────────── */
  var navToggle = document.getElementById("navToggle");
  var drawer = document.getElementById("drawer");

  var setMenu = function (open) {
    if (!drawer || !navToggle) return;
    drawer.hidden = !open;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };

  if (navToggle && drawer) {
    navToggle.addEventListener("click", function () { setMenu(drawer.hidden); });
    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    window.matchMedia("(min-width: 1000px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ── 3. Hero: título palabra por palabra ─────────────────────────────── */
  var heroTitle = document.getElementById("heroTitle");
  if (heroTitle) {
    // Recorremos los nodos hijos para conservar <em>inteligencia</em>.
    var pieces = [];
    Array.prototype.forEach.call(heroTitle.childNodes, function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/\s+/).forEach(function (w) {
          if (w) pieces.push({ text: w, em: false });
        });
      } else if (node.nodeType === 1) {
        (node.textContent || "").split(/\s+/).forEach(function (w) {
          if (w) pieces.push({ text: w, em: node.tagName === "EM" });
        });
      }
    });

    heroTitle.textContent = "";
    pieces.forEach(function (p) {
      var word = document.createElement("span");
      word.className = "word";
      var inner = document.createElement(p.em ? "em" : "span");
      inner.textContent = p.text;
      word.appendChild(inner);
      heroTitle.appendChild(word);
      heroTitle.appendChild(document.createTextNode(" "));
    });

    var showTitle = function () {
      if (reduceMotion) { heroTitle.classList.add("is-inview"); return; }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { heroTitle.classList.add("is-inview"); });
      });
      // Red de seguridad si el rAF se congela (pestaña en segundo plano).
      window.setTimeout(function () { heroTitle.classList.add("is-inview"); }, 1600);
    };
    showTitle();
  }

  /* ── 4. Ticker infinito ──────────────────────────────────────────────── */
  var tickerTrack = document.getElementById("tickerTrack");
  if (tickerTrack && !reduceMotion) {
    tickerTrack.innerHTML += tickerTrack.innerHTML; // duplicado → loop sin salto
    tickerTrack.setAttribute("aria-hidden", "true");
  }

  /* ── 5. Reveal on-scroll ─────────────────────────────────────────────── */
  var revealables = document.querySelectorAll(".reveal");
  // Escalonado por grupo: index dentro del contenedor padre.
  revealables.forEach(function (el) {
    var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [el];
    var idx = Array.prototype.indexOf.call(siblings, el);
    el.style.setProperty("--i", idx < 0 ? 0 : idx);
  });

  var showAll = function () {
    revealables.forEach(function (el) { el.classList.add("is-inview"); });
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    revealables.forEach(function (el) { io.observe(el); });
    // Redes de seguridad: si el observer nunca dispara (pestaña/panel oculto,
    // 'load' que no llega por imágenes lazy), revelamos igual.
    window.setTimeout(showAll, 3000);
    window.addEventListener("load", function () { window.setTimeout(showAll, 1200); });
  }

  /* ── 6. Panel de chat de Jaia ───────────────────────────────────────── */
  var jaiaFab = document.getElementById("jaiaFab");
  var jaiaPanel = document.getElementById("jaiaPanel");
  var jaiaClose = document.getElementById("jaiaClose");
  var jaiaIframe = jaiaPanel ? jaiaPanel.querySelector("iframe") : null;
  var waDot = document.querySelector(".dot--wa");
  var iframeLoaded = false;

  var setChat = function (open) {
    if (!jaiaPanel || !jaiaFab) return;
    if (open && jaiaIframe && !iframeLoaded) {
      jaiaIframe.src = jaiaIframe.dataset.src;
      iframeLoaded = true;
    }
    jaiaPanel.hidden = !open;
    jaiaFab.hidden = open;
    jaiaFab.setAttribute("aria-expanded", String(open));
    // Ocultamos el botón flotante de WhatsApp mientras el chat está abierto
    // para no ofrecer dos canales superpuestos (mobile y desktop).
    if (waDot) waDot.hidden = open;
  };

  if (jaiaFab && jaiaPanel) {
    jaiaFab.addEventListener("click", function () { setChat(true); });
    if (jaiaClose) jaiaClose.addEventListener("click", function () { setChat(false); });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !jaiaPanel.hidden) setChat(false);
    });
    // Disparadores extra desde el bloque de contacto.
    ["contactJaia", "contactJaiaBot", "devJaia"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("click", function () { setChat(true); });
    });
    // Link de los mails de prospección: ?jaia=agendar&ref=Empresa abre el chat solo.
    var q = new URLSearchParams(window.location.search);
    if (q.get("jaia") === "agendar") {
      var ref = (q.get("ref") || "").slice(0, 80);
      if (ref && jaiaIframe) jaiaIframe.dataset.src += "?ref=" + encodeURIComponent(ref);
      setChat(true);
    }
    // Link del mensaje de ausencia de WhatsApp: ?jaia=ausencia abre el chat e informa el origen.
    if (q.get("jaia") === "ausencia") {
      if (jaiaIframe) jaiaIframe.dataset.src += "?src=wa-ausencia";
      setChat(true);
    }
  }
})();

/* Logo animado del header: con movimiento reducido queda en el último cuadro */
(function () {
  var v = document.querySelector(".masthead__video");
  if (!v || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  v.removeAttribute("autoplay");
  v.pause();
  v.addEventListener("loadedmetadata", function () { v.currentTime = v.duration; });
})();

/* Video del hero: el movimiento sigue el scroll (scrub). Con movimiento reducido queda en el primer cuadro */
(function () {
  var v = document.getElementById("heroScrub");
  if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ready = false, target = 0, current = 0, ticking = false;
  function progress() {
    var r = v.getBoundingClientRect(), vh = window.innerHeight;
    var start = vh * 0.8, span = Math.max(r.height * 0.9, vh * 0.4);
    return Math.min(1, Math.max(0, (start - r.top) / span));
  }
  var last = 0;
  function frame(now) {
    ticking = false;
    if (!ready) return;
    var dt = Math.min(64, now - (last || now - 16)); last = now;
    current += (target - current) * (1 - Math.exp(-dt / 55)); // suavizado independiente de los Hz de la pantalla
    if (Math.abs(target - current) < 0.0004) current = target;
    var t = Math.round(current * v.duration * 24) / 24; // cuadro exacto: sin saltos entre cuadros
    var pending = Math.abs(t - v.currentTime) > 0.001;
    if (pending) v.currentTime = t;
    if (current !== target || pending) { ticking = true; requestAnimationFrame(frame); } else last = 0;
  }
  function onScroll() {
    target = progress();
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  v.addEventListener("loadedmetadata", function () { ready = true; onScroll(); });
  if (v.readyState >= 1) { ready = true; onScroll(); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();
