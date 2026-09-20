
document.addEventListener("DOMContentLoaded", () => {
  wireCarousel(document);
});

document.querySelectorAll('[data-src]').forEach(async (slot) => {
  const res = await fetch(slot.dataset.src);
  slot.innerHTML = await res.text();
});

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-item");
  const panels = document.querySelectorAll(".subject-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("current"));
      tab.classList.add("current");
      const selectedSubject = tab.getAttribute("data-subject");
      panels.forEach((panel) => panel.classList.remove("active"));
      const activePanel = document.querySelector(`.subject-panel[data-subject="${selectedSubject}"]`);

      if (activePanel) {
        activePanel.classList.add("active");
      }
    });
  });
});

document.querySelectorAll('.tl-segment').forEach(segment => {
  segment.style.cursor = 'pointer';
  segment.addEventListener('click', () => {
    const targetId = segment.dataset.target;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

document.querySelectorAll('[data-accent]').forEach(el =>
  el.style.setProperty('--accent-color', `var(--${el.dataset.accent})`)
);

/* ============================================================
   TREE OF LIFE — shared engine for two page types
   initFlowTree(TREE_DATA)  — vertical rows, optional groups
                               (dashed bracket) + merger events
                               → "Species of Geological Eras"
   initStageTree(TREE_DATA) — horizontal left-to-right stages
                               → "Species" (LUCA tree)
   ============================================================ */

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function buildMedia(images) {
  if (!images || !images.length) return '';
  if (images.length === 1) {
    const img = images[0];
    return `<figure class="single-img-slot">
      <div class="img-slot">
        ${img.src ? `<img src="${img.src}" alt="${(img.caption||'').replace(/"/g,'&quot;')}"${img.focus ? ` style="object-position:${img.focus}"` : ''}>` : 'image'}
      </div>
      ${img.caption ? `<figcaption class="carousel-caption">${img.caption}</figcaption>` : ''}
    </figure>`;
  }
  return buildCarousel(images);
}

function buildCarousel(images) {
  const slides = images.map((img, i) => `
    <figure class="carousel-slide" data-caption="${(img.caption||'').replace(/"/g,'&quot;')}">
      <div class="img-slot"><img src="${img.src}" alt="${(img.caption||'').replace(/"/g,'&quot;')}"${img.focus ? ` style="object-position:${img.focus}"` : ''}></div>
    </figure>`).join('');
  return `<div class="carousel"><div class="carousel-viewport"><div class="carousel-track">${slides}</div>
    <button class="carousel-arrow carousel-prev" aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
    <button class="carousel-arrow carousel-next" aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
    </div><div class="carousel-foot"><div class="carousel-caption"></div><div class="carousel-dots"></div></div></div>`;
}

function wireCarousel(root) {
  root.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const captionEl = carousel.querySelector('.carousel-caption');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    if (!track || !slides.length) return;
    let index = 0;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);
    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
      captionEl.textContent = slides[index].dataset.caption || '';
    }
    carousel.querySelector('.carousel-prev').addEventListener('click', () => goTo(index - 1));
    carousel.querySelector('.carousel-next').addEventListener('click', () => goTo(index + 1));
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 40) goTo(index - 1); else if (dx < -40) goTo(index + 1);
    });
    goTo(0);
  });
}

const PERIODS = [
  ['Cambrian','Cm'], ['Ordovician','O'], ['Silurian','S'], ['Devonian','D'],
  ['Carboniferous','C'], ['Permian','P'], ['Triassic','T'], ['Jurassic','J'],
  ['Cretaceous','K'], ['Paleogene','Pg'], ['Neogene','N'], ['Quaternary','Q']
];
function resolveColor(c) {
  const el = document.createElement('span');
  el.style.color = c;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;   // always "rgb(r, g, b)"
  el.remove();
  return rgb;
}

function inkOn(color) {
  const m = resolveColor(color).match(/\d+(\.\d+)?/g);
  if (!m) return '#1C2233';
  const c = m.slice(0, 3).map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.067) ? '#fff' : '#1C2233';
}

function periodStrip(node, color) {
  if (!node.lived || !node.lived.length) return '';
  const names = PERIODS.map(p => p[0]);
  const i0 = names.indexOf(node.lived[0]);
  const end = node.lived[1] || (node.extinct ? node.lived[0] : 'Quaternary');
  const i1 = names.indexOf(end);
  if (i0 < 0 || i1 < 0) return '';
  const c = color || node.color;
  const boxes = PERIODS.map((p, i) =>
    `<div class="pp${i >= i0 && i <= i1 ? ' on' : ''}" title="${p[0]}">${p[1]}</div>`
  ).join('');
  return `<div class="pstrip"${c ? ` style="--tl-on:${c}"` : ''} role="img" aria-label="Lived from ${names[i0]} to ${names[i1]}">${boxes}</div>`;
}

function cardHtml(item, badge, opts = {}) {
  const hasImages = item.images && item.images.length;
  const imageMarkup = hasImages
    ? (opts.imagePosition === 'right'
        ? `<div class="img-box right">${buildMedia(item.images)}</div>`
        : buildMedia(item.images))
    : '';
  return `
    <div class="expand-pad">
      <section class="card" style="--accent-color:var(--${item.color})">
        <div class="card-head">
          <h2 class="card-title">${item.name}${item.native ? `<span class="card-native">${item.native}</span>` : ''}</h2>
          ${badge ? `<span class="card-tag">${badge}</span>` : ''}
          ${item.etymology ? `<p class="card-etym">${item.etymology}</p>` : ''}
        </div>
        ${item.taxonPath ? `<p class="card-taxon">${item.taxonPath}</p>` : ''}
        <div class="card-body">
          ${opts.imagePosition === 'right' ? imageMarkup : ''}
          <div class="card-text">
            ${item.html}
            ${item.today ? `<div class="today-box"><strong>Today:</strong> ${item.today}</div>` : ''}
          </div>
          ${opts.imagePosition !== 'right' ? imageMarkup : ''}
        </div>
        ${item.lived ? periodStrip(item, item.color) : ''}
      </section>
    </div>`;
}

/* ---- FLOW TREE (vertical, rows + optional groups/events) ----
   Page needs:
     <div class="tree-flow" id="treeFlow"><svg class="tree-links" id="treeLinks"></svg></div>
     <aside class="detail-side" id="detailSide"><p class="detail-placeholder">Tap a card for information.</p></aside>
*/
function initFlowTree(TREE_DATA) {
  const flow = document.getElementById('treeFlow');
  const linksSvg = document.getElementById('treeLinks');
  const detailSide = document.getElementById('detailSide');
  const nodesById = Object.fromEntries(TREE_DATA.nodes.map(n => [n.id, n]));
  const groupsById = Object.fromEntries((TREE_DATA.groups || []).map(g => [g.id, g]));
  const eventsById = Object.fromEntries((TREE_DATA.events || []).map(e => [e.id, e]));
  const simpleLinks = [];
  let activeId = null;

  function toggleExpand(id, btn, item, badge) {
    const wasOpenForThis = activeId === id;
    document.querySelectorAll('.node-btn.is-active, .group-chip.is-active, .event-chip-btn.is-active').forEach(b => b.classList.remove('is-active'));
    if (wasOpenForThis) {
      detailSide.innerHTML = '<p class="detail-placeholder">Tap a name to see its card here.</p>';
      activeId = null;
    } else {
      detailSide.innerHTML = cardHtml(item, badge);
      wireCarousel(detailSide);
      btn.classList.add('is-active');
      activeId = id;
      if (window.innerWidth <= 760) {
        setTimeout(() => detailSide.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    }
  }

  function buildNodeCol(item) {
    const n = nodesById[item.id];
    const col = document.createElement('div');
    col.className = 'tree-col';
    col.dataset.nodeId = n.id;
    const btn = document.createElement('button');
    btn.className = `node-btn kind-${n.kind}`;
    btn.style.setProperty('--accent-color', `var(--${n.color})`);
    btn.dataset.id = n.id;
    btn.textContent = n.name;
    btn.addEventListener('click', () => toggleExpand(n.id, btn, n, n.rankLabel || null));
    col.appendChild(btn);
    if (item.from) simpleLinks.push({ fromId: item.from, toId: n.id });

    if (item.sub && item.sub.length) {
      const subWrap = document.createElement('div');
      subWrap.className = 'sub-branch';
      item.sub.forEach(subItem => {
        const subN = nodesById[subItem.id];
        const subBtn = document.createElement('button');
        subBtn.className = `node-btn node-btn--small kind-${subN.kind}`;
        subBtn.style.setProperty('--accent-color', `var(--${subN.color})`);
        subBtn.dataset.id = subN.id;
        subBtn.textContent = subN.name;
        subBtn.addEventListener('click', () => toggleExpand(subN.id, subBtn, subN, subN.rankLabel || null));
        subWrap.appendChild(subBtn);
        simpleLinks.push({ fromId: item.id, toId: subN.id });
      });
      col.appendChild(subWrap);
    }
    return col;
  }

  TREE_DATA.layout.forEach(entry => {
    if (entry.type === 'row') {
      const rowEl = document.createElement('div');
      rowEl.className = 'tree-row';
      if (entry.group) {
        const g = groupsById[entry.group];
        const wrap = document.createElement('div');
        wrap.className = 'group-wrap';
        wrap.style.setProperty('--group-color', `var(--${g.color})`);
        const chip = document.createElement('button');
        chip.className = 'group-chip';
        chip.textContent = g.label;
        chip.dataset.id = g.id;
        chip.addEventListener('click', () => toggleExpand(g.id, chip, g, 'informal group'));
        wrap.appendChild(chip);
        entry.items.forEach(item => wrap.appendChild(buildNodeCol(item)));
        rowEl.appendChild(wrap);
      } else {
        entry.items.forEach(item => rowEl.appendChild(buildNodeCol(item)));
      }
      flow.appendChild(rowEl);
    }
    if (entry.type === 'event') {
      const ev = eventsById[entry.id];
      const evRow = document.createElement('div');
      evRow.className = 'event-row';
      const chip = document.createElement('button');
      chip.className = 'event-chip-btn';
      chip.textContent = '?';
      chip.title = ev.label;
      chip.setAttribute('aria-label', ev.label);
      chip.dataset.id = ev.id;
      chip.addEventListener('click', () => toggleExpand(ev.id, chip, ev, 'event'));
      evRow.appendChild(chip);
      flow.appendChild(evRow);
    }
  });

  function redrawLinks() {
    (TREE_DATA.events || []).forEach(ev => {
      const chip = document.querySelector(`.event-chip-btn[data-id="${ev.id}"]`);
      const toEl = document.querySelector(`.node-btn[data-id="${ev.to}"]`);
      if (!chip || !toEl) return;
      const rowRect = chip.parentElement.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      let left = (toRect.left + toRect.width / 2) - rowRect.left - 13;
      left = Math.max(4, Math.min(left, rowRect.width - 30));
      chip.style.left = `${left}px`;
    });

    const flowRect = flow.getBoundingClientRect();
    linksSvg.innerHTML = '';
    linksSvg.setAttribute('width', flowRect.width);
    linksSvg.setAttribute('height', flowRect.height);

    function centerOf(el, edge) {
      const r = el.getBoundingClientRect();
      return { x: r.left - flowRect.left + r.width / 2, y: (edge === 'bottom' ? r.bottom : r.top) - flowRect.top };
    }
    function drawLine(p1, p2, dashed, color) {
  const path = svgEl('path', {
    d:`M${p1.x},${p1.y} C${p1.x},${(p1.y+p2.y)/2} ${p2.x},${(p1.y+p2.y)/2} ${p2.x},${p2.y}`,
    fill:'none', stroke: color || 'var(--text-soft)', 'stroke-width':'1.5'
  });
  if (dashed) path.setAttribute('stroke-dasharray', '4 4');
  linksSvg.appendChild(path);
}

simpleLinks.forEach(l => {
  const from = document.querySelector(`.node-btn[data-id="${l.fromId}"]`);
  const to = document.querySelector(`.node-btn[data-id="${l.toId}"]`);
  if (from && to) drawLine(centerOf(from,'bottom'), centerOf(to,'top'), false, `var(--${nodesById[l.toId].color})`);
});

(TREE_DATA.events || []).forEach(ev => {
  const chip = document.querySelector(`.event-chip-btn[data-id="${ev.id}"]`);
  if (!chip) return;
  ev.from.forEach(fid => {
    const from = document.querySelector(`.node-btn[data-id="${fid}"]`);
    if (from) drawLine(centerOf(from,'bottom'), centerOf(chip,'top'), true, `var(--${ev.color})`);
  });
  const to = document.querySelector(`.node-btn[data-id="${ev.to}"]`);
  if (to) drawLine(centerOf(chip,'bottom'), centerOf(to,'top'), true, `var(--${ev.color})`);
});
  }

  redrawLinks();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawLinks);
  setTimeout(redrawLinks, 300);
  setTimeout(redrawLinks, 1000);
  window.addEventListener('resize', redrawLinks);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.node-btn, .group-chip, .event-chip-btn, .detail-side')) {
      detailSide.innerHTML = '<p class="detail-placeholder">Tap a name to see its card here.</p>';
      activeId = null;
      document.querySelectorAll('.is-active').forEach(b => b.classList.remove('is-active'));
    }
  });
}

/* ---- STAGE TREE (horizontal, single-parent only) ----
   Page needs:
     <div class="tree-flow" id="treeFlow"><svg class="tree-links" id="treeLinks"></svg></div>
     <div class="detail-zone" id="detailZone"></div>
*/
function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

const RANKS = ['domain','kingdom','phylum','subphylum','class','infraclass','order','family','genus','species'];

function initStageTree(TREE_DATA) {
  /* ---- which ranks can be hidden ---- */
  const CORE = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
  const isExtra = n => !!n.rankLabel && !CORE.includes(n.rankLabel);   // subphylum, clade, superclass...
  let showExtra = true;

  const flow = document.getElementById('treeFlow');
  const linksSvg = document.getElementById('treeLinks');
  const detailZone = document.getElementById('detailZone');
  const dataById = Object.fromEntries(TREE_DATA.nodes.map(n => [n.id, n]));   // never modified
  const ROW_HEIGHT = 55;

  let nodesById = {};
  let simpleLinks = [];
  let headerRow = null;
  let activeId = null;

  let toggleBtn = document.getElementById('toggle-extra');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-extra';
    flow.parentElement.insertBefore(toggleBtn, flow);
  }
  const setToggleLabel = () => {
    toggleBtn.textContent = showExtra ? 'Hide subtaxa' : 'Show subtaxa';
  };
  toggleBtn.onclick = () => {
    showExtra = !showExtra;
    setToggleLabel();
    render();
  };
  setToggleLabel();

  const globalExpand = document.createElement('div');
  globalExpand.className = 'expand-wrap';
  globalExpand.innerHTML = '<div class="expand-inner"></div>';
  detailZone.appendChild(globalExpand);

  function closeExpand() {
    globalExpand.classList.remove('is-open');
    globalExpand.querySelector('.expand-inner').innerHTML = '';
    activeId = null;
  }

  function toggleExpand(id, btn, item, badge) {
    const inner = globalExpand.querySelector('.expand-inner');
    const wasOpenForThis = globalExpand.classList.contains('is-open') && activeId === id;
    document.querySelectorAll('.node-btn.is-active').forEach(b => b.classList.remove('is-active'));
    if (wasOpenForThis) {
      globalExpand.classList.remove('is-open');
      activeId = null;
      globalExpand.addEventListener('transitionend', () => { inner.innerHTML = ''; redrawLinks(); }, { once: true });
    } else {
      inner.innerHTML = cardHtml(item, badge, { imagePosition: 'right' });
      wireCarousel(inner);
      globalExpand.classList.add('is-open');
      btn.classList.add('is-active');
      activeId = id;
      setTimeout(() => globalExpand.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
    redrawLinks();
    setTimeout(redrawLinks, 320);
  }

  function render() {
    const RANK_LIST = RANKS.filter(r => showExtra || CORE.includes(r));
    const visible = TREE_DATA.nodes.filter(n => showExtra || !isExtra(n));
    const visibleIds = new Set(visible.map(n => n.id));

    const parentFor = n => {
      let p = n.from;
      while (p && !visibleIds.has(p)) p = dataById[p] ? dataById[p].from : null;
      return p || null;
    };

    function columnOf(n) {
      if (n.__ghostColumn != null) return n.__ghostColumn;
      if (!n.rankLabel) return 0;
      const idx = RANK_LIST.indexOf(n.rankLabel);
      return idx >= 0 ? idx + 1 : RANK_LIST.length + 1;
    }

    nodesById = Object.fromEntries(visible.map(n => [n.id, n]));
    simpleLinks = [];
    flow.querySelectorAll(':scope > .stage').forEach(s => s.remove());
    if (headerRow) headerRow.remove();

    const childrenOf = {};
    const parentOf = {};
    visible.forEach(n => {
      const p = parentFor(n);
      if (p) {
        parentOf[n.id] = p;
        (childrenOf[p] ||= []).push(n.id);
        simpleLinks.push({ fromId: p, toId: n.id });
      }
    });
    const roots = visible.map(n => n.id).filter(id => !parentOf[id]);

    const syntheticNodes = [];
    let ghostCounter = 0;

    visible.forEach(n => {
      const pId = parentOf[n.id];
      if (!pId) return;
      const parent = nodesById[pId];
      const gap = columnOf(n) - columnOf(parent);
      if (gap <= 1) return;

      const linkIdx = simpleLinks.findIndex(l => l.fromId === pId && l.toId === n.id);
      if (linkIdx !== -1) simpleLinks.splice(linkIdx, 1);
      childrenOf[pId] = childrenOf[pId].filter(id => id !== n.id);

      const ghostId = `__ghost${ghostCounter++}`;
      const ghostCol = columnOf(parent) + Math.round(gap / 2);
      const ghost = { id: ghostId, name: '···', kind: 'ghost', color: n.color, from: pId, __ghostColumn: ghostCol };
      syntheticNodes.push(ghost);
      nodesById[ghostId] = ghost;

      parentOf[ghostId] = pId;
      (childrenOf[pId] ||= []).push(ghostId);
      simpleLinks.push({ fromId: pId, toId: ghostId });

      parentOf[n.id] = ghostId;
      (childrenOf[ghostId] ||= []).push(n.id);
      simpleLinks.push({ fromId: ghostId, toId: n.id });
    });

    const allNodesIncludingGhosts = [...visible, ...syntheticNodes];

    const slot = {};
    let nextLeafSlot = 0;
    function assign(id) {
      const kids = childrenOf[id];
      if (!kids || !kids.length) { slot[id] = nextLeafSlot++; return slot[id]; }
      const kidSlots = kids.map(assign);
      slot[id] = (Math.min(...kidSlots) + Math.max(...kidSlots)) / 2;
      return slot[id];
    }
    roots.forEach(assign);
    const totalHeight = nextLeafSlot * ROW_HEIGHT;

    const byColumn = {};
    allNodesIncludingGhosts.forEach(n => (byColumn[columnOf(n)] ||= []).push(n));
    const usedColumns = Object.keys(byColumn).map(Number).sort((a, b) => a - b);

    headerRow = document.createElement('div');
    headerRow.className = 'stage-header-row';
    usedColumns.forEach(col => {
      const label = document.createElement('div');
      label.className = 'stage-header';
      label.textContent = col === 0 ? '' : (RANK_LIST[col - 1] || '');
      headerRow.appendChild(label);
    });
    flow.parentElement.insertBefore(headerRow, flow);

    usedColumns.forEach(col => {
      const stageEl = document.createElement('div');
      stageEl.className = 'stage';
      stageEl.style.height = `${totalHeight}px`;
      byColumn[col].forEach(n => {
        const colEl = document.createElement('div');
        colEl.className = 'stage-col';
        colEl.style.top = `${slot[n.id] * ROW_HEIGHT + ROW_HEIGHT / 2}px`;
        if (n.kind === 'ghost') {
          const dots = document.createElement('div');
          dots.className = 'node-ghost';
          dots.dataset.id = n.id;
          dots.style.setProperty('--accent-color', `var(--${n.color})`);
          dots.innerHTML = '<span></span><span></span><span></span>';
          colEl.appendChild(dots);
        } else {
          const btn = document.createElement('button');
          btn.className = `node-btn kind-${n.kind}${n.extinct ? ' is-extinct' : ''}`;
          btn.style.setProperty('--accent-color', `var(--${n.color})`);
          btn.dataset.id = n.id;
          btn.id = `node-${n.id}`;
          btn.innerHTML = `${n.name}${n.extinct ? '<span class="extinct-mark"> †</span>' : ''}`;
          btn.addEventListener('click', () => toggleExpand(n.id, btn, n, n.rankLabel || null));
          colEl.appendChild(btn);
        }
        stageEl.appendChild(colEl);
      });
      flow.appendChild(stageEl);
    });

    /* 5. keep the open card in sync with what is now visible */
    if (activeId && !nodesById[activeId]) {
      closeExpand();                       // its node was just hidden
    } else if (activeId) {
      const b = document.getElementById(`node-${activeId}`);
      if (b) b.classList.add('is-active');
    }

    redrawLinks();
    setTimeout(redrawLinks, 50);
  }

  function redrawLinks() {
    const flowRect = flow.getBoundingClientRect();
    linksSvg.innerHTML = '';
    linksSvg.setAttribute('width', flowRect.width);
    linksSvg.setAttribute('height', flowRect.height);
    function edgeOf(el, side) {
      const r = el.getBoundingClientRect();
      return { x: (side === 'right' ? r.right : r.left) - flowRect.left, y: r.top - flowRect.top + r.height / 2 };
    }
    function drawLine(p1, p2, color) {
      const path = svgEl('path', {
        d: `M${p1.x},${p1.y} C${(p1.x + p2.x) / 2},${p1.y} ${(p1.x + p2.x) / 2},${p2.y} ${p2.x},${p2.y}`,
        fill: 'none', stroke: color || 'var(--text-soft)', 'stroke-width': '1.5'
      });
      linksSvg.appendChild(path);
    }
    simpleLinks.forEach(l => {
      const from = document.querySelector(`[data-id="${l.fromId}"]`);
      const to = document.querySelector(`[data-id="${l.toId}"]`);
      if (from && to) drawLine(edgeOf(from, 'right'), edgeOf(to, 'left'), `var(--${nodesById[l.toId].color}, var(--text-soft))`);
    });
  }

  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawLinks);
  setTimeout(redrawLinks, 300);
  setTimeout(redrawLinks, 1000);
  window.addEventListener('resize', redrawLinks);

  function openFromHash() {
    const targetId = location.hash.replace('#node-', '');
    if (!targetId) return;
    const raw = dataById[targetId];
    if (raw && isExtra(raw) && !showExtra) { showExtra = true; setToggleLabel(); render(); }
    const n = nodesById[targetId];
    const btn = document.getElementById(`node-${targetId}`);
    if (n && btn) {
      toggleExpand(n.id, btn, n, n.rankLabel || null);
      setTimeout(() => btn.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

