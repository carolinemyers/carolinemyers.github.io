/* ==========================================================================
   Simple site script (no build step)
   - Builds nav tabs from data/site.json
   - Renders publications from data/publications.json
   - Renders demos/teaching/outreach from corresponding JSON files
   ========================================================================== */

async function fetchJSON(path){
  const res = await fetch(path, { cache: "no-cache" });
  if(!res.ok){
    throw new Error(`Failed to load ${path} (HTTP ${res.status})`);
  }
  return await res.json();
}

function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k === "class") node.className = v;
    else if(k === "html") node.innerHTML = v;
    else if(k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for(const c of children){
    if(c === null || c === undefined) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function iconSVG(kind){
  // Minimal inline icons (Google-y, clean).
  const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
  const k = (kind || "").toLowerCase();

  if(k === "email"){
    return `<svg ${common}><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>`;
  }
  if(k === "file" || k === "pdf" || k === "cv"){
    return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`;
  }
  if(k === "github"){
    return `<svg ${common}><path d="M9 19c-4 1.5-4-2.5-5-3"/><path d="M14 22v-3.5c0-1 .1-1.7-.5-2.4 1.8-.2 3.7-.9 3.7-4.1 0-.9-.3-1.7-.9-2.3.1-.2.4-1-.1-2.1 0 0-.7-.2-2.3.9-.7-.2-1.5-.3-2.2-.3s-1.5.1-2.2.3c-1.6-1.1-2.3-.9-2.3-.9-.5 1.1-.2 1.9-.1 2.1-.6.6-.9 1.4-.9 2.3 0 3.2 1.9 3.9 3.7 4.1-.4.5-.6 1.2-.5 1.9V22"/></svg>`;
  }
  if(k === "orcid"){
    return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M10 10v7"/><path d="M10 7h.01"/><path d="M13 10h2.2c2.2 0 3.8 1.6 3.8 3.5S17.4 17 15.2 17H13v-7Z"/></svg>`;
  }
  if(k === "scholar" || k === "googlescholar" || k === "google-scholar"){
    return `<svg ${common}><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M4 10v6c0 2 4 4 8 4s8-2 8-4v-6"/><path d="M8.5 13.5v3"/><path d="M15.5 13.5v3"/></svg>`;
  }
  if(k === "youtube" || k === "video"){
    return `<svg ${common}><path d="M22 12s0-3-1-4-4-1-9-1-8 0-9 1-1 4-1 4 0 3 1 4 4 1 9 1 8 0 9-1 1-4 1-4Z"/><path d="m10 9 6 3-6 3V9Z"/></svg>`;
  }
  if(k === "osf"){
    return `<svg ${common}><path d="M7.5 7.5 12 3l4.5 4.5"/><path d="M7.5 16.5 12 21l4.5-4.5"/><path d="M3 12h18"/></svg>`;
  }
  // Default: link icon
  return `<svg ${common}><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 1 1 7 7l-1 1"/><path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"/></svg>`;
}

function setActiveNav(){
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".nav-list a")];

  const top = window.scrollY + 120;
  let current = sections[0]?.id || "home";
  for(const s of sections){
    if(s.offsetTop <= top) current = s.id;
  }
  for(const a of navLinks){
    a.setAttribute("aria-current", a.getAttribute("href") === `#${current}` ? "page" : "false");
  }
}

function normalize(str){
  return (str || "").toLowerCase().replace(/\s+/g," ").trim();
}

function pubToText(p){
  return normalize(`${p.year} ${p.title} ${p.authors} ${p.venue} ${p.tags?.join(" ") || ""}`);
}

function formatCitation(p){
  // Keep it simple and editable. If you prefer strict APA later, you can change this function.
  const pieces = [];
  if(p.authors) pieces.push(p.authors);
  if(p.year) pieces.push(`(${p.year}).`);
  if(p.title) pieces.push(p.title);
  if(p.venue) pieces.push(p.venue);
  return pieces.join(" ");
}

