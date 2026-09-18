
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

function cardHtml(item, badge) {
  const hasImages = item.images && item.images.length;
  return `
    <div class="expand-pad">
      <section class="card" style="--accent-color:var(--${item.color})">
        <div class="card-head">
          <h2 class="card-title">${item.name}${item.native ? `<span class="card-native">${item.native}</span>` : ''}</h2>
          ${badge ? `<span class="card-tag">${badge}</span>` : ''}
        </div>
        <div class="card-body ${hasImages ? '' : 'no-image'}">
          <div class="card-text">
            ${item.html}
            ${item.today ? `<div class="today-box"><strong>Today:</strong> ${item.today}</div>` : ''}
          </div>
          ${hasImages ? buildMedia(item.images) : ''}
        </div>
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
function initStageTree(TREE_DATA) {
  const RANKS = TREE_DATA.ranks || ['domain','kingdom','phylum','subphylum','class','order','family','genus','species'];
  const flow = document.getElementById('treeFlow');
  const linksSvg = document.getElementById('treeLinks');
  const detailZone = document.getElementById('detailZone');
  const nodesById = Object.fromEntries(TREE_DATA.nodes.map(n => [n.id, n]));
  const simpleLinks = [];
  const ROW_HEIGHT = 70;

  const globalExpand = document.createElement('div');
  globalExpand.className = 'expand-wrap';
  globalExpand.innerHTML = '<div class="expand-inner"></div>';
  detailZone.appendChild(globalExpand);
  let activeId = null;

  function toggleExpand(id, btn, item, badge) {
    const inner = globalExpand.querySelector('.expand-inner');
    const wasOpenForThis = globalExpand.classList.contains('is-open') && activeId === id;
    document.querySelectorAll('.node-btn.is-active').forEach(b => b.classList.remove('is-active'));
    if (wasOpenForThis) {
      globalExpand.classList.remove('is-open');
      activeId = null;
      globalExpand.addEventListener('transitionend', () => { inner.innerHTML = ''; redrawLinks(); }, { once: true });
    } else {
      inner.innerHTML = cardHtml(item, badge);
      wireCarousel(inner);
      globalExpand.classList.add('is-open');
      btn.classList.add('is-active');
      activeId = id;
      setTimeout(() => globalExpand.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
    redrawLinks();
    setTimeout(redrawLinks, 320);
  }

  /* ---- 1. Parent/child map, straight from each node's own `from` ---- */
  const childrenOf = {};
  const parentOf = {};
  TREE_DATA.nodes.forEach(n => {
    if (n.from) {
      parentOf[n.id] = n.from;
      (childrenOf[n.from] ||= []).push(n.id);
      simpleLinks.push({ fromId: n.from, toId: n.id });
    }
  });
  const allIds = TREE_DATA.nodes.map(n => n.id);
  const roots = allIds.filter(id => !parentOf[id]);

  const syntheticNodes = [];
let ghostCounter = 0;

TREE_DATA.nodes.forEach(n => {
  if (!n.from) return;
  const parent = nodesById[n.from];
  const gap = columnOf(n) - columnOf(parent);
  if (gap <= 1) return; // adjacent columns (or same/root) — normal connector, nothing to do

  const linkIdx = simpleLinks.findIndex(l => l.fromId === n.from && l.toId === n.id);
  if (linkIdx !== -1) simpleLinks.splice(linkIdx, 1);
  childrenOf[n.from] = childrenOf[n.from].filter(id => id !== n.id);

  const ghostId = `__ghost${ghostCounter++}`;
  const ghostCol = columnOf(parent) + Math.round(gap / 2); // midpoint column
  const ghost = { id: ghostId, name: '···', kind: 'ghost', color: n.color, from: n.from, __ghostColumn: ghostCol };
  syntheticNodes.push(ghost);
  nodesById[ghostId] = ghost;

  parentOf[ghostId] = n.from;
  (childrenOf[n.from] ||= []).push(ghostId);
  simpleLinks.push({ fromId: n.from, toId: ghostId });

  parentOf[n.id] = ghostId;
  (childrenOf[ghostId] ||= []).push(n.id);
  simpleLinks.push({ fromId: ghostId, toId: n.id });
});

const allNodesIncludingGhosts = [...TREE_DATA.nodes, ...syntheticNodes];

  /* ---- 2. Bottom-up slot assignment (unchanged — still purely about
             parent/child structure, independent of column/rank) ---- */
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

  /* ---- 3. Column = rank position. Unranked/lineage nodes → column 0.
             Only non-empty columns get rendered, so skipped ranks
             (globally unused) don't waste space — but a lineage that
             skips a rank locally still just draws a longer connector,
             since drawLine uses real pixel positions regardless of
             how many columns apart the two nodes land. ---- */
  function columnOf(n) {
  if (n.__ghostColumn != null) return n.__ghostColumn;
  if (!n.rankLabel) return 0;
  const idx = RANKS.indexOf(n.rankLabel);
  return idx >= 0 ? idx + 1 : RANKS.length + 1;
}
  const byColumn = {};
  allNodesIncludingGhosts.forEach(n => (byColumn[columnOf(n)] ||= []).push(n));
  const usedColumns = Object.keys(byColumn).map(Number).sort((a, b) => a - b);

  const headerRow = document.createElement('div');
headerRow.className = 'stage-header-row';
usedColumns.forEach(col => {
  const label = document.createElement('div');
  label.className = 'stage-header';
  label.textContent = col === 0 ? '' : (RANKS[col - 1] || '');
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
        btn.className = `node-btn kind-${n.kind}`;
        btn.style.setProperty('--accent-color', `var(--${n.color})`);
        btn.dataset.id = n.id;
        btn.textContent = n.name;
        btn.addEventListener('click', () => toggleExpand(n.id, btn, n, n.rankLabel || null));
        colEl.appendChild(btn);
      }
      stageEl.appendChild(colEl);
    });
    flow.appendChild(stageEl);
  });

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

  redrawLinks();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawLinks);
  setTimeout(redrawLinks, 300);
  setTimeout(redrawLinks, 1000);
  window.addEventListener('resize', redrawLinks);
}