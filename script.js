const MENU = {
  chleby: [
    { id: "zytni", name: "Żytni razowy", price: 14, desc: "100% żyta, 48 h fermentacji. Wytrzyma tydzień w lnianej torbie.", tag: "Bestseller" },
    { id: "pszenny", name: "Pszenno-żytni", price: 12, desc: "Chrupiąca skórka, wilgotny środek. Na kanapki i do zupy." },
    { id: "orkisz", name: "Orkiszowy z ziarnami", price: 16, desc: "Słonecznik, siemię lniane, pestki dyni." },
    { id: "bagietka", name: "Bagietka na zakwasie", price: 6.5, desc: "Pieczona dwa razy dziennie: o 5:30 i o 14:00." }
  ],
  slodkie: [
    { id: "drozdzowka", name: "Drożdżówka z kruszonką", price: 5, desc: "Z twarogiem albo z jagodami, w zależności od dnia." },
    { id: "cynamonka", name: "Cynamonka kardamonowa", price: 7, desc: "Skandynawski przepis, mniej cukru niż zwykle.", tag: "Nowość" },
    { id: "brownie", name: "Brownie na zakwasie", price: 8, desc: "Gorzka czekolada 70%, szczypta soli." }
  ],
  kawa: [
    { id: "espresso", name: "Espresso", price: 8, desc: "Ziarno z palarni w Katowicach, zmieniane co miesiąc." },
    { id: "flat", name: "Flat white", price: 13, desc: "Mleko krowie lub owsiane bez dopłaty." },
    { id: "kakao", name: "Kakao na mleku", price: 11, desc: "Dla tych, którzy kawy nie piją." }
  ]
};

// Mon=1 ... Sun=0 ; [open, close] in minutes, null = closed
const HOURS = { 1: [330, 1080], 2: [330, 1080], 3: [330, 1080], 4: [330, 1080], 5: [330, 1140], 6: [420, 840], 0: null };
const DAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

const zl = n => n.toFixed(2).replace(".", ",") + " zł";
const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

/* ---------- open / closed status ---------- */
function renderStatus() {
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const h = HOURS[day];
  const el = document.getElementById("status");
  let text, color;
  if (h && mins >= h[0] && mins < h[1]) {
    text = `Otwarte do ${hm(h[1])}`; color = "#6BD49A";
  } else {
    let d = day, guard = 0, next;
    if (h && mins < h[0]) next = `dziś o ${hm(h[0])}`;
    while (!next && guard++ < 7) {
      d = (d + 1) % 7;
      if (HOURS[d]) next = `${guard === 1 ? "jutro" : DAYS[d].toLowerCase()} o ${hm(HOURS[d][0])}`;
    }
    text = `Zamknięte, otwieramy ${next}`; color = "#F28B6E";
  }
  el.textContent = text;
  el.style.setProperty("--dot", color);
}

function renderHours() {
  const today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  document.getElementById("hours-body").innerHTML = order.map(d => {
    const h = HOURS[d];
    return `<tr class="${d === today ? "today" : ""}"><td>${DAYS[d]}</td><td>${h ? `${hm(h[0])} – ${hm(h[1])}` : "nieczynne"}</td></tr>`;
  }).join("");
}

/* ---------- menu tabs ---------- */
function renderMenu(cat) {
  document.getElementById("menu-list").innerHTML = MENU[cat].map(i => `
    <li><h3>${i.name}${i.tag ? `<span class="tag">${i.tag}</span>` : ""}</h3>
    <span class="price">${zl(i.price)}</span><p>${i.desc}</p></li>`).join("");
}
document.querySelectorAll(".tabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", b === btn));
    renderMenu(btn.dataset.cat);
  });
});

/* ---------- pre-order ---------- */
const orderable = [...MENU.chleby, ...MENU.slodkie];
const qty = Object.fromEntries(orderable.map(i => [i.id, 0]));

function renderOrderItems() {
  document.getElementById("order-items").innerHTML = orderable.map(i => `
    <div class="item"><span>${i.name}<small>${zl(i.price)} / szt.</small></span>
      <div class="qty">
        <button type="button" data-id="${i.id}" data-d="-1" aria-label="Mniej: ${i.name}">−</button>
        <output id="q-${i.id}" aria-live="polite">${qty[i.id]}</output>
        <button type="button" data-id="${i.id}" data-d="1" aria-label="Więcej: ${i.name}">+</button>
      </div></div>`).join("");
}
function total() { return orderable.reduce((s, i) => s + i.price * qty[i.id], 0); }
document.getElementById("order-items").addEventListener("click", e => {
  const b = e.target.closest("button[data-id]");
  if (!b) return;
  const id = b.dataset.id;
  qty[id] = Math.max(0, Math.min(20, qty[id] + Number(b.dataset.d)));
  document.getElementById("q-" + id).textContent = qty[id];
  document.getElementById("total").textContent = zl(total());
});

const form = document.getElementById("order-form");
form.addEventListener("submit", e => {
  e.preventDefault();
  const err = document.getElementById("form-error");
  [...form.elements].forEach(el => el.removeAttribute?.("aria-invalid"));
  if (total() === 0) { err.textContent = "Dodaj przynajmniej jeden produkt."; return; }
  const bad = [...form.querySelectorAll("[required]")].filter(el => !el.checkValidity());
  if (bad.length) {
    bad.forEach(el => el.setAttribute("aria-invalid", "true"));
    err.textContent = "Uzupełnij imię, poprawny numer telefonu i godzinę odbioru.";
    bad[0].focus();
    return;
  }
  err.textContent = "";
  const data = new FormData(form);
  const list = orderable.filter(i => qty[i.id]).map(i => `${i.name} × ${qty[i.id]}`).join(", ");
  document.getElementById("confirm-text").textContent =
    `${data.get("name")}, czekamy na Ciebie jutro w godz. ${data.get("time")}. ${list}. Do zapłaty: ${zl(total())}. SMS z potwierdzeniem wyślemy na ${data.get("phone")}.`;
  form.hidden = true;
  const c = document.getElementById("confirm");
  c.hidden = false; c.focus();
});
document.getElementById("new-order").addEventListener("click", () => {
  Object.keys(qty).forEach(k => (qty[k] = 0));
  form.reset(); renderOrderItems();
  document.getElementById("total").textContent = zl(0);
  document.getElementById("confirm").hidden = true; form.hidden = false;
});

renderStatus(); setInterval(renderStatus, 60000);
renderHours(); renderMenu("chleby"); renderOrderItems();