function renderLink(label, href, kind="link"){
  return el("a", { class: "button", href, target: "_blank", rel: "noreferrer" }, [
    el("span", { html: iconSVG(kind) }),
    label
  ]);
}

function unique(arr){
  return [...new Set(arr)];
}

async function init(){
  // Presentations
  loadPresentations();
  // Footer year
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const navList = document.getElementById("nav-list");
  if(toggle && navList){
    toggle.addEventListener("click", () => {
      const open = navList.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navList.addEventListener("click", (e) => {
      if(e.target.closest("a")) navList.classList.remove("open");
    });
  }

  // Load site config
  const site = await fetchJSON("data/site.json");

  // Build nav
  const tabs = site.tabs || [
    { id: "home", label: "Home" },
    { id: "publications", label: "Publications" },
    { id: "cv", label: "CV" },
    { id: "demos", label: "Demos" },
    { id: "teaching", label: "Teaching" },
    { id: "outreach", label: "Outreach" },
    { id: "contact", label: "Contact" },
  ];
  navList.innerHTML = "";
  for(const t of tabs){
    const a = el("a", { href: `#${t.id}` }, [t.label]);
    navList.appendChild(el("li", {}, [a]));
  }

  // Hero quick links
  const heroLinks = document.getElementById("hero-links");
  if(heroLinks && site.quickLinks){
    heroLinks.innerHTML = ""; heroLinks.classList.add("icon-grid");
    for(const q of site.quickLinks){
      const kindGuess = (q.icon || q.kind || "").toLowerCase();
      const label = q.label || "";
      const kind = kindGuess || (label.toLowerCase().includes("scholar") ? "scholar" : label.toLowerCase().includes("orcid") ? "orcid" : label.toLowerCase().includes("github") ? "github" : label.toLowerCase().includes("osf") ? "osf" : label.toLowerCase().includes("cv") ? "cv" : (q.href?.startsWith("mailto:") ? "email" : (q.href?.includes("youtu") ? "youtube" : "link")));
      const a = el("a", { class: "icon-tile", href: q.href,
        target: q.href.startsWith("#") ? "_self" : "_blank", rel: "noreferrer" }, [
        el("span", { html: iconSVG(kind) }),
        el("div", { class: "label" }, [label])
      ]);
      heroLinks.appendChild(a);
    }
  }

  // Contact info
  const emailLink = document.getElementById("email-link");
  if(emailLink && site.email){
    emailLink.href = `mailto:${site.email}`;
    emailLink.textContent = site.email;
  }
  const address = document.getElementById("address");
  if(address && site.address_html){
    address.innerHTML = site.address_html;
  }
  const elsewhere = document.getElementById("elsewhere-list");
  if(elsewhere && site.elsewhere){
    elsewhere.innerHTML = "";
    for(const item of site.elsewhere){
      elsewhere.appendChild(el("li", {}, [
        el("a", { href: item.href, target: "_blank", rel: "noreferrer" }, [item.label])
      ]));
    }
  }

  // Publications
  const pubsData = await fetchJSON("data/publications.json");
  const pubs = Array.isArray(pubsData) ? pubsData : (pubsData.items || []);
const pubList = document.getElementById("publications-list");
  const search = document.getElementById("pub-search");
  const filters = document.getElementById("publications-filters");

  let all = (pubs.items || []).slice();
  // Newest first by year, then by "order" if provided
  all.sort((a,b) => (b.year||0)-(a.year||0) || (a.order||999)-(b.order||999));

  const tagSet = unique(all.flatMap(p => p.tags || [])).sort((a,b)=>a.localeCompare(b));
  let activeTag = "All";
  let q = "";

  function renderFilters(){
    if(!filters) return;
    filters.innerHTML = "";
    const tags = ["All", ...tagSet];
    for(const tag of tags){
      const btn = el("button", { class:"chip", type:"button", "aria-pressed": (tag===activeTag) ? "true" : "false" }, [tag]);
      btn.addEventListener("click", () => {
        activeTag = tag;
        renderFilters();
        renderPubs();
      });
      filters.appendChild(btn);
    }
  }

  function renderPubs(){
    if(!pubList) return;
    const filtered = all.filter(p => {
      const okTag = (activeTag === "All") || (p.tags || []).includes(activeTag);
      const okQ = !q || pubToText(p).includes(q);
      return okTag && okQ;
    });

    pubList.innerHTML = "";
    if(filtered.length === 0){
      pubList.appendChild(el("li", { class:"pub" }, [
        el("div", { class:"title" }, ["No matches."]),
        el("div", { class:"citation" }, ["Try a different search term or filter."])
      ]));
      return;
    }

    for(const p of filtered){
      const links = el("div", { class:"links" });

      if(p.pdf){
        links.appendChild(renderLink("PDF", p.pdf, "file"));
      }
      if(p.commentary){
        links.appendChild(renderLink("Commentary", p.commentary, "link"));
      }
      if(p.doi){
        links.appendChild(renderLink("DOI", p.doi, "link"));
      }
      if(p.osf){
        links.appendChild(renderLink("OSF", p.osf, "link"));
      }

      const li = el("li", { class:"pub", id: p.id || "" }, [
        el("div", { class:"meta" }, [
          el("span", { class:"chip", style:"pointer-events:none;" }, [String(p.year || "")]),
          ...(p.tags || []).slice(0,3).map(t => el("span", { class:"chip", style:"pointer-events:none;" }, [t]))
        ]),
        el("div", { class:"title" }, [p.title || "Untitled"]),
        el("div", { class:"citation" }, [formatCitation(p)]),
        links
      ]);
      pubList.appendChild(li);
    }
  }

  renderFilters();
  renderPubs();

  if(search){
    search.addEventListener("input", (e) => {
      q = normalize(e.target.value);
      renderPubs();
    });
  }

  // Demos
  const demos = await fetchJSON("data/demos.json");
  const demoGrid = document.getElementById("demos-grid");
  if(demoGrid){
    demoGrid.innerHTML = "";
    for(const d of (demos.items || [])){
      const tile = el("div", { class:"tile" }, [
        el("h3", {}, [d.title || "Demo"]),
        el("p", {}, [d.description || ""]),
        el("div", { class:"links" }, (d.links || []).map(l => renderLink(l.label, l.href, "link")))
      ]);
      demoGrid.appendChild(tile);
    }
  }

  // Teaching
  const teaching = await fetchJSON("data/teaching.json");
  const teachingList = document.getElementById("teaching-list");
  if(teachingList){
    teachingList.innerHTML = "";
    for(const t of (teaching.items || [])){
      const item = el("div", { class:"item" }, [
        el("div", { class:"kicker" }, [t.when || ""]),
        el("div", { class:"item-title" }, [t.title || ""]),
        el("div", { class:"muted" }, [t.description || ""]),
        el("div", { class:"item-links" }, (t.links || []).map(l => renderLink(l.label, l.href, l.kind || "link")))
      ]);
      teachingList.appendChild(item);
    }
  }

  // Outreach
  const outreach = await fetchJSON("data/outreach.json");
  const outreachList = document.getElementById("outreach-list");
  if(outreachList){
    outreachList.innerHTML = "";
    for(const o of (outreach.items || [])){
      const item = el("div", { class:"item" }, [
        el("div", { class:"kicker" }, [o.when || ""]),
        el("div", { class:"item-title" }, [o.title || ""]),
        el("div", { class:"muted" }, [o.description || ""]),
        el("div", { class:"item-links" }, (o.links || []).map(l => renderLink(l.label, l.href, l.kind || "link")))
      ]);
      outreachList.appendChild(item);
    }
  }

  // Active nav highlighting
  setActiveNav();
  window.addEventListener("scroll", () => setActiveNav(), { passive: true });

  // If loading with a hash, make sure nav highlight is correct after layout
  window.setTimeout(setActiveNav, 250);
}

init().catch(err => {
  console.error(err);
  const main = document.getElementById("main");
  if(main){
    const msg = document.createElement("div");
    msg.className = "container";
    msg.style.padding = "1rem 0";
    msg.innerHTML = `<div class="card"><strong>Site data failed to load.</strong><br/>
      <span class="muted">${err.message}</span><br/><br/>
      This usually means you're opening the HTML file directly from your computer (file://).<br/>
      GitHub Pages will work fine. For local preview, run a tiny server (see README).</div>`;
    main.prepend(msg);
  }
});



/* ===== Presentations support (v3) ===== */
function safeText(v){ return (v ?? "").toString(); }

function renderPresentations(items){
  const root = document.getElementById("presentations-list");
  if(!root) return;
  root.innerHTML = "";
  if(!Array.isArray(items) || items.length === 0){
    root.innerHTML = '<div class="card"><div class="pad">No presentations yet — add entries in <code>data/presentations.json</code>.</div></div>';
    return;
  }

  const html = items
    .sort((a,b)=> (b.year||0) - (a.year||0))
    .map(p=>{
      const title = escapeHtml(safeText(p.title));
      const authors = escapeHtml(safeText(p.authors));
      const venue = escapeHtml(safeText(p.venue));
      const year = escapeHtml(safeText(p.year));
      const type = escapeHtml(safeText(p.type));
      const desc = escapeHtml(safeText(p.description));

      const tagPills = (p.tags||[]).map(t=>`<span class="pill">${escapeHtml(t)}</span>`).join("");

      let embed = "";
      let buttons = "";

      if(p.pdf && safeText(p.pdf).trim()){
        const pdf = safeText(p.pdf).trim();
        embed = `
          <div class="embed-frame">
            <div class="ratio-16x9">
              <iframe src="${pdf}#view=FitH" title="${title} PDF preview" loading="lazy"></iframe>
            </div>
          </div>`;
        buttons = `<a class="button" href="${pdf}" target="_blank" rel="noopener">Open PDF</a>`;
      } else if(p.youtubeId && safeText(p.youtubeId).trim()){
        const yid = safeText(p.youtubeId).trim();
        const yt = `https://www.youtube-nocookie.com/embed/${yid}`;
        embed = `
          <div class="embed-frame">
            <div class="ratio-16x9">
              <iframe src="${yt}" title="${title} video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
          </div>`;
        buttons = `<a class="button" href="https://youtu.be/${yid}" target="_blank" rel="noopener">Open on YouTube</a>`;
      }

      return `
        <div class="card presentation-card">
          <div class="pad">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
              <div>
                <div class="section-title" style="margin:0 0 4px 0;">${title}</div>
                <div class="muted small">${authors}</div>
              </div>
              <div class="meta">
                ${type ? `<span class="pill">${type}</span>` : ""}
                ${venue ? `<span class="pill">${venue}</span>` : ""}
                ${year ? `<span class="pill">${year}</span>` : ""}
              </div>
            </div>

            ${desc ? `<p style="margin:10px 0 12px;">${desc}</p>` : ""}

            ${tagPills ? `<div class="pill-row" style="margin: 0 0 12px;">${tagPills}</div>` : ""}

            ${embed}

            ${buttons ? `<div class="pub-links" style="margin-top:12px;">${buttons}</div>` : ""}
          </div>
        </div>
      `;
    }).join("");

  root.innerHTML = html;
}

async function loadPresentations(){
  try{
    const resp = await fetch("data/presentations.json");
    if(!resp.ok) throw new Error("Failed to load presentations.json");
    const items = await resp.json();
    renderPresentations(items);
  }catch(e){
    const root = document.getElementById("presentations-list");
    if(root){
      root.innerHTML = '<div class="card"><div class="pad">Could not load <code>data/presentations.json</code>. Check the file exists and is valid JSON.</div></div>';
    }
  }
}
