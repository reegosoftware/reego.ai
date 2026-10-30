(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("reego-theme", next); } catch (e) {}
    });
  });

  /* ---------- Header + mobile nav ---------- */
  var header = document.querySelector("[data-header]");
  var onScroll = function () { header && header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navToggle = document.querySelector("[data-nav-toggle]");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
    document.querySelectorAll("#site-nav a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(siblings, 6) * 60 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Hero terminal: replay the agent run ---------- */
  var terminal = document.querySelector("[data-terminal]");
  if (terminal && !reduceMotion) {
    var lines = terminal.querySelectorAll(".tl");
    var run = function () {
      terminal.classList.add("is-animating");
      lines.forEach(function (l) { l.classList.remove("is-shown"); });
      lines.forEach(function (l, i) {
        var delay = 400 + i * (l.classList.contains("tl--think") ? 650 : 520);
        setTimeout(function () { l.classList.add("is-shown"); }, delay);
      });
      setTimeout(run, 400 + lines.length * 600 + 5000);
    };
    run();
  }

  /* ---------- Card spotlight ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    }, { passive: true });
  }

  /* ---------- Copy install commands ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.classList.add("is-copied");
        setTimeout(function () { btn.classList.remove("is-copied"); }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  /* ---------- Filter chips (work + blog) ---------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var scope = group.parentNode;
    var items = scope.querySelectorAll("[data-filter-item]");
    var empty = scope.querySelector("[data-filter-empty]");
    var chips = group.querySelectorAll("[data-filter]");
    function apply(value) {
      var shown = 0;
      items.forEach(function (item) {
        var tags = (item.getAttribute("data-tags") || "").split("|");
        var match = value === "all" || tags.indexOf(value) !== -1;
        item.hidden = !match;
        if (match) { shown++; item.classList.add("is-in"); }
      });
      if (empty) empty.hidden = shown > 0;
      chips.forEach(function (c) { c.classList.toggle("is-active", c.getAttribute("data-filter") === value); });
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var v = chip.getAttribute("data-filter");
        apply(v);
        try { history.replaceState(null, "", v === "all" ? location.pathname : "#" + encodeURIComponent(v)); } catch (e) {}
      });
    });
    var initial = decodeURIComponent(location.hash.slice(1));
    if (initial && group.querySelector('[data-filter="' + initial.replace(/"/g, "") + '"]')) apply(initial);
  });

  /* ---------- Consulting "Book …" buttons prefill the form ---------- */
  document.querySelectorAll("[data-topic]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var msg = document.querySelector('.contact__form textarea[name="message"]');
      var box = document.querySelector('.contact__form input[value="Consulting"]');
      if (box) box.checked = true;
      if (msg && !msg.value) msg.value = "Hi! I'd like to book a " + btn.getAttribute("data-topic").toLowerCase() + ". ";
    });
  });

  /* ---------- Contact form: mailto fallback when no form endpoint ---------- */
  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var interests = d.getAll("interest").join(", ");
      var subject = "Project inquiry — " + (d.get("company") || d.get("name"));
      var body =
        "Name: " + d.get("name") + "\n" +
        "Email: " + d.get("email") + "\n" +
        (d.get("company") ? "Company: " + d.get("company") + "\n" : "") +
        (interests ? "Interested in: " + interests + "\n" : "") +
        "\n" + d.get("message");
      window.location.href = "mailto:" + form.getAttribute("data-mailto") +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var note = form.querySelector("[data-form-note]");
      if (note) note.textContent = "Your email app should open now. Nothing happened? Write to " + form.getAttribute("data-mailto");
    });
  });

  /* ---------- Endpoint form (e.g. Formspree): submit via fetch ---------- */
  document.querySelectorAll("form.contact__form[action]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-form-note]");
      var btn = form.querySelector("[type=submit]");
      btn.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          note.textContent = "Thanks! We'll get back to you within one business day.";
        })
        .catch(function () { note.textContent = "Something went wrong — please email us directly."; })
        .then(function () { btn.disabled = false; });
    });
  });
})();
