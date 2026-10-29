(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const u = window.SUPABASE_URL, k = window.SUPABASE_ANON_KEY;
  const ok = window.supabase && u && k && !/PASTE_/.test(u + k);
  const client = ok ? window.supabase.createClient(u, k) : null;
  const LABELS = [["nickname", "Preferred name"], ["favorite_part", "Favorite part"], ["message", "Message"], ["dream_destination", "Dream destination"],
    ["favorites", "Favorite colors or flowers"], ["future_hopes", "Hopes for the future"], ["marriage_answer", "Marriage question"], ["note", "Other notes"]];
  let rows = [], current = null;
  ["Skipped", "Yes, in shaa Allah", "I would like more time to think", "I am not ready to answer this", "No"].forEach(v => { const o = el("option", "", v); o.value = v; $("#f").append(o); });
  const show = on => { $("#loginPanel").hidden = on; $("#dash").hidden = !on; };

  async function enter() {
    const { data, error } = await client.rpc("is_admin");
    if (error || data !== true) {
      await client.auth.signOut(); show(false);
      $("#loginMsg").textContent = "This account is not authorized as administrator."; return;
    }
    show(true); load();
  }
  async function load() {
    $("#count").textContent = "Loading…";
    const { data, error } = await client.from("love_responses").select("*").order("created_at", { ascending: false });
    if (error) { $("#count").textContent = "Could not load answers: " + error.message; return; }
    rows = data; render();
  }
  function render() {
    const t = $("#q").value.toLowerCase(), f = $("#f").value, list = $("#list"); list.innerHTML = "";
    const r = rows.filter(x => (!f || x.marriage_answer === f) && (!t || JSON.stringify(x).toLowerCase().includes(t)));
    $("#count").textContent = rows.length ? r.length + " of " + rows.length + " answers" : "No answers have arrived yet.";
    r.forEach(x => {
      const b = el("button", "item"); b.type = "button";
      const n = el("b", "", x.nickname || "Anonymous"); b.append(n, el("small", "", new Date(x.created_at).toLocaleString()), el("span", "", (x.message || x.note || x.future_hopes || x.marriage_answer).slice(0, 90)));
      b.onclick = () => open(x); list.append(b);
    });
  }
  function open(x) {
    current = x; const body = $("#dBody"); body.innerHTML = ""; $("#dMsg").textContent = "";
    body.append(el("p", "hint", "Received " + new Date(x.created_at).toLocaleString()));
    LABELS.forEach(([key, label]) => { body.append(el("h3", "", label), el("p", "", x[key] || "(empty)")); });
    $("#dlg").showModal();
  }
  $("#close").onclick = () => $("#dlg").close();
  $("#del").onclick = async () => {
    if (!current || !confirm("Delete this response permanently? This cannot be undone.")) return;
    const { data, error } = await client.from("love_responses").delete().eq("id", current.id).select();
    if (error || !data || !data.length) { $("#dMsg").textContent = "Delete failed. Nothing was removed."; return; }
    $("#dlg").close(); rows = rows.filter(r => r.id !== current.id); render();
  };
  $("#q").oninput = render; $("#f").onchange = render; $("#refresh").onclick = load;
  $("#out").onclick = async () => { await client.auth.signOut(); rows = []; $("#list").innerHTML = ""; show(false); };
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!client) { $("#loginMsg").textContent = "Add your Supabase URL and anon key in config.js first."; return; }
    $("#loginMsg").textContent = "Signing in…";
    const { error } = await client.auth.signInWithPassword({ email: $("#email").value.trim(), password: $("#password").value });
    if (error) { $("#loginMsg").textContent = "Sign-in failed. Check your email and password."; return; }
    $("#password").value = ""; $("#loginMsg").textContent = ""; enter();
  });
  if (client) client.auth.getSession().then(({ data }) => { if (data.session) enter(); });
})();
