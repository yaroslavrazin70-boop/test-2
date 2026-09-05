// ============================================================
// CLICK THE CAT — a simple, dependency-free clicker game
// ============================================================

const catEl = document.getElementById('cat');
const scoreEl = document.getElementById('score');
const cpsEl = document.getElementById('cps');
const fxLayer = document.getElementById('click-fx-layer');
const toastEl = document.getElementById('toast');
const resetBtn = document.getElementById('reset-btn');
const eyesNormal = document.getElementById('eyes');
const eyesHappy = document.getElementById('eyes-happy');
const milestoneEls = Array.from(document.querySelectorAll('.milestone'));

// ---------- Persistent score (falls back gracefully if storage is unavailable) ----------
let score = 0;
let bestCps = 0;

try {
  score = parseInt(localStorage.getItem('catClickerScore') || '0', 10) || 0;
  bestCps = parseInt(localStorage.getItem('catClickerBestCps') || '0', 10) || 0;
} catch (e) {
  score = 0;
  bestCps = 0;
}

function saveScore() {
  try {
    localStorage.setItem('catClickerScore', String(score));
    localStorage.setItem('catClickerBestCps', String(bestCps));
  } catch (e) { /* ignore */ }
}

// ---------- Clicks-per-second tracking ----------
let clickTimestamps = [];

function updateCps() {
  const now = performance.now();
  clickTimestamps = clickTimestamps.filter((t) => now - t < 1000);
  const currentCps = clickTimestamps.length;
  if (currentCps > bestCps) bestCps = currentCps;
  cpsEl.textContent = bestCps;
}

// ---------- Milestones ----------
const reachedMilestones = new Set();

function checkMilestones() {
  milestoneEls.forEach((el) => {
    const at = parseInt(el.dataset.at, 10);
    if (score >= at && !reachedMilestones.has(at)) {
      reachedMilestones.add(at);
      el.classList.add('reached');
      showToast(`Milestone: ${el.textContent.trim()} clicks!`);
    } else if (score >= at) {
      el.classList.add('reached');
    }
  });
}

let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

// ---------- Click feedback ----------
function spawnPlusOne(x, y) {
  const el = document.createElement('div');
  el.className = 'fx-plus';
  el.textContent = '+1';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  fxLayer.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function playHappyFace() {
  eyesNormal.style.display = 'none';
  eyesHappy.style.display = '';
  setTimeout(() => {
    eyesNormal.style.display = '';
    eyesHappy.style.display = 'none';
  }, 180);
}

function animateCat() {
  catEl.classList.remove('bounce', 'shake');
  // Occasionally shake instead of bounce, just for variety
  const useShake = Math.random() < 0.12;
  void catEl.offsetWidth; // restart animation
  catEl.classList.add(useShake ? 'shake' : 'bounce');
}

// ---------- Main click handler ----------
function handleClick(clientX, clientY) {
  score += 1;
  scoreEl.textContent = score;

  const now = performance.now();
  clickTimestamps.push(now);
  updateCps();

  const rect = catEl.getBoundingClientRect();
  const areaRect = fxLayer.getBoundingClientRect();
  const x = (clientX ?? (rect.left + rect.width / 2)) - areaRect.left;
  const y = (clientY ?? (rect.top + rect.height / 3)) - areaRect.top;
  spawnPlusOne(x, y);

  animateCat();
  playHappyFace();
  checkMilestones();
  saveScore();
}

catEl.addEventListener('click', (e) => {
  handleClick(e.clientX, e.clientY);
});

catEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
});

// Prevent double-firing / ghost clicks on touch devices
catEl.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  handleClick(t.clientX, t.clientY);
}, { passive: false });

// ---------- Reset ----------
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset your click count back to 0?')) return;
  score = 0;
  bestCps = 0;
  reachedMilestones.clear();
  milestoneEls.forEach((el) => el.classList.remove('reached'));
  scoreEl.textContent = '0';
  cpsEl.textContent = '0';
  saveScore();
});

// ---------- Init ----------
scoreEl.textContent = score;
cpsEl.textContent = bestCps;
checkMilestones();
