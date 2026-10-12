import { GUARDIAN_ARTWORKS, RUBRIC_CRITERIA } from './data.js';

// State
let currentCategory = 'all';
let currentPlatform = 'all';
let currentSort = 'rank-asc';
let activeModalIndex = null;

// DOM Elements
const heroSpotlightEl = document.getElementById('hero-spotlight');
const rubricGridEl = document.getElementById('rubric-grid');
const artFeedEl = document.getElementById('art-feed');
const matrixTbodyEl = document.getElementById('matrix-tbody');
const lightboxEl = document.getElementById('lightbox');
const lightboxImgEl = document.getElementById('lightbox-img');
const lightboxCaptionEl = document.getElementById('lightbox-caption');
const lightboxCloseBtn = document.getElementById('lightbox-close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderRubricGrid();
  renderHeroSpotlight(GUARDIAN_ARTWORKS[0]);
  renderArtFeed();
  renderMatrixTable();
  setupFilterControls();
  setupLightboxListeners();
});

// Render Rubric Info Cards
function renderRubricGrid() {
  if (!rubricGridEl) return;
  rubricGridEl.innerHTML = RUBRIC_CRITERIA.map(c => `
    <article class="rubric-card">
      <span class="rubric-pill">Max ${c.max} Pts</span>
      <h3 class="rubric-name">${c.name}</h3>
      <p class="rubric-desc">${c.desc}</p>
    </article>
  `).join('');
}

// Render Spotlight in Hero
function renderHeroSpotlight(item) {
  if (!heroSpotlightEl) return;
  heroSpotlightEl.innerHTML = `
    <div class="spotlight-media" role="button" tabindex="0" title="Click to inspect in high resolution">
      <img src="assets/${item.imageFile}" alt="${item.title}" onerror="this.src='assets/${item.imageFallback}'">
      <div class="spotlight-badge">Rank #${item.rank} · ${item.scores.total} / 100</div>
    </div>
    <div class="spotlight-content">
      <span class="eyebrow">${item.formName}</span>
      <h2 class="spotlight-title">${item.title}</h2>
      <p class="spotlight-artist">Art by <b>${item.artist}</b> (${item.artistHandle}) · <a href="${item.platformUrl}" target="_blank" rel="noopener noreferrer">${item.platform} ↗</a></p>
      <blockquote class="spotlight-quote">${item.quote}</blockquote>
      <p class="art-critique" style="font-size:0.9rem; margin-bottom:0.6rem;">${item.critique.slice(0, 240)}...</p>
      <div class="spotlight-actions">
        <a class="nav-btn primary" href="#art-${item.id}">Read Full Critique ↓</a>
        <a class="nav-btn" href="${item.platformUrl}" target="_blank" rel="noopener noreferrer">Source Page ↗</a>
      </div>
    </div>
  `;

  const spotlightImg = heroSpotlightEl.querySelector('.spotlight-media');
  spotlightImg.addEventListener('click', () => openLightbox(item));
}

// Filter and Sort Data
function getFilteredAndSortedArtworks() {
  let list = [...GUARDIAN_ARTWORKS];

  // Category filter
  if (currentCategory !== 'all') {
    list = list.filter(item => item.formCategory === currentCategory);
  }

  // Platform filter
  if (currentPlatform !== 'all') {
    list = list.filter(item => {
      const p = item.platform.toLowerCase();
      const sec = (item.secondaryPlatform || '').toLowerCase();
      const target = currentPlatform.toLowerCase();
      return p.includes(target) || sec.includes(target);
    });
  }

  // Sort
  if (currentSort === 'rank-asc') {
    list.sort((a, b) => a.rank - b.rank);
  } else if (currentSort === 'rank-desc') {
    list.sort((a, b) => b.rank - a.rank);
  } else if (currentSort === 'score-desc') {
    list.sort((a, b) => b.scores.total - a.scores.total);
  } else if (currentSort === 'mitigation-desc') {
    list.sort((a, b) => b.scores.mitigation - a.scores.mitigation);
  } else if (currentSort === 'silhouette-desc') {
    list.sort((a, b) => b.scores.silhouette - a.scores.silhouette);
  }

  return list;
}

