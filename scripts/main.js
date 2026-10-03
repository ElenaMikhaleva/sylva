
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
document.querySelectorAll('[data-accent2]').forEach(el =>
  el.style.setProperty('--accent-color2', `var(--${el.dataset.accent2})`)
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
        ${img.src ? `<img src="${img.src}" alt="${(img.caption||'').replace(/"/g,'&quot;')}" style="${img.focus?`object-position:${img.focus};`:''}${img.fit?`object-fit:${img.fit};`:''}">` : 'image'}</div>
      ${img.caption ? `<figcaption class="carousel-caption">${img.caption}</figcaption>` : ''}
    </figure>`;
  }
  return buildCarousel(images);
}

function buildCarousel(images) {
  const slides = images.map((img, i) => `
    <figure class="carousel-slide" data-caption="${(img.caption||'').replace(/"/g,'&quot;')}">
      <div class="img-slot"><img src="${img.src}" alt="${(img.caption||'').replace(/"/g,'&quot;')}" style="${img.focus?`object-position:${img.focus};`:''}${img.fit?`object-fit:${img.fit};`:''}"></div>
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
  const rgb = getComputedStyle(el).color;
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
      <section class="card" style="--accent-color:var(--${item.color || 'text-soft'})">
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
      chip.id = ev.id;
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

const RANKS = ['domain','kingdom','phylum','subphylum','infraphylum','class','subclass','infraclass','order','suborder','infraorder','superfamily','family','genus','species'];

