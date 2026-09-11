/* Padel With Giviko - shared site script
   - language routing: "/" = English, "/ka..." = Georgian (same HTML file served at both paths)
   - instant language toggle with History API (no reload), keeps canonical / title / hreflang correct
   - single-lesson price cards + multi-day package builder (no-op on pages without those elements)
*/
(function () {
  "use strict";

  var WA_NUMBER = "995599046801";
  var ORIGIN = "https://padelcoach.ge";
  var PRICES = { 1: 70, 2: 90, 3: 120, 4: 160 };
  // Paste TBC "გადახდის ბმული" (payment link) URLs here, one per fixed price. Empty = hide the card button.
  var TBC_LINKS = { 1: "", 2: "", 3: "", 4: "" };

  var state = { lang: "en", people: 1, days: 5, hoursPerDay: 1 };

  /* ---------------- routing helpers ---------------- */
  function route() {
    var p = location.pathname.replace(/\/+$/, "");
    if (p === "") p = "/";
    var isKa = p === "/ka" || p.indexOf("/ka/") === 0;
    var base = isKa ? (p.replace(/^\/ka/, "") || "/") : p; // canonical English path
    return { isKa: isKa, base: base };
  }
  function urlFor(lang, base) {
    if (lang === "ge") return ORIGIN + "/ka" + (base === "/" ? "" : base);
    return ORIGIN + base;
  }
  function pathFor(lang, base) {
    if (lang === "ge") return "/ka" + (base === "/" ? "" : base);
    return base;
  }

  /* ---------------- meta / head ---------------- */
  function metaContent(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute("content") : null;
  }
  function setMeta() {
    var r = route();
    var ge = state.lang === "ge";
    var canonical = urlFor(state.lang, r.base);

    var link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    var og = document.querySelector('meta[property="og:url"]');
    if (og) og.setAttribute("content", canonical);
    var ogl = document.querySelector('meta[property="og:locale"]');
    if (ogl) ogl.setAttribute("content", ge ? "ka_GE" : "en_US");

    var t = ge ? metaContent("page:title-ka") : metaContent("page:title-en");
    if (t) document.title = t;
    var d = ge ? metaContent("page:desc-ka") : metaContent("page:desc-en");
    var dEl = document.querySelector('meta[name="description"]');
    if (d && dEl) dEl.setAttribute("content", d);

    document.documentElement.setAttribute("lang", ge ? "ka" : "en");
  }

  /* ---------------- internal links ---------------- */
  function localizeLinks() {
    var ge = state.lang === "ge";
    var r = route();
    var links = document.querySelectorAll("a[data-i18n-link]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var enPath = a.getAttribute("data-i18n-link"); // stored as English path, e.g. "/pricing" or "/"
      a.setAttribute("href", pathFor(state.lang, enPath));
      var isActive = enPath !== "/" && enPath === r.base;
      a.classList.toggle("active", isActive);
    }
  }

  /* ---------------- generic WhatsApp links ---------------- */
  function waUrl(text) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
  }
  function updateWaLinks() {
    var ge = state.lang === "ge";
    var msg = ge
      ? "გამარჯობა გივიკო! მინდა დავჯავშნო პადელის გაკვეთილი.\n\nთარიღი: \nმოთამაშეების რაოდენობა: \nსასურველი დრო: "
      : "Hi Giviko! I'd like to book a padel lesson.\n\nDate: \nNumber of players: \nPreferred time: ";
    var url = waUrl(msg);
    ["nav-wa", "hero-wa", "cta-wa", "footer-wa", "float-wa", "svc-wa", "about-wa"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", url);
    });
  }

  /* ---------------- services page CTAs ---------------- */
  function updateServiceWaLinks() {
    var ge = state.lang === "ge";
    var msgs = {
      "svc-private-wa": ge
        ? "გამარჯობა გივიკო! მინდა დავჯავშნო კერძო პადელის გაკვეთილი.\n\nთარიღი: \nსასურველი დრო: "
        : "Hi Giviko! I'd like to book a private padel lesson.\n\nDate: \nPreferred time: ",
      "svc-group-wa": ge
        ? "გამარჯობა გივიკო! მინდა დავჯავშნო ჯგუფური პადელის გაკვეთილი.\n\nმოთამაშეების რაოდენობა: \nთარიღი: \nსასურველი დრო: "
        : "Hi Giviko! I'd like to book a group padel lesson.\n\nNumber of players: \nDate: \nPreferred time: ",
      "svc-gift-wa": ge
        ? "გამარჯობა გივიკო! მინდა ვიყიდო პადელის სასაჩუქრე ბარათი.\n\nთანხა / პაკეტი: \nმიმღების სახელი (სურვილისამებრ): "
        : "Hi Giviko! I'd like to buy a padel lessons gift card.\n\nAmount / package: \nRecipient name (optional): ",
      "svc-video-wa": ge
        ? "გამარჯობა გივიკო! მინდა გამოვაგზავნო ვიდეო ტექნიკის ანალიზისთვის ($45).\n\nვიდეოს ბმულს აქვე გამოგიგზავნი: "
        : "Hi Giviko! I'd like to submit a video for technique analysis ($45).\n\nI'll send the video link here: "
    };
    Object.keys(msgs).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", waUrl(msgs[id]));
    });
  }

  /* ---------------- single-lesson price cards ---------------- */
  var priceGrid = document.getElementById("price-grid");
  function renderPriceCards() {
    if (!priceGrid) return;
    var ge = state.lang === "ge";
    priceGrid.innerHTML = "";
    [1, 2, 3, 4].forEach(function (n) {
      var card = document.createElement("div");
      card.className = "price-card" + (n === 2 ? " featured" : "");
      var peopleLabel = ge ? (n === 1 ? "1 ადამიანი" : n + " ადამიანი") : (n === 1 ? "1 player" : n + " players");
      var perPerson = Math.round(PRICES[n] / n);
      var msg = ge
        ? "გამარჯობა გივიკო! მინდა დავჯავშნო პადელის გაკვეთილი.\n\nმოთამაშეების რაოდენობა: " + n + "\nფასი: $" + PRICES[n] + " (კორტი და ინვენტარი ჩათვლილია)\nთარიღი: \nსასურველი დრო: "
        : "Hi Giviko! I'd like to book a padel lesson.\n\nNumber of players: " + n + "\nPrice: $" + PRICES[n] + " total (court & equipment included)\nDate: \nPreferred time: ";
      var payLink = TBC_LINKS[n];
      card.innerHTML =
        (n === 2 ? '<div class="badge">⭐ <span class="ge">პოპულარული</span><span class="en">Most Popular</span></div>' : "") +
        '<div class="people">' + peopleLabel + "</div>" +
        '<div class="amount">$' + PRICES[n] + "</div>" +
        '<div class="per">' + (ge ? "1 საათიანი გაკვეთილი - სულ" : "per 1-hour lesson - total") +
        (n > 1 ? " ($" + perPerson + " " + (ge ? "ერთ ადამიანზე" : "per person") + ")" : "") + "</div>" +
        '<div class="actions">' +
        '<a class="book" target="_blank" rel="noopener" href="' + waUrl(msg) + '">' + (ge ? "დაჯავშნე" : "Book now") + "</a>" +
        (payLink ? '<a class="pay" target="_blank" rel="noopener" href="' + payLink + '">' + (ge ? "ბარათით გადახდა (TBC)" : "Pay by card (TBC)") + "</a>" : "") +
        "</div>";
      priceGrid.appendChild(card);
    });
  }

  /* ---------------- multi-day package builder ---------------- */
  var peoplePillsEl = document.getElementById("people-pills");
  var daysMinus = document.getElementById("days-minus");
  var daysPlus = document.getElementById("days-plus");
  var hasBuilder = !!(peoplePillsEl && daysMinus && daysPlus);

  function renderPeoplePills() {
    if (!peoplePillsEl) return;
    peoplePillsEl.innerHTML = "";
    [1, 2, 3, 4].forEach(function (n) {
      var b = document.createElement("button");
      b.className = "pill" + (n === state.people ? " active" : "");
      b.textContent = n + (state.lang === "ge" ? " ადამ." : (n === 1 ? " player" : " players"));
      b.addEventListener("click", function () {
        state.people = n;
        renderPeoplePills();
        updateSummary();
      });
      peoplePillsEl.appendChild(b);
    });
  }

  if (daysMinus) {
    daysMinus.addEventListener("click", function () {
      state.days = Math.max(2, state.days - 1);
      document.getElementById("days-val").firstChild.textContent = state.days;
      updateSummary();
    });
  }
  if (daysPlus) {
    daysPlus.addEventListener("click", function () {
      state.days = Math.min(21, state.days + 1);
      document.getElementById("days-val").firstChild.textContent = state.days;
      updateSummary();
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("#hours-pills .pill"), function (p) {
    p.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll("#hours-pills .pill"), function (x) {
        x.classList.remove("active");
      });
      p.classList.add("active");
      state.hoursPerDay = parseInt(p.dataset.hours, 10);
      updateSummary();
    });
  });

  function getDiscountRate(days) {
    return days <= 3 ? 0.1 : 0.15;
  }
  function updateSummary() {
    if (!hasBuilder) return;
    var ge = state.lang === "ge";
    var rate = PRICES[state.people];
    var totalHours = state.days * state.hoursPerDay;
    var base = rate * totalHours;
    var discounted = Math.round(base * (1 - getDiscountRate(state.days)));
    var savings = base - discounted;

    document.getElementById("sum-people").innerHTML =
      state.people + " " + (ge ? "ადამიანი" : state.people === 1 ? "player" : "players");
    document.getElementById("sum-hours").textContent = totalHours + "h";
    document.getElementById("price-strike").textContent = "$" + base;
    document.getElementById("price-final").textContent = "$" + discounted;
    document.getElementById("save-amount").innerHTML =
      (ge ? '<span class="ge">დაზოგე</span>' : '<span class="en">You save</span>') + " $" + savings;

    var msg = ge
      ? "გამარჯობა გივიკო! მინდა დავჯავშნო პაკეტი.\n\nმოთამაშეების რაოდენობა: " + state.people + "\nდღეების რაოდენობა: " + state.days + "\nსაათი დღეში: " + state.hoursPerDay + "\nჯამური ფასი: $" + discounted + " (კორტი და ინვენტარი ჩათვლილია)\nსასურველი დაწყების თარიღი: "
      : "Hi Giviko! I'd like to book a package.\n\nNumber of players: " + state.people + "\nNumber of days: " + state.days + "\nHours per day: " + state.hoursPerDay + "\nTotal price: $" + discounted + " (court & equipment included)\nPreferred start date: ";
    document.getElementById("builder-wa").setAttribute("href", waUrl(msg));
  }

  /* ---------------- language switch ---------------- */
  function applyLang(l, push) {
    state.lang = l;
    document.body.classList.toggle("lang-en", l === "en");
    Array.prototype.forEach.call(document.querySelectorAll(".lang-toggle button"), function (b) {
      b.classList.toggle("active", b.dataset.lang === l);
    });
    if (push) {
      var r = route();
      history.pushState({ lang: l }, "", pathFor(l, r.base) || "/");
    }
    setMeta();
    localizeLinks();
    updateWaLinks();
    updateServiceWaLinks();
    renderPriceCards();
    renderPeoplePills();
    updateSummary();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".lang-toggle button"), function (b) {
    b.addEventListener("click", function () {
      applyLang(b.dataset.lang, true);
    });
  });
  window.addEventListener("popstate", function () {
    applyLang(route().isKa ? "ge" : "en", false);
  });

  /* ---------------- scroll reveal ---------------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
      io.observe(el);
    });
  }

  /* ---------------- init ---------------- */
  applyLang(route().isKa ? "ge" : "en", false);
})();