// Render Artworks Feed
function renderArtFeed() {
  if (!artFeedEl) return;
  const items = getFilteredAndSortedArtworks();

  if (items.length === 0) {
    artFeedEl.innerHTML = `
      <div style="text-align:center; padding: 4rem 1rem; color: var(--ash);">
        <p style="font-size: 1.3rem; margin-bottom: 0.8rem;">No artworks found matching current filters.</p>
        <button class="nav-btn" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  artFeedEl.innerHTML = items.map(item => `
    <article class="art-card" id="art-${item.id}">
      <!-- Media Column -->
      <div class="art-media-col" role="button" tabindex="0" title="Click to view full-resolution artwork">
        <img class="art-media-img" src="assets/${item.imageFile}" alt="${item.title}" onerror="this.src='assets/${item.imageFallback}'" loading="lazy">
        <div class="rank-badge ${item.rank <= 3 ? 'top-3' : ''}">#${item.rank}</div>
        <div class="score-badge-overlay">${item.scores.total} / 100</div>
        <div class="zoom-hint">Click to enlarge ↗</div>
      </div>

      <!-- Info Column -->
      <div class="art-info-col">
        <div class="art-header">
          <div class="art-meta-tags">
            <span class="tag platform-${item.platform.toLowerCase()}">${item.platform}</span>
            <span class="tag form-${item.formCategory}">${item.formName}</span>
            <span class="tag">${item.loreHeritage}</span>
          </div>
          <h3 class="art-title">${item.title}</h3>
          <p class="art-artist-line">
            By <a href="${item.platformUrl}" target="_blank" rel="noopener noreferrer">${item.artist}</a>
            ${item.artistHandle ? `(${item.artistHandle})` : ''}
          </p>
        </div>

        <!-- Rubric Breakdown -->
        <div class="score-breakdown-card">
          <div class="score-breakdown-head">
            <span class="score-breakdown-title">Rubric Evaluation</span>
            <span class="score-total-val">${item.scores.total} / 100</span>
          </div>
          <div class="score-bars">
            <div class="mini-score-item">
              <span class="mini-score-label">Silhouette</span>
              <div class="mini-bar-track"><div class="mini-bar-fill" style="width: ${(item.scores.silhouette / 20) * 100}%"></div></div>
              <span class="mini-score-num">${item.scores.silhouette}</span>
            </div>
            <div class="mini-score-item">
              <span class="mini-score-label">Lore</span>
              <div class="mini-bar-track"><div class="mini-bar-fill" style="width: ${(item.scores.lore / 20) * 100}%"></div></div>
              <span class="mini-score-num">${item.scores.lore}</span>
            </div>
            <div class="mini-score-item">
              <span class="mini-score-label">Mitigation</span>
              <div class="mini-bar-track"><div class="mini-bar-fill" style="width: ${(item.scores.mitigation / 20) * 100}%"></div></div>
              <span class="mini-score-num">${item.scores.mitigation}</span>
            </div>
            <div class="mini-score-item">
              <span class="mini-score-label">Environment</span>
              <div class="mini-bar-track"><div class="mini-bar-fill" style="width: ${(item.scores.environment / 20) * 100}%"></div></div>
              <span class="mini-score-num">${item.scores.environment}</span>
            </div>
            <div class="mini-score-item">
              <span class="mini-score-label">Craft</span>
              <div class="mini-bar-track"><div class="mini-bar-fill" style="width: ${(item.scores.craft / 20) * 100}%"></div></div>
              <span class="mini-score-num">${item.scores.craft}</span>
            </div>
          </div>
        </div>

        <p class="art-critique">${item.critique}</p>
        <blockquote class="art-quote">${item.quote}</blockquote>

        <div class="art-actions">
          <a class="source-link-btn" href="${item.platformUrl}" target="_blank" rel="noopener noreferrer">
            View on ${item.platform} ↗
          </a>
          ${item.secondaryUrl ? `
            <a class="source-link-btn" href="${item.secondaryUrl}" target="_blank" rel="noopener noreferrer" style="font-size:0.75rem;">
              ${item.secondaryPlatform} ↗
            </a>
          ` : ''}
        </div>
      </div>
    </article>
  `).join('');

  // Attach lightbox click handlers
  artFeedEl.querySelectorAll('.art-media-col').forEach((el, index) => {
    el.addEventListener('click', () => {
      openLightbox(items[index]);
    });
  });
}

// Render Leaderboard / Comparison Table
function renderMatrixTable() {
  if (!matrixTbodyEl) return;
  matrixTbodyEl.innerHTML = GUARDIAN_ARTWORKS.map(item => `
    <tr>
      <td class="num">#${item.rank}</td>
      <td><b><a href="#art-${item.id}">${item.title}</a></b></td>
      <td><a href="${item.platformUrl}" target="_blank" rel="noopener noreferrer">${item.artist}</a></td>
      <td><span class="tag platform-${item.platform.toLowerCase()}">${item.platform}</span></td>
      <td>${item.formName}</td>
      <td class="num">${item.scores.silhouette}</td>
      <td class="num">${item.scores.lore}</td>
      <td class="num">${item.scores.mitigation}</td>
      <td class="num">${item.scores.environment}</td>
      <td class="num">${item.scores.craft}</td>
      <td class="total">${item.scores.total}</td>
    </tr>
  `).join('');
}

// Controls & Filter Listeners
function setupFilterControls() {
  // Category buttons
  document.querySelectorAll('[data-filter-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-category]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.filterCategory;
      renderArtFeed();
    });
  });

  // Platform buttons
  document.querySelectorAll('[data-filter-platform]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-platform]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPlatform = btn.dataset.filterPlatform;
      renderArtFeed();
    });
  });

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderArtFeed();
    });
  }
}

window.resetFilters = function() {
  currentCategory = 'all';
  currentPlatform = 'all';
  currentSort = 'rank-asc';
  document.querySelectorAll('[data-filter-category]').forEach(b => b.classList.toggle('active', b.dataset.filterCategory === 'all'));
  document.querySelectorAll('[data-filter-platform]').forEach(b => b.classList.toggle('active', b.dataset.filterPlatform === 'all'));
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'rank-asc';
  renderArtFeed();
};

// Lightbox modal logic
function setupLightboxListeners() {
  if (!lightboxEl) return;

  lightboxCloseBtn?.addEventListener('click', closeLightbox);
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxEl.classList.contains('active')) {
      closeLightbox();
    }
  });
}

function openLightbox(item) {
  if (!lightboxEl) return;
  lightboxImgEl.src = `assets/${item.imageFile}`;
  lightboxImgEl.onerror = () => { lightboxImgEl.src = `assets/${item.imageFallback}`; };
  lightboxCaptionEl.innerHTML = `
    <b>#${item.rank} · ${item.title}</b> by ${item.artist} (${item.scores.total} / 100)
    <div class="sub">${item.formName} · <a href="${item.platformUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-bright);">View on ${item.platform} ↗</a></div>
  `;
  lightboxEl.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('active');
  document.body.style.overflow = '';
}
