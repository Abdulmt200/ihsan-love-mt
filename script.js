(() => {
  "use strict";
  const C = window.SITE, $ = s => document.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!C) { document.body.classList.remove("lock"); $("#intro").remove(); return; }

  document.title = "For " + C.her + " ❤️";
  $("#introName").textContent = C.her; $("#heroTitle").textContent = C.heroTitle;
  $("#introP").textContent = C.intro; $("#msg").textContent = C.message;
  $("#sig").textContent = C.signature; $("#footer").textContent = C.footer;

  // Intro
  const intro = $("#intro");
  const closeIntro = () => {
    document.body.classList.remove("lock"); intro.classList.add("out");
    setTimeout(() => { intro.remove(); $("#main").focus({ preventScroll: true }); }, reduce ? 0 : 700);
  };
  const openEnv = () => { intro.classList.add("open"); setTimeout(closeIntro, reduce ? 0 : 1200); };
  $("#openBtn").onclick = openEnv; $("#env").onclick = openEnv; $("#skipBtn").onclick = closeIntro;
  $("#openBtn").focus();

  // Letter with optional typewriter
  const lt = $("#letterText"), full = C.letter.join("\n\n"); let timer, started = false;
  const showAll = () => { clearInterval(timer); lt.textContent = full; $("#revealAll").hidden = true; };
  $("#letterBtn").onclick = function () {
    const open = $("#letter").classList.toggle("open");
    this.setAttribute("aria-expanded", open); this.textContent = open ? "Close the letter" : "Open the letter 💌";
    if (open && !started) {
      started = true; if (reduce) return showAll();
      let i = 0; $("#revealAll").hidden = false;
      timer = setInterval(() => { lt.textContent = full.slice(0, ++i); if (i >= full.length) showAll(); }, 28);
    }
  };
  $("#revealAll").onclick = showAll;

  // Tap-to-reveal cards
  const cards = (list, box) => list.forEach(x => {
    const b = el("button", "card"), m = el("span", "cm", x.m); m.hidden = true;
    b.type = "button"; b.setAttribute("aria-expanded", "false"); b.append(el("span", "ct", x.t), m);
    b.onclick = () => { const o = m.hidden; m.hidden = !o; b.setAttribute("aria-expanded", o); b.classList.toggle("on", o); };
    box.append(b);
  });
  cards(C.reasons, $("#reasons")); cards(C.openWhen, $("#openwhen")); cards(C.dreams, $("#dreams")); cards(C.kindness, $("#kind"));

  // Memories
  const real = C.memories && C.memories.length, mems = real ? C.memories : C.sampleMemories;
  if (!real) $("#memEmpty").textContent = C.memoryEmpty;
  mems.forEach(x => {
    const li = el("li"); li.append(el("h3", "", x.title), el("time", "", x.date || ""), el("p", "", x.text));
    if (x.img) { const im = el("img"); im.src = x.img; im.alt = x.title; im.loading = "lazy"; li.append(im); }
    $("#timeline").append(li);
  });

  // Daily + surprise
  let d = Math.floor(Date.now() / 864e5) % C.daily.length;
  const showDaily = () => { $("#dailyText").textContent = C.daily[d]; };
  showDaily(); $("#dailyBtn").onclick = () => { d = (d + 1) % C.daily.length; showDaily(); };
  let s = -1;
  $("#surpriseBtn").onclick = () => {
    s = (s + 1 + Math.floor(Math.random() * (C.surprises.length - 1 || 1))) % C.surprises.length;
    $("#surpriseText").textContent = C.surprises[s];
    if (reduce) return;
    for (let i = 0; i < 12; i++) {
      const b = el("span", "b", "❤"); b.style.setProperty("--x", (Math.random() * 300 - 150) + "px"); b.style.setProperty("--y", -(80 + Math.random() * 220) + "px");
      $("#burst").append(b); setTimeout(() => b.remove(), 1700);
    }
  };

  // Sweet questions (conversation prompts only, not stored)
  let q = 0;
  const showQ = () => { $("#qText").textContent = C.questions[q]; $("#qCount").textContent = (q + 1) + " of " + C.questions.length; };
  const moveQ = n => { q = (q + n + C.questions.length) % C.questions.length; showQ(); };
  showQ(); $("#qNext").onclick = $("#qSkip").onclick = () => moveQ(1); $("#qBack").onclick = () => moveQ(-1);

  // Scroll reveal
  const rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    rv.forEach(n => io.observe(n));
  } else rv.forEach(n => n.classList.add("in"));

  // Light floating hearts, paused when the tab is hidden
  if (!reduce) {
    for (let i = 0; i < 7; i++) {
      const h = el("span", "h", "❤"); h.style.left = (8 + i * 13) + "%"; h.style.fontSize = (12 + (i % 3) * 5) + "px";
      h.style.animationDelay = (i * 2.3) + "s"; h.style.animationDuration = (14 + i) + "s"; $("#hearts").append(h);
    }
    document.addEventListener("visibilitychange", () => document.body.classList.toggle("paused", document.hidden));
  }

  // Questionnaire -> Supabase
  const form = $("#loveForm"), btn = $("#sendBtn"), st = $("#status"); let sending = false, client = null;
  const say = (t, c) => { st.textContent = t; st.className = c || ""; };
  const getClient = () => {
    const u = window.SUPABASE_URL, k = window.SUPABASE_ANON_KEY;
    if (client) return client;
    if (!window.supabase || !u || !k || /PASTE_/.test(u + k)) return null;
    return (client = window.supabase.createClient(u, k));
  };
  form.addEventListener("submit", async e => {
    e.preventDefault(); if (sending) return;
    const v = id => $("#" + id).value.trim();
    const row = { nickname: v("nickname"), favorite_part: v("favorite_part"), message: v("message"), dream_destination: v("dream_destination"),
      favorites: v("favorites"), future_hopes: v("future_hopes"), note: v("note"), marriage_answer: form.querySelector('input[name="marriage"]:checked').value };
    if (!Object.entries(row).some(([k, x]) => k === "marriage_answer" ? x !== "Skipped" : x)) { say("Fill in at least one answer before sending.", "err"); return; }
    const c = getClient();
    if (!c) { say("This form isn't connected yet, so nothing was sent. Abdullahi needs to add the Supabase details in config.js.", "err"); return; }
    sending = true; btn.disabled = true; btn.textContent = "Sending…"; say("");
    try {
      const { error } = await c.from("love_responses").insert(row);
      if (error) throw error;
      form.innerHTML = ""; form.append(el("h3", "serif big", "Thank you, " + (row.nickname || C.her) + ". Your answers were sent. ❤️"));
    } catch (err) {
      console.error(err); sending = false; btn.disabled = false; btn.textContent = "Send my answers ❤️";
      say("Your answers were not sent. Check your internet connection and try again. Nothing you typed was lost.", "err");
    }
  });
})();
