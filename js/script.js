/* ══════════════════════════════════════════════════════
   NyX — Help Portal
   ══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ─────────── theme ─────────── */
  var theme = null;
  document.getElementById("themeToggle").addEventListener("click", function () {
    var sysLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    var isLight = theme ? theme === "light" : sysLight;
    theme = isLight ? "dark" : "light";
    root.setAttribute("data-theme", theme);
    this.textContent = theme === "light" ? "☀" : "☾";
  });

  /* ─────────── reveal on scroll ─────────── */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("in"); });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".frag").forEach(function (el) { io.observe(el); });

  /* ─────────── powers ─────────── */
  document.querySelectorAll(".p-head").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var li = btn.parentElement;
      var open = li.getAttribute("data-open") === "true";
      document.querySelectorAll(".powers li").forEach(function (o) {
        o.setAttribute("data-open", "false");
        o.querySelector(".p-head").setAttribute("aria-expanded", "false");
      });
      if (!open) {
        li.setAttribute("data-open", "true");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ══════════════════════════════════════════════════
     The figure — front and back, on a slider
     ══════════════════════════════════════════════════ */
  var pane = document.getElementById("characterPane");
  var track = document.getElementById("track");
  var viewName = document.getElementById("viewName");
  var dots = document.querySelectorAll(".view-count .dot");
  var VIEWS = ["Front", "Back"];
  var at = 0;

  function show(i) {
    at = (i + VIEWS.length) % VIEWS.length;
    track.setAttribute("data-at", String(at));
    viewName.textContent = VIEWS[at];
    dots.forEach(function (d, n) { d.classList.toggle("on", n === at); });
  }
  show(0);

  document.getElementById("viewPrev").addEventListener("click", function () { show(at - 1); });
  document.getElementById("viewNext").addEventListener("click", function () { show(at + 1); });
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") show(at - 1);
    if (e.key === "ArrowRight") show(at + 1);
  });

  /* swipe on touch */
  var sx = null;
  track.addEventListener("pointerdown", function (e) { sx = e.clientX; });
  window.addEventListener("pointerup", function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 55) show(dx < 0 ? at + 1 : at - 1);
  });

  /* reveal once the first image is decoded, so she never pops in half-loaded */
  var first = track.querySelector("img");
  function live() { pane.classList.add("live"); }
  if (first.complete) { live(); } else { first.addEventListener("load", live); first.addEventListener("error", live); }

  /* ══════════════════════════════════════════════════
     The Sanctuary — an overlay, opened on arrival
     ══════════════════════════════════════════════════ */
  var sanctuary = document.getElementById("sanctuary");
  var scrim = document.getElementById("scrim");
  var closeBtn = document.getElementById("closeBtn");
  var navState = document.getElementById("navState");
  var navTalk = document.getElementById("navTalk");

  var started = false;     // has she said hello yet
  var autoDone = false;    // she only lets herself in once per visit
  var lastFocus = null;

  function isOpen() { return !sanctuary.hidden; }

  function openSanctuary(auto) {
    if (isOpen()) return;
    lastFocus = document.activeElement;

    scrim.hidden = false;
    sanctuary.hidden = false;

    navTalk.textContent = "Close";
    navState.textContent = "Sanctuary";

    requestAnimationFrame(function () {
      scrim.classList.add("open");
      sanctuary.classList.add("open");
    });

    if (!started) { started = true; open(); }
    else { setTimeout(function () { focusField(); }, reduced ? 0 : 320); }
  }

  function closeSanctuary() {
    if (!isOpen()) return;
    sanctuary.classList.remove("open");
    scrim.classList.remove("open");
    navTalk.textContent = "Talk to me";
    navState.textContent = "Story";
    setTimeout(function () {
      sanctuary.hidden = true;
      scrim.hidden = true;
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    }, reduced ? 0 : 450);
  }

  function focusField() {
    var f = document.getElementById("field");
    if (!f || f.offsetParent === null) return;
    try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
  }

  document.getElementById("talkBtnTop").addEventListener("click", function () { openSanctuary(false); });
  closeBtn.addEventListener("click", closeSanctuary);
  scrim.addEventListener("click", closeSanctuary);
  navTalk.addEventListener("click", function () {
    if (isOpen()) { closeSanctuary(); } else { openSanctuary(false); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) closeSanctuary();
  });

  /* keep tab focus inside the panel while it is up */
  sanctuary.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = sanctuary.querySelectorAll("button:not([hidden]):not([disabled]), textarea, [href]");
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* she comes in on her own, once, after the page has settled.
     No sound, no permissions — it is only a panel. */
  function arrive() {
    if (autoDone) return;
    autoDone = true;
    openSanctuary(true);
  }
  if (document.readyState === "complete") {
    setTimeout(arrive, reduced ? 200 : 1100);
  } else {
    window.addEventListener("load", function () {
      setTimeout(arrive, reduced ? 200 : 1100);
    });
  }

  /* ══════════════════════════════════════════════════
     The conversation
     ══════════════════════════════════════════════════ */
  var log = document.getElementById("log");
  var form = document.getElementById("entry");
  var field = document.getElementById("field");
  var send = document.getElementById("send");
  var err = document.getElementById("err");
  var hint = document.getElementById("entryHint");
  var finish = document.getElementById("finish");
  var tStatus = document.getElementById("tStatus");

  var step = 0, done = false;
  var data = { name: "", age: "", location: "", email: "", grievance: "" };
  var said = [];                     // everything they typed about what happened

  var FIELD = [
    { mode: "text",    auto: "given-name",     rows: 1, ph: "Type your answer",            hint: "" },
    { mode: "numeric", auto: "off",            rows: 1, ph: "Your age",                    hint: "" },
    { mode: "text",    auto: "address-level2", rows: 1, ph: "City or region",              hint: "" },
    { mode: "email",   auto: "email",          rows: 1, ph: "you@example.com",             hint: "" },
    { mode: "text",    auto: "off",            rows: 3, ph: "Whatever comes first",
      hint: "Send as many messages as you need. Shift + Enter for a new line." }
  ];

  function dress() {
    var f = FIELD[Math.min(step, FIELD.length - 1)];
    field.setAttribute("inputmode", f.mode);
    field.setAttribute("autocomplete", f.auto);
    field.rows = f.rows;
    field.placeholder = f.ph;
    hint.textContent = f.hint;
  }

  function line(who, text, cls) {
    var d = document.createElement("div");
    d.className = "line " + cls;
    if (cls === "sys") { d.textContent = text; }
    else {
      var w = document.createElement("span"); w.className = "who"; w.textContent = who;
      var t = document.createElement("span"); t.className = "what"; t.textContent = text;
      d.appendChild(w); d.appendChild(t);
    }
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function nyx(text, cb) {
    var d = document.createElement("div");
    d.className = "dots";
    d.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    setTimeout(function () {
      d.remove();
      line("NyX", text, "nyx");
      if (cb) cb();
    }, reduced ? 0 : 520);
  }

  function nyxAll(lines, cb) {
    if (!lines.length) { if (cb) cb(); return; }
    nyx(lines.shift(), function () {
      setTimeout(function () { nyxAll(lines, cb); }, reduced ? 0 : 230);
    });
  }

  function fail(m) { err.textContent = m; err.style.display = "block"; }
  function clearFail() { err.textContent = ""; err.style.display = "none"; }

  function showFinish(on) {
    finish.hidden = !on;
    finish.disabled = !on;
  }
  finish.addEventListener("click", function () { if (step === 4) recap(); });

  function setEntry(on) {
    form.style.display = on ? "flex" : "none";
    hint.style.display = on ? "" : "none";
  }

  var okEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var okAge = function (v) { var n = Number(v); return /^\d+$/.test(v.trim()) && n > 0 && n < 120; };

  function open() {
    line("", "Channel open", "sys");
    tStatus.textContent = "open";
    dress();
    nyxAll([
      "I'm here.",
      "What should I call you?"
    ], function () {
      setTimeout(function () { try { field.focus({ preventScroll: true }); } catch (e) { field.focus(); } }, 200);
    });
  }

  /* ── she keeps the door open while they talk ── */
  function norm(t) {
    return (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  var THEMES = [
    { key: "safety",   re: /(unsafe|afraid|scared|threat|threaten|harm|hurt|violence|abuse|attack|stalk|harass|hit|follow(ed|ing)?|fear)/,
      reads: "something that puts you at risk" },
    { key: "home",     re: /(landlord|rent|flat|apartment|house|neighbour|neighbor|evict|lease|home)/,
      reads: "a problem where you live" },
    { key: "close",    re: /(boyfriend|girlfriend|partner|husband|wife|\bex\b|family|mother|father|mom|dad|sister|brother|friend)/,
      reads: "something with a person close to you" },
    { key: "work",     re: /(job|boss|coworker|colleague|manager|work|school|college|teacher|class|office|shift)/,
      reads: "pressure at work or in study" },
    { key: "money",    re: /(money|debt|loan|wage|salary|unpaid|bill|cash|payment|broke)/,
      reads: "money pressure" },
    { key: "social",   re: /(ignored|excluded|mocked|teased|bully|bullied|gossip|rumou?r|left out|lonely|isolat)/,
      reads: "being pushed out or picked on" },
    { key: "identity", re: /(race|racist|caste|religion|gender|disabilit|discriminat|targeted)/,
      reads: "being treated differently for who you are" },
    { key: "weight",   re: /(exhaust|overwhelm|stress|anxious|panic|can.?t sleep|crying|too much|breaking)/,
      reads: "something that has been wearing you down" }
  ];

  /* her acknowledgement between messages, shaped by what they wrote */
  function answerTo(text) {
    var t = norm(text);
    if (!t) return "Go on.";
    if (THEMES[0].re.test(t)) return "I have that. Keep going.";
    if (THEMES[7].re.test(t)) return "I hear you. Go on.";
    if (t.split(" ").length > 22) return "Mm. And then?";
    var picks = ["Go on.", "And then?", "I'm still here.", "What else?"];
    return picks[said.length % picks.length];
  }

  /* what the whole account reads like — tentative, never a diagnosis */
  function themeOf(all) {
    var t = norm(all);
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].re.test(t)) return THEMES[i].reads;
    }
    return null;
  }

  function askedForMore() { showFinish(true); }

  /* ── read it back to them before anything is sent ── */
  function recap() {
    showFinish(false);
    setEntry(false);
    var reads = themeOf(said.join(" "));
    nyxAll([
      "Let me be sure I have this right before I carry it.",
      reads
        ? "What I'm hearing is " + reads + ". Your words, as you gave them:"
        : "This is what you told me, in your words:"
    ], function () {
      var box = document.createElement("div");
      box.className = "recap";

      var heading = document.createElement("h3");
      heading.textContent = "What you said so far:";
      box.appendChild(heading);

      var dl = document.createElement("dl");
      [["Name", data.name], ["Age", data.age], ["Where", data.location], ["Email", data.email]]
        .forEach(function (pair) {
          var dt = document.createElement("dt"); dt.textContent = pair[0];
          var dd = document.createElement("dd"); dd.textContent = pair[1];
          dl.appendChild(dt); dl.appendChild(dd);
        });
      box.appendChild(dl);

      var wrap = document.createElement("div");
      wrap.className = "said";
      if (said.length) {
        said.forEach(function (s) {
          var p = document.createElement("p");
          p.textContent = s;
          wrap.appendChild(p);
        });
      } else {
        var empty = document.createElement("p");
        empty.textContent = "Nothing yet.";
        wrap.appendChild(empty);
      }
      box.appendChild(wrap);
      log.appendChild(box);
      log.scrollTop = log.scrollHeight;

      nyx("Have I understood you?", function () {
        var row = document.createElement("div");
        row.className = "verify";
        var yes = document.createElement("button");
        yes.type = "button"; yes.className = "verify-btn"; yes.textContent = "That\u2019s it";
        yes.addEventListener("click", function () { row.remove(); submit(); });
        var no = document.createElement("button");
        no.type = "button"; no.className = "verify-btn ghost"; no.textContent = "There\u2019s more";
        no.addEventListener("click", function () { row.remove(); addMore(); });
        row.appendChild(no); row.appendChild(yes);
        log.appendChild(row);
        log.scrollTop = log.scrollHeight;
      });
    });
  }

  function addMore() {
    setEntry(true);
    dress();
    nyx("Go ahead. I'm listening.", function () {
      showFinish(true);
      field.focus();
    });
  }

  /**
   * Delivery. Sends through EmailJS using js/config.js.
   * Falls back to logging the payload when EmailJS isn't configured
   * or the SDK didn't load, so the portal still works offline.
   * Shape: { name, age, location, email, grievance, messages, submittedAt }
   */
  function submitHelpRequest(payload) {
    var cfg = window.EMAIL_CONFIG || {};
    var ready = window.emailjs && cfg.SERVICE_ID && cfg.TEMPLATE_ID && cfg.PUBLIC_KEY;

    if (!ready) {
      console.warn("EmailJS not configured — logging instead of sending.");
      console.log("submitHelpRequest", payload);
      return new Promise(function (resolve) {
        setTimeout(function () { resolve({ ok: true, sent: false }); }, 600);
      });
    }

    var submittedAt = new Date(payload.submittedAt).toLocaleString();
    return window.emailjs.send(cfg.SERVICE_ID, cfg.TEMPLATE_ID, {
      to_email:     cfg.CANDIDATE_EMAIL,
      from_name:    payload.name,
      reply_to:     payload.email,
      visitor_name: payload.name,
      visitor_age:  payload.age,
      visitor_location: payload.location,
      visitor_email:    payload.email,
      grievance:    payload.grievance,
      submitted_at: submittedAt,
      submittedAt:  submittedAt
    }, { publicKey: cfg.PUBLIC_KEY });
  }

  function submit() {
    showFinish(false);
    setEntry(false);
    tStatus.textContent = "sending";
    data.grievance = said.join("\n\n");
    data.messages = said.slice();
    data.submittedAt = new Date().toISOString();

    submitHelpRequest(data).then(received).catch(function () { broke(submit); });
  }

  function received() {
    done = true;
    log.innerHTML = "";
    setEntry(false);
    showFinish(false);
    clearFail();
    tStatus.textContent = "received";
    var box = document.createElement("div");
    box.className = "received";
    box.innerHTML =
      '<svg class="sigil" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l1.4 4.3L18 6.7l-4.3 1.4L12 12l-1.4-4.3L6 6.7l4.6-1.4L12 1z"/><circle cx="12" cy="18" r="2.6"/></svg>' +
      "<h3>I got your email.</h3>" +
      "<p>Thank you for telling me.</p>" +
      "<p>I\u2019ll catch you at " + data.email + ".</p>" +
      '<p class="sig">— NyX</p>';
    log.appendChild(box);
  }

  function broke(retry) {
    tStatus.textContent = "interrupted";
    var box = document.createElement("div");
    box.className = "received";
    box.innerHTML =
      "<h3>That did not reach me.</h3>" +
      "<p>Nothing is lost. Everything you wrote is still here.</p>";
    var b = document.createElement("button");
    b.className = "t-btn primary"; b.type = "button"; b.textContent = "Try again";
    b.addEventListener("click", function () { box.remove(); tStatus.textContent = "open"; retry(); });
    box.appendChild(b);
    log.appendChild(box);
    log.scrollTop = log.scrollHeight;
  }

  function advance(text) {
    clearFail();
    switch (step) {
      case 0:
        data.name = text; line("You", text, "you"); field.value = "";
        nyxAll([
          "Good to meet you, " + data.name + ".",
          "A few things first, so I know who I am speaking to.",
          "How old are you?"
        ], function () { step = 1; dress(); });
        break;

      case 1:
        if (!okAge(text)) return fail("A number, if you would.");
        data.age = text; line("You", text, "you"); field.value = "";
        nyx("Where are you?", function () { step = 2; dress(); });
        break;

      case 2:
        data.location = text; line("You", text, "you"); field.value = "";
        nyx("An email, so I can reach you.(gmail)", function () { step = 3; dress(); });
        break;

      case 3:
        if (!okEmail(text)) return fail("That address does not look right. Check it once for me.");
        data.email = text; line("You", text, "you"); field.value = "";
        nyxAll([
          "Alright, " + data.name + ". I\u2019m listening.",
          "Tell me what happened."
        ], function () { step = 4; dress(); showFinish(true); field.focus(); });
        break;

      case 4:
        if (text.length < 2) return fail("A little more than that.");
        said.push(text);
        line("You", text, "you");
        field.value = "";
        field.focus();
        nyx(answerTo(text), askedForMore);
        break;
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (done) return;
    var v = field.value.trim();
    if (!v) { fail(step === 4 ? "Say something first." : "I'm waiting on an answer."); return; }
    advance(v);
  });

  field.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });
})();
