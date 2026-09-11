
document.querySelectorAll('[data-src]').forEach(async (slot) => {
  const res = await fetch(slot.dataset.src);
  slot.innerHTML = await res.text();
});

document.querySelectorAll('.carousel').forEach(carousel => {
  const box = carousel.parentElement;
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
  const captionEl = box.querySelector('.carousel-caption');
  const dotsWrap = box.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  if (!track || !slides.length) return;

  let index = 0;

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'img-slot-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
    if (captionEl) {
      captionEl.textContent = slides[index].dataset.caption || '';
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

  let startX = 0;
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 40) goTo(index - 1);
    else if (dx < -40) goTo(index + 1);
  });

  goTo(0);
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