function initStageTree(TREE_DATA) {
  const CORE = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
  const isExtra = n => !!n.rankLabel && !CORE.includes(n.rankLabel);
  let showExtra = true;

  const flow = document.getElementById('treeFlow');
  const linksSvg = document.getElementById('treeLinks');
  const detailZone = document.getElementById('detailZone');
  const dataById = Object.fromEntries(TREE_DATA.nodes.map(n => [n.id, n]));
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

      const namedIdx = RANK_LIST.indexOf(n.rankLabel);
      if (namedIdx >= 0) return namedIdx + 1;

      let cur = n, hops = 0;
      while (cur.from && dataById[cur.from]) {
        cur = dataById[cur.from];
        hops++;
        const idx = cur.rankLabel ? RANK_LIST.indexOf(cur.rankLabel) : -1;
        if (idx >= 0) return idx + 1 + hops * 0.1;
      }
      return hops * 0.1;
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
          btn.id = `${n.id}`;
          btn.innerHTML = `${n.name}${n.extinct ? '<span class="extinct-mark"> †</span>' : ''}`;
          btn.addEventListener('click', () => toggleExpand(n.id, btn, n, n.rankLabel || null));
          colEl.appendChild(btn);
        }
        stageEl.appendChild(colEl);
      });
      flow.appendChild(stageEl);
    });

    if (activeId && !nodesById[activeId]) {
      closeExpand();
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

/* ----------------------------------------------------- NOTES ------------------------------------------------- */

/* Works wherever it is loaded: it waits for the page, and each feature is isolated so one
   failure can't stop the others. No colours are set or calculated here: everything
   takes its colour from your CSS (the page's --accent-color). */
(() => {
  const pad = n => String(n).padStart(2, '0');
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  /* 1. hover / focus a phrase or its note -> both light up */
  function initLinks() {
    const root = document.querySelector('.sheet') || document;
    const link = (e, on) => {
      const t = e.target.closest('[data-n]');
      if (!t) return;
      root.querySelectorAll('[data-n="' + t.dataset.n + '"]').forEach(x => x.classList.toggle('is-linked', on));
    };
    ['mouseover', 'focusin'].forEach(ev => root.addEventListener(ev, e => link(e, true)));
    ['mouseout', 'focusout'].forEach(ev => root.addEventListener(ev, e => link(e, false)));
  }

  /* 2. contents: one pill with the current section, full-width dropdown with all h2s */
  function initToc() {
    const toc = document.querySelector('.toc');
    const secs = [...document.querySelectorAll('.sheet .note-sec')].filter(s => s.querySelector('h2'));
    if (!toc || !secs.length) return;

    const det = el('details');
    const sum = el('summary');
    const curNum = el('b');
    const curTitle = el('span', '', 'Contents');
    sum.append(curNum, curTitle);
    const list = el('ol');

    secs.forEach((s, i) => {
      if (!s.id) s.id = 'sec-' + (i + 1);
      const a = el('a');
      a.href = '#' + s.id;
      a.append(el('b', '', pad(i + 1)), s.querySelector('h2').textContent);
      a.addEventListener('click', () => { det.open = false; });
      const li = el('li');
      li.appendChild(a);
      list.appendChild(li);
    });
    det.append(sum, list);
    toc.appendChild(det);

    const links = [...list.querySelectorAll('a')];
    const setCurrent = i => {
      curNum.textContent = pad(i + 1);
      curTitle.textContent = secs[i].querySelector('h2').textContent;
      links.forEach((a, j) => a.setAttribute('aria-current', String(j === i)));
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) setCurrent(secs.indexOf(en.target)); });
    }, { rootMargin: '-20% 0px -70% 0px' });
    secs.forEach(s => io.observe(s));

    document.addEventListener('click', e => { if (!toc.contains(e.target)) det.open = false; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') det.open = false; });
  }

  /* 3. period strip: own section here -> filled, links there; otherwise dashed, links to the timeline */
  function initPeriods() {
    document.querySelectorAll('.periods .period').forEach(li => {
      const id = li.dataset.period;
      const a = li.querySelector('a');
      const here = document.getElementById(id);
      a.href = here ? '#' + id : 'greek-history.html#' + id;
      li.classList.toggle('is-done', !!here);
      li.classList.toggle('is-todo', !here);
      if (!here) a.title = 'On the timeline page';
    });
  }

  /* 4. materials. Put any of these on a <section class="note-sec"> or on an empty <div>:
          data-ids="iliad odyssey"   exactly these items, in this order
          data-materials="tag"       items whose "tags" array contains it
          data-years="-800,-480"     items whose year (or year–yearEnd) overlaps the range
          data-related="id id"       a second group, "Also related"
          <ol class="recommended">…</ol> inside the div: a collapsed "Recommended" group (plain text)
          data-closed                start collapsed
        A collapsible "Materials" block is added; nothing is added if nothing matches. */
  const fmtYear = y => (y < 0 ? `${-y} BCE` : String(y));
  const fmtSpan = it => {
    const a = it.year, b = it.yearEnd;
    if (b == null || b === a) return fmtYear(a);
    if (a < 0 && b < 0) return `${-a}–${-b} BCE`;
    if (a < 0) return `${-a} BCE – ${b}`;
    return `${a}–${b}`;
  };

  const STATUS = { finished: 'Finished', inprogress: 'In progress', notstarted: 'Not started', willnotfinish: 'Will not finish' };
  let uid = 0;

  /* same markup as the list view on the library page */
  function row(it) {
    const li = el('li', 'item' + (it.status === 'inprogress' ? ' is-progress' : ''));
    li.dataset.accent = it.subject;                           // colour comes from CSS, see note-sheet.css

    const b = el('button', 'item__main');
    b.type = 'button';
    const moreId = 'mat-' + (++uid);
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', moreId);

    const rank = it.status === 'finished' && it.rating ? ` marker--r${it.rating}` : '';
    const marker = el('i', 'marker marker--' + it.status + rank);
    const title = el('span', 'item__title');
    title.append(el('span', 'sr', (STATUS[it.status] || STATUS.notstarted) + ': '), it.title);

    const kind = el('span', 'item__kind');
    if (document.getElementById('i-' + it.kind)) {           // icon only if your sprite is on this page
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'icon');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS(NS, 'use');
      use.setAttribute('href', '#i-' + it.kind);
      svg.appendChild(use);
      kind.appendChild(svg);
    }
    kind.append(typeof KINDS !== 'undefined' ? KINDS[it.kind] : it.kind);

    b.append(marker, title, el('span', 'item__creator', it.creator), kind, el('span', 'item__year', fmtSpan(it)), el('span', 'item__subject', it.genre));

    const more = el('div', 'item__more');
    more.id = moreId;
    more.hidden = true;
    if (it.status === 'finished' && it.rating && typeof RATINGS !== 'undefined') more.appendChild(el('p', 'verdict', RATINGS[it.rating]));
    if (it.note) more.appendChild(el('p', '', it.note));
    if (it.also && it.also.length && typeof SUBJECTS !== 'undefined') {
      more.appendChild(el('p', 'also', 'Also linked to ' + it.also.map(s => SUBJECTS[s] || s).join(', ') + '.'));
    }
    const open = el('a', '', 'Open page');
    open.href = 'library.html#' + it.id;                     // change to your item page later
    more.appendChild(open);

    b.addEventListener('click', () => {
      const show = more.hidden;
      more.hidden = !show;
      b.setAttribute('aria-expanded', String(show));
    });
    li.append(b, more);
    return li;
  }

  /* look items up by id (warns about typos) */
  function lookup(str) {
    return (str || '').split(/\s+/).filter(Boolean).map(id => {
      const it = ITEMS.find(x => x.id === id);
      if (!it) console.warn('note-sheet: no item with id "' + id + '"');
      return it;
    }).filter(Boolean);
  }
  function pick(ids, tag, years) {
    const listed = lookup(ids);
    const rest = ITEMS.filter(it => {
      if (listed.includes(it)) return false;
      if (tag && (it.tags || []).includes(tag)) return true;
      if (years && it.year != null) return it.year <= years[1] && (it.yearEnd ?? it.year) >= years[0];
      return false;
    }).sort((x, y) => x.year - y.year || x.title.localeCompare(y.title));
    return [...listed, ...rest];
  }

  function initMaterials() {
    const hosts = document.querySelectorAll('.materials, [data-ids], [data-materials], [data-years], [data-related]');
    if (!hosts.length) return;
    if (typeof ITEMS === 'undefined') {
      console.warn('note-sheet: ITEMS is not defined. Load the data script as a normal (non-module) script.');
      hosts.forEach(h => h.append(el('p', 'materials-error', 'Materials unavailable: ITEMS not found.')));
      return;
    }
    hosts.forEach(host => {
      const years = host.dataset.years ? host.dataset.years.split(',').map(Number) : null;
      const rec = host.querySelector(':scope > .recommended');   // plain list written in the HTML
      const blocks = [
        { label: 'Directly related', items: pick(host.dataset.ids, host.dataset.materials, years) },
        { label: 'Also related',     items: lookup(host.dataset.related) }
      ].filter(g => g.items.length).map(g => {
        const list = el('ul', 'list');
        g.items.forEach(it => list.appendChild(row(it)));
        return { label: g.label, node: list, fold: false };
      });
      if (rec) blocks.push({ label: 'Recommended', node: rec, fold: true });
      if (!blocks.length) return;

      const box = el('details', 'materials-box');
      box.open = !host.hasAttribute('data-closed');
      box.appendChild(el('summary', '', 'Materials'));
      blocks.forEach(g => {
        if (blocks.length === 1 && !g.fold) { box.appendChild(g.node); return; }
        if (g.fold) {                                          // collapsible, starts closed
          const d = el('details', 'materials-group');
          d.append(el('summary', '', g.label), g.node);
          box.appendChild(d);
        } else {                                               // always visible
          const d = el('div', 'materials-group');
          d.append(el('p', 'materials-label', g.label), g.node);
          box.appendChild(d);
        }
      });
      host.appendChild(box);
    });
  }

  /* 5a. a .line with a note column needs ONE text block next to it: if the text is several
         elements (p + ul ...), wrap them so the grid keeps two columns */
  function initWrap() {
    document.querySelectorAll('.line').forEach(line => {
      if (!line.querySelector(':scope > .note-side')) return;
      const kids = [...line.children].filter(c => !c.classList.contains('note-side'));
      if (kids.length < 2) return;
      const box = el('div', 'line__text');
      line.insertBefore(box, kids[0]);
      kids.forEach(k => box.appendChild(k));
    });
  }

  /* 5b. note column width s / m / l: picked from the longest note in the line
         (override by hand with <div class="line" data-side="s|m|l">).
         Default is m; quotes and pictures always get l. */
  const SIDE_SHORT = 24, SIDE_LONG = 110;                   // characters
  function initSide() {
    document.querySelectorAll('.line').forEach(line => {
      const side = line.querySelector(':scope > .note-side');
      if (!side || line.hasAttribute('data-side')) return;
      let longest = 0;
      side.querySelectorAll(':scope > .margin').forEach(n => {
        const s = n.querySelector('summary');
        longest = Math.max(longest, (s ? s.textContent : n.textContent).trim().length);
      });
      const heavy = side.querySelector('.margin--quote, .img-box');
      line.dataset.side = heavy || longest > SIDE_LONG ? 'l' : (longest <= SIDE_SHORT ? 's' : 'm');
    });
  }

  /* 5. margin notes sit level with the phrase they belong to (stacking when they would overlap) */
  function initNotes() {
    const mq = window.matchMedia('(max-width: 44rem)');
    const lines = [...document.querySelectorAll('.line')].filter(l => l.querySelector(':scope > .note-side > [data-n]'));
    if (!lines.length) return;
    const place = line => {
      const side = line.querySelector(':scope > .note-side');
      const notes = [...side.querySelectorAll(':scope > [data-n]')];
      notes.forEach(n => { n.style.marginTop = ''; });
      if (mq.matches) return;
      const gap = parseFloat(getComputedStyle(side).rowGap) || 0;
      const base = side.getBoundingClientRect().top;
      let cursor = 0;
      notes.forEach(n => {
        const a = line.querySelector('.anchor[data-n="' + n.dataset.n + '"]');
        const want = a ? a.getBoundingClientRect().top - base : cursor;
        const mt = Math.max(0, want - cursor);
        n.style.marginTop = mt + 'px';
        cursor += mt + n.offsetHeight + gap;
      });
    };
    const all = () => lines.forEach(place);
    all();
    window.addEventListener('resize', all);
    mq.addEventListener('change', all);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
    if (window.ResizeObserver) lines.forEach(l => new ResizeObserver(() => place(l)).observe(l));
  }

  function start() {
    [initLinks, initToc, initPeriods, initMaterials, initWrap, initSide, initNotes].forEach(f => {
      try { f(); } catch (err) { console.error('note-sheet: ' + f.name + ' failed', err); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();