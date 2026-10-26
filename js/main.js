/**
 * YTPAI RAUDLATUL MUTA'ALLIMIN LAMONGAN - CORE PUBLIC PORTAL SCRIPT
 * Reactive rendering from DB, multi-step PPDB Registration, & Instant Official Receipt
 */

// Global State Variables (declared at top to prevent Temporal Dead Zone ReferenceErrors)
let heroSliderTimer = null;
let heroTaglineTimer = null;
let currentSlideIdx = 0;
let currentTaglineIdx = 0;
let globalRevealObserver = null;
let currentNewsCategory = 'Semua';
let currentNewsSearch = '';
let currentKaryaCategory = 'Semua';
let currentTasmikCategory = 'Semua';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollEngine();
  initAnimatedCounters();
  renderAllSections();
  initNewsControls();
  initFilterTabs();
  initKaryaFilterTabs();
  initTasmikFilterTabs();
  initSegmentedTabs();
  initPPDBRegistration();
  initContactForm();
  initInteractiveContactMap();
  initModals();
  initParallaxScroll();
  initPpdbGatewaySlider();
  initVisitorTelemetry();
  initHeroCtaInteractiveHover();
  initLatestInfoPopup();

  // Listen to live database updates from Admin panel
  window.addEventListener('ytpai_db_updated', () => {
    renderAllSections();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'ytpai_database_v1' || e.key === 'ytpai_db_v1') {
      renderAllSections();
    }
  });
});

function renderAllSections() {
  const db = getDB();
  try { renderMeta(db); } catch (e) { console.error('Error renderMeta:', e); }
  try { renderHeroContent(db); } catch (e) { console.error('Error renderHeroContent:', e); }
  try { renderHeroSlider(db); } catch (e) { console.error('Error renderHeroSlider:', e); }
  try { renderVideoShowcase(db); } catch (e) { console.error('Error renderVideoShowcase:', e); }
  try { renderUnits(db); } catch (e) { console.error('Error renderUnits:', e); }
  try { renderPrograms(db); } catch (e) { console.error('Error renderPrograms:', e); }
  try { renderLeadership(db); } catch (e) { console.error('Error renderLeadership:', e); }
  try { renderFacilities(db); } catch (e) { console.error('Error renderFacilities:', e); }
  try { renderExtracurriculars(db); } catch (e) { console.error('Error renderExtracurriculars:', e); }
  try { renderTasmikGallery(db, currentTasmikCategory); } catch (e) { console.error('Error renderTasmikGallery:', e); }
  try { renderKarya(db, currentKaryaCategory); } catch (e) { console.error('Error renderKarya:', e); }
  try { renderNews(db); } catch (e) { console.error('Error renderNews:', e); }
  try { renderProfilHighlights(db); } catch (e) { console.error('Error renderProfilHighlights:', e); }
  try { renderPrestasiHomepage(db); } catch (e) { console.error('Error renderPrestasiHomepage:', e); }
  try { renderAchievements(db, 'Semua'); } catch (e) { console.error('Error renderAchievements:', e); }
  try { renderTestimonials(db); } catch (e) { console.error('Error renderTestimonials:', e); }
  try { populateUnitSelects(db); } catch (e) { console.error('Error populateUnitSelects:', e); }
  try { renderCoreValues(db); } catch (e) { console.error('Error renderCoreValues:', e); }
  try { renderAgenda(db); } catch (e) { console.error('Error renderAgenda:', e); }
  try { renderPpdbGatewaySlider(db); } catch (e) { console.error('Error renderPpdbGatewaySlider:', e); }
  try { initHeroTaglineRotator(db); } catch (e) { console.error('Error initHeroTaglineRotator:', e); }
  try { renderHeroGateway(db); } catch (e) { console.error('Error renderHeroGateway:', e); }
  try { renderBimbinganTab(db); } catch (e) { console.error('Error renderBimbinganTab:', e); }
  try { renderPsbWaveHeader(db); } catch (e) { console.error('Error renderPsbWaveHeader:', e); }
  try { renderPsbFaq(db); } catch (e) { console.error('Error renderPsbFaq:', e); }
  if (typeof refreshScrollObserver === 'function') {
    refreshScrollObserver();
  }
}

/* 0. HERO SLIDER DENGAN SMOOTH ZOOM & CROSSFADE OTOMATIS */
function renderHeroSlider(db) {
  const track = document.getElementById('heroSliderTrack');
  if (!track) return;
  const dotsContainer = document.getElementById('heroSliderDots');

  const slides = db.heroSlides && db.heroSlides.length > 0 ? db.heroSlides : [
    {
      id: "slide-1",
      image: "assets/hero_belajar_santri.jpg",
      title: "Santri Putra & Putri Belajar Bersama",
      tag: "Pesantren Putra & Putri"
    }
  ];

  // Render full-bleed background slides
  track.innerHTML = slides.map((slide, idx) => `
    <div class="hero-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
      <img src="${slide.image}" alt="${slide.title}" class="hero-slide-img" onerror="this.onerror=null; this.src='assets/hero_belajar_santri.jpg';">
    </div>
  `).join('');

  // Render mobile dedicated photo showcase card
  const mobileTrack = document.getElementById('heroMobilePhotoTrack');
  if (mobileTrack) {
    mobileTrack.innerHTML = slides.map((slide, idx) => `
      <div class="hero-mobile-photo-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <img src="${slide.image}" alt="${slide.title}" class="hero-mobile-photo-img" onerror="this.onerror=null; this.src='assets/hero_belajar_santri.jpg';">
      </div>
    `).join('');
  }

  // Render navigation dots if container exists
  if (dotsContainer) {
    dotsContainer.innerHTML = slides.map((_, idx) => `
      <button class="slider-dot ${idx === 0 ? 'active' : ''}" data-dot="${idx}" aria-label="Lihat Slide ${idx + 1}"></button>
    `).join('');
  }

  // Initialize interactive slide caption & counter if elements exist
  updateSlideInfo(slides[0], 0, slides.length);

  initHeroSliderLogic(slides);
}

function updateSlideInfo(slide, idx, total) {
  if (!slide) return;
  const tagEl = document.getElementById('heroActiveTag');
  const titleEl = document.getElementById('heroActiveTitle');
  const counterEl = document.getElementById('heroSlideCounter');
  const mobileTagEl = document.getElementById('heroMobilePhotoTag');

  if (tagEl) tagEl.textContent = slide.tag || 'Unggulan';
  if (counterEl) counterEl.textContent = `0${idx + 1} / 0${total}`;
  if (mobileTagEl) mobileTagEl.textContent = slide.tag || slide.title || 'Santri & Pesantren YTPAI';

  if (titleEl) {
    titleEl.style.opacity = '0';
    setTimeout(() => {
      titleEl.textContent = slide.title;
      titleEl.style.opacity = '1';
    }, 180);
  }
}

function initHeroSliderLogic(slides) {
  const totalSlides = slides.length;
  if (totalSlides <= 1) return;

  const prevBtn = document.getElementById('sliderPrevBtn');
  const nextBtn = document.getElementById('sliderNextBtn');
  const dots = document.querySelectorAll('.slider-dot');
  const slideEls = document.querySelectorAll('.hero-slide');
  const mobileSlideEls = document.querySelectorAll('.hero-mobile-photo-item');

  const goToSlide = (targetIdx) => {
    if (!slideEls[currentSlideIdx]) return;
    slideEls[currentSlideIdx].classList.remove('active');
    if (dots[currentSlideIdx]) dots[currentSlideIdx].classList.remove('active');
    if (mobileSlideEls[currentSlideIdx]) mobileSlideEls[currentSlideIdx].classList.remove('active');

    currentSlideIdx = (targetIdx + totalSlides) % totalSlides;

    if (slideEls[currentSlideIdx]) {
      slideEls[currentSlideIdx].classList.add('active');
      if (dots[currentSlideIdx]) dots[currentSlideIdx].classList.add('active');
      if (mobileSlideEls[currentSlideIdx]) mobileSlideEls[currentSlideIdx].classList.add('active');
      updateSlideInfo(slides[currentSlideIdx], currentSlideIdx, totalSlides);
    }
  };

  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      goToSlide(currentSlideIdx - 1);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      goToSlide(currentSlideIdx + 1);
    };
  }

  dots.forEach(dot => {
    dot.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(dot.getAttribute('data-dot'), 10);
      goToSlide(idx);
    };
  });
}

/* 0. RENDER META DATA & STATS */
function renderMeta(db) {
  const sloganEls = document.querySelectorAll('.dynamic-slogan');
  sloganEls.forEach(el => el.textContent = db.meta.slogan);

  const phoneEls = document.querySelectorAll('.dynamic-phone');
  phoneEls.forEach(el => el.textContent = db.meta.phone);

  const waEls = document.querySelectorAll('.dynamic-wa');
  waEls.forEach(el => el.textContent = db.meta.whatsapp);

  const addressEls = document.querySelectorAll('.dynamic-address');
  addressEls.forEach(el => el.textContent = db.meta.address);

  // Dynamic Google Maps iframe & action buttons
  const mapFrame = document.querySelector('.map-container iframe');
  if (mapFrame && db.meta && db.meta.mapsEmbedUrl) {
    mapFrame.src = db.meta.mapsEmbedUrl;
  }
  const mapsBtn = document.querySelectorAll('.btn-open-maps');
  mapsBtn.forEach(btn => {
    if (db.meta && db.meta.mapsUrl) btn.href = db.meta.mapsUrl;
  });

  // Dynamic Announcement Running Text Marquee
  if (db.meta && db.meta.runningText) {
    const tickerContentEls = document.querySelectorAll('.dynamic-running-text');
    if (tickerContentEls.length > 0) {
      const rawText = db.meta.runningText;
      const items = rawText.split('•').map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        const formattedHtml = items.map(item => `<span>${item}</span>`).join('<span class="ticker-separator">•</span>') + '<span class="ticker-separator">•</span>';
        tickerContentEls.forEach(el => el.innerHTML = formattedHtml);
      }
    }
  }
}

function renderHeroDescriptionWithWords(descEl, text) {
  if (!descEl) return;
  const rawText = text || '';
  const words = rawText.trim().split(/\s+/);
  if (words.length === 0 || (words.length === 1 && words[0] === '')) {
    descEl.innerHTML = '';
    return;
  }
  const cleanWord = (w) => {
    return w.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  descEl.innerHTML = words.map((w, idx) => `<span class="hero-desc-word" style="--w-idx:${idx};">${cleanWord(w)}</span>`).join(' ');
}

function renderHeroContent(db) {
  const hero = db.hero || (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.hero) || {};

  const badgeTagEl = document.getElementById('heroBadgeTag');
  if (badgeTagEl && hero.badgeTag) {
    badgeTagEl.textContent = hero.badgeTag;
  }

  const badgeSloganEl = document.getElementById('heroBadgeSlogan');
  if (badgeSloganEl) {
    badgeSloganEl.textContent = hero.badgeSlogan || (db.meta && db.meta.slogan) || 'Unggul dalam Prestasi, Berkarakter dalam Budaya';
  }

  const headlineEl = document.getElementById('heroHeadline');
  if (headlineEl && hero.headline) {
    headlineEl.innerHTML = hero.headline;
  }

  const descEl = document.getElementById('heroDescription');
  if (descEl && hero.description) {
    renderHeroDescriptionWithWords(descEl, hero.description);
  }

  const cta1El = document.getElementById('heroCta1');
  const cta1TextEl = document.getElementById('heroCta1Text');
  if (cta1TextEl && hero.cta1Text) cta1TextEl.textContent = hero.cta1Text;
  if (cta1El && hero.cta1Link) cta1El.setAttribute('href', hero.cta1Link);

  const cta2El = document.getElementById('heroCta2');
  const cta2TextEl = document.getElementById('heroCta2Text');
  if (cta2TextEl && hero.cta2Text) cta2TextEl.textContent = hero.cta2Text;
  if (cta2El && hero.cta2Link) cta2El.setAttribute('href', hero.cta2Link);

  try {
    initHeroTaglineRotator(db);
  } catch (e) {
    console.warn('initHeroTaglineRotator error:', e);
  }

  initHeroCtaInteractiveHover();
}

/* ==========================================================================
   0B. EXPANDING CIRCULAR RIPPLE HOVER EFFECT FOR HERO PRIMARY CTA
   Menyediakan animasi transisi warna dari titik kursor mouse (di mana pun pointer berada)
   yang menyebar secara melingkar ke seluruh tombol (Navy ke Kuning Emas).
   ========================================================================== */
function initHeroCtaInteractiveHover() {
  const cta = document.getElementById('heroCta1');
  if (!cta || cta.dataset.rippleEffectReady) return;
  cta.dataset.rippleEffectReady = 'true';

  let wave = cta.querySelector('.btn-ripple-wave');
  if (!wave) {
    wave = document.createElement('span');
    wave.className = 'btn-ripple-wave';
    cta.insertBefore(wave, cta.firstChild);
  }

  cta.addEventListener('mouseenter', (e) => {
    const rect = cta.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Hitung jarak terjauh ke 4 sudut tombol agar lingkaran kuning menutupi 100% tombol
    const maxDistX = Math.max(x, rect.width - x);
    const maxDistY = Math.max(y, rect.height - y);
    const radius = Math.ceil(Math.hypot(maxDistX, maxDistY));
    const size = radius * 2.2;

    // Reset posisi lingkaran tepat di koordinat mouse kursor
    wave.style.transition = 'none';
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.style.transform = 'translate(-50%, -50%) scale(0)';
    wave.style.opacity = '1';

    // Force reflow agar scale(0) pada koordinat baru terdaftar oleh browser
    void wave.offsetWidth;

    // Mulai animasi menyebar secara melingkar keluar dari titik kursor
    requestAnimationFrame(() => {
      wave.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease';
      cta.classList.add('is-hovered');
      wave.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  });

  cta.addEventListener('mouseleave', (e) => {
    const rect = cta.getBoundingClientRect();
    const exitX = Math.round(e.clientX - rect.left);
    const exitY = Math.round(e.clientY - rect.top);

    // Susutkan kembali ke arah titik keluar kursor secara mulus
    wave.style.transition = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease';
    wave.style.left = `${exitX}px`;
    wave.style.top = `${exitY}px`;
    wave.style.transform = 'translate(-50%, -50%) scale(0)';
    wave.style.opacity = '0';
    cta.classList.remove('is-hovered');
  });
}

/* 0C. RENDER HERO GATEWAY DOCK (QUICK ACCESS KBIHU & LBB) */
function renderHeroGateway(db) {
  const dock = document.getElementById('heroGatewayDock');
  if (!dock) return;
  const hg = db.heroGateway || {
    kbihu: { name: "KBIHU Haji & Umrah", tag: "Izin Kemenag", desc: "Bimbingan Manasik Teori & Praktik Miniatur Ka'bah", url: "kbihu.html" },
    lbb: { name: "LBB Sukses PTN", tag: "Terbuka Siswa Luar", desc: "Bimbel UTBK, SNBT & Simulasi CBT Laboratorium", url: "lbb.html" }
  };

  dock.innerHTML = `
    <!-- KBIHU Interactive Item -->
    <a href="${hg.kbihu.url || 'kbihu.html'}" class="hero-dock-item item-kbihu" title="Buka Portal ${hg.kbihu.name || 'KBIHU'}">
      <div class="hero-dock-icon icon-kbihu-emerald">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4v11l-9 4-9-4V7z"/><path d="M12 3v19"/><path d="M3 10.5l9 4 9-4"/><path d="M15 15.5v4.5"/></svg>
      </div>
      <div class="hero-dock-info">
        <div class="hero-dock-title-wrap">
          <strong class="hero-dock-name">${hg.kbihu.name || 'KBIHU Haji & Umrah'}</strong>
          <span class="hero-dock-tag tag-kbihu">${hg.kbihu.tag || 'Izin Kemenag'}</span>
        </div>
        <span class="hero-dock-desc">${hg.kbihu.desc || ''}</span>
      </div>
      <div class="hero-dock-action">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </a>

    <!-- Vertical Hairline Divider -->
    <div class="hero-dock-divider"></div>

    <!-- LBB Interactive Item -->
    <a href="${hg.lbb.url || 'lbb.html'}" class="hero-dock-item item-lbb" title="Buka Portal ${hg.lbb.name || 'LBB'}">
      <div class="hero-dock-icon icon-lbb-blue">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      </div>
      <div class="hero-dock-info">
        <div class="hero-dock-title-wrap">
          <strong class="hero-dock-name">${hg.lbb.name || 'LBB Sukses PTN'}</strong>
          <span class="hero-dock-tag tag-lbb">${hg.lbb.tag || 'Terbuka Siswa Luar'}</span>
        </div>
        <span class="hero-dock-desc">${hg.lbb.desc || ''}</span>
      </div>
      <div class="hero-dock-action">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </a>
  `;
}

/* 0D. RENDER TAB 4 PUSAT BIMBINGAN KHUSUS (KBIHU & LBB DUO GRID) */
function renderBimbinganTab(db) {
  const grid = document.getElementById('bimbinganDuoGrid');
  if (!grid) return;
  const kbihu = db.kbihuInfo || {};
  const lbb = db.lbbInfo || {};
  const kbihuHighlights = kbihu.highlights || [
    { title: "Miniatur Ka'bah & Lintasan Sa'i", desc: "Fasilitas simulasi manasik proporsional untuk kemantapan rukun dan wajib haji" },
    { title: "Bimbingan Langsung KH. Miftahul Falah", desc: "Kajian fiqih haji bersanad madzhab Syafi'i, bimbingan manasik intensif, dan pengawalan ibadah mabrur" },
    { title: "Layanan Konsultasi & Pendaftaran", desc: `Narahubung: ${kbihu.coordinator || "Ust. Yusuf Afif Rifa'i"} — Kontak WA: ${kbihu.whatsapp || '+62 856-0630-7911'}` }
  ];
  const lbbHighlights = lbb.highlights || [
    { title: "Laboratorium CBT & Tryout Terjadwal", desc: "Simulasi ujian komputer berstandar nasional dengan analisis skor dan ranking instan" },
    { title: "Terbuka Siswa Luar & Jadwal Fleksibel", desc: "Pilihan kelas sore & akhir pekan dibimbing tentor master lulusan perguruan tinggi ternama" },
    { title: "Layanan Informasi & Pendaftaran Siswa", desc: `Narahubung: ${lbb.coordinator || 'Ust. M. Wildan Pratama, M.Pd.'} — Kontak WA: ${lbb.whatsapp || '+62 813-5789-2244'}` }
  ];

  grid.innerHTML = `
    <!-- Kartu KBIHU Raudlatul Muta'allimin -->
    <div class="pesantren-card kbihu-featured-card">
      <div class="pesantren-card-media">
        <img src="${kbihu.image || 'assets/pesantren_gedung.jpg'}" alt="${kbihu.name || "KBIHU Raudlatul Muta'allimin"}" loading="lazy">
        <div class="pesantren-media-overlay">
          <span class="pesantren-badge-tag kbihu-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4v11l-9 4-9-4V7z"/><path d="M12 3v19"/><path d="M3 10.5l9 4 9-4"/><path d="M15 15.5v4.5"/></svg>
            Bimbingan Haji & Umrah
          </span>
          <span class="pesantren-status-pill">${kbihu.skKemenag ? 'Izin Resmi Kemenag' : 'Izin Kemenag'}</span>
        </div>
      </div>

      <div class="pesantren-card-body">
        <h3 class="pesantren-card-name">${kbihu.name || "KBIHU Raudlatul Muta'allimin"}</h3>
        <p class="pesantren-card-summary">
          ${kbihu.shortDesc || ''}
        </p>

        <div class="pesantren-card-highlights">
          ${kbihuHighlights.map(h => `
            <div class="highlight-item">
              <div class="highlight-icon-svg icon-emerald">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4v11l-9 4-9-4V7z"/><path d="M12 3v19"/><path d="M3 10.5l9 4 9-4"/><path d="M15 15.5v4.5"/></svg>
              </div>
              <div>
                <strong>${h.title}</strong>
                <p>${h.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="pesantren-card-footer">
          <a href="kbihu.html" class="btn btn-primary btn-sm">
            Buka Halaman Lengkap KBIHU →
          </a>
          <button type="button" class="btn btn-outline btn-sm" onclick="openUnitModal('kbihu')">
            Lihat Galeri & Foto Manasik
          </button>
        </div>
      </div>
    </div>

    <!-- Kartu LBB Raudlatul Muta'allimin -->
    <div class="pesantren-card lbb-featured-card">
      <div class="pesantren-card-media">
        <img src="${lbb.image || 'assets/lbb_bimbel_intensif.jpg'}" alt="${lbb.name || "LBB Raudlatul Muta'allimin"}" loading="lazy">
        <div class="pesantren-media-overlay">
          <span class="pesantren-badge-tag lbb-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            Bimbel Sukses PTN
          </span>
          <span class="pesantren-status-pill pill-blue">${(lbb.targetAudience && lbb.targetAudience.length <= 26) ? lbb.targetAudience : 'Terbuka Siswa Luar'}</span>
        </div>
      </div>

      <div class="pesantren-card-body">
        <h3 class="pesantren-card-name">${lbb.name || "LBB Raudlatul Muta'allimin"}</h3>
        <p class="pesantren-card-summary">
          ${lbb.shortDesc || ''}
        </p>

        <div class="pesantren-card-highlights">
          ${lbbHighlights.map(h => `
            <div class="highlight-item">
              <div class="highlight-icon-svg icon-blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <strong>${h.title}</strong>
                <p>${h.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="pesantren-card-footer">
          <a href="lbb.html" class="btn btn-primary btn-sm btn-lbb-primary">
            Buka Halaman Lengkap LBB →
          </a>
          <button type="button" class="btn btn-outline btn-sm" onclick="openUnitModal('lbb')">
            Lihat Fasilitas & Suasana Kelas
          </button>
        </div>
      </div>
    </div>
  `;
}

function initHeroTaglineRotator(db) {
  const hero = db.hero || (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.hero) || {};
  const taglines = hero.taglines && hero.taglines.length > 0 ? hero.taglines : [
    {
      badgeTag: hero.badgeTag || "Akreditasi Unggul (A)",
      badgeSlogan: hero.badgeSlogan || "Unggul dalam Prestasi, Berkarakter dalam Budaya",
      headline: hero.headline || "Pendidikan Terbaik untuk <span class=\"highlight\">Generasi Unggul</span> dan Berkarakter",
      description: hero.description || "Yayasan Taman Pendidikan Agama Islam Raudlatul Muta'allimin Lamongan mengintegrasikan kurikulum nasional, keunggulan sains terapan, serta keluhuran tradisi kepesantrenan salaf dalam satu ekosistem pendidikan modern."
    }
  ];

  const dots = document.querySelectorAll('.hero-tagline-dot');
  const counterEl = document.getElementById('heroTaglineCounter');
  const headlineEl = document.getElementById('heroHeadline');
  const descEl = document.getElementById('heroDescription');
  const badgeTagEl = document.getElementById('heroBadgeTag');
  const badgeSloganEl = document.getElementById('heroBadgeSlogan');
  const badgeContainer = document.querySelector('.hero-unified-badge');

  let textTransitionTimeouts = [];
  const clearTextTimeouts = () => {
    textTransitionTimeouts.forEach(t => clearTimeout(t));
    textTransitionTimeouts = [];
  };

  const showTagline = (idx, isImmediate = false) => {
    clearTextTimeouts();
    currentTaglineIdx = (idx + taglines.length) % taglines.length;
    const item = taglines[currentTaglineIdx];

    // 1. Update Navigation Dots & Counter
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === currentTaglineIdx);
    });

    if (counterEl) {
      counterEl.textContent = `0${currentTaglineIdx + 1} / 0${taglines.length}`;
    }

    // 2. Transisi Foto Latar Belakang (Mulai lebih awal secara halus)
    const slideEls = document.querySelectorAll('.hero-slide');
    const mobileSlideEls = document.querySelectorAll('.hero-mobile-photo-item');
    if (slideEls.length > 0) {
      const targetSlideIdx = currentTaglineIdx % slideEls.length;
      slideEls.forEach((s, i) => s.classList.toggle('active', i === targetSlideIdx));
      if (mobileSlideEls.length > 0) {
        mobileSlideEls.forEach((ms, i) => ms.classList.toggle('active', i === targetSlideIdx));
      }
    }

    if (isImmediate) {
      if (badgeTagEl && item.badgeTag) badgeTagEl.textContent = item.badgeTag;
      if (badgeSloganEl && item.badgeSlogan) badgeSloganEl.textContent = item.badgeSlogan;
      if (headlineEl) headlineEl.innerHTML = item.headline;
      if (descEl) renderHeroDescriptionWithWords(descEl, item.description);
      const mobileTagEl = document.getElementById('heroMobilePhotoTag');
      if (mobileTagEl && item.badgeTag) mobileTagEl.textContent = item.badgeTag;
      return;
    }

    // 3. Transisi Teks Berlapis & Tidak Bersamaan (Decoupled Soft Staggered)
    // Fase Keluar: Teks melarut lembut keluar dengan blur halus (0ms - 360ms)
    if (badgeContainer) badgeContainer.classList.add('hero-text-soft-exit');
    if (headlineEl) headlineEl.classList.add('hero-text-soft-exit');
    if (descEl) descEl.classList.add('hero-text-soft-exit');

    // Fase Ganti Konten DOM (t = 380ms, saat teks lama sudah tidak terlihat)
    textTransitionTimeouts.push(setTimeout(() => {
      if (badgeTagEl && item.badgeTag) badgeTagEl.textContent = item.badgeTag;
      if (badgeSloganEl && item.badgeSlogan) badgeSloganEl.textContent = item.badgeSlogan;
      if (headlineEl) headlineEl.innerHTML = item.headline;
      if (descEl) renderHeroDescriptionWithWords(descEl, item.description);
      const mobileTagEl = document.getElementById('heroMobilePhotoTag');
      if (mobileTagEl && item.badgeTag) {
        mobileTagEl.textContent = item.badgeTag;
      }
    }, 380));

    // Fase Masuk Bertahap (Staggered Cascade Entrance):
    // 1) Badge masuk pada 420ms
    textTransitionTimeouts.push(setTimeout(() => {
      if (badgeContainer) badgeContainer.classList.remove('hero-text-soft-exit');
    }, 420));

    // 2) Headline masuk lembut pada 540ms (jeda halus setelah foto & badge)
    textTransitionTimeouts.push(setTimeout(() => {
      if (headlineEl) headlineEl.classList.remove('hero-text-soft-exit');
    }, 540));

    // 3) Deskripsi menyusul masuk pada 660ms (kata-kata muncul perlahan satu per satu)
    textTransitionTimeouts.push(setTimeout(() => {
      if (descEl) descEl.classList.remove('hero-text-soft-exit');
    }, 660));
  };

  dots.forEach(dot => {
    dot.onclick = (e) => {
      e.stopPropagation();
      const slide = parseInt(dot.getAttribute('data-slide') || '0', 10);
      showTagline(slide, false);
      startTaglineLoop();
    };
  });

  const startTaglineLoop = () => {
    if (heroTaglineTimer) clearInterval(heroTaglineTimer);
    if (taglines.length <= 1) return;
    heroTaglineTimer = setInterval(() => {
      showTagline(currentTaglineIdx + 1, false);
    }, 7000);
  };

  // Initial set without jump
  showTagline(0, true);
  startTaglineLoop();
}

/* 0C. RENDER 4 PILAR NILAI DASAR PESANTREN (REF: MASKUMAMBANG) */
function renderCoreValues(db) {
  const container = document.getElementById('coreValuesGrid');
  if (!container) return;

  const values = db.coreValues && db.coreValues.length > 0 ? db.coreValues : (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.coreValues : []);

  const getIconSvg = (icon) => {
    switch (icon) {
      case 'book':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>`;
      case 'heart':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
      case 'lightbulb':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      case 'star':
      default:
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
  };

  const getTargetNum = (str) => {
    const clean = (str || '').replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 100;
  };

  const getSuffix = (str) => {
    if ((str || '').includes('+')) return '+';
    if ((str || '').includes('%')) return '%';
    if ((str || '').includes('Unit')) return ' Unit';
    return '';
  };

  container.innerHTML = values.map((val, idx) => `
    <div class="core-value-card scroll-reveal stagger-${(idx % 4) + 1}">
      <div class="core-value-card-top">
        <div class="core-value-header-row">
          <div class="core-value-icon-wrapper">
            <div class="core-value-icon-box">
              ${getIconSvg(val.icon)}
            </div>
          </div>
          <span class="core-value-index">0${idx + 1}</span>
        </div>
        <h3 class="core-value-title">${val.title}</h3>
        <p class="core-value-subtitle">${val.subtitle}</p>
      </div>
      <div class="core-value-stat-strip">
        <span class="core-value-stat-num stat-number" data-target="${getTargetNum(val.statNumber)}" data-suffix="${getSuffix(val.statNumber)}">${val.statNumber}</span>
        <span class="core-value-stat-lbl">${val.statLabel}</span>
      </div>
    </div>
  `).join('');

  initAnimatedCounters();
  if (typeof refreshScrollObserver === 'function') {
    refreshScrollObserver();
  }
}

/* 0D. RENDER AGENDA & JADWAL KEGIATAN PESANTREN (REF: MASKUMAMBANG) */
function renderAgenda(db) {
  const container = document.getElementById('agendaList');
  if (!container) return;

  const agenda = db.agenda && db.agenda.length > 0 ? db.agenda : (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.agenda : []);

  container.innerHTML = agenda.map(item => `
    <div class="agenda-item-card" onclick="openAgendaModal('${item.id}')">
      <div class="agenda-date-box">
        <span class="agenda-date-day">${item.dateDay}</span>
        <span class="agenda-date-month">${item.dateMonth}</span>
        <span class="agenda-date-year">${item.dateYear}</span>
      </div>
      <div class="agenda-item-content">
        <div class="agenda-item-badge-row">
          <span class="agenda-category-pill">${item.category}</span>
          <span class="agenda-status-pill">${item.status || 'Mendatang'}</span>
        </div>
        <h4 class="agenda-item-title">${item.title}</h4>
        <div class="agenda-meta-info">
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${item.timeRange}
          </span>
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${item.location}
          </span>
        </div>
        <p class="agenda-item-desc">${item.desc}</p>
      </div>
    </div>
  `).join('');
}

window.openAgendaModal = function(eventId) {
  const db = getDB();
  const agenda = (db.agenda || []).find(e => String(e.id) === String(eventId));
  if (!agenda) return;

  const modalTitle = document.getElementById('genericModalTitle');
  const modalBody = document.getElementById('genericModalBody');
  if (!modalTitle || !modalBody) return;

  modalTitle.innerHTML = `
    <span style="color:var(--color-primary); display:inline-flex; align-items:center; gap:8px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      Agenda Kegiatan Pesantren
    </span>
  `;

  modalBody.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div class="agenda-modal-date-strip">
        <div class="agenda-date-box" style="width:54px; height:60px;">
          <span class="agenda-date-day" style="font-size:1.3rem;">${agenda.dateDay}</span>
          <span class="agenda-date-month">${agenda.dateMonth}</span>
          <span class="agenda-date-year">${agenda.dateYear}</span>
        </div>
        <div>
          <span class="agenda-category-pill" style="margin-bottom:4px; display:inline-block;">${agenda.category}</span>
          <h3 style="font-size:1.15rem; color:var(--color-primary); margin:0;">${agenda.title}</h3>
        </div>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.85rem; color:#334155; margin-bottom:10px;">
          <div>
            <strong style="color:var(--color-primary-dark); display:block; margin-bottom:2px;">Waktu Pelaksanaan:</strong>
            <span>${agenda.timeRange}</span>
          </div>
          <div>
            <strong style="color:var(--color-primary-dark); display:block; margin-bottom:2px;">Lokasi / Tempat:</strong>
            <span>${agenda.location}</span>
          </div>
        </div>
        <div>
          <strong style="color:var(--color-primary-dark); display:block; margin-bottom:2px; font-size:0.85rem;">Status Acara:</strong>
          <span class="agenda-status-pill">${agenda.status || 'Mendatang / Terjadwal'}</span>
        </div>
      </div>

      <div style="font-size:0.95rem; color:#334155; line-height:1.7; margin-bottom:24px;">
        <h4 style="font-size:1rem; color:var(--color-primary); margin-bottom:8px;">Deskripsi & Informasi Kegiatan:</h4>
        <p>${agenda.desc}</p>
      </div>

      <div style="display:flex; gap:12px; justify-content:flex-end; flex-wrap:wrap; border-top:1px solid var(--color-border); padding-top:16px;">
        <button class="btn btn-outline btn-sm" onclick="closeGenericModal()">Tutup</button>
        <a href="https://wa.me/6285648847070?text=Assalamu%27alaikum%20Panitia%20YTPAI,%20saya%20ingin%20bertanya%20mengenai%20agenda:%20${encodeURIComponent(agenda.title)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          Konfirmasi Keikutsertaan via WA
        </a>
      </div>
    </div>
  `;

  openGenericModal();
};

/* 0C. RENDER VIDEO SHOWCASE & PARALLAX SECTION (REF: AL-MANAR) */
function renderVideoShowcase(db) {
  const v = db.videoShowcase || (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.videoShowcase) || {};

  const badgeTextEl = document.getElementById('parallaxBadgeText');
  if (badgeTextEl && v.badge) badgeTextEl.textContent = v.badge;

  const headlineEl = document.getElementById('parallaxHeadline');
  if (headlineEl && v.headline) headlineEl.innerHTML = v.headline;

  const descEl = document.getElementById('parallaxDesc');
  if (descEl && v.description) descEl.textContent = v.description;

  const tagEl = document.getElementById('parallaxVideoTag');
  if (tagEl && v.videoTag) tagEl.textContent = v.videoTag;

  const titleEl = document.getElementById('parallaxVideoTitle');
  if (titleEl && v.videoTitle) titleEl.textContent = v.videoTitle;

  const speakerEl = document.getElementById('parallaxSpeakerName');
  if (speakerEl && v.speakerName) {
    speakerEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"></circle><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path></svg>
      <span>${v.speakerName}</span>
    `;
  }

  const ctaBtn = document.getElementById('parallaxCtaBtn');
  const ctaText = document.getElementById('parallaxCtaText');
  if (ctaText && v.ctaText) ctaText.textContent = v.ctaText;
  if (ctaBtn && v.ctaLink) ctaBtn.setAttribute('href', v.ctaLink);

  const bgEl = document.getElementById('parallaxShowcaseBg');
  if (bgEl && v.bgImage) {
    bgEl.style.backgroundImage = `url('${v.bgImage}')`;
  }

  // Update YouTube iframe src if videoId changed
  const iframeEl = document.getElementById('parallaxIframe');
  if (iframeEl && v.youtubeId) {
    const targetSrc = `https://www.youtube-nocookie.com/embed/${v.youtubeId}?rel=0&modestbranding=1`;
    if (!iframeEl.src.includes(v.youtubeId)) {
      iframeEl.src = targetSrc;
    }
  }
}

/* 0D. DYNAMIC HARDWARE-ACCELERATED PARALLAX ENGINE */
function initParallaxScroll() {
  const section = document.getElementById('video-profil');
  const bg = document.getElementById('parallaxShowcaseBg');
  if (!section || !bg) return;

  let ticking = false;

  function updateParallax() {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Check if section is within or approaching viewport
    if (rect.bottom > -150 && rect.top < windowHeight + 150) {
      // Calculate progress from 0 (entering from bottom) to 1 (leaving from top)
      const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      // Map progress to smooth vertical translation (-90px to +90px)
      // As user scrolls down (progress increases), the background shifts smoothly from bottom to top!
      const offset = (progress - 0.5) * 190;
      bg.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // Initial trigger on load
  updateParallax();
}

/* 1. NAVBAR SCROLL & MOBILE MENU */
function initNavbar() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeDrawer = () => {
      mobileDrawer.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));

    // Tap outside to close drawer
    mobileDrawer.addEventListener('click', (e) => {
      if (e.target === mobileDrawer) closeDrawer();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('active')) {
        closeDrawer();
      }
    });
  }

  // Desktop & Hybrid Dropdown Enhancement (Click to Pin/Toggle + Outside Click to Close)
  const dropdownItems = document.querySelectorAll('.nav-item-dropdown');
  dropdownItems.forEach(item => {
    const trigger = item.querySelector('.nav-link-dropdown');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        // Pada layar desktop/laptop, klik pada trigger mem-pin buka dropdown agar stabil dan tidak hilang saat kursor bergerak
        if (window.innerWidth >= 992) {
          e.preventDefault();
          const wasOpen = item.classList.contains('is-open');
          dropdownItems.forEach(other => other.classList.remove('is-open'));
          if (!wasOpen) {
            item.classList.add('is-open');
          }
        }
      });
    }
  });

  // Klik di luar area dropdown atau tombol Escape untuk menutup dropdown yang ter-pin
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item-dropdown')) {
      dropdownItems.forEach(item => item.classList.remove('is-open'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdownItems.forEach(item => item.classList.remove('is-open'));
    }
  });
}

/* ==========================================================================
   EXECUTIVE SCROLL REVEAL & INTERACTION ENGINE
   Smooth Apple/Stripe-style physics, Reading Progress Bar & Back to Top
   ========================================================================== */
function initScrollEngine() {
  const progressBar = document.getElementById('scrollProgressBar');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Ultra-lightweight rAF throttled scroll handler for budget/low-end devices
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const height = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;

        // 1. Top Reading Scroll Progress Bar
        if (progressBar) {
          progressBar.style.width = scrolled + '%';
        }

        // 2. Navbar elevation on scroll
        if (navbar) {
          if (winScroll > 30) {
            if (!navbar.classList.contains('scrolled')) navbar.classList.add('scrolled');
          } else {
            if (navbar.classList.contains('scrolled')) navbar.classList.remove('scrolled');
          }
        }

        // 3. Floating Back to Top Button
        if (scrollTopBtn) {
          if (winScroll > 420) {
            if (!scrollTopBtn.classList.contains('visible')) scrollTopBtn.classList.add('visible');
          } else {
            if (scrollTopBtn.classList.contains('visible')) scrollTopBtn.classList.remove('visible');
          }
        }

        // 4. Update Active Navigation Link
        let currentSectionId = '';
        sections.forEach(sec => {
          const secTop = sec.offsetTop - 140;
          const secHeight = sec.offsetHeight;
          if (winScroll >= secTop && winScroll < secTop + secHeight) {
            currentSectionId = sec.getAttribute('id');
          }
        });

        if (currentSectionId) {
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentSectionId}`) {
              link.classList.add('active');
            } else if (href && href.startsWith('#')) {
              link.classList.remove('active');
            }
          });
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // Floating Back to Top Button Click
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Setup High-Performance IntersectionObserver for reveal animations
  // Setup High-Performance IntersectionObserver for soft, elegant reveal animations
  if ('IntersectionObserver' in window) {
    globalRevealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05
    });

    refreshScrollObserver();
  } else {
    // Fallback: reveal immediately for older browsers without IntersectionObserver
    document.querySelectorAll('.scroll-reveal, .scroll-reveal-soft, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .scroll-reveal-zoom')
      .forEach(el => el.classList.add('is-revealed'));
  }

  // Active scroll fallback: ensures elements smoothly reveal on scroll across all devices & iframes
  window.addEventListener('scroll', checkScrollRevealsFallback, { passive: true });

  // Initial check: reveal ONLY elements already visible in initial viewport
  checkScrollRevealsFallback();
  setTimeout(checkScrollRevealsFallback, 150);
  setTimeout(checkScrollRevealsFallback, 400);
}

function checkScrollRevealsFallback() {
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;
  const unrevealed = document.querySelectorAll(
    '.scroll-reveal:not(.is-revealed), .scroll-reveal-soft:not(.is-revealed), .scroll-reveal-left:not(.is-revealed), .scroll-reveal-right:not(.is-revealed), .scroll-reveal-scale:not(.is-revealed), .scroll-reveal-zoom:not(.is-revealed)'
  );
  if (unrevealed.length === 0) return;

  unrevealed.forEach(el => {
    const rect = el.getBoundingClientRect();
    // Soft reveal: trigger when element enters lower portion of viewport
    if (rect.top < vh - 30 && rect.bottom > 0) {
      el.classList.add('is-revealed');
      if (globalRevealObserver) {
        try { globalRevealObserver.unobserve(el); } catch (e) {}
      }
    }
  });
}

function refreshScrollObserver() {
  // Automatically attach smooth, luxurious scroll reveal & stagger across all modules
  const autoRevealSelectors = [
    // Section Headers & Badges & Titles
    '.section-header', '.section-header-center', '.psb-section-header', '.section-badge',
    // Foundation & Pillars
    '.pilar-card', '.pilar-exec-card', '.core-value-card',
    // Editorial Speech & Visimisi & Tentang
    '.editorial-main-headline', '.editorial-speech-block', '.visimisi-split-card', '.visimisi-hero-card',
    '.about-image-card', '.yayasan-vision-card', '.about-visit-card', '.about-history-banner', '.yayasan-mission-box', '.vision-pillar-card', '.mission-item',
    // Units of Education
    '.unit-grid > div', '.unit-card', '.unit-card-v2', '.unit-item-horizontal',
    // Asrama Santri
    '.asrama-showcase-card', '.asrama-feature-card',
    // Facilities & Buildings
    '.facilities-showcase-grid > article', '.facility-showcase-card', '.facility-card', '.facility-spec-card', '.facility-grid > div', '.fasilitas-card',
    // Extracurriculars
    '.ekskul-card',
    // News & Media
    '.news-grid > article', '.news-grid > div', '.news-card',
    // Highlights & Prestasi
    '.highlight-card-executive', '.prestasi-grid > div', '.prestasi-card', '.stat-card-executive',
    // Tahfidz & Student Creative Works
    '.tasmik-card', '.karya-grid > div', '.karya-card',
    // Leadership & History
    '.leader-grid > div', '.leader-card', '.pembina-card',
    '.timeline-item', '.timeline-card', '.muassis-card',
    '.history-stat-card', '.history-lead-card', '.history-archive-card', '.philosophy-card',
    // Programs & Gateways
    '.programs-grid > div', '.program-card', '.agenda-item-card', '.ppdb-gateway-card', '.hero-gateway-strip',
    // KBIHU & LBB Modules
    '.kbihu-grid > div', '.kbihu-card', '.kbihu-program-card', '.kbihu-package-card', '.kbihu-mentor-card', '.kbihu-step-card',
    '.lbb-card', '.lbb-briefing-card', '.lbb-mentor-card', '.lbb-day-card', '.lbb-timeline-step', '.lbb-pricing-card', '.lbb-matrix-wrap',
    // PSB & Registration Modules
    '.psb-step-card', '.psb-wave-card', '.psb-benefit-card', '.psb-beasiswa-card', '.psb-alur-card',
    '.psb-easy-step-card', '.psb-cost-card', '.duo-card',
    // Testimonials
    '.testi-card-v2',
    // FAQ & Contact
    '.faq-item', '.accordion-item', '.contact-info-card', '.contact-form-card',
    // Footer Blocks
    '.footer-brand', '.footer-col'
  ];

  document.querySelectorAll(autoRevealSelectors.join(', ')).forEach((el, idx) => {
    if (!el.classList.contains('scroll-reveal') && !el.classList.contains('scroll-reveal-soft') && !el.classList.contains('scroll-reveal-left') && !el.classList.contains('scroll-reveal-right') && !el.classList.contains('scroll-reveal-scale') && !el.classList.contains('scroll-reveal-zoom')) {
      el.classList.add('scroll-reveal');
      if (!el.className.includes('stagger-')) {
        el.classList.add(`stagger-${(idx % 6) + 1}`);
      }
    }
  });

  const unrevealed = document.querySelectorAll(
    '.scroll-reveal:not(.is-revealed), .scroll-reveal-soft:not(.is-revealed), .scroll-reveal-left:not(.is-revealed), .scroll-reveal-right:not(.is-revealed), .scroll-reveal-scale:not(.is-revealed), .scroll-reveal-zoom:not(.is-revealed)'
  );
  if (unrevealed.length === 0) return;

  const vh = window.innerHeight || document.documentElement.clientHeight || 800;
  unrevealed.forEach(el => {
    // If element is already in initial visible viewport on page load, reveal smoothly
    const rect = el.getBoundingClientRect();
    if (rect.top < vh - 40 && rect.bottom > 0) {
      el.classList.add('is-revealed');
      return;
    }
    if (globalRevealObserver) {
      globalRevealObserver.observe(el);
    } else {
      el.classList.add('is-revealed');
    }
  });
}

/* 2. ANIMATED COUNTERS - CINEMATIC SLOW-MO ENGINE */
function initAnimatedCounters() {
  const statsElements = document.querySelectorAll('.stat-number');
  if (!statsElements.length) return;

  const animateSingleCounter = (el) => {
    if (el.dataset.animating === 'true' || el.dataset.animated === 'true') return;
    el.dataset.animating = 'true';

    const target = parseInt(el.getAttribute('data-target') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target) || target <= 0) {
      el.dataset.animated = 'true';
      el.dataset.animating = 'false';
      return;
    }

    // Durasi slow-motion ~2600ms (2.6 detik) untuk kepuasan visual & presisi agung
    const duration = 2600;
    let startTime = null;

    // Visual polish: beri kelas glowing saat berputar slow-mo
    el.classList.add('is-counting-slowmo');
    el.textContent = '0' + suffix;

    // Easing Quartic Deceleration: start dinamis, lalu melambat perlahan (slow-mo) menuju target
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      // Hitung angka saat ini berdasarkan progres kurva slow-mo
      const currentVal = Math.round(easedProgress * target);
      el.textContent = currentVal.toLocaleString('id-ID') + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Tepat sampai di angka target
        el.textContent = target.toLocaleString('id-ID') + suffix;
        el.dataset.animated = 'true';
        el.dataset.animating = 'false';
        el.classList.remove('is-counting-slowmo');
        el.classList.add('counter-finished');
        setTimeout(() => el.classList.remove('counter-finished'), 800);
      }
    };

    window.requestAnimationFrame(step);
  };

  // Setup Observer presisi saat discroll masuk ke layar
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetEl = entry.target;
          if (targetEl.classList.contains('stat-number')) {
            animateSingleCounter(targetEl);
            obs.unobserve(targetEl);
          } else {
            // Container wrapper
            targetEl.querySelectorAll('.stat-number').forEach(s => animateSingleCounter(s));
            obs.unobserve(targetEl);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.15
    });

    const statsSections = document.querySelectorAll('.core-values-wrapper, .floating-stats-wrapper, #nilai-dasar');
    if (statsSections.length) {
      statsSections.forEach(sec => {
        // Jika sudah masuk layar pada viewport awal, jalankan
        const rect = sec.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < vh * 0.85 && rect.bottom > 0) {
          sec.querySelectorAll('.stat-number').forEach(s => animateSingleCounter(s));
        } else {
          counterObserver.observe(sec);
        }
      });
    } else {
      statsElements.forEach(el => counterObserver.observe(el));
    }
  } else {
    // Fallback untuk browser lawas
    statsElements.forEach(el => {
      const target = parseInt(el.getAttribute('data-target') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '';
      el.textContent = target.toLocaleString('id-ID') + suffix;
    });
  }
}

/* 3. RENDER SATUAN PENDIDIKAN */
function renderUnits(db) {
  const container = document.getElementById('unitsGrid');
  if (!container) return;

  function getCleanCategory(unit) {
    const map = {
      'kb': '<span class="desc-desktop">Kelompok Bermain</span><span class="desc-mobile">PAUD / KB</span>',
      'tk': '<span class="desc-desktop">Taman Kanak-Kanak</span><span class="desc-mobile">TK</span>',
      'mi': '<span class="desc-desktop">Madrasah Ibtidaiyah</span><span class="desc-mobile">MI</span>',
      'mts': '<span class="desc-desktop">Madrasah Tsanawiyah</span><span class="desc-mobile">MTs</span>',
      'smp': '<span class="desc-desktop">SMP Berkarakter</span><span class="desc-mobile">SMP</span>',
      'ma': '<span class="desc-desktop">Madrasah Aliyah</span><span class="desc-mobile">MA</span>',
      'sma': '<span class="desc-desktop">SMA Unggulan</span><span class="desc-mobile">SMA</span>'
    };
    if (map[unit.id]) return map[unit.id];
    return (unit.category || '').replace(/^Formal\s*\(/i, '').replace(/\)$/, '').trim();
  }

  function getCleanAccreditation(unit) {
    const accred = unit.accreditation || '';
    if (accred.includes('Unggul') || accred.includes('Akreditasi A')) {
      return 'Akreditasi A';
    }
    if (accred.includes('BAN-PAUD') || accred.includes('Terakreditasi')) {
      return 'Terakreditasi BAN';
    }
    return accred;
  }

  container.innerHTML = db.units.map((unit, idx) => {
    const isKbihu = unit.id === 'kbihu';
    const isLbb = unit.id === 'lbb';
    const cleanCategory = getCleanCategory(unit);
    const cleanAccred = getCleanAccreditation(unit);
    const badgeExtra = isKbihu ? `<span class="unit-special-pill pill-kbihu">Bimbingan Haji & Umrah Resmi Kemenag</span>`
      : isLbb ? `<span class="unit-special-pill pill-lbb">Bimbel Terbuka Siswa Luar & Santri</span>`
      : '';
    const standaloneLink = isKbihu ? `<a href="kbihu.html" class="unit-direct-portal-btn btn-portal-kbihu" onclick="event.stopPropagation()">Portal KBIHU ↗</a>`
      : isLbb ? `<a href="lbb.html" class="unit-direct-portal-btn btn-portal-lbb" onclick="event.stopPropagation()">Portal LBB ↗</a>`
      : '';

    return `
    <div class="unit-card ${isKbihu ? 'unit-card-highlight-kbihu' : ''} ${isLbb ? 'unit-card-highlight-lbb' : ''} scroll-reveal stagger-${(idx % 4) + 1}" onclick="openUnitModal('${unit.id}')">
      <div class="unit-thumb">
        <img src="${unit.image}" alt="${unit.name}" loading="lazy">
        ${badgeExtra}
      </div>
      <div class="unit-body">
        <div class="unit-card-meta-row">
          <span class="unit-category-kicker">
            <span class="unit-kicker-dot"></span>
            <span>${cleanCategory}</span>
          </span>
          ${cleanAccred ? `
            <span class="unit-accred-badge-pill" title="Status Akreditasi Resmi BAN-S/M">
              <span class="accred-star-icon">★</span>
              <span class="accred-grade-text">${cleanAccred}</span>
            </span>
          ` : ''}
        </div>
        <h3 class="unit-title">${unit.name}</h3>
        ${unit.headmaster ? `
          <div class="unit-headmaster-row" style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="event.stopPropagation(); openUnitModal('${unit.id}', 'tab-sambutan')" title="Baca Sambutan ${unit.headmaster}">
            ${unit.headmasterPhoto ? `
              <img src="${unit.headmasterPhoto}" alt="${unit.headmaster}" style="width:24px; height:28px; object-fit:cover; object-position:top center; border-radius:4px; border:1.5px solid #FBBF24; flex-shrink:0; box-shadow:0 1px 3px rgba(0,0,0,0.15);" onerror="this.style.display='none'">
            ` : `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            `}
            <span>${unit.leadershipTitle || (['mi', 'mts', 'ma'].includes(unit.id) ? 'Kepala Madrasah' : 'Kepala Sekolah')}: <strong>${unit.headmaster}</strong></span>
          </div>
        ` : ''}
        <p class="unit-desc">${unit.shortDesc}</p>
        <div class="unit-card-action-row">
          <span class="unit-link">
            Lihat Detail & Sambutan
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </span>
          ${standaloneLink}
        </div>
      </div>
    </div>
  `;
  }).join('');
  refreshScrollObserver();
}

/* 3B. RENDER PROGRAM UNGGULAN & KHIDMAH SANTRI */
function renderPrograms(db) {
  const container = document.getElementById('programsGrid');
  if (!container) return;

  const programs = db.programs && db.programs.length > 0 ? db.programs : [];
  container.innerHTML = programs.map((prog, idx) => `
    <div class="program-card scroll-reveal stagger-${(idx % 3) + 1}">
      <div class="program-card-thumb">
        <img src="${prog.image}" alt="${prog.title}" loading="lazy">
        <span class="program-category-pill">${prog.category}</span>
        ${prog.badge ? `<span class="program-badge-right">${prog.badge}</span>` : ''}
        <div class="program-thumb-title">
          <h4>${prog.title}</h4>
        </div>
      </div>
      <div class="program-card-body">
        <div class="program-target-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Sasaran: <strong>${prog.target}</strong></span>
        </div>
        <p class="program-card-desc">${prog.desc}</p>
        <div class="program-features-list">
          ${(prog.features || []).map(f => `
            <div class="program-feature-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${f}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
  refreshScrollObserver();
}

/* 4. RENDER DEWAN PIMPINAN & PEMBINA */
function renderLeadership(db) {
  if (!db || !db.leadership) return;

  const ketua = db.leadership.find(l => l.id === 'ketua-yayasan') || db.leadership[0];
  let pembinaList = db.leadership.filter(l => l.id !== 'ketua-yayasan');

  // Urutan etika kepesantrenan yang terhormat: Ketua -> Sekretaris -> Bendahara
  const roleSortOrder = { 'pengasuh-ketua': 1, 'pengasuh-sekretaris': 2, 'pengasuh-bendahara': 3 };
  pembinaList.sort((a, b) => (roleSortOrder[a.id] || 99) - (roleSortOrder[b.id] || 99));

  // 4A. Render Trio Peer Selector (Tampil Sejajar 3 Tokoh di HP)
  const peerSelector = document.getElementById('pembinaPeerSelector');
  if (peerSelector) {
    peerSelector.innerHTML = pembinaList.map((leader, idx) => {
      let roleLabel = 'Pengasuh';
      if ((leader.role || '').includes('Ketua')) roleLabel = 'Ketua';
      else if ((leader.role || '').includes('Sekretaris')) roleLabel = 'Sekretaris';
      else if ((leader.role || '').includes('Bendahara')) roleLabel = 'Bendahara';

      let shortName = leader.name;
      if (leader.name.includes('Miftahul Falah')) shortName = 'KH. Miftahul Falah';
      else if (leader.name.includes('Ghozi')) shortName = 'Dr. KH. Ghozi';
      else if (leader.name.includes('Nuschul Ibad')) shortName = 'KH. M. Nuschul Ibad';

      return `
        <button type="button" class="pembina-peer-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}" onclick="window.selectPembinaSlide(${idx})" aria-label="Lihat ${leader.name}">
          <span class="peer-btn-role">${roleLabel} Dewan Pengasuh</span>
          <span class="peer-btn-name">${shortName}</span>
        </button>
      `;
    }).join('');
  }

  // Helper: Ikon Spesialisasi Dewan Pengasuh yang Anggun & Representatif
  function getLeaderSpecialtyIcon(specialty, roleId) {
    const spec = (specialty || '').toLowerCase();
    const id = (roleId || '').toLowerCase();

    // 1. Syariah & Bahasa Arab (Dr. KH. Ghozi) -> Kitab Turats / Mushaf Terbuka
    if (spec.includes('syariah') || spec.includes('bahasa') || spec.includes('arab') || id.includes('sekretaris')) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M8 7h8"></path><path d="M8 11h6"></path></svg>`;
    }
    // 2. Pengasuhan & Tradisi Salaf Aswaja (KH. Miftahul Falah) -> Kubah Mihrab Sanad Aswaja
    if (spec.includes('pengasuhan') || spec.includes('salaf') || spec.includes('aswaja') || id.includes('ketua')) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.5 5 6.5 8 6.5 12a5.5 5.5 0 0 0 11 0c0-4-2-7-5.5-10z"/><path d="M12 12v6"/><path d="M9.5 18h5"/></svg>`;
    }
    // 3. Kemandirian Santri & Tata Kelola (KH. M. Nuschul Ibad) -> Kompas Integritas & Khidmah
    if (spec.includes('mandiri') || spec.includes('kelola') || spec.includes('bendahara') || id.includes('bendahara')) {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`;
    }
    // Default: Bintang 8 Islami
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  }

  // 4B. Render 3 Tokoh Dewan Pengasuh Cards (Sejajar Horisontal)
  const pembinaGrid = document.getElementById('pembinaGrid');
  if (pembinaGrid) {
    pembinaGrid.innerHTML = pembinaList.map((leader, idx) => `
      <div class="pembina-card pembina-${leader.id} scroll-reveal stagger-${(idx % 3) + 1}" data-index="${idx}" data-role-id="${leader.id}" id="pembinaCard-${idx}">
        <!-- Top Executive Crest Bar -->
        <div class="pembina-card-top-crest">
          <div class="pembina-card-gold-line"></div>
          <span class="pembina-crest-badge">
            ${leader.role.toUpperCase()}
          </span>
        </div>

        <!-- Elegant Rounded Portrait Frame -->
        <div class="pembina-photo-showcase">
          <div class="pembina-arch-frame">
            <img src="${leader.photo}" alt="${leader.name}" loading="lazy" class="pembina-portrait-img" 
                 style="--base-scale: ${leader.photoScale || 1}; --base-offset-y: ${leader.photoOffsetY || 0}%; transform: scale(${leader.photoScale || 1}) translateY(${leader.photoOffsetY || 0}%); transform-origin: center top;"
                 onerror="this.onerror=null; this.src='assets/leader_ketua.jpg';">
            <div class="pembina-arch-inner-glow"></div>
          </div>
        </div>

        <!-- Card Body -->
        <div class="pembina-card-body">
          <h3 class="pembina-name">${leader.name}</h3>
          
          <div class="pembina-specialty-pill" title="${leader.specialty || 'Keilmuan & Kepesantrenan'}">
            <span class="pembina-specialty-icon-circle">
              ${getLeaderSpecialtyIcon(leader.specialty, leader.id)}
            </span>
            <span class="pembina-specialty-text">${leader.specialty || 'Keilmuan & Kepesantrenan'}</span>
          </div>

          <div class="pembina-quote-box">
            <div class="pembina-quote-mark-wrap">
              <svg class="pembina-quote-mark" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>
            <p class="pembina-quote-text">${leader.speechTitle || 'Menjaga Kemurnian Sanad Keilmuan & Akhlak'}</p>
          </div>

          <button class="btn btn-outline btn-sm pembina-speech-btn" onclick="openSpeechModal('${leader.id}')">
            <span>Amanah Dewan Pengasuh</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // 4C. Render Dots Navigasi & Navigasi Panah
  const dotsContainer = document.getElementById('pembinaDots');
  if (dotsContainer) {
    dotsContainer.innerHTML = pembinaList.map((_, idx) => `
      <button type="button" class="pembina-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" onclick="window.selectPembinaSlide(${idx})" aria-label="Tokoh Pengasuh ${idx + 1}"></button>
    `).join('');
  }

  let currentPembinaIdx = 0;
  window.selectPembinaSlide = function(idx) {
    if (idx < 0) idx = 0;
    if (idx >= pembinaList.length) idx = pembinaList.length - 1;
    currentPembinaIdx = idx;

    // Update active class on peer buttons
    if (peerSelector) {
      peerSelector.querySelectorAll('.pembina-peer-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
      });
    }

    // Update dots
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.pembina-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
      });
    }

    // Scroll to card in horizontal track
    if (pembinaGrid) {
      const targetCard = pembinaGrid.querySelector(`[data-index="${idx}"]`);
      if (targetCard) {
        const gridRect = pembinaGrid.getBoundingClientRect();
        const cardRect = targetCard.getBoundingClientRect();
        const scrollOffset = targetCard.offsetLeft - (pembinaGrid.clientWidth - targetCard.clientWidth) / 2;
        pembinaGrid.scrollTo({ left: scrollOffset, behavior: 'smooth' });
      }
    }
  };

  const prevBtn = document.getElementById('pembinaPrevBtn');
  const nextBtn = document.getElementById('pembinaNextBtn');
  if (prevBtn) {
    prevBtn.onclick = () => window.selectPembinaSlide(currentPembinaIdx - 1);
  }
  if (nextBtn) {
    nextBtn.onclick = () => window.selectPembinaSlide(currentPembinaIdx + 1);
  }

  // Sinkronisasi otomatis saat user swipe manual dengan jari
  if (pembinaGrid) {
    let scrollTimeout;
    pembinaGrid.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const cards = pembinaGrid.querySelectorAll('.pembina-card');
        const gridCenter = pembinaGrid.scrollLeft + pembinaGrid.clientWidth / 2;
        let closestIdx = 0;
        let minDistance = Infinity;

        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.clientWidth / 2;
          const dist = Math.abs(cardCenter - gridCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
          }
        });

        currentPembinaIdx = closestIdx;
        if (peerSelector) {
          peerSelector.querySelectorAll('.pembina-peer-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === closestIdx);
          });
        }
        if (dotsContainer) {
          dotsContainer.querySelectorAll('.pembina-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === closestIdx);
          });
        }
      }, 60);
    }, { passive: true });
  }

  // 4B. Render Ketua Yayasan Sekaligus Sambutan Resmi (Monumental Executive Showcase)
  const sambutanKetuaContainer = document.getElementById('sambutanKetuaContainer');
  if (sambutanKetuaContainer && ketua) {
    const rawParagraphs = (ketua.speechContent || '').split('\n\n').filter(p => p.trim().length > 0);
    const excerptQuote = rawParagraphs[1] || rawParagraphs[0] || 'Yayasan kami didirikan atas tekad luhur para ulama dan sesepuh untuk menghadirkan oase pendidikan yang tidak sekadar mentransfer pengetahuan kognitif, melainkan menumbuhkan akhlaqul karimah serta memperkuat ketahanan tauhid para santri.';
    const displayParagraphs = rawParagraphs.length > 2 ? [rawParagraphs[0], rawParagraphs[2]] : rawParagraphs;

    sambutanKetuaContainer.innerHTML = `
      <div class="sambutan-ketua-royal-card">
        <!-- Top Luxury Header Bar (Single-Line Executive Banner) -->
        <div class="sambutan-royal-topbar">
          <div class="sambutan-royal-title-group">
            <span class="royal-crest-indicator" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
              </svg>
            </span>
            <span class="royal-title-desktop-txt">KALAM SAMBUTAN RESMI • KETUA YAYASAN</span>
            <span class="royal-title-mobile-txt">Sambutan Ketua Yayasan</span>
          </div>
          <div class="sambutan-bismillah-text" aria-label="Bismillahirrohmanirrohim">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div class="sambutan-status-pill">
            <span class="status-live-dot"></span>
            <span class="status-desktop-txt">Pimpinan Yayasan Aktif</span>
            <span class="status-mobile-txt">Aktif</span>
          </div>
        </div>

        <div class="sambutan-ketua-grid">
          <!-- Kolom Kiri: Foto Monumental & Identity Plaque -->
          <div class="sambutan-ketua-monumental-portrait scroll-reveal-left">
            <div class="portrait-arch-casing">
              <div class="portrait-gold-filigree-ring"></div>
              <img src="${ketua.photo}" alt="${ketua.name}" class="portrait-official-photo" onerror="this.onerror=null; this.src='assets/leader_ketua.jpg';">
              <div class="portrait-gold-vignette"></div>
            </div>

            <!-- Identity Plaque -->
            <div class="portrait-identity-plaque">
              <div class="plaque-office-tag">
                <span class="plaque-office-role-badge">KETUA</span>
                <span class="plaque-office-line-1">Yayasan Taman Pendidikan Agama Islam</span>
                <span class="plaque-office-line-2">Raudlatul Muta'allimin</span>
              </div>
              <h3 class="plaque-name">${ketua.name}</h3>
              <div class="plaque-meta">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span class="plaque-meta-desktop-txt">Amanah Kebijakan & Transformasi Pendidikan</span>
                <span class="plaque-meta-mobile-txt">Amanah Kebijakan & Transformasi</span>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Naskah Resmi Sambutan -->
          <div class="sambutan-ketua-editorial-content scroll-reveal-right">
            <div class="editorial-bismillah-opening" aria-label="Bismillahirrohmanirrohim">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <h2 class="editorial-main-headline">
              ${ketua.speechTitle || 'Membina Generasi Emas Berjiwa Santri dan Berdaya Saing Global'}
            </h2>
            <!-- Formal Body Paragraphs -->
            <div class="editorial-paragraphs">
              ${displayParagraphs.map(p => `<p class="editorial-paragraph">${p}</p>`).join('')}
            </div>

            <!-- Actions -->
            <div class="editorial-actions-bar">
              <button class="btn btn-primary btn-md royal-action-btn" onclick="openSpeechModal('${ketua.id}')">
                <span>Baca Sambutan Lengkap</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
              <a href="#unit" class="btn btn-outline btn-md royal-outline-btn">
                <span>Satuan Pendidikan (11 Unit)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Fallback if legacy #leadershipGrid still exists
  const legacyContainer = document.getElementById('leadershipGrid');
  if (legacyContainer && (!pembinaGrid || legacyContainer !== pembinaGrid)) {
    legacyContainer.innerHTML = db.leadership.map((leader, idx) => `
      <div class="leader-card scroll-reveal stagger-${(idx % 4) + 1}">
        <div class="leader-photo-wrap">
          <img src="${leader.photo}" alt="${leader.name}" loading="lazy">
        </div>
        <div class="leader-body">
          <h3 class="leader-name">${leader.name}</h3>
          <p class="leader-role">${leader.role}</p>
          <span class="leader-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ${leader.rating}
          </span>
          <button class="btn btn-outline btn-sm leader-btn" onclick="openSpeechModal('${leader.id}')">
            Baca Sambutan
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }
  if (legacyContainer && (!pembinaGrid || legacyContainer !== pembinaGrid)) {
    legacyContainer.innerHTML = db.leadership.map((leader, idx) => `
      <div class="leader-card scroll-reveal stagger-${(idx % 4) + 1}">
        <div class="leader-photo-wrap">
          <img src="${leader.photo}" alt="${leader.name}" loading="lazy">
        </div>
        <div class="leader-body">
          <h3 class="leader-name">${leader.name}</h3>
          <p class="leader-role">${leader.role}</p>
          <span class="leader-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ${leader.rating}
          </span>
          <button class="btn btn-outline btn-sm leader-btn" onclick="openSpeechModal('${leader.id}')">
            Baca Sambutan
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  refreshScrollObserver();
}

/* 5. RENDER FASILITAS UNGGULAN & ARSITEKTUR PESANTREN */
function renderFacilities(db) {
  const container = document.getElementById('facilitiesShowcaseGrid') || document.getElementById('facilitiesRow');
  if (!container) return;

  const facilities = db.facilities && db.facilities.length > 0 ? db.facilities : [];

  container.innerHTML = facilities.map((fac, idx) => {
    const features = fac.features && Array.isArray(fac.features) ? fac.features : [];
    const capacity = fac.capacity || 'Kapasitas Representatif';
    const category = fac.category || 'Fasilitas Unggulan';
    const target = fac.target || 'Santri Putra & Putri';

    return `
      <article class="facility-showcase-card scroll-reveal stagger-${(idx % 3) + 1}" onclick="openFacilityDetail('${fac.id}')" role="button" tabindex="0" aria-label="Lihat spesifikasi ${fac.name}">
        <div class="facility-showcase-thumb">
          <img src="${fac.image}" alt="${fac.name}" loading="lazy" class="facility-thumb-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=85';">
          <div class="facility-thumb-scrim"></div>
          <div class="facility-thumb-badges">
            <span class="facility-cat-badge">${category}</span>
            <span class="facility-cap-badge">${capacity}</span>
          </div>
        </div>
        <div class="facility-showcase-body">
          <div class="facility-target-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>${target}</span>
          </div>
          <h3 class="facility-showcase-title">${fac.name}</h3>
          <p class="facility-showcase-desc">${fac.desc}</p>
          
          <div class="facility-specs-chips">
            ${features.slice(0, 3).map(feat => `
              <span class="facility-spec-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                ${feat}
              </span>
            `).join('')}
          </div>

          <div class="facility-showcase-footer">
            <span class="facility-explore-btn">
              <span>Lihat Spesifikasi & Detail Galeri</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  refreshScrollObserver();
}

/* 5.5 RENDER EKSTRAKURIKULER & PEMBINAAN SANTRI (PRD 5.2 H) */
function renderExtracurriculars(db) {
  const container = document.getElementById('ekskulGrid');
  if (!container) return;

  const ekskulList = db.extracurriculars && db.extracurriculars.length > 0
    ? db.extracurriculars
    : (DEFAULT_YAYASAN_DATA.extracurriculars || []);

  container.innerHTML = ekskulList.map(ekskul => {
    const name = ekskul.name || ekskul.title || 'Ekstrakurikuler';
    const category = ekskul.category || 'Kepanduan & Karakter';
    const badge = ekskul.badge || '';
    const pembina = ekskul.pembina || ekskul.coach || '';
    const schedule = ekskul.schedule || ekskul.jadwal || '';
    const desc = ekskul.desc || ekskul.description || '';
    const features = Array.isArray(ekskul.features) ? ekskul.features : (Array.isArray(ekskul.achievements) ? ekskul.achievements : []);
    const image = ekskul.image || 'assets/hero_santri.jpg';

    return `
      <article class="ekskul-card scroll-reveal" id="ekskul-${ekskul.id}">
        <div class="ekskul-card-thumb">
          <img src="${image}" alt="${name}" class="ekskul-thumb-img" loading="lazy">
          <div class="ekskul-thumb-scrim"></div>
          <div class="ekskul-thumb-badges">
            <span class="ekskul-cat-badge">${category}</span>
            ${badge ? `<span class="ekskul-pill-badge">${badge}</span>` : ''}
          </div>
        </div>
        <div class="ekskul-card-body">
          ${pembina ? `
            <div class="ekskul-pembina-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Pembina: ${pembina}</span>
            </div>
          ` : ''}
          <h3 class="ekskul-title">${name}</h3>
          <p class="ekskul-desc">${desc}</p>
          
          ${schedule ? `
            <div class="ekskul-schedule-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${schedule}</span>
            </div>
          ` : ''}

          ${features.length > 0 ? `
            <div class="ekskul-features-list">
              ${features.map(f => `
                <div class="ekskul-feature-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>${f}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');

  refreshScrollObserver();
}

/* 6. RENDER WARTA & BERITA TERPADU (Filter Kategori, Realtime Search & Modal Reader) */
function initNewsControls() {
  const filterBtns = document.querySelectorAll('.news-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentNewsCategory = btn.getAttribute('data-category') || 'Semua';
      renderNews(getDB());
    });
  });

  const searchInput = document.getElementById('newsSearchInput');
  const clearBtn = document.getElementById('newsSearchClear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentNewsSearch = e.target.value.trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = currentNewsSearch.length > 0 ? 'flex' : 'none';
      }
      renderNews(getDB());
    });
  }
}

window.clearNewsSearch = function() {
  const searchInput = document.getElementById('newsSearchInput');
  const clearBtn = document.getElementById('newsSearchClear');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  currentNewsSearch = '';
  renderNews(getDB());
};

window.resetNewsFilters = function() {
  currentNewsCategory = 'Semua';
  currentNewsSearch = '';
  const searchInput = document.getElementById('newsSearchInput');
  const clearBtn = document.getElementById('newsSearchClear');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  const filterBtns = document.querySelectorAll('.news-filter-btn');
  filterBtns.forEach(b => {
    if (b.getAttribute('data-category') === 'Semua') {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  renderNews(getDB());
};

function renderNews(db) {
  const container = document.getElementById('newsGrid');
  const hpContainer = document.getElementById('newsGridHomepage');
  const featuredArea = document.getElementById('newsFeaturedArea');
  const countBadge = document.getElementById('newsCountBadge');
  const emptyState = document.getElementById('newsEmptyState');
  const newsList = db.news || [];

  // Render Berita Utama / Featured Headline on Portal Berita
  if (featuredArea) {
    if (newsList.length > 0 && currentNewsCategory === 'Semua' && !currentNewsSearch) {
      const featured = newsList.find(n => n.isFeatured) || newsList[0];
      featuredArea.style.display = 'block';
      featuredArea.innerHTML = `
        <div class="featured-news-card" onclick="openNewsModal(${featured.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openNewsModal(${featured.id});}" role="button" tabindex="0" aria-label="Buka Berita Utama: ${featured.title}">
          <div class="featured-news-media">
            <img src="${featured.image}" alt="${featured.title}" class="featured-news-img" loading="eager">
            <div class="featured-news-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
              <span>BERITA UTAMA</span>
            </div>
          </div>
          <div class="featured-news-body">
            <div>
              <div class="featured-news-meta-top">
                <span class="featured-cat-pill">${featured.category || 'Prestasi'}</span>
                <span class="featured-read-time">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${featured.readTime || '3 Menit'}
                </span>
              </div>
              <h2 class="featured-news-title">${featured.title}</h2>
              <p class="featured-news-desc">${featured.excerpt || (featured.content ? featured.content.substring(0, 160) + '...' : '')}</p>
            </div>
            <div class="featured-news-footer">
              <span class="featured-author-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${featured.author || 'Humas MA'} &bull; ${featured.date}
              </span>
              <span class="featured-read-more-btn">
                Baca Selengkapnya &rarr;
              </span>
            </div>
          </div>
        </div>
      `;
    } else {
      featuredArea.innerHTML = '';
      featuredArea.style.display = 'none';
    }
  }

  // Render 3 latest news on homepage
  if (hpContainer) {
    const latest3 = newsList.slice(0, 3);
    hpContainer.innerHTML = latest3.map((item, idx) => {
      let catClass = 'badge-cat-default';
      const catLower = (item.category || '').toLowerCase();
      if (catLower.includes('akademik') || catLower.includes('sains')) catClass = 'badge-cat-akademik';
      else if (catLower.includes('kegiatan')) catClass = 'badge-cat-kegiatan';
      else if (catLower.includes('bahasa')) catClass = 'badge-cat-bahasa';
      else if (catLower.includes('ppdb')) catClass = 'badge-cat-ppdb';

      return `
        <article class="news-card scroll-reveal stagger-${(idx % 3) + 1}" onclick="openNewsModal(${item.id})" role="button" tabindex="0" aria-label="Buka warta: ${item.title}">
          <div class="news-thumb">
            <img src="${item.image}" alt="${item.title}" loading="lazy" class="news-thumb-img">
            <span class="news-badge ${catClass}">${item.category}</span>
          </div>
          <div class="news-body">
            <div class="news-meta-top">
              <span class="news-date-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${item.date}
              </span>
              <span class="news-author-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${item.author}
              </span>
            </div>
            <h3 class="news-title" title="${item.title}">${item.title}</h3>
            <p class="news-excerpt">${item.excerpt}</p>
            <div class="news-footer-action">
              <span class="news-read-more">
                Baca Selengkapnya
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  if (!container) return;

  // Filter by category and search keyword
  const filtered = newsList.filter(item => {
    const matchCategory = currentNewsCategory === 'Semua' || 
      (item.category && item.category.toLowerCase().includes(currentNewsCategory.toLowerCase()));
    const matchSearch = !currentNewsSearch || 
      item.title.toLowerCase().includes(currentNewsSearch) ||
      (item.excerpt && item.excerpt.toLowerCase().includes(currentNewsSearch)) ||
      (item.content && item.content.toLowerCase().includes(currentNewsSearch)) ||
      (item.author && item.author.toLowerCase().includes(currentNewsSearch)) ||
      (item.category && item.category.toLowerCase().includes(currentNewsSearch));
    return matchCategory && matchSearch;
  });

  // Update counter pill
  if (countBadge) {
    if (currentNewsCategory !== 'Semua' || currentNewsSearch) {
      countBadge.textContent = `Menampilkan ${filtered.length} dari ${newsList.length} Warta`;
    } else {
      countBadge.textContent = `Total ${filtered.length} Warta Terbit`;
    }
  }

  // Handle empty state
  if (filtered.length === 0) {
    container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  } else {
    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
  }

  container.innerHTML = filtered.map((item, idx) => {
    let catClass = 'badge-cat-default';
    const catLower = (item.category || '').toLowerCase();
    if (catLower.includes('akademik') || catLower.includes('sains')) catClass = 'badge-cat-akademik';
    else if (catLower.includes('kegiatan')) catClass = 'badge-cat-kegiatan';
    else if (catLower.includes('bahasa')) catClass = 'badge-cat-bahasa';
    else if (catLower.includes('ppdb')) catClass = 'badge-cat-ppdb';

      return `
        <article class="news-card scroll-reveal stagger-${(idx % 3) + 1}" onclick="openNewsModal(${item.id})" role="button" tabindex="0" aria-label="Buka warta: ${item.title}">
          <div class="news-thumb">
            <img src="${item.image}" alt="${item.title}" loading="lazy" class="news-thumb-img">
            <span class="news-badge ${catClass}">${item.category}</span>
          </div>
        <div class="news-body">
          <div class="news-meta-top">
            <span class="news-date-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${item.date}
            </span>
            <span class="news-author-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${item.author}
            </span>
          </div>
          <h3 class="news-title" title="${item.title}">${item.title}</h3>
          <p class="news-excerpt">${item.excerpt}</p>
          <div class="news-footer-action">
            <span class="news-read-more">
              Baca Selengkapnya
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');
  refreshScrollObserver();
}

function safeTruncateWords(str, maxWords = 18) {
  if (!str) return '';
  const words = str.trim().split(/\s+/);
  if (words.length <= maxWords) return str;
  return words.slice(0, maxWords).join(' ') + '...';
}

function renderProfilHighlights(db) {
  const container = document.getElementById('aboutHighlightsGrid');
  if (!container) return;

  const newsList = db.news || [];
  const achList = db.achievements || [];

  const topAch = achList[0] || {
    id: "ach-1",
    title: "Membanggakan! Kontingen Pramuka Gudep Pesantren Raih Juara Umum Jambore Daerah",
    winner: "Kontingen Pramuka MTs & MA",
    unit: "MTs & MA Raudlatul Muta'allimin",
    category: "Kepanduan",
    year: "2026",
    image: "assets/kegiatan_pramuka_santri.jpg",
    desc: "Kontingen Pramuka Gugus Depan Pondok Pesantren Raudlatul Muta'allimin sukses menorehkan prestasi gemilang sebagai Juara Umum Jambore Daerah se-Jawa Timur."
  };

  const achImageSrc = (topAch.image && !topAch.image.includes('1526976668912-1a811878dd37') && !topAch.image.includes('photo-1526976668912')) 
    ? topAch.image 
    : 'assets/kegiatan_pramuka_santri.jpg';

  const topNews = (newsList.find(n => n.isFeatured) || newsList[0]) || {
    id: 1,
    title: "Orientasi Santri Baru & Pembukaan Tahun Ajaran 2026/2027 Berlangsung Khidmat",
    category: "Kegiatan Pesantren",
    date: "10 Sep 2026",
    author: "Humas Pesantren",
    image: "assets/hero_santri.jpg",
    excerpt: "Ratusan santri baru bersama wali santri memadati kompleks yayasan dalam rangka pembukaan tahun ajaran baru dan ta'aruf pesantren."
  };

  container.innerHTML = `
    <!-- Card 1: Highlight Prestasi Santri Terkini -->
    <div class="highlight-card-executive highlight-card-prestasi scroll-reveal stagger-1" onclick="openPrestasiDetail('${topAch.id}')" role="button" tabindex="0" aria-label="Buka Highlight Prestasi: ${topAch.title}">
      <div class="highlight-card-top-row">
        <span class="highlight-badge badge-gold-glow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span class="desc-desktop">TOREHAN PRESTASI TERBARU</span><span class="desc-mobile">PRESTASI TERBARU</span>
        </span>
        <span class="highlight-pill-year">Tahun ${topAch.year || '2026'}</span>
      </div>

      <div class="highlight-card-content-layout">
        <div class="highlight-card-media">
          <img src="${achImageSrc}" alt="${topAch.title}" loading="lazy" class="highlight-card-img" onerror="this.onerror=null; this.src='assets/kegiatan_pramuka_santri.jpg';">
          <span class="highlight-media-cat">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle; margin-right:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            ${topAch.category || 'Prestasi'}
          </span>
        </div>
        <div class="highlight-card-info">
          <div class="highlight-winner-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            <span>${topAch.winner} &bull; ${topAch.unit}</span>
          </div>
          <h4 class="highlight-card-title">${topAch.title}</h4>
          <p class="highlight-card-excerpt">${safeTruncateWords(topAch.desc, 18)}</p>
          <div class="highlight-card-footer">
            <span class="highlight-action-link">
              Lihat Detail Prestasi
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Highlight Berita & Warta Utama Terkini -->
    <div class="highlight-card-executive highlight-card-berita scroll-reveal stagger-2" onclick="openNewsModal(${topNews.id})" role="button" tabindex="0" aria-label="Buka Warta Terkini: ${topNews.title}">
      <div class="highlight-card-top-row">
        <span class="highlight-badge badge-navy-glow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
          <span class="desc-desktop">WARTA TERKINI PESANTREN</span><span class="desc-mobile">WARTA TERKINI</span>
        </span>
        <span class="highlight-pill-date">${topNews.date}</span>
      </div>

      <div class="highlight-card-content-layout">
        <div class="highlight-card-media">
          <img src="${topNews.image || 'assets/hero_santri.jpg'}" alt="${topNews.title}" loading="lazy" class="highlight-card-img" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
          <span class="highlight-media-cat cat-news">${topNews.category || 'Warta'}</span>
        </div>
        <div class="highlight-card-info">
          <div class="highlight-author-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>${topNews.author || 'Humas Yayasan'} &bull; ${topNews.category || 'Berita'}</span>
          </div>
          <h4 class="highlight-card-title">${topNews.title}</h4>
          <p class="highlight-card-excerpt">${safeTruncateWords(topNews.excerpt || topNews.content, 18)}</p>
          <div class="highlight-card-footer">
            <span class="highlight-action-link">
              Baca Warta Lengkap
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPrestasiHomepage(db) {
  const container = document.getElementById('prestasiGridHomepage');
  if (!container) return;

  const list = (db.achievements || []).slice(0, 3);
  if (list.length === 0) return;

  container.innerHTML = list.map((item, idx) => {
    const itemImg = (item.image && !item.image.includes('1526976668912-1a811878dd37') && !item.image.includes('photo-1526976668912'))
      ? item.image
      : (item.id === 'ach-1' ? 'assets/kegiatan_pramuka_santri.jpg' : 'assets/hero_santri.jpg');
    return `
    <article class="news-card scroll-reveal stagger-${(idx % 3) + 1}" onclick="openPrestasiDetail('${item.id}')" role="button" tabindex="0" aria-label="Buka prestasi: ${item.title}">
      <div class="news-thumb">
        <img src="${itemImg}" alt="${item.title}" loading="lazy" class="news-thumb-img" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
        <span class="news-badge badge-cat-gold">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle; margin-right:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          ${item.category || 'Prestasi'}
        </span>
      </div>
      <div class="news-body">
        <div class="news-meta-top">
          <span class="news-date-tag" style="color:var(--color-gold); font-weight:700;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            Tahun ${item.year || '2026'}
          </span>
          <span class="news-author-tag" title="${item.winner}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${item.winner}
          </span>
        </div>
        <h3 class="news-title" title="${item.title}">${item.title}</h3>
        <p class="news-excerpt">${safeTruncateWords(item.desc, 18)}</p>
        <div class="news-footer-action">
          <span class="news-read-more" style="color:var(--color-primary);">
            Lihat Keterangan Lomba
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </div>
    </article>
    `;
  }).join('');
}

window.switchBeritaHpTab = function(tab) {
  const btnBerita = document.getElementById('tabBtnBeritaHp');
  const btnPrestasi = document.getElementById('tabBtnPrestasiHp');
  const paneBerita = document.getElementById('beritaHpPane');
  const panePrestasi = document.getElementById('prestasiHpPane');

  if (tab === 'prestasi') {
    if (btnBerita) { btnBerita.classList.remove('active'); btnBerita.setAttribute('aria-selected', 'false'); }
    if (btnPrestasi) { btnPrestasi.classList.add('active'); btnPrestasi.setAttribute('aria-selected', 'true'); }
    if (paneBerita) paneBerita.style.display = 'none';
    if (panePrestasi) panePrestasi.style.display = 'block';
  } else {
    if (btnPrestasi) { btnPrestasi.classList.remove('active'); btnPrestasi.setAttribute('aria-selected', 'false'); }
    if (btnBerita) { btnBerita.classList.add('active'); btnBerita.setAttribute('aria-selected', 'true'); }
    if (panePrestasi) panePrestasi.style.display = 'none';
    if (paneBerita) paneBerita.style.display = 'block';
  }
};

/* ==========================================================================
   SMART CONTEXTUAL RELATED NEWS ALGORITHM & PROFESSIONAL ARTICLE VIEWER
   ========================================================================== */
function getSmartRelatedNews(currentItem, allNews, limit = 3) {
  if (!allNews || allNews.length <= 1) return [];

  const currentCategory = (currentItem.category || '').toLowerCase().trim();
  const currentTitle = (currentItem.title || '').toLowerCase();
  
  // Keyword extractor (ignoring common Indonesian stop words)
  const stopWords = new Set([
    'yang', 'untuk', 'pada', 'dalam', 'dengan', 'dan', 'dari', 'atau', 'akan', 'oleh',
    'serta', 'resmi', 'tahun', 'raih', 'babat', 'lamongan', 'raudlatul', 'mutaallimin',
    'muta\'allimin', 'ytpai', 'santri', 'pesantren', 'menjadi', 'dapat', 'lebih', 'tentang'
  ]);
  const currentWords = currentTitle
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));

  const scored = allNews
    .filter(n => String(n.id) !== String(currentItem.id))
    .map(n => {
      let score = 0;
      const cat = (n.category || '').toLowerCase().trim();
      
      // High score for same category
      if (cat === currentCategory) {
        score += 12;
      }

      // Keyword matches in title or content/excerpt
      const targetTitle = (n.title || '').toLowerCase();
      const targetContent = (n.content || n.excerpt || '').toLowerCase();

      currentWords.forEach(w => {
        if (targetTitle.includes(w)) score += 6;
        if (targetContent.includes(w)) score += 2;
      });

      return { item: n, score };
    });

  // Sort by relevance score descending, then by newest id
  scored.sort((a, b) => b.score - a.score || Number(b.item.id) - Number(a.item.id));

  return scored.slice(0, limit).map(s => s.item);
}

window.showNewsToast = function(message) {
  let toast = document.getElementById('newsToastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'newsToastNotification';
    toast.className = 'news-toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div class="news-toast-inner">
      <div class="news-toast-icon-badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.8"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <span class="news-toast-text">${message || 'Tautan warta berhasil disalin!'}</span>
    </div>
  `;
  // Reset animation cleanly
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  
  if (window._newsToastTimer) clearTimeout(window._newsToastTimer);
  window._newsToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
};

window.copyArticleLink = function(customUrl) {
  const url = customUrl || (window.location.origin + window.location.pathname + '#berita');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      window.showNewsToast("Tautan warta berhasil disalin!");
    }).catch(() => {
      prompt("Salin tautan berita resmi ini:", url);
    });
  } else {
    prompt("Salin tautan berita resmi ini:", url);
  }
};

window.openNewsModal = function(newsId) {
  const db = (typeof getDB === 'function' ? getDB() : window.APP_DB) || {};
  const newsList = db.news || [];
  const itemIndex = newsList.findIndex(n => String(n.id) === String(newsId) || Number(n.id) === Number(newsId));
  if (itemIndex === -1) return;

  const item = newsList[itemIndex];
  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle');
  const body = document.getElementById('genericModalBody');

  if (!modal || !body) return;

  if (title) {
    title.innerHTML = `
      <div class="news-modal-top-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
        <span>Warta & Informasi Resmi Yayasan</span>
      </div>
    `;
  }

  // Format content paragraphs with refined editorial styling
  const rawContent = item.content || item.excerpt || 'Kabar terbaru dari YTPAI Raudlatul Muta\'allimin Lamongan.';
  const paragraphs = rawContent
    .split('\n\n')
    .filter(p => p.trim().length > 0)
    .map((p, idx) => {
      const cleanP = p.trim().replace(/\n/g, '<br>');
      return `<p class="article-paragraph ${idx === 0 ? 'article-lead-p' : ''}">${cleanP}</p>`;
    })
    .join('');

  // Prepare WhatsApp share
  const shareTitle = item.title || 'Warta YTPAI Raudlatul Muta\'allimin';
  const articleUrl = window.location.origin + window.location.pathname + '#berita';
  const waShareText = encodeURIComponent(`*${shareTitle}*\n\nSimak warta resmi selengkapnya dari YTPAI Raudlatul Muta'allimin Lamongan:\n${articleUrl}`);

  // Smart Contextual Related News
  const relatedNews = getSmartRelatedNews(item, newsList, 3);

  // Prev & Next navigation
  const prevItem = itemIndex > 0 ? newsList[itemIndex - 1] : null;
  const nextItem = itemIndex < newsList.length - 1 ? newsList[itemIndex + 1] : null;

  body.innerHTML = `
    <article class="news-article-view">
      <!-- 1. Breadcrumb & Meta Toolbar -->
      <div class="article-meta-header-box">
        <div class="article-breadcrumb-nav">
          <span>Portal Warta</span>
          <span class="bc-sep">›</span>
          <span class="bc-cat">${item.category || 'Berita'}</span>
        </div>
        <div class="article-meta-pills-row">
          <span class="article-category-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            ${item.category || 'Warta'}
          </span>
          <span class="article-meta-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${item.date || 'Terkini'}
          </span>
          <span class="article-meta-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            ${item.author || 'Redaksi Humas'}
          </span>
          <span class="article-meta-pill pill-readtime">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${item.readTime || '3 Menit Baca'}
          </span>
          <span class="article-meta-pill pill-verified">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Rilis Resmi Yayasan
          </span>
        </div>
      </div>

      <!-- 2. Headline Utama -->
      <h1 class="article-headline">${item.title}</h1>

      <!-- 3. Kotak Intisari & Ringkasan Warta (Lead Box) -->
      ${item.excerpt ? `
        <div class="article-lead-box">
          <div class="lead-box-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>Intisari & Ringkasan Berita</span>
          </div>
          <p class="lead-box-text">${item.excerpt}</p>
        </div>
      ` : ''}

      <!-- 4. Hero Visual Dokumentasi -->
      <div class="article-hero-image-wrap">
        <div class="article-hero-img-container">
          <img src="${item.image || 'assets/hero_santri.jpg'}" alt="${item.title}" class="article-hero-img" loading="lazy" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
          <div class="article-hero-scrim"></div>
          <div class="article-hero-caption-overlay">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Dokumentasi Resmi Redaksi Media & Humas YTPAI Raudlatul Muta'allimin Babat Lamongan</span>
          </div>
        </div>
      </div>

      <!-- 5. Isi Narasi Berita Editorial -->
      <div class="article-content-body">
        ${paragraphs}
      </div>

      <!-- 6. Interactive Multi-Platform Share Toolbar -->
      <div class="article-share-bar-modern">
        <div class="share-bar-left">
          <div class="share-bar-label">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="2.2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span>Bagikan Warta:</span>
          </div>
          <div class="share-bar-btns">
            <a href="https://api.whatsapp.com/send?text=${waShareText}" target="_blank" rel="noopener noreferrer" class="btn-share-pill btn-share-pill-wa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              WhatsApp
            </a>
            <button type="button" class="btn-share-pill" onclick="copyArticleLink()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Salin Tautan
            </button>
          </div>
        </div>
        <div class="share-bar-verified">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span>Pemberitaan Terverifikasi</span>
        </div>
      </div>

      <!-- 7. Navigasi Switcher Warta Sebelumnya & Selanjutnya -->
      ${(prevItem || nextItem) ? `
        <div class="article-prev-next-nav">
          ${prevItem ? `
            <button type="button" class="btn-nav-article prev" onclick="openNewsModal(${prevItem.id})">
              <span class="nav-dir">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Warta Sebelumnya
              </span>
              <span class="nav-title">${prevItem.title}</span>
            </button>
          ` : `<div class="nav-spacer"></div>`}
          
          ${nextItem ? `
            <button type="button" class="btn-nav-article next" onclick="openNewsModal(${nextItem.id})">
              <span class="nav-dir">
                Warta Selanjutnya
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
              <span class="nav-title">${nextItem.title}</span>
            </button>
          ` : `<div class="nav-spacer"></div>`}
        </div>
      ` : ''}

      <!-- 8. REKOMENDASI WARTA BERKAITAN (Contextual Related News Deck) -->
      ${relatedNews.length > 0 ? `
        <div class="article-related-box">
          <div class="related-section-header">
            <div class="related-header-text">
              <div class="related-badge-strip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C59B27" stroke-width="2.5"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                <span>Rekomendasi Warta Berkaitan</span>
              </div>
              <h4 class="related-main-title">Warta Pilihan Seputar ${item.category || 'Pesantren'}</h4>
            </div>
            <span class="related-topic-pill">Kategori Terkait</span>
          </div>

          <div class="related-grid-modern">
            ${relatedNews.map((rel) => `
              <article class="related-card-modern" onclick="openNewsModal(${rel.id})" role="button" tabindex="0" aria-label="Buka warta: ${rel.title}">
                <div class="related-card-thumb-wrap">
                  <img src="${rel.image || 'assets/hero_santri.jpg'}" alt="${rel.title}" class="related-card-thumb" loading="lazy" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
                  <span class="related-card-cat-badge">${rel.category}</span>
                </div>
                <div class="related-card-content">
                  <div class="related-card-meta">
                    <span class="related-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      ${rel.date}
                    </span>
                    <span class="related-meta-sep">&bull;</span>
                    <span class="related-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      ${rel.readTime || '3 Menit'}
                    </span>
                  </div>
                  <h5 class="related-card-title">${rel.title}</h5>
                  <div class="related-card-action">
                    <span>Baca Warta</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 9. Modal Bottom Actions & Official CTA -->
      <div class="article-modal-footer">
        <div class="article-footer-left">
          <a href="psb.html" class="btn btn-primary btn-sm" onclick="closeGenericModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Daftar Santri Baru (PSB) →
          </a>
          <a href="https://wa.me/6285648847070?text=Halo%20Humas%20YTPAI%20Raudlatul%20Mutaallimin,%20saya%20ingin%20berkonsultasi%20terkait%20warta:%20${encodeURIComponent(item.title)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            Tanya Humas
          </a>
        </div>
        <button type="button" class="btn btn-outline btn-sm btn-close-warta" onclick="closeGenericModal()">
          Tutup Warta
        </button>
      </div>
    </article>
  `;

  // Ensure modal is activated and reset scroll position to top
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  body.scrollTop = 0;
};

/* ==========================================================================
   INTERACTIVE SEGMENTED TABS CONTROLLER (COMPACT CONSOLIDATED SECTIONS)
   ========================================================================== */
function initSegmentedTabs() {
  const tabButtons = document.querySelectorAll('.segmented-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-tab-group');
      const targetId = btn.getAttribute('data-target');

      // 1. Update button states in this tab group
      document.querySelectorAll(`.segmented-tab-btn[data-tab-group="${group}"]`).forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // 2. Switch tab pane
      const parentSection = btn.closest('section');
      if (parentSection) {
        parentSection.querySelectorAll('.segmented-tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });
      }
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        // Instantly reveal all elements in the activated tab pane
        targetPane.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale')
          .forEach(el => el.classList.add('is-revealed'));
        refreshScrollObserver();
        if (targetId === 'tab-prestasi') {
          setTimeout(() => {
            if (typeof setupPrestasiCarousel === 'function') {
              setupPrestasiCarousel();
            }
          }, 60);
        }
      }
    });
  });

  // Deep linking and anchor interception
  function activateTabByHash(hash) {
    if (!hash) return;
    const cleanHash = hash.replace('#', '').toLowerCase();

    const tabRouting = {
      'unit': 'tab-satuan-formal',
      'pendidikan': 'tab-satuan-formal',
      'pesantren': 'tab-pesantren',
      'asrama': 'tab-pesantren',
      'program': 'tab-program',
      'bimbingan': 'tab-layanan-khusus',
      'layanan-khusus': 'tab-layanan-khusus',
      'kbihu': 'tab-layanan-khusus',
      'lbb': 'tab-layanan-khusus',
      'berita': 'tab-warta',
      'warta': 'tab-warta',
      'prestasi': 'tab-prestasi',
      'karya': 'tab-karya'
    };

    const targetTabId = tabRouting[cleanHash];
    if (targetTabId) {
      const btn = document.querySelector(`.segmented-tab-btn[data-target="${targetTabId}"]`);
      if (btn) {
        btn.click();
      }
    }
  }

  // Global helper to switch education tabs and scroll smoothly to #unit
  window.switchPendidikanTab = function(targetTabId) {
    const btn = document.querySelector(`.segmented-tab-btn[data-target="${targetTabId}"]`);
    if (btn) {
      btn.click();
      const unitSection = document.getElementById('unit');
      if (unitSection) {
        unitSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Intercept anchor clicks
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      activateTabByHash(href);
    });
  });

  // Initial load check
  if (window.location.hash) {
    setTimeout(() => activateTabByHash(window.location.hash), 150);
  }
}

/* ==========================================================================
   7. PRESTASI SANTRI & GURU - SMOOTH CAROUSEL (AUTO 3s + MANUAL CONTROLS)
   Ref: Maskumambang Style Showcase (Smooth 3s Interval, Touch/Drag, Buttons, Dots)
   ========================================================================== */
let prestasiCarouselTimer = null;
let currentPrestasiIndex = 0;
let isPrestasiInteracting = false;

function initFilterTabs() {
  const container = document.getElementById('prestasiFilterTabs');
  if (!container) return;
  const tabButtons = container.querySelectorAll('.filter-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      const category = btn.getAttribute('data-category');
      renderAchievements(getDB(), category);
    });
  });
}

function renderAchievements(db, category) {
  const container = document.getElementById('achievementsGrid');
  if (!container) return;

  const rawList = db.achievements || [];
  const filtered = category === 'Semua' 
    ? rawList 
    : rawList.filter(a => a.category === category);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; width: 100%; color: var(--color-text-muted);">
        <p>Belum ada data prestasi untuk kategori <strong>${category}</strong>.</p>
      </div>
    `;
    const dots = document.getElementById('prestasiDots');
    if (dots) dots.innerHTML = '';
    return;
  }

  container.innerHTML = filtered.map((a, idx) => `
    <div class="prestasi-slide-card" data-index="${idx}">
      <div class="prestasi-card-inner" onclick="if(!window._prestasiIsDragging) openPrestasiDetail('${a.id}')" role="button" tabindex="0" title="Klik untuk melihat rincian & keterangan prestasi">
        <div class="prestasi-media-wrap">
          <img src="${a.image || 'assets/hero_santri.jpg'}" alt="${a.title}" class="prestasi-img" loading="lazy" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
          <div class="prestasi-scrim-gradient"></div>
          
          <div class="prestasi-top-badges">
            <span class="prestasi-year-badge">${a.year || '2026'}</span>
            <span class="prestasi-cat-badge">${a.category || 'Prestasi'}</span>
          </div>

          <div class="prestasi-overlay-box">
            <span class="prestasi-winner-tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              ${a.winner} • ${a.unit}
            </span>
            <h4 class="prestasi-card-title">${a.title}</h4>
            <div class="prestasi-card-footer-action">
              <span>Buka Keterangan Lomba</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  currentPrestasiIndex = 0;
  setTimeout(() => {
    setupPrestasiCarousel();
  }, 50);
}

function setupPrestasiCarousel() {
  if (prestasiCarouselTimer) {
    clearInterval(prestasiCarouselTimer);
    prestasiCarouselTimer = null;
  }

  const viewport = document.getElementById('prestasiViewport');
  const track = document.getElementById('achievementsGrid');
  const btnPrev = document.getElementById('prestasiBtnPrev');
  const btnNext = document.getElementById('prestasiBtnNext');
  const dotsContainer = document.getElementById('prestasiDots');

  if (!viewport || !track) return;

  const cards = Array.from(track.querySelectorAll('.prestasi-slide-card'));
  if (cards.length === 0) return;

  // Render dots indicator
  if (dotsContainer) {
    dotsContainer.innerHTML = cards.map((_, idx) => `
      <button type="button" class="prestasi-dot ${idx === currentPrestasiIndex ? 'active' : ''}" data-index="${idx}" aria-label="Lihat Prestasi ${idx + 1}"></button>
    `).join('');

    dotsContainer.querySelectorAll('.prestasi-dot').forEach(dot => {
      dot.onclick = () => {
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        scrollToPrestasiCard(idx, true);
        tempPauseAuto();
      };
    });
  }

  function updateDots(activeIdx) {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.prestasi-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === activeIdx);
    });
  }

  function scrollToPrestasiCard(index, smooth = true) {
    if (cards.length === 0) return;
    if (index >= cards.length) index = 0;
    if (index < 0) index = cards.length - 1;

    currentPrestasiIndex = index;
    const targetCard = cards[index];
    if (targetCard) {
      const scrollPos = targetCard.offsetLeft - track.offsetLeft;
      viewport.scrollTo({
        left: scrollPos,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
    updateDots(currentPrestasiIndex);
  }

  function tempPauseAuto(duration = 3500) {
    isPrestasiInteracting = true;
    clearTimeout(window._prestasiPauseTimeout);
    window._prestasiPauseTimeout = setTimeout(() => {
      isPrestasiInteracting = false;
    }, duration);
  }

  // Manual Previous / Next Button Handlers
  if (btnNext) {
    btnNext.onclick = (e) => {
      e.preventDefault();
      let nextIdx = currentPrestasiIndex + 1;
      if (nextIdx >= cards.length) nextIdx = 0;
      scrollToPrestasiCard(nextIdx, true);
      tempPauseAuto();
    };
  }

  if (btnPrev) {
    btnPrev.onclick = (e) => {
      e.preventDefault();
      let prevIdx = currentPrestasiIndex - 1;
      if (prevIdx < 0) prevIdx = cards.length - 1;
      scrollToPrestasiCard(prevIdx, true);
      tempPauseAuto();
    };
  }

  // Mouse Drag / Touch Swipe Interaction
  let isDown = false;
  let startX = 0;
  let scrollLeftInit = 0;
  window._prestasiIsDragging = false;

  viewport.onmousedown = (e) => {
    isDown = true;
    window._prestasiIsDragging = false;
    isPrestasiInteracting = true;
    viewport.classList.add('grabbing');
    startX = e.pageX - viewport.offsetLeft;
    scrollLeftInit = viewport.scrollLeft;
  };

  viewport.onmouseleave = () => {
    if (isDown) {
      isDown = false;
      viewport.classList.remove('grabbing');
      snapToNearest();
      setTimeout(() => { window._prestasiIsDragging = false; }, 80);
    }
    isPrestasiInteracting = false;
  };

  viewport.onmouseenter = () => {
    isPrestasiInteracting = true;
  };

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      viewport.classList.remove('grabbing');
      snapToNearest();
      tempPauseAuto();
      setTimeout(() => { window._prestasiIsDragging = false; }, 80);
    }
  });

  viewport.onmousemove = (e) => {
    if (!isDown) return;
    const x = e.pageX - viewport.offsetLeft;
    if (Math.abs(x - startX) > 6) {
      window._prestasiIsDragging = true;
    }
    e.preventDefault();
    const walk = (x - startX) * 1.3;
    viewport.scrollLeft = scrollLeftInit - walk;
  };

  // Mobile Touch Support
  viewport.ontouchstart = () => {
    isPrestasiInteracting = true;
  };

  viewport.ontouchend = () => {
    snapToNearest();
    tempPauseAuto();
  };

  function snapToNearest() {
    const currentScroll = viewport.scrollLeft;
    let closestIndex = 0;
    let minDiff = Infinity;

    cards.forEach((card, idx) => {
      const cardOffset = card.offsetLeft - track.offsetLeft;
      const diff = Math.abs(cardOffset - currentScroll);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    currentPrestasiIndex = closestIndex;
    updateDots(currentPrestasiIndex);
  }

  // Auto-scroll every 3000ms (3 seconds)
  prestasiCarouselTimer = setInterval(() => {
    if (isPrestasiInteracting) return;
    if (viewport.offsetParent === null) return; // When tab is hidden

    let nextIdx = currentPrestasiIndex + 1;
    if (nextIdx >= cards.length) {
      nextIdx = 0;
    }
    scrollToPrestasiCard(nextIdx, true);
  }, 3000);
}

/* ==========================================================================
   MODAL GENERIC UTILITIES & DETAIL PRESTASI SANTRI
   ========================================================================== */
window.closeGenericModal = function() {
  const modal = document.getElementById('genericModal');
  if (modal) {
    modal.classList.remove('active');
    const card = modal.querySelector('.modal-card');
    if (card) card.classList.remove('modal-speech-mode');
  }
  document.body.style.overflow = '';
};

// Global Esc key & backdrop click handler for generic modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeGenericModal();
  }
});

const _globalGenericModal = document.getElementById('genericModal');
if (_globalGenericModal) {
  _globalGenericModal.addEventListener('click', (e) => {
    if (e.target === _globalGenericModal) {
      window.closeGenericModal();
    }
  });
}

window.openPrestasiDetail = function(achId) {
  const db = (typeof getDB === 'function' ? getDB() : window.APP_DB) || {};
  const achievements = db.achievements || [];
  const a = achievements.find(item => String(item.id) === String(achId));
  if (!a) return;

  const modal = document.getElementById('genericModal');
  const titleEl = document.getElementById('genericModalTitle');
  const bodyEl = document.getElementById('genericModalBody');

  if (!modal || !bodyEl) return;

  if (titleEl) {
    titleEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
        <span>Warta Prestasi & Kejuaraan Santri</span>
      </div>
    `;
  }

  // Format paragraphs from description
  const rawDesc = a.desc || `Prestasi membanggakan diraih oleh ${a.winner} dari satuan pendidikan ${a.unit} dalam ajang ${a.title}. Keberhasilan ini membuktikan komitmen YTPAI Raudlatul Muta'allimin Lamongan dalam memadukan kurikulum kepesantrenan dengan keunggulan kompetitif santri di berbagai bidang kejuaraan.`;
  
  const sentences = rawDesc.split(/(?<=[.!?])\s+/);
  let paragraphsHtml = '';
  if (sentences.length > 2) {
    const lead = sentences.slice(0, 2).join(' ');
    const rest = sentences.slice(2).join(' ');
    paragraphsHtml = `
      <p class="article-lead">${lead}</p>
      <p>${rest}</p>
    `;
  } else {
    paragraphsHtml = `<p class="article-lead">${rawDesc}</p>`;
  }

  // Featured post list in sidebar (other achievements)
  const otherAchievements = achievements.filter(item => String(item.id) !== String(a.id));
  const sidebarItems = (otherAchievements.length > 0 ? otherAchievements : achievements).slice(0, 5);

  const sidebarItemsHtml = sidebarItems.map(item => `
    <div class="featured-post-item" data-search="${(item.title + ' ' + (item.category || '') + ' ' + (item.winner || '')).toLowerCase()}">
      <div class="featured-post-cat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>${item.category || 'Prestasi'}</span>
      </div>
      <div class="featured-post-row" onclick="openPrestasiDetail('${item.id}')" role="button" tabindex="0" title="${item.title}">
        <img src="${item.image || 'assets/hero_santri.jpg'}" alt="${item.title}" class="featured-post-thumb" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
        <h4 class="featured-post-title">${item.title}</h4>
      </div>
    </div>
  `).join('');

  const waShareText = encodeURIComponent(`Lihat prestasi santri YTPAI Raudlatul Muta'allimin: "${a.title}" diraih oleh ${a.winner} (${a.unit}). Selengkapnya: https://raudlatulmutaallimin.sch.id/prestasi.html`);

  const dateStr = a.date || (a.year ? `20 Juni ${a.year}` : '20 Juni 2026');

  bodyEl.innerHTML = `
    <div class="prestasi-article-layout">
      <!-- LEFT COLUMN: MAIN ARTICLE -->
      <main class="prestasi-article-main">
        <header class="prestasi-article-header">
          <h1 class="prestasi-article-title">${a.title}</h1>
          <div class="prestasi-article-meta-row">
            <span class="meta-item meta-author">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              By: ${a.winner || 'Humas Pesantren RM'}
            </span>
            <span class="meta-item meta-time">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              08:30 WIB
            </span>
            <span class="meta-item meta-date">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${dateStr}
            </span>
          </div>
          <div class="prestasi-gold-accent-line"></div>
        </header>

        <figure class="prestasi-article-featured-wrap">
          <img src="${a.image || 'assets/hero_santri.jpg'}" alt="${a.title}" class="prestasi-article-featured-img" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
          <figcaption class="prestasi-article-caption">
            <span class="caption-badge">${a.category || 'Prestasi'}</span>
            <span>Dokumentasi Resmi Kejuaraan • ${a.unit || 'YTPAI Raudlatul Muta\'allimin Lamongan'}</span>
          </figcaption>
        </figure>

        <div class="prestasi-article-winner-card">
          <div class="prestasi-winner-item">
            <span class="prestasi-winner-label">Peraih Prestasi</span>
            <span class="prestasi-winner-val">${a.winner || '-'}</span>
          </div>
          <div class="prestasi-winner-item">
            <span class="prestasi-winner-label">Satuan Pendidikan</span>
            <span class="prestasi-winner-val">${a.unit || '-'}</span>
          </div>
          <div class="prestasi-winner-item">
            <span class="prestasi-winner-label">Kategori / Tahun</span>
            <span class="prestasi-winner-val">${a.category || 'Kejuaraan'} • ${a.year || '2026'}</span>
          </div>
        </div>

        <div class="prestasi-article-content">
          ${paragraphsHtml}
          <p>Capaian membanggakan ini membuktikan bahwa pendidikan di lingkungan Yayasan Taman Pendidikan Agama Islam (YTPAI) Raudlatul Muta'allimin Babat Lamongan senantiasa memberikan ruang luas bagi para santri dan peserta didik untuk berkembang secara paripurna, menyeimbangkan kedalaman spiritualitas salafiyah dengan kecakapan kompetitif berwawasan modern.</p>
        </div>

        <div class="prestasi-article-actions">
          <a href="https://api.whatsapp.com/send?text=${waShareText}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm share-wa-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Bagikan via WhatsApp
          </a>
          <a href="psb.html" class="btn btn-primary btn-sm cta-psb-btn">
            Daftar Santri Baru (PSB) →
          </a>
          <button type="button" class="btn btn-outline btn-sm close-modal-btn" onclick="closeGenericModal()">
            Tutup
          </button>
        </div>
      </main>

      <!-- RIGHT COLUMN: SIDEBAR -->
      <aside class="prestasi-article-sidebar">
        <!-- Search Box with Gold Button -->
        <div class="prestasi-sidebar-search-box">
          <input type="text" id="prestasiSidebarSearchInput" class="prestasi-sidebar-search-input" placeholder="Search..." aria-label="Cari Prestasi">
          <button type="button" class="prestasi-sidebar-search-btn" id="prestasiSidebarSearchBtn" aria-label="Cari">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>

        <!-- Featured Post Widget -->
        <div class="prestasi-sidebar-widget">
          <h3 class="prestasi-sidebar-widget-title">Featured Post</h3>
          <div class="prestasi-sidebar-posts-list" id="prestasiSidebarPostsList">
            ${sidebarItemsHtml}
          </div>
        </div>
      </aside>
    </div>
  `;

  // Hook live search filtering on sidebar
  const searchInput = document.getElementById('prestasiSidebarSearchInput');
  const searchBtn = document.getElementById('prestasiSidebarSearchBtn');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const q = (e.target.value || '').toLowerCase().trim();
      const items = bodyEl.querySelectorAll('.featured-post-item');
      items.forEach(it => {
        const str = it.getAttribute('data-search') || '';
        it.style.display = (!q || str.includes(q)) ? 'flex' : 'none';
      });
    });
    if (searchBtn) {
      searchBtn.onclick = () => searchInput.focus();
    }
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Scroll modal body to top smoothly
  const modalBodyEl = modal.querySelector('.modal-body');
  if (modalBodyEl) modalBodyEl.scrollTop = 0;
};

/* ==========================================================================
   7.C GALERI KEHORMATAN TASMIK 5 JUZ AL-QUR'AN
   Didampingi Orang Tua & Mandiri (Santri Asrama)
   ========================================================================== */
function initTasmikFilterTabs() {
  const tabsContainer = document.getElementById('tasmikFilterTabs');
  if (!tabsContainer) return;
  
  const buttons = tabsContainer.querySelectorAll('.tasmik-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      currentTasmikCategory = btn.getAttribute('data-filter') || 'Semua';
      const db = getDB();
      renderTasmikGallery(db, currentTasmikCategory);
    });
  });
}

function renderTasmikGallery(db, filterType = 'Semua') {
  const container = document.getElementById('tasmikGrid');
  if (!container) return;

  const records = db.tasmikRecords || [];
  const filtered = filterType === 'Semua' 
    ? records 
    : records.filter(r => r.accompaniment === filterType);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 48px 20px; background:#F8FAFC; border-radius:16px; border:1px dashed #CBD5E1;">
        <div style="font-size:2.5rem; margin-bottom:12px;">📖</div>
        <h4 style="color:#0F4C81; margin-bottom:6px;">Belum Ada Data Tasmik untuk Kategori Ini</h4>
        <p style="color:#64748B; font-size:0.88rem;">Dokumentasi santri yang menuntaskan ujian tasmik 5 juz akan segera diperbarui.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((t, idx) => {
    const isParent = t.accompaniment === 'parent';
    const badgeClass = isParent ? 'tasmik-badge-parent' : 'tasmik-badge-independent';
    const badgeIcon = isParent 
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10a3 3 0 0 1 6 0v11H9V10z"/></svg>`;
    const badgeLabel = isParent ? 'Didampingi Orang Tua' : 'Mandiri (Santri Asrama)';

    return `
      <div class="tasmik-card scroll-reveal stagger-${(idx % 3) + 1}" onclick="openTasmikDetail('${t.id}')" role="button" tabindex="0" title="Klik untuk membuka Sertifikasi & Syahadah Tasmik 5 Juz">
        <div class="tasmik-photo-wrap">
          <img src="${t.image || 'assets/tahfidz_quran_pesantren.jpg'}" alt="${t.name}" class="tasmik-img" loading="lazy" onerror="this.onerror=null; this.src='assets/tahfidz_quran_pesantren.jpg';">
          <div class="tasmik-photo-scrim"></div>
          
          <div class="tasmik-badges-top">
            <span class="tasmik-badge-juz">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              ${t.juz || '5 Juz Bil Ghaib'}
            </span>
            <span class="tasmik-badge-accompaniment ${badgeClass}">
              ${badgeIcon}
              ${badgeLabel}
            </span>
          </div>

          <div class="tasmik-overlay-content">
            <div class="tasmik-date-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${t.date || '2026'}
            </div>
            <h3 class="tasmik-student-name">${t.name}</h3>
            <div class="tasmik-student-unit">${t.unit}</div>
          </div>
        </div>

        <div class="tasmik-body">
          <div class="tasmik-accompaniment-box ${isParent ? 'box-parent' : 'box-independent'}">
            <div class="accompaniment-icon">
              ${isParent ? '👨‍👩‍👦' : '🏢'}
            </div>
            <div class="accompaniment-text">
              <span class="accompaniment-label">${isParent ? 'Didampingi Wali Santri:' : 'Status Asrama Pesantren:'}</span>
              <strong>${t.parentInfo || '-'}</strong>
            </div>
          </div>

          <div class="tasmik-info-meta-row">
            <div class="tasmik-info-meta-item">
              <span class="meta-label">Dewan Penguji</span>
              <span class="meta-value">${t.tester || 'Asatidz Tahfidz'}</span>
            </div>
            <div class="tasmik-info-meta-item text-right">
              <span class="meta-label">Predikat Syahadah</span>
              <span class="tasmik-predicate-badge">${t.predicate || 'Mumtaz'}</span>
            </div>
          </div>

          <div class="tasmik-card-footer-action">
            <span>Buka Sertifikasi & Syahadah</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (typeof refreshScrollObserver === 'function') {
    refreshScrollObserver();
  }
}

window.openTasmikDetail = function(tasmikId) {
  const db = (typeof getDB === 'function' ? getDB() : window.APP_DB) || {};
  const records = db.tasmikRecords || [];
  const t = records.find(item => String(item.id) === String(tasmikId));
  if (!t) return;

  const modal = document.getElementById('genericModal');
  const titleEl = document.getElementById('genericModalTitle');
  const bodyEl = document.getElementById('genericModalBody');

  if (!modal || !bodyEl) return;

  const isParent = t.accompaniment === 'parent';
  const badgeClass = isParent ? 'tasmik-badge-parent' : 'tasmik-badge-independent';
  const badgeLabel = isParent ? 'Didampingi Orang Tua' : 'Mandiri (Santri Asrama)';
  const badgeIcon = isParent ? '👨‍👩‍👦' : '🏢';

  if (titleEl) {
    titleEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5" style="vertical-align:middle; margin-right:6px;"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
      Sertifikasi & Syahadah Kehormatan Tasmik 5 Juz
    `;
  }

  const waShareText = encodeURIComponent(`Barakallah! Santri YTPAI Raudlatul Muta'allimin: ${t.name} (${t.unit}) telah menuntaskan Tasmik ${t.juz} Bil Ghaib dengan predikat ${t.predicate} (${badgeLabel}). Info selengkapnya: https://raudlatulmutaallimin.sch.id/prestasi.html#tasmik`);

  bodyEl.innerHTML = `
    <div class="tasmik-dialog-view">
      <div class="tasmik-dialog-hero">
        <img src="${t.image || 'assets/tahfidz_quran_pesantren.jpg'}" alt="${t.name}" onerror="this.onerror=null; this.src='assets/tahfidz_quran_pesantren.jpg';">
        <div class="tasmik-dialog-hero-scrim"></div>
        <div class="tasmik-dialog-hero-badges">
          <span class="badge-juz">${t.juz || '5 Juz Bil Ghaib'}</span>
          <span class="badge-predicate">${t.predicate || 'Mumtaz'}</span>
          <span class="badge-accompaniment ${badgeClass}">${badgeIcon} ${badgeLabel}</span>
        </div>
        <div class="tasmik-dialog-hero-title">
          <h3>${t.name}</h3>
          <p>${t.unit}</p>
        </div>
      </div>

      <div class="tasmik-dialog-meta-grid">
        <div class="tasmik-dialog-meta-item">
          <div class="tasmik-dialog-meta-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div>
            <div class="tasmik-dialog-meta-label">Nama Santri / Hafidz</div>
            <div class="tasmik-dialog-meta-val">${t.name}</div>
          </div>
        </div>

        <div class="tasmik-dialog-meta-item">
          <div class="tasmik-dialog-meta-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div>
            <div class="tasmik-dialog-meta-label">Tanggal Ujian Setoran</div>
            <div class="tasmik-dialog-meta-val">${t.date || '-'}</div>
          </div>
        </div>

        <div class="tasmik-dialog-meta-item">
          <div class="tasmik-dialog-meta-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <div class="tasmik-dialog-meta-label">${isParent ? 'Didampingi Orang Tua' : 'Pendamping Asrama'}</div>
            <div class="tasmik-dialog-meta-val">${t.parentInfo || '-'}</div>
          </div>
        </div>

        <div class="tasmik-dialog-meta-item">
          <div class="tasmik-dialog-meta-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div>
            <div class="tasmik-dialog-meta-label">Dewan Penguji Sanad</div>
            <div class="tasmik-dialog-meta-val">${t.tester || 'Asatidz Tahfidz'}</div>
          </div>
        </div>
      </div>

      <div class="tasmik-dialog-notes-box">
        <h4 style="font-size:0.95rem; font-weight:700; color:#0A2540; margin:0 0 8px 0; display:flex; align-items:center; gap:6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Catatan & Kesaksian Ujian Tasmik 5 Juz
        </h4>
        <p>${(t.notes || 'Telah menyelesaikan ujian tasmik 5 juz sekali duduk bil-ghaib dengan lancar dan fashih.').replace(/\n/g, '<br>')}</p>
      </div>

      <div class="tasmik-dialog-actions">
        <a href="https://api.whatsapp.com/send?text=${waShareText}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Bagikan Kebanggaan via WA
        </a>
        <a href="psb.html" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
          Daftar Program Tahfidz (PSB) →
        </a>
        <button type="button" class="btn btn-outline btn-sm" onclick="closeGenericModal()">
          Tutup
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

/* 7.B RUANG KARYA & KREATIVITAS SANTRI */
function initKaryaFilterTabs() {
  const tabsContainer = document.getElementById('karyaFilterTabs');
  if (!tabsContainer) return;
  tabsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    tabsContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    currentKaryaCategory = btn.dataset.category;
    const db = getDB();
    renderKarya(db, currentKaryaCategory);
  });
}

function renderKarya(db, activeCategory = 'Semua') {
  const container = document.getElementById('karyaGrid');
  if (!container) return;

  const works = db.studentWorks || [];
  const filtered = activeCategory === 'Semua' 
    ? works 
    : works.filter(w => w.category === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 48px 20px; background:#F8FAFC; border-radius:16px; border:1px dashed #CBD5E1;">
        <div style="font-size:2.5rem; margin-bottom:12px;">🎨</div>
        <h4 style="color:#0F4C81; margin-bottom:6px;">Belum Ada Karya untuk Kategori Ini</h4>
        <p style="color:#64748B; font-size:0.88rem;">Karya siswa dan santri pada kategori ini akan segera diperbarui.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((k, idx) => {
    const isMedia = k.category === 'Film' || k.category === 'Musik';
    return `
      <div class="karya-card scroll-reveal stagger-${(idx % 3) + 1}" onclick="openKaryaModal('${k.id}')">
        <div class="karya-thumb-wrapper">
          <img src="${k.thumbnail}" alt="${k.title}" class="karya-thumb-img" loading="lazy">
          <span class="karya-category-tag">${k.categoryLabel}</span>
          ${k.duration ? `<span class="karya-duration-badge">${k.duration}</span>` : ''}
          ${isMedia ? `
            <div class="karya-play-btn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
            </div>
          ` : ''}
        </div>
        <div class="karya-body">
          <div class="karya-meta-row">
            <span class="karya-unit-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6a3 3 0 0 1 6 0v6"/></svg>
              ${k.unit}
            </span>
            <span style="display:inline-flex; align-items:center; gap:5px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${k.date}
            </span>
          </div>
          <h3 class="karya-title">${k.title}</h3>
          <div class="karya-creator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${k.creator}
          </div>
          <p class="karya-synopsis">${k.synopsis}</p>
          <div class="karya-footer">
            <button class="karya-like-btn" onclick="event.stopPropagation(); giveLikeKarya('${k.id}', this)" style="display:inline-flex; align-items:center; gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#E11D48" stroke="#E11D48"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>${k.likes || 0}</span> Apresiasi
            </button>
            <span class="karya-read-link">
              ${k.category === 'Film' ? 'Tonton Film →' : k.category === 'Musik' ? 'Putar Musik →' : k.category === 'Tulisan' ? 'Baca Tulisan →' : 'Lihat Karya →'}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  refreshScrollObserver();
}

window.giveLikeKarya = function(karyaId, btnElement) {
  const db = getDB();
  const work = (db.studentWorks || []).find(w => w.id === karyaId);
  if (!work) return;
  work.likes = (work.likes || 0) + 1;
  saveDB(db);
  if (btnElement) {
    const span = btnElement.querySelector('span');
    if (span) span.textContent = work.likes;
    btnElement.style.transform = 'scale(1.2)';
    btnElement.style.background = '#FEE2E2';
    setTimeout(() => { btnElement.style.transform = ''; }, 250);
  }
};

window.openKaryaModal = function(karyaId) {
  const db = getDB();
  const work = (db.studentWorks || []).find(w => w.id === karyaId);
  if (!work) return;

  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle') || document.getElementById('modalTitle');
  const body = document.getElementById('genericModalBody') || document.getElementById('modalBody');
  if (!modal || !title || !body) return;

  title.textContent = work.title;

  let mediaContentHtml = '';

  if (work.category === 'Film') {
    mediaContentHtml = `
      <div class="karya-modal-video">
        ${work.mediaUrl && work.mediaUrl.includes('youtube') 
          ? `<iframe src="${work.mediaUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
          : `<img src="${work.thumbnail}" style="width:100%; height:100%; object-fit:cover;">`
        }
      </div>
    `;
  } else if (work.category === 'Musik') {
    mediaContentHtml = `
      <div class="karya-audio-player-box">
        <img src="${work.thumbnail}" alt="${work.title}" class="karya-audio-cover">
        <div class="karya-audio-info">
          <span style="font-size:0.75rem; background:rgba(255,255,255,0.2); padding:3px 10px; border-radius:999px; text-transform:uppercase; font-weight:700;">🎵 Audio Santri</span>
          <h4 style="margin:6px 0 2px; font-size:1.1rem; color:#FFF;">${work.title}</h4>
          <p style="margin:0; font-size:0.82rem; color:rgba(255,255,255,0.85);">${work.creator}</p>
          <div class="karya-audio-waveform">
            <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
            <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
            <div class="wave-bar"></div><div class="wave-bar"></div>
          </div>
          <audio controls style="width:100%; height:36px; margin-top:8px;" autoplay>
            <source src="${work.mediaUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}" type="audio/mpeg">
            Browser Anda tidak mendukung elemen audio.
          </audio>
        </div>
      </div>
      ${work.content ? `
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:18px; margin-bottom:20px;">
          <h5 style="margin:0 0 10px; color:#0F4C81; font-weight:700;">🎼 Bait Lirik & Aransemen:</h5>
          <div style="font-style:italic; font-size:0.92rem; line-height:1.7; color:#334155; white-space:pre-line;">${work.content}</div>
        </div>
      ` : ''}
    `;
  } else if (work.category === 'Tulisan') {
    mediaContentHtml = `
      <div style="text-align:center; margin-bottom:20px;">
        <img src="${work.thumbnail}" alt="${work.title}" style="max-width:100%; max-height:240px; object-fit:cover; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08);">
      </div>
      <div class="karya-reading-view">${work.content || work.synopsis}</div>
    `;
  } else if (work.category === 'Seni') {
    mediaContentHtml = `
      <div class="karya-art-view">
        <img src="${work.mediaUrl || work.thumbnail}" alt="${work.title}">
      </div>
      ${work.content ? `
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:18px; margin-bottom:20px;">
          <h5 style="margin:0 0 8px; color:#0F4C81; font-weight:700;">🎨 Filosofi & Makna Karya:</h5>
          <p style="margin:0; font-size:0.9rem; line-height:1.6; color:#334155; white-space:pre-line;">${work.content}</p>
        </div>
      ` : ''}
    `;
  }

  body.innerHTML = `
    <div style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <span class="section-badge" style="margin:0;">${work.categoryLabel}</span>
      <span style="font-size:0.8rem; color:#64748B; font-weight:600;">📅 ${work.date} • ⏱️ ${work.duration}</span>
    </div>

    ${mediaContentHtml}

    <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:18px; margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
        <div>
          <h4 style="margin:0 0 4px; font-size:1.05rem; color:#0F4C81; font-weight:800;">${work.title}</h4>
          <p style="margin:0; font-size:0.85rem; color:#2563EB; font-weight:700;">👤 ${work.creator}</p>
          <span style="font-size:0.78rem; color:#64748B;">📍 Satuan/Asrama: ${work.unit}</span>
        </div>
        <button class="karya-like-btn" id="modalLikeBtn" style="padding:6px 14px; font-size:0.85rem;" onclick="giveLikeKarya('${work.id}', this)">
          ❤️ <span>${work.likes || 0}</span> Apresiasi
        </button>
      </div>

      <p style="color:#475569; font-size:0.9rem; line-height:1.6; margin:0 0 14px 0;">${work.synopsis}</p>

      ${work.crew ? `
        <div style="background:#F1F5F9; padding:10px 14px; border-radius:8px; font-size:0.8rem; color:#475569; margin-bottom:12px;">
          <strong>🎬 Tim / Kredit Kreator:</strong> ${work.crew}
        </div>
      ` : ''}

      ${work.tags && work.tags.length > 0 ? `
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${work.tags.map(t => `<span style="font-size:0.72rem; background:#EFF6FF; color:#1D4ED8; padding:3px 10px; border-radius:999px; font-weight:600;">#${t}</span>`).join('')}
        </div>
      ` : ''}
    </div>

    <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      <a href="https://wa.me/?text=${encodeURIComponent('Lihat karya keren santri YTPAI Raudlatul Muta\'allimin Lamongan: "' + work.title + '" oleh ' + work.creator)}" target="_blank" class="btn btn-outline btn-sm">
        📲 Bagikan ke WhatsApp
      </a>
      <button class="btn btn-primary btn-sm" onclick="closeGenericModal()">Tutup</button>
    </div>
  `;

  modal.classList.add('active');
};

/* 8. TESTIMONIALS (ELEVATED V2 WITH STRICT MODERATION & VERIFIED BADGES) */
let currentActiveTestiFilter = 'all';

function safeEscapeTestiHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTestimonials(db, activeCategory = 'all') {
  const container = document.getElementById('testimonialsGrid');
  if (!container) return;

  currentActiveTestiFilter = activeCategory;
  const testimonials = db.testimonials || [];

  // 1. STRICT MODERATION FILTER: Hanya ulasan dengan status 'approved' (atau tanpa field status/legacy) yang tampil di website publik!
  // Seluruh inputan baru berstatus 'pending' TIDAK PERNAH tayang otomatis sebelum disetujui Admin.
  const approvedList = testimonials.filter(t => t.status === 'approved' || !t.status);

  // 2. Hitung jumlah ulasan per kategori untuk tombol filter
  const countAllEl = document.getElementById('countTestiAll');
  const countAlumniEl = document.getElementById('countTestiAlumni');
  const countWaliEl = document.getElementById('countTestiWali');
  const countSantriEl = document.getElementById('countTestiSantri');

  const alumniCount = approvedList.filter(t => t.category === 'alumni' || (!t.category && (t.role || '').toLowerCase().includes('alumni'))).length;
  const waliCount = approvedList.filter(t => t.category === 'wali' || (!t.category && (t.role || '').toLowerCase().includes('wali'))).length;
  const santriCount = approvedList.filter(t => t.category === 'santri' || (!t.category && (t.role || '').toLowerCase().includes('santri') && !(t.role || '').toLowerCase().includes('wali'))).length;

  if (countAllEl) countAllEl.textContent = approvedList.length;
  if (countAlumniEl) countAlumniEl.textContent = alumniCount;
  if (countWaliEl) countWaliEl.textContent = waliCount;
  if (countSantriEl) countSantriEl.textContent = santriCount;

  // 3. Saring sesuai kategori yang dipilih
  let filteredList = approvedList;
  if (activeCategory !== 'all') {
    filteredList = approvedList.filter(t => {
      if (t.category) return t.category === activeCategory;
      // Fallback matching untuk data legacy
      const roleLow = (t.role || '').toLowerCase();
      if (activeCategory === 'alumni') return roleLow.includes('alumni');
      if (activeCategory === 'wali') return roleLow.includes('wali');
      if (activeCategory === 'santri') return roleLow.includes('santri') && !roleLow.includes('wali');
      return true;
    });
  }

  // Jika tidak ada ulasan pada kategori yang dipilih
  if (filteredList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #FFFFFF; border: 1.5px dashed #CBD5E1; border-radius: 16px;">
        <div style="font-size: 2.2rem; margin-bottom: 10px;">💬</div>
        <h4 style="margin: 0 0 6px; color: #0A2540; font-size: 1.05rem; font-weight: 800;">Belum Ada Ulasan di Kategori Ini</h4>
        <p style="margin: 0 0 16px; font-size: 0.86rem; color: #64748B;">Jadilah yang pertama membagikan pengalaman inspiratif Anda bersama kami.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openTestimonialModal()" style="border-radius: 999px; padding: 8px 20px;">
          + Tulis Ulasan Sekarang
        </button>
      </div>
    `;
    return;
  }

  const starIconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" stroke-width="0.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

  container.innerHTML = filteredList.map((t, idx) => {
    const safeName = safeEscapeTestiHtml(t.name);
    const safeRole = safeEscapeTestiHtml(t.role);
    const safeQuote = safeEscapeTestiHtml(t.quote);
    const ratingCount = Math.max(1, Math.min(5, parseInt(t.rating, 10) || 5));

    // Badge label
    let badgeText = t.verifiedText;
    if (!badgeText) {
      if (t.category === 'wali' || safeRole.toLowerCase().includes('wali')) {
        badgeText = 'Terverifikasi Wali Santri';
      } else if (t.category === 'santri' || safeRole.toLowerCase().includes('santri')) {
        badgeText = 'Terverifikasi Santri';
      } else {
        badgeText = 'Terverifikasi Alumni';
      }
    }

    // Avatar fallback (Inisial Elegan jika foto kosong / placeholder gagal)
    const initialLetter = (safeName || 'S').trim().charAt(0).toUpperCase();
    const avatarMarkup = (t.avatar && !t.avatar.includes('placehold.co')) 
      ? `<img src="${t.avatar}" alt="${safeName}" class="testi-avatar-img" onerror="this.outerHTML='<div class=\\\'testi-avatar-fallback\\\'>${initialLetter}</div>'">`
      : `<div class="testi-avatar-fallback">${initialLetter}</div>`;

    return `
      <div class="testi-card-v2 scroll-reveal stagger-${(idx % 3) + 1}">
        <span class="testi-watermark-quote" aria-hidden="true">&ldquo;</span>

        <div>
          <!-- Card Header: Stars Pill & Trust Badge -->
          <div class="testi-card-top">
            <div class="testi-stars-pill" title="Penilaian ${ratingCount} dari 5 Bintang Penuh">
              <div class="testi-stars-row">
                ${starIconSvg.repeat(ratingCount)}
              </div>
              <span class="testi-score-val">${ratingCount}.0</span>
            </div>
            <span class="testi-badge-verified">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${badgeText}</span>
            </span>
          </div>

          <!-- Kutipan Testimoni -->
          <p class="testi-quote-text">
            <span class="testi-quote-open" aria-hidden="true">&ldquo;</span>${safeQuote}<span class="testi-quote-close" aria-hidden="true">&rdquo;</span>
          </p>
        </div>

        <!-- Profil Penulis Ulasan -->
        <div class="testi-profile-row">
          <div class="testi-avatar-wrap">
            ${avatarMarkup}
            <span class="avatar-verified-pin" title="Identitas Sah &amp; Terverifikasi" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
          </div>
          <div class="testi-author-info">
            <h4 class="testi-author-name" title="${safeName}">${safeName}</h4>
            <p class="testi-author-role" title="${safeRole}">${safeRole}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  refreshScrollObserver();
}

window.filterTestimonials = function(category, btnElement) {
  const filterBtns = document.querySelectorAll('#testiFilterGroup .testi-filter-btn');
  filterBtns.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  if (btnElement) {
    btnElement.classList.add('active');
    btnElement.setAttribute('aria-selected', 'true');
  }

  const db = (typeof getDB === 'function') ? getDB() : (window._cachedDB || DEFAULT_YAYASAN_DATA);
  renderTestimonials(db, category);
};

/* --- PUBLIC TESTIMONIAL SUBMISSION MODAL HANDLERS --- */
window.openTestimonialModal = function() {
  const modal = document.getElementById('testimonialSubmitModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  const firstInput = document.getElementById('pubTestiName');
  if (firstInput) setTimeout(() => firstInput.focus(), 150);
};

window.closeTestimonialModal = function() {
  const modal = document.getElementById('testimonialSubmitModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';

  const form = document.getElementById('formPublicTestimonial');
  if (form) form.reset();
  clearTestiPhoto();
};

/* --- DEVICE PHOTO PICKER & CLIENT-SIDE COMPRESSOR --- */
window.handleTestiPhotoUpload = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Mohon pilih file gambar yang valid (JPG, PNG, atau WEBP).');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Kompres dan resize ke dimensi proporsional max 300px
      const maxDim = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Konversi ke base64 JPEG ramah memori (~25-45KB)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Simpan ke hidden input form
      const hiddenAvatar = document.getElementById('pubTestiAvatar');
      if (hiddenAvatar) hiddenAvatar.value = compressedDataUrl;

      // Update UI Preview
      const thumb = document.getElementById('testiPhotoPreviewThumb');
      if (thumb) {
        thumb.style.backgroundImage = `url("${compressedDataUrl}")`;
        thumb.innerHTML = '';
      }

      const leadEl = document.getElementById('testiUploadLead');
      if (leadEl) {
        const shortName = file.name.length > 20 ? (file.name.substring(0, 18) + '...') : file.name;
        leadEl.textContent = shortName;
      }

      const subEl = document.getElementById('testiUploadSub');
      if (subEl) subEl.textContent = 'Foto siap digunakan (Klik untuk ganti)';

      const clearBtn = document.getElementById('btnClearTestiPhoto');
      if (clearBtn) clearBtn.style.display = 'flex';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.clearTestiPhoto = function(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

  const fileInput = document.getElementById('pubTestiAvatarFile');
  if (fileInput) fileInput.value = '';

  const hiddenInput = document.getElementById('pubTestiAvatar');
  if (hiddenInput) hiddenInput.value = '';

  const thumb = document.getElementById('testiPhotoPreviewThumb');
  if (thumb) {
    thumb.style.backgroundImage = '';
    thumb.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;
  }

  const leadEl = document.getElementById('testiUploadLead');
  if (leadEl) leadEl.textContent = 'Pilih Foto dari Perangkat...';

  const subEl = document.getElementById('testiUploadSub');
  if (subEl) subEl.textContent = 'Klik untuk buka galeri / file';

  const clearBtn = document.getElementById('btnClearTestiPhoto');
  if (clearBtn) clearBtn.style.display = 'none';
};

window.handlePublicTestimonialSubmit = function(e) {
  e.preventDefault();

  const nameInput = document.getElementById('pubTestiName');
  const catInput = document.getElementById('pubTestiCategory');
  const roleInput = document.getElementById('pubTestiRole');
  const waInput = document.getElementById('pubTestiWhatsapp');
  const ratingInput = document.getElementById('pubTestiRating');
  const avatarInput = document.getElementById('pubTestiAvatar');
  const quoteInput = document.getElementById('pubTestiQuote');
  const submitBtn = document.getElementById('btnSubmitTesti');

  const nameVal = (nameInput?.value || '').trim();
  const catVal = (catInput?.value || 'alumni').trim();
  const roleVal = (roleInput?.value || '').trim();
  const waVal = (waInput?.value || '').trim();
  const ratingVal = parseInt(ratingInput?.value, 10) || 5;
  const avatarVal = (avatarInput?.value || '').trim();
  const quoteVal = (quoteInput?.value || '').trim();

  if (!nameVal || !roleVal || !waVal || !quoteVal) {
    alert('Mohon lengkapi data wajib (Nama, Peran/Profesi, No WhatsApp, dan Isi Testimoni).');
    return;
  }

  if (quoteVal.length < 20) {
    alert('Kutipan ulasan terlalu singkat. Mohon tuliskan minimal 20 karakter agar bermanfaat bagi calon santri.');
    return;
  }

  // Tampilkan state memproses
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Mengirim & Mengamankan Ulasan...</span>';
  }

  // Format tanggal pengiriman
  const now = new Date();
  const formattedDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Tentukan teks lencana verifikasi
  let verifiedText = 'Ulasan Terverifikasi';
  if (roleVal.toLowerCase().includes('wali')) verifiedText = 'Terverifikasi Wali';
  else if (roleVal.toLowerCase().includes('alumni')) verifiedText = 'Terverifikasi Alumni';

  // Objek Testimoni Baru dengan STATUS 'pending' (DIJAMIN TIDAK OTOMATIS TAYANG)
  const newTestimonial = {
    id: 'test-' + Date.now(),
    name: nameVal,
    role: roleVal,
    category: catVal,
    verifiedText: verifiedText,
    whatsapp: waVal,
    rating: ratingVal,
    quote: quoteVal,
    avatar: avatarVal || '',
    status: 'pending', // PENDING APPROVAL - WAJIB DISETUJUI ADMIN DI CMS
    submittedAt: formattedDate
  };

  try {
    const db = (typeof getDB === 'function') ? getDB() : (window._cachedDB || DEFAULT_YAYASAN_DATA);
    if (!db.testimonials) db.testimonials = [];

    // Tambahkan di urutan teratas daftar
    db.testimonials.unshift(newTestimonial);

    if (typeof saveDB === 'function') {
      saveDB(db);
    }

    // Tutup modal submit
    closeTestimonialModal();

    // Buka Generic Modal Konfirmasi Apresiasi yang Sangat Ramah & Islami
    if (typeof openGenericModal === 'function') {
      openGenericModal('Apresiasi Testimoni Anda', `
        <div style="text-align:center; padding:18px 8px 10px;">
          <div style="width:68px; height:68px; border-radius:50%; background:#ECFDF5; border:2px solid #34D399; color:#059669; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:2rem; box-shadow:0 6px 18px rgba(16,185,129,0.2);">
            ✓
          </div>
          <h3 style="color:#0A2540; font-size:1.2rem; font-weight:800; margin:0 0 8px;">Jazakumullah Khairan Katsiran!</h3>
          <p style="color:#475569; font-size:0.9rem; line-height:1.6; margin:0 0 16px;">
            Terima kasih atas kebaikan hati <strong>${safeEscapeTestiHtml(nameVal)}</strong> telah membagikan kesan dan pengalaman berharga bersama YTPAI Raudlatul Muta'allimin.
          </p>
          <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-left:4px solid #F59E0B; border-radius:8px; padding:12px; text-align:left; font-size:0.82rem; color:#334155; margin-bottom:18px; line-height:1.5;">
            🔒 <strong>Status Verifikasi:</strong> Ulasan Anda telah tersimpan dengan aman di sistem antrean moderasi. Tim Humas & Admin Yayasan akan memverifikasi keaslian ulasan sebelum ditayangkan secara resmi di halaman depan.
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="closeGenericModal()" style="border-radius:999px; padding:9px 24px;">
            Tutup Informasi
          </button>
        </div>
      `);
    } else {
      alert(`Jazakumullah Khairan Katsiran!\n\nTestimoni Anda berhasil dikirim ke antrean moderasi Humas. Ulasan akan diverifikasi sebelum ditayangkan ke publik.`);
    }

  } catch (err) {
    console.error('Gagal menyimpan testimoni:', err);
    alert('Terjadi kendala saat menyimpan ulasan. Silakan coba kembali.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Kirim Testimoni untuk Diverifikasi →</span>';
    }
  }
};

function populateUnitSelects(db) {
  const select = document.getElementById('selectUnit');
  if (!select) return;
  // 10 Jenjang Pendidikan Resmi SPMB TA. 2027/2028: KB, TK, MI, MTs, SMP, MA, SMA, MADIN, PONPES PA & PI
  const spmbUnits = [
    { value: "KB", label: "KB Raudlatul Muta'allimin", cat: "Pendidikan Anak Usia Dini" },
    { value: "TK", label: "TK Raudlatul Muta'allimin", cat: "Taman Kanak-Kanak" },
    { value: "MI", label: "MI Raudlatul Muta'allimin", cat: "Madrasah Ibtidaiyah" },
    { value: "MTs", label: "MTs Raudlatul Muta'allimin", cat: "Madrasah Tsanawiyah" },
    { value: "SMP", label: "SMP Raudlatul Muta'allimin", cat: "Sekolah Menengah Pertama" },
    { value: "MA", label: "MA Raudlatul Muta'allimin", cat: "Madrasah Aliyah" },
    { value: "SMA", label: "SMA Raudlatul Muta'allimin", cat: "Sekolah Menengah Atas" },
    { value: "Madin", label: "Madrasah Diniyah Takmiliyah (MDT)", cat: "Pendidikan Diniyah Salafiyah" },
    { value: "Ponpes PA", label: "Pondok Pesantren Putra", cat: "Santri Mukim Putra 24 Jam" },
    { value: "Ponpes PI", label: "Pondok Pesantren Putri", cat: "Santri Mukim Putri 24 Jam" }
  ];
  select.innerHTML = spmbUnits.map(u => 
    `<option value="${u.value}" ${u.value === 'MTs' ? 'selected' : ''}>${u.label} — [${u.cat}]</option>`
  ).join('');
}

/* INTERACTIVE BOARDING & GENDER HANDLERS */
window.handleGenderChange = function(gender) {
  const badge = document.getElementById('boardingDestBadge');
  const previewBox = document.getElementById('asramaPreviewBox');
  const icon = document.getElementById('asramaIcon');
  const title = document.getElementById('asramaPlacementTitle');
  const desc = document.getElementById('asramaPlacementDesc');

  if (gender === 'Perempuan') {
    if (badge) {
      badge.textContent = 'Asrama Putri (Syar\'i)';
      badge.classList.add('badge-putri');
    }
    if (previewBox) {
      previewBox.classList.add('preview-putri');
    }
    if (icon) {
      icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B83280" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }
    if (title) title.textContent = "Penempatan: Pondok Pesantren Putri Raudlatul Muta'allimin";
    if (desc) desc.textContent = "Lingkungan asri & syar'i tertutup dengan Mushola Pondok Pesantren Putri yang eksklusif, penjagaan 24 jam, halaqah tahfidzatil Qur'an, dan kajian fiqih wanita.";
  } else {
    if (badge) {
      badge.textContent = 'Asrama Putra (Mandiri)';
      badge.classList.remove('badge-putri');
    }
    if (previewBox) {
      previewBox.classList.remove('preview-putri');
    }
    if (icon) {
      icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D3B66" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6a3 3 0 0 1 6 0v6"/></svg>`;
    }
    if (title) title.textContent = "Penempatan: Pondok Pesantren Putra Raudlatul Muta'allimin";
    if (desc) desc.textContent = "Berpusat di Mushola Pondok Pesantren Putra (pusat ibadah & ngaji bersama alumni) dengan pembinaan disiplin mandiri 24 jam dan mudzakarah kitab kuning.";
  }
};

window.selectBoardingOption = function(option) {
  const isBoarding = option === 'Mondok';
  const optYes = document.getElementById('optBoardingYes');
  const optNo = document.getElementById('optBoardingNo');
  const cardYes = document.getElementById('cardBoardingYes');
  const cardNo = document.getElementById('cardBoardingNo');
  const detailBox = document.getElementById('boardingDetailBox');
  const nonBoardingBox = document.getElementById('nonBoardingDetailBox');

  if (isBoarding) {
    if (optYes) optYes.checked = true;
    if (cardYes) cardYes.classList.add('active');
    if (cardNo) cardNo.classList.remove('active');
    if (detailBox) detailBox.style.display = 'block';
    if (nonBoardingBox) nonBoardingBox.style.display = 'none';
  } else {
    if (optNo) optNo.checked = true;
    if (cardNo) cardNo.classList.add('active');
    if (cardYes) cardYes.classList.remove('active');
    if (detailBox) detailBox.style.display = 'none';
    if (nonBoardingBox) nonBoardingBox.style.display = 'block';
  }
};

/* 8B. RENDER GELOMBANG & PERIODE PSB DINAMIS DARI DATABASE (SISTEM 2 GELOMBANG) */
function renderPsbWaveHeader(db) {
  if (!db) db = getDB();
  const waveCfg = db.psbWaveConfig;
  if (!waveCfg) return;

  const activeWaveNum = (typeof waveCfg.activeWave !== 'undefined') ? waveCfg.activeWave : 1;
  const isClosed = (activeWaveNum === 0 || waveCfg.isOpen === false);

  const wIndent = waveCfg.indent || { name: 'Jalur Indent', shortName: 'INDENT', dateRange: '01 Nov 2026 – 06 Jan 2027', status: 'Segera Dibuka', isOpen: true };
  const w1 = waveCfg.wave1 || { name: 'Gelombang 1', shortName: 'GELOMBANG 1', dateRange: '07 Jan – 31 Mar 2027', status: 'Tahap 1', isOpen: false };
  const w2 = waveCfg.wave2 || { name: 'Gelombang 2', shortName: 'GELOMBANG 2', dateRange: '01 Apr – 08 Jul 2027', status: 'Tahap 2', isOpen: false };

  // Ambil objek gelombang yang sedang aktif
  let currentWave = wIndent;
  if (activeWaveNum === 2) currentWave = w1;
  else if (activeWaveNum === 3) currentWave = w2;

  const academicYearEl = document.getElementById('psbAcademicYearBadge');
  if (academicYearEl && waveCfg.academicYear) {
    academicYearEl.textContent = waveCfg.academicYear;
  }

  // 0. UPDATE BACKGROUND FOTO MASTHEAD HERO PORTAL PSB (Dinamis dari CMS)
  const mastheadEl = document.querySelector('.psb-masthead');
  const customBg = (waveCfg && waveCfg.heroBackground) || (db.meta && db.meta.psbHeroBackground);
  if (mastheadEl && customBg) {
    try {
      const resolvedBg = new URL(customBg, window.location.href).href;
      mastheadEl.style.setProperty('--psb-masthead-bg', `url("${resolvedBg}")`);
    } catch (e) {
      mastheadEl.style.setProperty('--psb-masthead-bg', `url("${customBg}")`);
    }
  }

  // 1. UPDATE JALUR INDENT DI BADGE
  const cardIndent = document.getElementById('psbWaveCardIndent');
  const titleIndent = document.getElementById('psbWaveIndentTitle');
  const statusIndent = document.getElementById('psbWaveIndentStatusText');
  const dateIndent = document.getElementById('psbWaveIndentDateText');
  if (cardIndent) {
    if (activeWaveNum === 1) {
      cardIndent.classList.remove('dimmed');
      cardIndent.classList.add('active');
    } else {
      cardIndent.classList.add('dimmed');
      cardIndent.classList.remove('active');
    }
  }
  if (titleIndent) {
    let ti = (wIndent.shortName || wIndent.name || 'INDENT').toUpperCase();
    if (!ti.endsWith(':')) ti += ':';
    titleIndent.textContent = ti;
  }
  if (dateIndent) dateIndent.textContent = wIndent.dateRange || '01 Nov 2026 – 06 Jan 2027';
  if (statusIndent) {
    if (activeWaveNum === 1) {
      statusIndent.textContent = (wIndent.status || 'SEGERA BUKA').toUpperCase();
      statusIndent.className = 'psb-period-status';
    } else {
      statusIndent.textContent = 'SELESAI';
      statusIndent.className = 'psb-period-status status-subtle';
    }
  }

  // 2. UPDATE GELOMBANG 1 DI BADGE
  const card1 = document.getElementById('psbWaveCard1');
  const title1 = document.getElementById('psbWave1Title');
  const status1 = document.getElementById('psbWave1StatusText');
  const date1 = document.getElementById('psbWave1DateText');
  const quota1 = document.getElementById('psbWave1QuotaText');

  if (card1) {
    if (activeWaveNum === 2) {
      card1.classList.remove('dimmed');
      card1.classList.add('active');
    } else {
      card1.classList.add('dimmed');
      card1.classList.remove('active');
    }
  }
  if (title1) {
    let t1 = (w1.shortName || w1.name || 'GELOMBANG 1').toUpperCase();
    if (!t1.endsWith(':')) t1 += ':';
    title1.textContent = t1;
  }
  if (date1) date1.textContent = w1.dateRange || '07 Jan – 31 Mar 2027';
  if (quota1) quota1.textContent = w1.status || 'Tahap 1';
  if (status1) {
    if (activeWaveNum === 2) {
      status1.textContent = (w1.status || 'SEDANG DIBUKA').toUpperCase();
      status1.className = 'psb-period-status';
    } else if (activeWaveNum === 1) {
      status1.textContent = 'TAHAP 1';
      status1.className = 'psb-period-status status-subtle';
    } else {
      status1.textContent = 'SELESAI';
      status1.className = 'psb-period-status status-subtle';
    }
  }

  // 3. UPDATE GELOMBANG 2 DI BADGE
  const card2 = document.getElementById('psbWaveCard2');
  const title2 = document.getElementById('psbWave2Title');
  const status2 = document.getElementById('psbWave2StatusText');
  const date2 = document.getElementById('psbWave2DateText');
  const quota2 = document.getElementById('psbWave2QuotaText');

  if (card2) {
    if (activeWaveNum === 3) {
      card2.classList.remove('dimmed');
      card2.classList.add('active');
    } else {
      card2.classList.add('dimmed');
      card2.classList.remove('active');
    }
  }
  if (title2) {
    let t2 = (w2.shortName || w2.name || 'GELOMBANG 2').toUpperCase();
    if (!t2.endsWith(':')) t2 += ':';
    title2.textContent = t2;
  }
  if (date2) date2.textContent = w2.dateRange || '01 Apr – 08 Jul 2027';
  if (quota2) quota2.textContent = w2.status || 'Tahap 2';
  if (status2) {
    if (activeWaveNum === 3) {
      status2.textContent = (w2.status || 'SEDANG DIBUKA').toUpperCase();
      status2.className = 'psb-period-status';
    } else {
      status2.textContent = 'TAHAP 2';
      status2.className = 'psb-period-status status-subtle';
    }
  }

  // Support legacy single anchor jika ada
  const waveNameEl = document.getElementById('psbWaveNameText');
  if (waveNameEl) {
    const wName = currentWave.shortName || (isWave2Active ? 'Gelombang II' : 'Gelombang I');
    waveNameEl.textContent = wName.endsWith(':') ? wName : (wName + ':');
  }
  const waveDateEl = document.getElementById('psbWaveDateText');
  if (waveDateEl && currentWave.dateRange) {
    waveDateEl.textContent = currentWave.dateRange;
  }
  const waveStatusEl = document.getElementById('psbWaveStatusText');
  if (waveStatusEl) {
    waveStatusEl.textContent = currentWave.status || 'Kuota Terbatas';
  }

  // Banner Pengumuman Resmi (Format Kartu Informasi Layanan Eksekutif Navy-Gold)
  const bannerIcon = document.getElementById('psbBannerWaveIcon');
  if (bannerIcon) {
    bannerIcon.innerHTML = isClosed 
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  }

  const bannerTitle = document.getElementById('psbBannerWaveTitle');
  if (bannerTitle) {
    const displayWaveTitle = (currentWave.shortName || (isWave2Active ? 'GELOMBANG II' : 'GELOMBANG I')).toUpperCase();
    bannerTitle.textContent = !isClosed
      ? `PENDAFTARAN SANTRI & MURID BARU ${displayWaveTitle} SEDANG DIBUKA`
      : `PENDAFTARAN SANTRI & MURID BARU T.A. RESMI TELAH DITUTUP SEMENTARA`;
  }

  const bannerDesc = document.getElementById('psbBannerWaveDesc');
  if (bannerDesc) {
    if (isClosed) {
      bannerDesc.innerHTML = `
        <div class="psb-announcement-content">
          <p class="psb-announcement-lead">Pendaftaran santri &amp; murid baru (PSB / SPMB) saat ini sedang ditutup sementara karena kuota gelombang telah terpenuhi. Pantau kanal informasi resmi atau hubungi layanan panitia kami.</p>
          <div class="psb-announcement-chips">
            <div class="psb-info-chip">
              <span class="psb-chip-icon">💬</span>
              <div class="psb-chip-body">
                <span class="psb-chip-title">Layanan Panitia</span>
                <span class="psb-chip-desc"><a href="https://wa.me/6285648847070" target="_blank" style="color:#0F4C81; font-weight:700;">WhatsApp Panitia SPMB (0856-4884-7070)</a></span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      const rawAnnouncement = currentWave.announcementText || waveCfg.announcementText || '';
      const hasOffice = /sabtu\s*s\.?d\.?\s*kamis/i.test(rawAnnouncement) || /07\.00/i.test(rawAnnouncement);
      const hasOnline = /online/i.test(rawAnnouncement) || /24\s*jam/i.test(rawAnnouncement);

      if (hasOffice || hasOnline) {
        bannerDesc.innerHTML = `
          <div class="psb-announcement-content">
            <p class="psb-announcement-lead">Layanan Penerimaan Santri &amp; Murid Baru (PSB / SPMB) dibuka secara fleksibel melalui kanal daring maupun tatap muka langsung di kantor yayasan:</p>
            <div class="psb-announcement-chips">
              <div class="psb-info-chip">
                <span class="psb-chip-icon">🌐</span>
                <div class="psb-chip-body">
                  <span class="psb-chip-title">Pendaftaran Online</span>
                  <span class="psb-chip-desc">Akses Formulir Aktif <strong>24 Jam Non-stop</strong></span>
                </div>
              </div>
              <div class="psb-info-chip">
                <span class="psb-chip-icon">🏛️</span>
                <div class="psb-chip-body">
                  <span class="psb-chip-title">Layanan Tatap Muka</span>
                  <span class="psb-chip-desc">Sabtu s.d. Kamis pukul <strong>07.00 – 14.00 WIB</strong> <span class="psb-chip-alert">(Jum'at Libur)</span></span>
                </div>
              </div>
              <div class="psb-info-chip">
                <span class="psb-chip-icon">📍</span>
                <div class="psb-chip-body">
                  <span class="psb-chip-title">Lokasi Sekretariat</span>
                  <span class="psb-chip-desc">Kantor Pusat PSB / SPMB YTPAI &amp; Kantor Unit Formal (KB–SMA)</span>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        bannerDesc.innerHTML = `<p class="psb-announcement-lead">${rawAnnouncement}</p>`;
      }
    }
  }

  // Render Visualisasi Jadwal 3 Tahap SPMB TA. 2027/2028 di Seksi Informasi
  const waveTableBody = document.querySelector('#info .psb-table tbody');
  if (waveTableBody) {
    waveTableBody.innerHTML = `
      <tr style="background:rgba(251,191,36,0.08); font-weight:600;">
        <td align="center">1</td>
        <td><strong style="color:var(--color-gold-dark, #C59B27);">1 November 2026 – 6 Januari 2027</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <strong>JALUR INDENT SPMB TA. 2027/2028</strong>
            <span class="psb-wave-badge" style="background:#10B981; color:#FFF; font-size:0.68rem; font-weight:800; padding:2px 7px; border-radius:4px; letter-spacing:0.02em;">🟢 DIBUKA SEKARANG</span>
          </div>
          <small style="color:#64748B;">Pendaftaran awal kuota prioritas kamar asrama &amp; penempatan satuan pilihan</small>
        </td>
        <td align="center">
          <a href="#formulir" class="btn btn-primary btn-sm">Daftar Indent</a>
        </td>
      </tr>
      <tr>
        <td align="center">2</td>
        <td><strong style="color:var(--color-primary, #0F4C81);">7 Januari – 31 Maret 2027</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <strong>GELOMBANG 1 SPMB TA. 2027/2028</strong>
            <span class="psb-wave-badge" style="background:#0284C7; color:#FFF; font-size:0.68rem; font-weight:700; padding:2px 6px; border-radius:4px; letter-spacing:0.02em;">TAHAP 1</span>
          </div>
          <small style="color:#64748B;">Pendaftaran reguler tahap pertama seluruh 10 jenjang pendidikan</small>
        </td>
        <td align="center">
          <a href="#formulir" class="btn btn-primary btn-sm">Daftar Gel. 1</a>
        </td>
      </tr>
      <tr>
        <td align="center">3</td>
        <td><strong style="color:var(--color-primary-dark, #0A2540);">1 April – 8 Juli 2027</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <strong>GELOMBANG 2 SPMB TA. 2027/2028</strong>
            <span class="psb-wave-badge" style="background:#64748B; color:#FFF; font-size:0.68rem; font-weight:700; padding:2px 6px; border-radius:4px; letter-spacing:0.02em;">TAHAP 2</span>
          </div>
          <small style="color:#64748B;">Pendaftaran reguler tahap kedua penutupan kuota tahun ajaran 2027/2028</small>
        </td>
        <td align="center">
          <a href="#formulir" class="btn btn-primary btn-sm">Daftar Gel. 2</a>
        </td>
      </tr>
    `;
  }

  // Update Conversion Booster Card (Panel Status Gelombang & Kuota Asrama)
  const boosterW1Title = document.getElementById('psbBoosterWave1Title');
  if (boosterW1Title) boosterW1Title.textContent = 'Gelombang 1 (Reguler Utama)';
  const boosterW1Date = document.getElementById('psbBoosterWave1Date');
  if (boosterW1Date) boosterW1Date.textContent = '7 Januari – 31 Maret 2027';
  const boosterW1Badge = document.getElementById('psbBoosterWave1Badge');
  if (boosterW1Badge) {
    boosterW1Badge.textContent = 'Tahap 1';
    boosterW1Badge.className = 'psb-wave-badge-active';
  }

  const boosterW2Title = document.getElementById('psbBoosterWave2Title');
  if (boosterW2Title) boosterW2Title.textContent = 'Gelombang 2 (Penutupan Kuota)';
  const boosterW2Date = document.getElementById('psbBoosterWave2Date');
  if (boosterW2Date) boosterW2Date.textContent = '1 April – 8 Juli 2027';
  const boosterW2Badge = document.getElementById('psbBoosterWave2Badge');
  if (boosterW2Badge) {
    boosterW2Badge.textContent = 'Tahap 2';
    boosterW2Badge.className = 'psb-wave-badge-secondary';
  }
}

/* 8C. RENDER FAQ PPDB DINAMIS DARI DATABASE (TANGGAL MENGIKUTI SETELAN ADMIN) */
function renderPsbFaq(db) {
  const container = document.getElementById('psbFaqList');
  if (!container) return;
  if (!db) db = getDB();

  const faqs = (db && db.psbFaq && Array.isArray(db.psbFaq) && db.psbFaq.length > 0)
    ? db.psbFaq
    : ((typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.psbFaq) ? DEFAULT_YAYASAN_DATA.psbFaq : []);

  const waveCfg = (db && db.psbWaveConfig) || ((typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.psbWaveConfig) ? DEFAULT_YAYASAN_DATA.psbWaveConfig : {});
  const w1 = waveCfg.wave1 || { dateRange: '02 Jan – 31 Mar 2026' };
  const w2 = waveCfg.wave2 || { dateRange: '01 Apr – 30 Jun 2026' };
  const w1Dates = w1.dateRange || '02 Jan – 31 Mar 2026';
  const w2Dates = w2.dateRange || '01 Apr – 30 Jun 2026';

  // Urutkan FAQ berdasarkan nomor urut (order)
  const sortedFaqs = [...faqs].sort((a, b) => (parseInt(a.order, 10) || 0) - (parseInt(b.order, 10) || 0));

  container.innerHTML = sortedFaqs.map((item, idx) => {
    let answer = item.answer || '';
    // Substitusi otomatis token tanggal gelombang dari admin
    answer = answer.replace(/\{\{WAVE_1_DATES\}\}/g, w1Dates)
                   .replace(/\{\{WAVE_2_DATES\}\}/g, w2Dates);

    const isFirst = idx === 0;

    return `
      <div class="psb-faq-item ${isFirst ? 'active' : ''}" data-faq-id="${item.id || ('faq-' + (idx + 1))}">
        <button type="button" class="psb-faq-btn" onclick="togglePsbFaq(this)">
          <span>${idx + 1}. ${item.question}</span>
          <span class="psb-faq-icon">+</span>
        </button>
        <div class="psb-faq-body" style="display:${isFirst ? 'block' : 'none'};">
          ${answer}
        </div>
      </div>
    `;
  }).join('');
}

/* 9. ALUR PENDAFTARAN SANTRI BARU (PPDB ONLINE) */
function initPPDBRegistration() {
  const form = document.getElementById('ppdbForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('ppdbName') ? document.getElementById('ppdbName').value.trim() : '';
    const gender = document.getElementById('ppdbGender') ? document.getElementById('ppdbGender').value : 'Laki-laki';
    
    // Support modern split birthplace/birthdate or legacy single field
    const birthPlaceEl = document.getElementById('ppdbBirthPlace');
    const birthDateEl = document.getElementById('ppdbBirthDate');
    let birth = '';
    if (birthPlaceEl && birthDateEl) {
      const bPlace = birthPlaceEl.value.trim();
      const bDate = birthDateEl.value;
      if (bPlace && bDate) {
        // Format readable date
        try {
          const dObj = new Date(bDate);
          const dateStr = dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          birth = `${bPlace}, ${dateStr}`;
        } catch(err) {
          birth = `${bPlace}, ${bDate}`;
        }
      }
    } else if (document.getElementById('ppdbBirth')) {
      birth = document.getElementById('ppdbBirth').value.trim();
    }

    const unit = document.getElementById('selectUnit') ? document.getElementById('selectUnit').value : 'MTs';

    // Evaluasi Opsi Mondok
    const boardingRadio = document.querySelector('input[name="ppdbBoarding"]:checked');
    const isBoarding = boardingRadio ? boardingRadio.value === 'Mondok' : true;

    const boardingStatus = isBoarding ? 'Mondok (Santri Mukim)' : 'Tidak Mondok (Siswa Non-Mukim)';
    const boardingWing = isBoarding 
      ? (gender === 'Laki-laki' ? "Pondok Pesantren Putra" : "Pondok Pesantren Putri")
      : '-';
    const program = isBoarding 
      ? (document.getElementById('ppdbBoardingProgram') ? document.getElementById('ppdbBoardingProgram').value : 'Reguler Kepesantrenan')
      : 'Siswa Non-Mukim';

    const fatherName = document.getElementById('ppdbFather') ? document.getElementById('ppdbFather').value.trim() : '';
    const motherName = document.getElementById('ppdbMother') ? document.getElementById('ppdbMother').value.trim() : '';
    const legacyParent = document.getElementById('ppdbParent') ? document.getElementById('ppdbParent').value.trim() : '';
    
    let parentName = '';
    if (fatherName && motherName) {
      parentName = `${fatherName} (Ayah) & ${motherName} (Ibu)`;
    } else if (fatherName) {
      parentName = `${fatherName} (Ayah)`;
    } else if (motherName) {
      parentName = `${motherName} (Ibu)`;
    } else {
      parentName = legacyParent;
    }

    const whatsapp = (document.getElementById('ppdbPhoneStep1') && document.getElementById('ppdbPhoneStep1').value.trim()) 
      || (document.getElementById('ppdbWA') ? document.getElementById('ppdbWA').value.trim() : '');
    const email = document.getElementById('ppdbEmail') ? document.getElementById('ppdbEmail').value.trim() : '';
    const address = document.getElementById('ppdbAddress') ? document.getElementById('ppdbAddress').value.trim() : '';
    const notes = document.getElementById('ppdbNotes') ? document.getElementById('ppdbNotes').value.trim() : '';

    // Validasi form lengkap jika fungsi validator tersedia
    if (typeof validateField === 'function') {
      const vName = validateField('ppdbName');
      const vPlace = birthPlaceEl ? validateField('ppdbBirthPlace') : true;
      const vDate = birthDateEl ? validateField('ppdbBirthDate') : true;
      const vFather = document.getElementById('ppdbFather') ? validateField('ppdbFather') : true;
      const vMother = document.getElementById('ppdbMother') ? validateField('ppdbMother') : true;
      const vWA = validateField('ppdbWA');
      const vAddr = validateField('ppdbAddress');
      const vNotes = document.getElementById('ppdbNotes') ? validateField('ppdbNotes') : true;

      if (!vName || !vPlace || !vDate || !vFather || !vMother || !vWA || !vAddr || !vNotes) {
        alert('⚠️ Formulir belum dapat dikirim!\n\nMohon periksa kembali isian formulir. Pastikan semua kolom wajib diisi dengan benar dan tidak diisi teks sembarangan.');
        return;
      }
    } else {
      if (!fullName || (!fatherName && !legacyParent) || !whatsapp || !address) {
        alert('Mohon lengkapi Nama Calon Santri, Data Orang Tua, Nomor WhatsApp aktif, dan Alamat tempat tinggal.');
        return;
      }
    }

    // Dokumen bersifat opsional saat pendaftaran daring agar proses berlangsung cepat (~2 menit).
    // Berkas fisik dapat diserahkan santai saat survei/silaturahmi ke pesantren.

    // Ambil lampiran dokumen berkas (Pasfoto, KK, Akta, KTP, Ijazah/SKL)
    const docs = (typeof window.uploadedPpdbDocs !== 'undefined') ? window.uploadedPpdbDocs : {};
    const attachedDocs = {
      pasfoto: docs.pasfoto || null,
      kk: docs.kk || null,
      akta: docs.akta || null,
      ktp: docs.ktp || null,
      ijazah: docs.ijazah || null
    };

    const regNumber = 'REG-2026-' + Math.floor(1000 + Math.random() * 9000);
    const currentDate = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    // Deteksi Gelombang Aktif dari Konfigurasi Database
    const dbInst = getDB();
    const activeWaveNum = (dbInst && dbInst.psbWaveConfig && typeof dbInst.psbWaveConfig.activeWave !== 'undefined') 
      ? dbInst.psbWaveConfig.activeWave 
      : 1;
    const currentWaveTag = activeWaveNum === 2 ? 'Gelombang II' : 'Gelombang I';

    const newLead = {
      regNumber,
      date: currentDate,
      wave: currentWaveTag,
      fullName,
      gender,
      birthPlaceDate: birth || '-',
      fatherName: fatherName || (legacyParent || '-'),
      motherName: motherName || '-',
      parentName,
      whatsapp,
      email: email || '-',
      unit,
      isBoarding,
      boardingStatus,
      boardingWing,
      program,
      address: address || '-',
      status: 'Baru',
      notes: notes || '-',
      documents: attachedDocs
    };

    // Simpan ke Reactive Database
    const db = dbInst;
    if (!db.leads) db.leads = [];
    db.leads.unshift(newLead);
    saveDB(db);

    // Kirim sinkronisasi otomatis ke Google Sheets jika webhook URL aktif
    syncLeadToGoogleSheets(newLead, db);

    // Tampilkan Bukti Registrasi Resmi
    showRegistrationReceipt(newLead);
    form.reset();

    // Reset upload status
    if (typeof removeDocFile === 'function') {
      ['pasfoto', 'kk', 'akta', 'ktp', 'ijazah'].forEach(k => removeDocFile(k));
    }
    if (typeof switchFormStep === 'function') {
      switchFormStep(1);
    }
    selectBoardingOption('Mondok');
    handleGenderChange('Laki-laki');
  });
}

/**
 * Sinkronisasi Pendaftar PPDB ke Google Sheets secara real-time
 */
function syncLeadToGoogleSheets(lead, db) {
  try {
    const webhookUrl = (db && db.meta && db.meta.googleSheetWebhookUrl)
      ? db.meta.googleSheetWebhookUrl.trim()
      : (localStorage.getItem('ytpai_google_sheet_url') || '');

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return;
    }

    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lead)
    })
    .then(() => {
      console.log('✅ Data PPDB berhasil disinkronkan ke Google Sheets:', lead.regNumber);
    })
    .catch(err => {
      console.warn('⚠️ Gagal mengirim ke Google Sheets:', err);
    });
  } catch (err) {
    console.warn('⚠️ Error di syncLeadToGoogleSheets:', err);
  }
}


function showRegistrationReceipt(data) {
  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle');
  const body = document.getElementById('genericModalBody');

  const docs = data.documents || {};
  const hasPasfoto = docs.pasfoto && docs.pasfoto.dataUrl;

  title.textContent = 'Bukti Pendaftaran Santri Baru (PPDB)';
  body.innerHTML = `
    <div class="receipt-card">
      <div class="receipt-header">
        ${hasPasfoto ? `
          <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-bottom:10px;">
            <img src="assets/logo.png" alt="Logo YTPAI" style="width:52px; height:52px; object-fit:contain;">
            <div style="width:58px; height:68px; border-radius:8px; overflow:hidden; border:2px solid var(--color-gold); box-shadow:0 4px 10px rgba(0,0,0,0.15);">
              <img src="${docs.pasfoto.dataUrl}" alt="Pasfoto Santri" style="width:100%; height:100%; object-fit:cover;">
            </div>
          </div>
        ` : `
          <img src="assets/logo.png" alt="Logo YTPAI" style="width:50px; height:50px; object-fit:contain; margin:0 auto 8px; display:block;">
        `}
        <div style="font-size:0.85rem; font-weight:700; color:var(--color-primary); text-transform:uppercase; letter-spacing:0.06em;">
          YAYASAN TAMAN PENDIDIKAN AGAMA ISLAM RAUDLATUL MUTA'ALLIMIN
        </div>
        <div style="font-size:0.75rem; color:var(--color-text-muted);">
          Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Lamongan • WhatsApp / Telepon: 0856-4884-7070
        </div>
        <div class="receipt-reg-number">${data.regNumber}</div>
        <div style="font-size:0.8rem; color:var(--color-success); font-weight:700;">
          STATUS: PENDAFTARAN BERHASIL TERCATAT
        </div>
      </div>

      <table class="receipt-table">
        <tr><td>Nama Calon Santri</td><td>: <strong>${data.fullName}</strong></td></tr>
        <tr><td>Jenis Kelamin</td><td>: ${data.gender}</td></tr>
        <tr><td>Tempat, Tgl Lahir</td><td>: ${data.birthPlaceDate}</td></tr>
        <tr><td>Pilihan Satuan Pendidikan</td><td>: <span style="color:var(--color-accent); font-weight:700;">${data.unit}</span></td></tr>
        <tr><td>Status Kepesantrenan</td><td>: <strong>${data.boardingStatus}</strong></td></tr>
        ${data.isBoarding ? `
          <tr><td>Penempatan Asrama</td><td>: <span style="color:var(--color-primary); font-weight:700;">${data.boardingWing}</span></td></tr>
          <tr><td>Fokus Program Asrama</td><td>: ${data.program}</td></tr>
        ` : `
          <tr><td>Kategori Siswa</td><td>: Siswa Non-Mukim (Pulang-Pergi)</td></tr>
        `}
        <tr><td>Nama Ayah Kandung</td><td>: <strong>${data.fatherName || data.parentName || '-'}</strong></td></tr>
        <tr><td>Nama Ibu Kandung</td><td>: <strong>${data.motherName || '-'}</strong></td></tr>
        <tr><td>Nomor WhatsApp Aktif</td><td>: ${data.whatsapp}</td></tr>
        <tr><td>Gelombang Pendaftaran</td><td>: <span style="display:inline-block; font-size:0.75rem; font-weight:800; background:${data.wave === 'Gelombang II' ? '#FEF3C7' : '#EDE9FE'}; color:${data.wave === 'Gelombang II' ? '#92400E' : '#6D28D9'}; border:1px solid ${data.wave === 'Gelombang II' ? '#FCD34D' : '#DDD6FE'}; padding:1px 8px; border-radius:4px;">${data.wave || 'Gelombang I'}</span></td></tr>
        <tr><td>Waktu Pendaftaran</td><td>: ${data.date}</td></tr>
      </table>

      <!-- Checklist Kelengkapan Berkas Daring -->
      <div style="margin-top:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px;">
        <div style="font-size:0.82rem; font-weight:800; color:#0A2540; margin-bottom:8px;">📁 Status Lampiran Berkas Persyaratan:</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.78rem;">
          <div>📸 Pasfoto Santri: <strong>${docs.pasfoto ? '✅ Terunggah' : '⏳ Belum Ada'}</strong></div>
          <div>📄 Kartu Keluarga: <strong>${docs.kk ? '✅ Terunggah' : '⏳ Bawa Fisik'}</strong></div>
          <div>📜 Akta Kelahiran: <strong>${docs.akta ? '✅ Terunggah' : '⏳ Bawa Fisik'}</strong></div>
          <div>🪪 KTP Wali: <strong>${docs.ktp ? '✅ Terunggah' : '⏳ Bawa Fisik'}</strong></div>
          <div style="grid-column:1/-1;">🎓 Ijazah / SKL: <strong>${docs.ijazah ? '✅ Terunggah' : '⏳ Menyusul Saat Terbit'}</strong></div>
        </div>
      </div>

      <div style="background-color:#F0FDF4; border:1px solid #BBF7D0; border-radius:var(--radius-md); padding:14px; margin-top:16px;">
        <h5 style="color:#166534; font-size:0.85rem; margin-bottom:4px; font-weight:700;">Langkah Selanjutnya:</h5>
        <ol style="margin-left:18px; font-size:0.82rem; color:#166534; line-height:1.5;">
          <li>Simpan atau cetak nomor registrasi ini sebagai bukti sah pendaftaran.</li>
          <li>Kirim konfirmasi ke WhatsApp Panitia PPDB untuk jadwal tes pemetaan potensi & wawancara.</li>
          <li>Bagi berkas yang belum diunggah secara daring, bawa fotokopi fisik (KK, Akta & KTP) saat verifikasi ke sekretariat.</li>
        </ol>
      </div>
    </div>
  `;

  const dbCurrent = (typeof getDB === 'function') ? getDB() : null;
    const panitiaWaClean = (dbCurrent && dbCurrent.meta && dbCurrent.meta.whatsappClean)
      ? dbCurrent.meta.whatsappClean
      : ((dbCurrent && dbCurrent.meta && dbCurrent.meta.whatsapp) ? dbCurrent.meta.whatsapp.replace(/[^0-9]/g, '') : '6285648847070');

    const formattedWaMsg = encodeURIComponent(
      `*KONFIRMASI PENDAFTARAN MURID BARU (SPMB T.A. 2027/2028)*\n` +
      `*YTPAI RAUDLATUL MUTA'ALLIMIN LAMONGAN*\n\n` +
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Kepada Yth. Panitia PPDB YTPAI Lamongan,\n\n` +
      `Saya selaku orang tua/wali dari calon santri telah menyelesaikan pendaftaran online dengan data sebagai berikut:\n` +
      `• *No. Registrasi:* ${data.regNumber}\n` +
      `• *Nama Lengkap Santri:* ${data.fullName}\n` +
      `• *Jenis Kelamin:* ${data.gender || '-'}\n` +
      `• *Pilihan Satuan:* ${data.unit}\n` +
      `• *Status Asrama:* ${data.boardingStatus}${data.isBoarding ? ' (' + (data.boardingWing || (data.gender === 'Perempuan' ? 'Putri' : 'Putra')) + ')' : ''}\n` +
      `• *Program Pilihan:* ${data.program || 'Reguler'}\n` +
      `• *Gelombang:* ${data.wave || 'Gelombang I'}\n` +
      `• *Nama Orang Tua/Wali:* ${data.fatherName || data.parentName || '-'}\n` +
      `• *Waktu Registrasi:* ${data.date}\n\n` +
      `Seluruh data telah kami submit melalui portal resmi. Mohon petunjuk mengenai jadwal observasi pemetaan potensi, wawancara, dan tahapan verifikasi berikutnya.\n\n` +
      `Jazakumullah Khairan Katsiran.\n` +
      `_Wassalamu'alaikum Warahmatullahi Wabarakatuh._`
    );
    const waUrl = `https://wa.me/${panitiaWaClean}?text=${formattedWaMsg}`;

    body.innerHTML += `
      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:16px;">
        <button class="btn btn-outline btn-sm" onclick="window.print()">
          🖨️ Cetak / Simpan PDF
        </button>
        <div style="display:flex; gap:8px;">
          <a href="${waUrl}" target="_blank" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #059669 0%, #047857 100%); color:#FFFFFF; border:none; font-weight:700; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(5,150,105,0.25);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.9 11.9 0 0 0 5.85 1.52h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.44zM12.06 21.88a9.9 9.9 0 0 1-5.06-1.39l-.36-.22-3.75.98 1-3.66-.24-.38a9.92 9.92 0 0 1-1.52-5.24c0-5.48 4.46-9.94 9.94-9.94 2.65 0 5.15 1.03 7.02 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.91-9.94 9.91zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35z"/></svg>
            <span>Kirim Konfirmasi WA Panitia →</span>
          </a>
          <button class="btn btn-primary btn-sm" onclick="closeGenericModal()">Selesai</button>
        </div>
      </div>
    `;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* ==========================================================================
   PPDB ANNOUNCEMENT & RESULT CHECKER
   ========================================================================== */
window.handleAnnouncementSearch = function(e) {
  if (e) e.preventDefault();

  const regInput = document.getElementById('announcementReg');
  const birthInput = document.getElementById('announcementBirth');
  const resultArea = document.getElementById('announcementResultArea');
  const btn = document.getElementById('btnCheckAnnouncement');

  if (!regInput || !birthInput || !resultArea) return;

  const regQuery = regInput.value.trim().toUpperCase();
  const birthQuery = birthInput.value.trim();

  if (!regQuery || !birthQuery) {
    alert('Mohon masukkan Nomor Registrasi dan Tanggal Lahir calon santri.');
    return;
  }

  // Visual feedback
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Sedang Memeriksa...</span>';
  }

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Periksa Hasil Seleksi</span>`;
    }

    const db = (typeof getDB === 'function') ? getDB() : { leads: [] };
    const allLeads = db.leads || [];

    // Cari pendaftar berdasarkan No. Registrasi
    const lead = allLeads.find(item => {
      const matchReg = (item.regNumber || '').trim().toUpperCase() === regQuery;
      if (!matchReg) return false;

      // Verifikasi tanggal lahir jika tersimpan
      if (item.birthPlaceDate) {
        const cleanDate = birthQuery.trim();
        return item.birthPlaceDate.includes(cleanDate);
      }
      return true;
    });

    resultArea.style.display = 'block';

    if (!lead) {
      resultArea.innerHTML = `
        <div class="result-card-notfound">
          <div style="font-size:2.2rem; margin-bottom:8px;">🔍❌</div>
          <h4>Data Pendaftar Tidak Ditemukan</h4>
          <p>Kombinasi <strong>Nomor Registrasi (${regQuery})</strong> dan <strong>Tanggal Lahir</strong> tidak cocok dengan data pendaftaran kami.<br>
          Pastikan Anda memasukkan nomor registrasi dan tanggal lahir sesuai bukti pendaftaran Anda.</p>
          <div style="margin-top:16px;">
            <a href="https://wa.me/6285648847070?text=Assalamu%27alaikum%20Panitia%20PSB,%20saya%20kesulitan%20mengecek%20pengumuman%20dengan%20No%20Registrasi:%20${regQuery}" target="_blank" class="btn btn-outline btn-sm" style="color:#B91C1C; border-color:#FCA5A5;">
              💬 Bantuan Panitia PSB via WhatsApp
            </a>
          </div>
        </div>
      `;
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Tampilkan hasil berdasarkan status
    const status = lead.status || 'Baru';
    const isAccepted = (status === 'Diterima');
    const isVerified = (status === 'Diverifikasi');
    const isMukim = lead.isBoarding || (lead.boardingStatus && lead.boardingStatus.includes('Mondok'));
    const docs = lead.documents || {};
    const photoUrl = (docs.pasfoto && docs.pasfoto.dataUrl) ? docs.pasfoto.dataUrl : 'assets/logo.png';

    if (isAccepted) {
      resultArea.innerHTML = `
        <div class="result-card-accepted">
          <div class="result-banner-accepted">
            <div>
              <h4 class="result-banner-title">
                <span>🎉</span> SELAMAT! ANANDA DINYATAKAN DITERIMA
              </h4>
              <p class="result-banner-sub">Lulus Seleksi Penerimaan Santri Baru YTPAI Raudlatul Muta'allimin Lamongan TP. 2027/2028</p>
            </div>
            <span class="badge-accepted-pill">LULUS SELEKSI</span>
          </div>

          <div class="result-card-body">
            <!-- Biodata Singkat -->
            <div class="student-meta-grid">
              <img src="${photoUrl}" alt="Foto Santri" class="student-meta-photo">
              <div>
                <div class="student-meta-item">
                  <span class="student-meta-label">Nama Lengkap Santri</span>
                  <span class="student-meta-value" style="font-size:1.15rem; color:#0F4C81;">${lead.fullName}</span>
                </div>
                <div class="student-meta-item">
                  <span class="student-meta-label">Nomor Registrasi Resmi</span>
                  <span class="student-meta-value" style="font-family:monospace; color:#D97706;">${lead.regNumber}</span>
                </div>
                <div class="student-meta-item">
                  <span class="student-meta-label">Jenis Kelamin / Tempat, Tgl Lahir</span>
                  <span class="student-meta-value">${lead.gender} • ${lead.birthPlaceDate}</span>
                </div>
              </div>

              <div>
                <div class="student-meta-item">
                  <span class="student-meta-label">Satuan Pendidikan Diterima</span>
                  <span class="student-meta-value" style="color:#059669; font-weight:800;">${lead.unit}</span>
                </div>
                <div class="student-meta-item">
                  <span class="student-meta-label">Status Kepesantrenan</span>
                  <span class="student-meta-value">${lead.boardingStatus}</span>
                </div>
                ${isMukim ? `
                  <div class="student-meta-item">
                    <span class="student-meta-label">Penempatan Asrama</span>
                    <span class="student-meta-value" style="color:#2563EB;">${lead.boardingWing || (lead.gender === 'Perempuan' ? 'Asrama Putri' : 'Asrama Putra')}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Petunjuk Daftar Ulang -->
            <div class="next-steps-container">
              <h5>
                <span>📋</span> Petunjuk & Alur Daftar Ulang Santri Baru:
              </h5>
              <ol class="next-steps-list">
                <li><strong>Cetak Surat Keputusan Penerimaan:</strong> Klik tombol cetak di bawah dan simpan salinan digital (PDF) atau cetak fisik sebagai berkas sah verifikasi.</li>
                <li><strong>Konfirmasi Daftar Ulang:</strong> Lakukan konfirmasi melalui narahubung panitia PPDB WhatsApp resmi dalam waktu maksimal 7 (tujuh) hari kerja setelah pengumuman.</li>
                <li><strong>Verifikasi Dokumen Fisik:</strong> Serahkan berkas fisik asli (Fotokopi KK 2 lbr, Akta Kelahiran 2 lbr, Pasfoto 3x4 berwarna 4 lbr, dan SKL/Ijazah).</li>
                <li><strong>Administrasi & Perlengkapan:</strong> Pengukuran seragam sekolah/pesantren dan pembagian nomor kamar asrama santri mukim.</li>
              </ol>
            </div>

            <!-- Tombol Aksi -->
            <div class="result-action-buttons">
              <button type="button" class="btn-print-letter" onclick="printAcceptanceLetter('${lead.regNumber}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                <span>Cetak Surat Keputusan Penerimaan Resmi (SKPSB)</span>
              </button>
              <a href="https://wa.me/6285648847070?text=Assalamu%27alaikum%20Panitia%20PPDB%20YTPAI%20Lamongan,%20Alhamdulillah%20ananda%20*${encodeURIComponent(lead.fullName)}*%20dengan%20No%20Reg%20*${lead.regNumber}*%20telah%20DINYATAKAN%20DITERIMA%20pada%20*${encodeURIComponent(lead.unit)}*.%20Kami%20bermaksud%20konfirmasi%20daftar%20ulang." target="_blank" class="btn-confirm-wa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                <span>Konfirmasi Daftar Ulang (WhatsApp Panitia)</span>
              </a>
            </div>
          </div>
        </div>
      `;
    } else if (isVerified) {
      resultArea.innerHTML = `
        <div class="result-card-pending">
          <div class="result-banner-pending">
            <div>
              <h4 class="result-banner-title">
                <span>⏳</span> BERKAS TERVERIFIKASI • DALAM TAHAP SELEKSI
              </h4>
              <p class="result-banner-sub">Pendaftaran ananda <strong>${lead.fullName}</strong> (${lead.regNumber}) telah diverifikasi oleh tim panitia.</p>
            </div>
            <span class="badge-accepted-pill" style="background:#DBEAFE; color:#1E40AF;">VERIFIED</span>
          </div>
          <div class="result-card-body">
            <p style="color:#334155; line-height:1.6; margin-bottom:14px;">
              Seluruh berkas persyaratan (Pasfoto, Kartu Keluarga, Akta Kelahiran, dan KTP Orang Tua) telah diperiksa dan dinyatakan <strong>Lengkap</strong>. Saat ini calon santri sedang dalam proses penentuan kuota kelas dan penempatan asrama oleh Dewan Penguji.
            </p>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px; margin-bottom:18px;">
              <strong>Satuan Pendidikan yang Dituju:</strong> ${lead.unit}<br>
              <strong>Kategori Asrama:</strong> ${lead.boardingStatus}<br>
              <strong>Waktu Sidang Kelulusan:</strong> Pengumuman hasil akhir diterbitkan secara berkala setiap hari Sabtu pukul 14.00 WIB.
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="https://wa.me/6285648847070?text=Assalamu%27alaikum%20Panitia%20PPDB,%20mohon%20informasi%20kelanjutan%20seleksi%20No%20Reg:%20${lead.regNumber}%20atas%20nama%20${encodeURIComponent(lead.fullName)}" target="_blank" class="btn btn-outline btn-sm" style="color:#1D4ED8; border-color:#93C5FD;">
                💬 Tanyakan Status Seleksi ke Panitia
              </a>
            </div>
          </div>
        </div>
      `;
    } else if (status === 'Ditolak') {
      resultArea.innerHTML = `
        <div class="result-card-notfound" style="background:#FFF1F2; border-color:#FECDD3; color:#881337;">
          <div style="font-size:2rem; margin-bottom:6px;">📋</div>
          <h4 style="color:#9F1239;">Informasi Hasil Seleksi Santri Baru</h4>
          <p style="color:#881337; margin-bottom:14px;">
            Mohon maaf, berdasarkan sidang penentuan kuota penerimaan tahun ajaran 2027/2028, berkas calon santri atas nama <strong>${lead.fullName}</strong> (${lead.regNumber}) saat ini <strong>belum dapat diterima</strong> pada satuan ${lead.unit} dikarenakan kapasitas kuota asrama/kelas reguler telah terpenuhi.
          </p>
          <p style="font-size:0.84rem; color:#9F1239;">
            Orang tua/wali dapat berkonsultasi mengenai opsi daftar tunggu (Cadangan Gelombang II) atau pengalihan satuan pendidikan yang masih tersedia melalui Sekretariat Panitia.
          </p>
          <div style="margin-top:16px;">
            <a href="https://wa.me/6285648847070?text=Assalamu%27alaikum%20Panitia%20PPDB,%20saya%20wali%20dari%20${encodeURIComponent(lead.fullName)}%20(${lead.regNumber})%20ingin%20berkonsultasi%20terkait%20kuota%20cadangan/alternatif." target="_blank" class="btn btn-outline btn-sm" style="color:#9F1239; border-color:#FDA4AF;">
              💬 Hubungi Sekretariat Panitia
            </a>
          </div>
        </div>
      `;
    } else {
      // Status 'Baru'
      resultArea.innerHTML = `
        <div class="result-card-pending" style="border-color:#F59E0B;">
          <div class="result-banner-pending" style="background:linear-gradient(135deg, #B45309 0%, #D97706 100%); border-bottom-color:#FDE68A;">
            <div>
              <h4 class="result-banner-title">
                <span>📋</span> PENDAFTARAN DARING TERCATAT
              </h4>
              <p class="result-banner-sub">Pendaftaran ananda <strong>${lead.fullName}</strong> (${lead.regNumber}) berhasil tersimpan.</p>
            </div>
            <span class="badge-accepted-pill" style="background:#FEF3C7; color:#92400E;">TERDAFTAR</span>
          </div>
          <div class="result-card-body">
            <p style="color:#334155; line-height:1.6; margin-bottom:14px;">
              Formulir pendaftaran dan dokumen berkas Anda telah berhasil masuk ke basis data panitia PPDB. Tim panitia saat ini sedang memverifikasi keabsahan dokumen berkas yang diunggah.
            </p>
            <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:14px; margin-bottom:18px;">
              <strong>Satuan Pendidikan:</strong> ${lead.unit}<br>
              <strong>Waktu Pendaftaran:</strong> ${lead.date || '-'}<br>
              <strong>Status Verifikasi:</strong> Menunggu peninjauan dokumen berkas oleh Panitia Penerimaan Santri Baru.
            </div>
            <div>
              <a href="https://wa.me/6285648847070?text=Assalamu%27alaikum%20Panitia%20PPDB,%20saya%20sudah%20mendaftar%20dengan%20No%20Reg:%20${lead.regNumber}%20atas%20nama%20${encodeURIComponent(lead.fullName)}.%20Mohon%20verifikasi%20berkasnya." target="_blank" class="btn btn-outline btn-sm" style="color:#B45309; border-color:#FCD34D;">
                💬 Konfirmasi Pengiriman Berkas ke WhatsApp Panitia
              </a>
            </div>
          </div>
        </div>
      `;
    }

    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 400);
};

window.printAcceptanceLetter = function(regNumber) {
  const db = (typeof getDB === 'function') ? getDB() : { leads: [] };
  const lead = (db.leads || []).find(item => item.regNumber === regNumber);
  if (!lead) {
    alert('Data pendaftar tidak ditemukan.');
    return;
  }

  const docs = lead.documents || {};
  const photoUrl = (docs.pasfoto && docs.pasfoto.dataUrl) ? docs.pasfoto.dataUrl : '';
  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const isMukim = lead.isBoarding || (lead.boardingStatus && lead.boardingStatus.includes('Mondok'));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Gagal membuka jendela cetak. Pastikan browser Anda tidak memblokir pop-up.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Surat Keputusan Penerimaan Santri Baru - ${lead.regNumber}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm 20mm; }
        * { box-sizing: border-box; font-family: 'Times New Roman', Times, serif; }
        body { margin: 0; padding: 20px; color: #111; line-height: 1.45; font-size: 11pt; background: #FFF; }
        .kop-wrapper { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 18px; }
        .kop-logo { width: 78px; height: 78px; object-fit: contain; }
        .kop-text { text-align: center; flex: 1; padding: 0 10px; }
        .kop-instansi { font-size: 12pt; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; }
        .kop-yayasan { font-size: 14pt; font-weight: bold; color: #0A2540; letter-spacing: 0.02em; }
        .kop-alamat { font-size: 9pt; color: #333; margin-top: 2px; }
        .letter-title { text-align: center; margin: 16px 0 12px; }
        .letter-title h2 { margin: 0; font-size: 13pt; text-decoration: underline; letter-spacing: 0.04em; }
        .letter-title span { font-size: 10pt; font-weight: bold; }
        .table-meta { width: 100%; border-collapse: collapse; margin: 14px 0 16px; font-size: 10.5pt; }
        .table-meta td { padding: 4px 6px; vertical-align: top; }
        .table-meta td:first-child { width: 28%; }
        .table-meta td:nth-child(2) { width: 3%; text-align: center; }
        .box-decision { border: 2px solid #059669; background: #F0FDF4; padding: 12px 18px; text-align: center; margin: 16px 0; border-radius: 6px; }
        .decision-badge { font-size: 13pt; font-weight: bold; color: #065F46; letter-spacing: 0.05em; text-transform: uppercase; }
        .box-instructions { background: #F8FAFC; border: 1px solid #CBD5E1; padding: 10px 14px; margin: 14px 0; border-radius: 4px; font-size: 9.5pt; }
        .box-instructions h4 { margin: 0 0 6px; font-size: 10pt; }
        .box-instructions ol { margin: 0; padding-left: 18px; }
        .box-instructions li { margin-bottom: 3px; }
        .footer-signatures { margin-top: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
        .qr-placeholder { text-align: center; font-size: 8pt; color: #555; }
        .qr-box { width: 75px; height: 75px; border: 1px dashed #888; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; font-family: monospace; font-size: 8pt; }
        .sig-block { text-align: center; width: 220px; font-size: 10.5pt; }
        .photo-frame { width: 70px; height: 90px; border: 1.5px solid #000; object-fit: cover; display: block; margin: 0 auto 6px; }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background:#FEF3C7; border:1px solid #F59E0B; padding:10px 16px; margin-bottom:16px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:10pt; color:#92400E; font-family:sans-serif;"><strong>Pratinjau Dokumen Resmi:</strong> Siap dicetak atau disimpan ke format PDF (Ukuran A4).</span>
        <button onclick="window.print()" style="background:#0F4C81; color:#FFF; border:none; padding:8px 18px; border-radius:5px; font-weight:bold; cursor:pointer; font-family:sans-serif;">🖨️ Cetak Dokumen Ini</button>
      </div>

      <div class="kop-wrapper">
        <img src="assets/logo.png" alt="Logo" class="kop-logo">
        <div class="kop-text">
          <div class="kop-instansi">PONDOK PESANTREN & YAYASAN PENDIDIKAN ISLAM</div>
          <div class="kop-yayasan">RAUDLATUL MUTA'ALLIMIN LAMONGAN</div>
          <div class="kop-alamat">
            Sekretariat: Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan, Jawa Timur 62271<br>
            Informasi Pendaftaran (WhatsApp / Telepon): 0856-4884-7070 • Website: www.ytpai-mutaallimin.sch.id • Email: info@ytpai-mutaallimin.sch.id
          </div>
        </div>
        <img src="assets/logo.png" alt="Logo" class="kop-logo" style="visibility:hidden;">
      </div>

      <div class="letter-title">
        <h2>SURAT KEPUTUSAN PENERIMAAN SANTRI BARU (SKPSB)</h2>
        <span>Nomor: 421.1/SK-PPDB/YTPAI/${lead.regNumber.replace('REG-', '')}/2026</span>
      </div>

      <p style="text-align:justify; margin-bottom:8px;">
        <em>Bismillaahirrohmaanirrohiim.</em> Panitia Penerimaan Santri Baru (PPDB) Yayasan Taman Pendidikan Agama Islam Raudlatul Muta'allimin Lamongan Tahun Pelajaran 2027/2028, berdasarkan hasil verifikasi berkas administrasi dan sidang seleksi calon santri, menerangkan bahwa:
      </p>

      <div style="display:flex; gap:16px; align-items:flex-start;">
        <div style="flex:1;">
          <table class="table-meta">
            <tr><td>Nomor Registrasi</td><td>:</td><td><strong>${lead.regNumber}</strong></td></tr>
            <tr><td>Nama Lengkap Santri</td><td>:</td><td><strong>${lead.fullName}</strong></td></tr>
            <tr><td>Jenis Kelamin</td><td>:</td><td>${lead.gender}</td></tr>
            <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${lead.birthPlaceDate}</td></tr>
            <tr><td>Nama Orang Tua / Wali</td><td>:</td><td>${lead.fatherName || lead.parentName || '-'}</td></tr>
            <tr><td>Alamat Asal</td><td>:</td><td>${lead.address || '-'}</td></tr>
          </table>
        </div>
        ${photoUrl ? `
          <div style="text-align:center;">
            <img src="${photoUrl}" alt="Pasfoto" class="photo-frame">
            <span style="font-size:8pt; color:#555;">Pasfoto Resmi</span>
          </div>
        ` : ''}
      </div>

      <div class="box-decision">
        <div style="font-size:10pt; color:#065F46; margin-bottom:2px;">Berdasarkan Hasil Seleksi Dinyatakan:</div>
        <div class="decision-badge">★ DITERIMA SEBAGAI SANTRI BARU ★</div>
        <div style="font-size:10.5pt; margin-top:4px; font-weight:bold; color:#0A2540;">
          Pada Satuan: ${lead.unit} • Status: ${lead.boardingStatus} ${isMukim ? '(' + (lead.boardingWing || (lead.gender === 'Perempuan' ? 'Putri' : 'Putra')) + ')' : ''}
        </div>
      </div>

      <div class="box-instructions">
        <h4>Petunjuk Kewajiban Daftar Ulang Santri:</h4>
        <ol>
          <li>Menunjukkan lembar Surat Keputusan Penerimaan ini saat verifikasi tatap muka di Sekretariat PPDB.</li>
          <li>Melunasi administrasi infaq masuk / daftar ulang paling lambat 7 (tujuh) hari kalender sejak surat ini diterbitkan.</li>
          <li>Menyerahkan berkas fisik asli: Fotokopi KK (2 lembar), Akta Kelahiran (2 lembar), Pasfoto 3x4 (4 lembar), dan Ijazah/SKL jika sudah terbit.</li>
          <li>Bagi santri mukim (asrama), wajib mengikuti pembagian ranjang kamar dan tata tertib kepesantrenan.</li>
        </ol>
      </div>

      <div class="footer-signatures">
        <div class="qr-placeholder">
          <div class="qr-box">
            <span>VALIDATED<br>OFFICIAL</span>
          </div>
          <span>Kode Keabsahan:<br>${lead.regNumber}</span>
        </div>

        <div class="sig-block">
          <div>Ditetapkan di : Lamongan</div>
          <div>Pada tanggal : ${currentDate}</div>
          <div style="margin-top:6px; font-weight:bold;">Panitia Penerimaan Santri Baru (PPDB)<br>Ketua Panitia,</div>
          <div style="height:60px; display:flex; align-items:center; justify-content:center;">
            <span style="color:#0F4C81; font-family:sans-serif; font-size:9pt; font-weight:bold; border:1.5px solid #0F4C81; padding:3px 8px; border-radius:4px; transform:rotate(-4deg); display:inline-block;">TERVERIFIKASI SISTEM PPDB</span>
          </div>
          <div style="font-weight:bold; text-decoration:underline;">H. AHMAD MUNIR, S.Pd.I, M.Pd</div>
          <div style="font-size:9pt;">NIP/NIY: 19840815 201001 1 002</div>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
};

/* 10. MODALS HANDLERS & UNIT MULTI-PHOTO AUTO-SLIDESHOW */
window.unitModalSlideshowState = {
  timer: null,
  currentIndex: 0,
  photos: [],
  isPaused: false
};

window.stopUnitModalSlideshow = function() {
  if (window.unitModalSlideshowState.timer) {
    clearInterval(window.unitModalSlideshowState.timer);
    window.unitModalSlideshowState.timer = null;
  }
  window.unitModalSlideshowState.isPaused = false;
  window.unitModalSlideshowState.currentIndex = 0;
};

window.pauseUnitSlideshow = function() {
  window.unitModalSlideshowState.isPaused = true;
};

window.resumeUnitSlideshow = function() {
  window.unitModalSlideshowState.isPaused = false;
};

window.setUnitSlide = function(targetIndex) {
  const state = window.unitModalSlideshowState;
  const photos = state.photos;
  if (!photos || photos.length === 0) return;
  
  const total = photos.length;
  state.currentIndex = (targetIndex + total) % total;
  
  // Update slide items
  const items = document.querySelectorAll('.unit-slide-item');
  items.forEach((item, idx) => {
    if (idx === state.currentIndex) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update dots
  const dots = document.querySelectorAll('.unit-slide-dot');
  dots.forEach((dot, idx) => {
    if (idx === state.currentIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  // Update thumbs
  const thumbs = document.querySelectorAll('.unit-thumb-item');
  thumbs.forEach((th, idx) => {
    if (idx === state.currentIndex) {
      th.classList.add('active');
    } else {
      th.classList.remove('active');
    }
  });

  // Update caption & counter
  const captionEl = document.getElementById('unitSlideCaptionText');
  if (captionEl && photos[state.currentIndex]) {
    captionEl.textContent = photos[state.currentIndex].caption || 'Dokumentasi Kegiatan Siswa/Santri';
  }
  const counterEl = document.getElementById('unitSlideCounterText');
  if (counterEl) {
    counterEl.textContent = `${state.currentIndex + 1}/${total}`;
  }
};

window.nextUnitSlide = function() {
  const state = window.unitModalSlideshowState;
  window.setUnitSlide(state.currentIndex + 1);
};

window.prevUnitSlide = function() {
  const state = window.unitModalSlideshowState;
  window.setUnitSlide(state.currentIndex - 1);
};

window.startUnitModalSlideshow = function(photos) {
  window.stopUnitModalSlideshow();
  window.unitModalSlideshowState.photos = photos || [];
  window.unitModalSlideshowState.currentIndex = 0;
  window.unitModalSlideshowState.isPaused = false;

  if (photos && photos.length > 1) {
    window.unitModalSlideshowState.timer = setInterval(() => {
      if (!window.unitModalSlideshowState.isPaused) {
        window.nextUnitSlide();
      }
    }, 3800);
  }
};

window.switchUnitTab = function(tabId, btnEl) {
  const tabBtns = document.querySelectorAll('.unit-tab-btn');
  tabBtns.forEach(b => b.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const matchedBtn = document.querySelector(`.unit-tab-btn[onclick*="${tabId}"]`);
    if (matchedBtn) matchedBtn.classList.add('active');
  }

  const panes = document.querySelectorAll('.unit-tab-pane');
  panes.forEach(p => {
    if (p.id === tabId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
};

function initModals() {
  const overlays = document.querySelectorAll('.modal-overlay');
  overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        window.stopUnitModalSlideshow();
      }
    });
  });
}

window.closeGenericModal = function() {
  const modal = document.getElementById('genericModal');
  if (modal) {
    modal.classList.remove('active');
    const card = modal.querySelector('.modal-card');
    if (card) card.classList.remove('modal-speech-mode');
  }
  document.body.style.overflow = '';
  if (typeof window.stopUnitModalSlideshow === 'function') {
    window.stopUnitModalSlideshow();
  }
};

window.handleRegisterUnit = function(unitId, unitName) {
  // 1. Otomatis tutup jendela modal secara instan
  window.closeGenericModal();

  // 2. Pilih unit di dropdown formulir jika tersedia di halaman
  if (typeof window.selectUnitDropdown === 'function') {
    window.selectUnitDropdown(unitId || unitName);
  } else if (typeof selectUnitDropdown === 'function') {
    selectUnitDropdown(unitId || unitName);
  }

  // 3. Gulir halus (smooth scroll) ke bagian pendaftaran
  const target = document.getElementById('pendaftaran') || document.getElementById('info-ppdb');
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  } else {
    window.location.href = `psb.html?unit=${encodeURIComponent(unitId || '')}`;
  }
};

// Differentiate institutional authority: Kemenag (Kepala Madrasah) vs Diknas (Kepala Sekolah) vs Pesantren (Pemangku Pondok)
window.getUnitLeaderMeta = function(unit) {
  if (!unit) {
    return {
      type: 'diknas',
      label: 'Kepala Sekolah',
      speechTitlePrefix: 'Pesan Kepala Sekolah',
      tabLabel: 'Sambutan Kepala Sekolah',
      role: 'Kepala Sekolah'
    };
  }

  const id = (unit.id || '').toLowerCase();
  const name = (unit.name || '').toLowerCase();
  const cat = (unit.category || '').toLowerCase();

  // 1. Pesantren / Asrama Santri Mukim
  if (id.startsWith('ponpes') || id.includes('pesantren') || cat.includes('pesantren') || cat.includes('asrama') || name.includes('pesantren') || name.includes('pondok')) {
    const isPutri = id.includes('putri') || name.includes('putri') || cat.includes('putri');
    return {
      type: 'pesantren',
      label: isPutri ? 'Musyrifah & Pengasuh' : 'Musyrif & Pengasuh',
      speechTitlePrefix: isPutri ? 'Sambutan Musyrifah & Pengasuh' : 'Sambutan Musyrif & Pengasuh',
      tabLabel: isPutri ? 'Sambutan Musyrifah' : 'Sambutan Musyrif',
      shortTabLabel: isPutri ? 'Musyrifah' : 'Musyrif',
      role: isPutri ? "Musyrifah & Pengasuh Asrama Putri" : "Musyrif & Pengasuh Asrama Putra"
    };
  }

  // 1B. Poskestren (Klinik & Perawatan Kesehatan Santri)
  if (id === 'poskestren' || name.includes('poskestren') || cat.includes('kesehatan') || cat.includes('klinik')) {
    return {
      type: 'kesehatan',
      label: 'Penanggung Jawab Medis',
      speechTitlePrefix: 'Amanah Pelayanan Medis',
      tabLabel: 'Pesan Tenaga Medis',
      shortTabLabel: 'Tenaga Medis',
      unitFormalName: "Poskestren Raudlatul Muta'allimin",
      role: unit.role || "Penanggung Jawab Medis Poskestren"
    };
  }

  // 2. Lembaga Penunjang: LBB & KBIHU
  if (id === 'lbb' || name.includes('bimbingan belajar') || name.includes('lbb')) {
    return {
      type: 'lembaga',
      label: 'Ketua LBB',
      speechTitlePrefix: 'Pesan Ketua LBB',
      tabLabel: 'Sambutan Ketua LBB',
      shortTabLabel: 'Sambutan',
      role: 'Ketua Lembaga Bimbingan Belajar (LBB)'
    };
  }
  if (id === 'kbihu' || name.includes('kbihu') || name.includes('haji')) {
    return {
      type: 'lembaga',
      label: 'Pimpinan KBIHU',
      speechTitlePrefix: 'Pesan Pimpinan KBIHU',
      tabLabel: 'Pesan Pimpinan KBIHU',
      shortTabLabel: 'Sambutan',
      role: "Pimpinan KBIHU Mandiri Raudlatul Muta'allimin"
    };
  }

  // 3. SPESIFIK UNIT SATUAN PENDIDIKAN FORMAL (Baku Penuh Tanpa Singkatan)
  if (id === 'mts') {
    return {
      type: 'kemenag',
      label: 'Kepala Madrasah Tsanawiyah',
      speechTitlePrefix: 'Pesan Kepala Madrasah Tsanawiyah',
      tabLabel: 'Sambutan Kepala Madrasah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: "Kepala Madrasah Tsanawiyah Raudlatul Muta'allimin"
    };
  }
  if (id === 'ma') {
    return {
      type: 'kemenag',
      label: 'Kepala Madrasah Aliyah',
      speechTitlePrefix: 'Pesan Kepala Madrasah Aliyah',
      tabLabel: 'Sambutan Kepala Madrasah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: "Kepala Madrasah Aliyah Raudlatul Muta'allimin"
    };
  }
  if (id === 'mi') {
    return {
      type: 'kemenag',
      label: "Kepala Madrasah Ibtida'iyah",
      speechTitlePrefix: "Pesan Kepala Madrasah Ibtida'iyah",
      tabLabel: 'Sambutan Kepala Madrasah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: "Kepala Madrasah Ibtida'iyah Raudlatul Muta'allimin"
    };
  }
  if (id === 'sma') {
    return {
      type: 'diknas',
      label: 'Kepala Sekolah Menengah Atas',
      speechTitlePrefix: 'Pesan Kepala Sekolah Menengah Atas',
      tabLabel: 'Sambutan Kepala Sekolah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: "Kepala Sekolah Menengah Atas Raudlatul Muta'allimin"
    };
  }
  if (id === 'smp') {
    return {
      type: 'diknas',
      label: 'Kepala Sekolah Menengah Pertama',
      speechTitlePrefix: 'Pesan Kepala Sekolah Menengah Pertama',
      tabLabel: 'Sambutan Kepala Sekolah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: "Kepala Sekolah Menengah Pertama Raudlatul Muta'allimin"
    };
  }
  if (id === 'tk') {
    return {
      type: 'diknas',
      label: 'Kepala Taman Kanak-Kanak',
      speechTitlePrefix: 'Pesan Kepala Taman Kanak-Kanak',
      tabLabel: 'Sambutan Kepala Sekolah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: "Kepala Taman Kanak-Kanak Raudlatul Muta'allimin"
    };
  }
  if (id === 'kb') {
    return {
      type: 'diknas',
      label: 'Kepala Kelompok Bermain',
      speechTitlePrefix: 'Pesan Kepala Kelompok Bermain',
      tabLabel: 'Sambutan Kepala Sekolah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: "Kepala Kelompok Bermain Raudlatul Muta'allimin"
    };
  }

  // 4. DIKNAS (Kemendikbudristek / Dinas Pendidikan) Fallback
  const isDiknas = id === 'sma' || id === 'smp' || id === 'smk' || id === 'kb' || id === 'tk' ||
    /\bsma\b/i.test(name) || /\bsmp\b/i.test(name) || /\bsmk\b/i.test(name) ||
    cat.includes('sma') || cat.includes('smp') || cat.includes('smk') ||
    cat.includes('paud') || cat.includes('taman kanak-kanak') || cat.includes('kelompok bermain');

  if (isDiknas) {
    return {
      type: 'diknas',
      label: 'Kepala Sekolah',
      speechTitlePrefix: 'Pesan Kepala Sekolah',
      tabLabel: 'Sambutan Kepala Sekolah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: `Kepala Sekolah ${unit.name}`
    };
  }

  // 5. KEMENAG (Kementerian Agama) Fallback
  const isKemenag = id === 'mi' || id === 'mts' || id === 'ma' || id === 'madin' || id === 'ra' ||
    cat.includes('madrasah') || cat.includes('kemenag') ||
    name.includes('madrasah') ||
    /\bmi\b/i.test(name) ||
    /\bmts\b/i.test(name) ||
    /\bma\b/i.test(name) ||
    name.includes('diniyah');

  if (isKemenag) {
    return {
      type: 'kemenag',
      label: 'Kepala Madrasah',
      speechTitlePrefix: 'Pesan Kepala Madrasah',
      tabLabel: 'Sambutan Kepala Madrasah',
      shortTabLabel: 'Sambutan',
      unitFormalName: "Raudlatul Muta'allimin",
      role: `Kepala Madrasah ${unit.name}`
    };
  }

  // Default fallback for any other formal schools under Diknas
  return {
    type: 'diknas',
    label: 'Kepala Sekolah',
    speechTitlePrefix: 'Pesan Kepala Sekolah',
    tabLabel: 'Sambutan Kepala Sekolah',
    shortTabLabel: 'Sambutan',
    unitFormalName: "Raudlatul Muta'allimin",
    role: `Kepala Sekolah ${unit.name}`
  };
};

window.openUnitModal = function(unitId, initialTabId) {
  const db = getDB();
  let unit = null;

  if (unitId === 'kbihu' && db.kbihuInfo) {
    unit = {
      id: 'kbihu',
      name: db.kbihuInfo.name,
      category: 'Bimbingan Haji & Umrah Resmi Kemenag',
      image: db.kbihuInfo.image,
      shortDesc: db.kbihuInfo.shortDesc,
      fullDesc: db.kbihuInfo.fullDesc,
      programs: db.kbihuInfo.programs,
      gallery: (db.kbihuInfo.gallery && db.kbihuInfo.gallery.length > 0)
        ? db.kbihuInfo.gallery
        : [{ src: db.kbihuInfo.image || 'assets/pesantren_gedung.jpg', caption: db.kbihuInfo.name }]
    };
  } else if (unitId === 'lbb' && db.lbbInfo) {
    unit = {
      id: 'lbb',
      name: db.lbbInfo.name,
      category: 'Bimbingan Belajar, UTBK & Siswa Luar',
      image: db.lbbInfo.image,
      shortDesc: db.lbbInfo.shortDesc,
      fullDesc: db.lbbInfo.fullDesc,
      programs: db.lbbInfo.programs,
      gallery: (db.lbbInfo.gallery && db.lbbInfo.gallery.length > 0)
        ? db.lbbInfo.gallery
        : [{ src: db.lbbInfo.image || 'assets/lbb_bimbel_intensif.jpg', caption: db.lbbInfo.name }]
    };
  } else {
    unit = (db.units || []).find(u => u.id === unitId);
    if (!unit && db.boardingWings) {
      unit = db.boardingWings.find(b => b.id === unitId);
    }
    if (!unit && db.nonFormalUnits) {
      unit = db.nonFormalUnits.find(n => n.id === unitId);
    }
    // Support composite / legacy footer alias lookups
    if (!unit) {
      if (unitId === 'kb-tk') unit = (db.units || []).find(u => u.id === 'kb') || (db.units || []).find(u => u.id === 'tk');
      else if (unitId === 'mts-smp') unit = (db.units || []).find(u => u.id === 'mts') || (db.units || []).find(u => u.id === 'smp');
      else if (unitId === 'ma-sma') unit = (db.units || []).find(u => u.id === 'ma') || (db.units || []).find(u => u.id === 'sma');
      else if (unitId === 'lpba-kbihu-lbb') unit = (db.nonFormalUnits || []).find(n => n.id === 'lpba') || (db.nonFormalUnits || []).find(n => n.id === 'lbb') || (db.nonFormalUnits || []).find(n => n.id === 'kbihu');
    }
  }
  if (!unit) return;

  const leaderMeta = window.getUnitLeaderMeta(unit);

  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle');
  const body = document.getElementById('genericModalBody');

  // Multi-photo gallery extraction
  const photos = (unit.gallery && unit.gallery.length > 0)
    ? unit.gallery
    : [{ src: unit.image || 'assets/hero_santri.jpg', caption: unit.name }];

  // Start auto-slideshow
  window.startUnitModalSlideshow(photos);

  // Icon mapping
  const iconMap = {
    'kb': '🧸',
    'tk': '🎨',
    'mi': '📖',
    'mts': '🔬',
    'smp': '💻',
    'ma': '📚',
    'sma': '🎓',
    'ponpes-putra': '🕌',
    'ponpes-putri': '🌸',
    'madin': '📜',
    'lpba': '🌐',
    'lbb': '🚀',
    'kbihu': '🕋',
    'poskestren': '🏥'
  };
  const unitEmoji = iconMap[unit.id] || '🏫';

  // Clean Accreditation Badge Text (Avoid duplicate "Akreditasi Terakreditasi")
  let rawAcc = (unit.accreditation || 'Terakreditasi A Unggul').trim();
  let cleanAccBadge = rawAcc;
  if (!cleanAccBadge.toLowerCase().includes('akreditasi') && !cleanAccBadge.toLowerCase().includes('terakreditasi')) {
    cleanAccBadge = 'Akreditasi ' + cleanAccBadge;
  }

  // Title markup (Institutional Grade Header)
  title.innerHTML = `
    <div class="unit-modal-header-brand">
      <div class="unit-modal-cat-tag">
        <span class="unit-cat-badge">${unit.category || 'Satuan Pendidikan Resmi'}</span>
        <span class="unit-status-badge">${cleanAccBadge}</span>
      </div>
      <h3 class="unit-modal-main-title">${unit.name}</h3>
    </div>
  `;

  // Minimalist Executive Slideshow Markup (Ultra Compact & Clean)
  const slideshowHtml = `
    <div class="unit-slideshow-container" id="unitSlideshowBox" onmouseenter="pauseUnitSlideshow()" onmouseleave="resumeUnitSlideshow()">
      <div class="unit-slideshow-track" id="unitSlideshowTrack">
        ${photos.map((p, idx) => `
          <div class="unit-slide-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            <img src="${p.src}" alt="${p.caption || unit.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/pesantren_gedung.jpg';">
          </div>
        `).join('')}
      </div>
      
      <div class="unit-slide-overlay">
        <div class="unit-slide-caption">
          <span id="unitSlideCaptionText">${photos[0] ? photos[0].caption : unit.name}</span>
        </div>
        <div class="unit-slide-counter">
          <span id="unitSlideCounterText">1/${photos.length}</span>
        </div>
      </div>

      ${photos.length > 1 ? `
        <button type="button" class="unit-slide-arrow prev" onclick="prevUnitSlide()" aria-label="Foto Sebelumnya">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button type="button" class="unit-slide-arrow next" onclick="nextUnitSlide()" aria-label="Foto Berikutnya">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="unit-slide-dots" id="unitSlideDots">
          ${photos.map((_, idx) => `
            <button type="button" class="unit-slide-dot ${idx === 0 ? 'active' : ''}" onclick="setUnitSlide(${idx})" aria-label="Ke Foto ${idx + 1}"></button>
          `).join('')}
        </div>
      ` : ''}
    </div>

    ${photos.length > 1 ? `
      <div class="unit-thumbs-row">
        ${photos.map((p, idx) => `
          <div class="unit-thumb-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" onclick="setUnitSlide(${idx})">
            <img src="${p.src}" alt="Thumb ${idx + 1}" onerror="this.onerror=null;this.src='assets/pesantren_gedung.jpg';">
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  const hasSpeech = Boolean(unit.headmasterSpeech);
  const isHeadmasterClickable = hasSpeech;
  const headmasterActionBadge = isHeadmasterClickable
    ? `<span class="unit-spec-action-badge">
        <span class="badge-lbl-desktop">${leaderMeta.tabLabel || 'Sambutan'}</span>
        <span class="badge-lbl-mobile">Sambutan</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
       </span>`
    : '';

  const isPoskestren = unit.id === 'poskestren';
  const isKbihu = unit.id === 'kbihu';
  const isLbb = unit.id === 'lbb';

  // Executive Quick-Fact Specs Bar (Sleek 3-Item Layout, Zero Clutter)
  const factsHtml = `
    <div class="unit-specs-bar">
      <!-- 1. Pimpinan / Kepala Satuan / Penanggung Jawab Medis (Full Width) -->
      <div class="unit-spec-item spec-item-headmaster ${isHeadmasterClickable ? 'clickable-speech' : ''}" ${isHeadmasterClickable ? `onclick="switchUnitTab('tab-sambutan')" role="button" tabindex="0" title="Buka ${leaderMeta.tabLabel || 'Sambutan'}"` : ''}>
        <div class="unit-spec-icon spec-icon-leader">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="unit-spec-content">
          <div class="unit-spec-label-row">
            <span class="unit-spec-label">${leaderMeta.label}</span>
            ${headmasterActionBadge}
          </div>
          <strong class="unit-spec-val spec-val-headmaster" title="${unit.headmaster || leaderMeta.label}">${unit.headmaster || leaderMeta.label}</strong>
        </div>
      </div>

      <!-- 2. Daya Tampung / Sasaran Layanan (Col 1) -->
      <div class="unit-spec-item spec-item-quota">
        <div class="unit-spec-header-row">
          <div class="unit-spec-icon icon-emerald">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span class="unit-spec-label">${isPoskestren ? 'Sasaran Layanan' : (isKbihu ? 'Kapasitas Jamaah' : 'Daya Tampung')}</span>
        </div>
        <div class="unit-spec-val-box">
          <strong class="unit-spec-val" title="${unit.quota || 'Tersedia'}">${unit.quota || 'Tersedia'}</strong>
        </div>
      </div>

      <!-- 3. Sistem Belajar / Jam Layanan Medis (Col 2) -->
      <div class="unit-spec-item spec-item-studytime">
        <div class="unit-spec-header-row">
          <div class="unit-spec-icon icon-blue">
            ${isPoskestren ? `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            ` : `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            `}
          </div>
          <span class="unit-spec-label">${isPoskestren ? 'Jam Layanan Medis' : (isKbihu ? 'Waktu Bimbingan' : (isLbb ? 'Jadwal Bimbingan' : 'Sistem Belajar'))}</span>
        </div>
        <div class="unit-spec-val-box">
          <strong class="unit-spec-val" title="${unit.studyTime || 'Reguler & Mukim'}">${unit.studyTime || 'Reguler & Mukim'}</strong>
        </div>
      </div>
    </div>
  `;

  // Special Callout if LBB, KBIHU, or Poskestren
  let specialCallout = '';
  if (isLbb) {
    specialCallout = `
      <div style="background:#F0F9FF; border:1px solid #BAE6FD; border-left:4px solid #0284C7; padding:10px 14px; border-radius:8px; margin-bottom:10px;">
        <div style="font-size:0.82rem; font-weight:800; color:#0369A1; display:flex; align-items:center; gap:6px; margin-bottom:2px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          LBB Terbuka untuk Siswa Sekolah Luar & Santri Pesantren
        </div>
        <p style="margin:0; font-size:0.77rem; color:#0284C7; line-height:1.45;">
          LBB Raudlatul Muta'allimin <strong>bisa diikuti oleh siswa/santri dari sekolah luar</strong> (SMA/SMK/MA) kelas sore & weekend tanpa mengganggu jadwal sekolah asal.
        </p>
      </div>
    `;
  } else if (isKbihu) {
    specialCallout = `
      <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-left:4px solid #059669; padding:10px 14px; border-radius:8px; margin-bottom:10px;">
        <div style="font-size:0.82rem; font-weight:800; color:#065F46; display:flex; align-items:center; gap:6px; margin-bottom:2px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Unit Layanan Mandiri Pembinaan Haji & Umrah
        </div>
        <p style="margin:0; font-size:0.77rem; color:#047857; line-height:1.45;">
          KBIHU beroperasi <strong>berdiri sendiri</strong> dengan manajemen & narahubung mandiri, khusus melayani bimbingan calon jamaah haji dan umrah mabrur sesuai sunnah.
        </p>
      </div>
    `;
  } else if (isPoskestren) {
    specialCallout = `
      <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-left:4px solid #10B981; padding:10px 14px; border-radius:8px; margin-bottom:10px;">
        <div style="font-size:0.82rem; font-weight:800; color:#065F46; display:flex; align-items:center; gap:6px; margin-bottom:2px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Layanan Kesehatan Siaga Santri Terpadu Yayasan (24 Jam)
        </div>
        <p style="margin:0; font-size:0.77rem; color:#047857; line-height:1.45;">
          Poskestren dibina oleh <strong>Dinas Kesehatan & Puskesmas Setempat</strong>, menyediakan ruang istirahat rawat observasi terpisah putra & putri, obat esensial berizin, serta pendampingan rujukan darurat 24 jam.
        </p>
      </div>
    `;
  }

  // Refined Segmented Tabs Navigation (Contextualized Labels & SVG Icons)
  const tab1Label = isPoskestren ? 'Layanan Medis' : (isKbihu ? 'Program Manasik' : (isLbb ? 'Program Bimbel' : 'Kurikulum'));
  const tab2Label = isPoskestren ? 'Fasilitas & Obat' : 'Fasilitas';
  const tab3Label = isPoskestren ? 'SOP Pelayanan' : (isKbihu ? 'Konsultasi Jamaah' : (isLbb ? 'Info & Jadwal' : 'PPDB'));

  const tab1Icon = isPoskestren
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;

  const tab2Icon = isPoskestren
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>`;

  const tab3Icon = isPoskestren
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`;

  const tabsNavHtml = `
    <div class="unit-tabs-nav ${hasSpeech ? 'has-speech-tab' : ''}">
      <button class="unit-tab-btn active" onclick="switchUnitTab('tab-kurikulum', this)" title="${tab1Label}">
        ${tab1Icon}
        <span>${tab1Label}</span>
      </button>
      ${hasSpeech ? `
        <button class="unit-tab-btn unit-tab-btn-speech" onclick="switchUnitTab('tab-sambutan', this)" title="${leaderMeta.tabLabel}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Sambutan</span>
        </button>
      ` : ''}
      <button class="unit-tab-btn" onclick="switchUnitTab('tab-fasilitas', this)" title="${tab2Label}">
        ${tab2Icon}
        <span>${tab2Label}</span>
      </button>
      <button class="unit-tab-btn" onclick="switchUnitTab('tab-psb', this)" title="${tab3Label}">
        ${tab3Icon}
        <span>${tab3Label}</span>
      </button>
    </div>
  `;

  // Tab 1: Kurikulum & Program / Layanan Medis
  const tab1Subhead = isPoskestren
    ? 'Layanan Medis & Perawatan Santri Unggulan:'
    : (isKbihu ? 'Program & Materi Manasik Haji Unggulan:' : (isLbb ? 'Program Pembelajaran & Target Unggulan:' : 'Program & Kurikulum Unggulan:'));

  const tab1Html = `
    <div class="unit-tab-pane active" id="tab-kurikulum">
      <p class="unit-desc-text">
        ${unit.fullDesc}
      </p>
      <h4 class="unit-section-subhead">
        <span class="subhead-bar ${isPoskestren ? 'emerald' : 'gold'}"></span>
        <span>${tab1Subhead}</span>
      </h4>
      <ul class="unit-programs-list">
        ${(unit.programs || []).map(p => `
          <li class="unit-program-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" class="program-check-icon">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${p}</span>
          </li>
        `).join('')}
      </ul>
      ${(unit.structural && Object.keys(unit.structural).length > 0) ? `
        <div class="unit-structural-block" style="margin-top: 24px; padding: 18px 20px; background: #F8FAFC; border-radius: 14px; border: 1.5px solid #E2E8F0;">
          <h4 class="unit-section-subhead" style="margin-top: 0; margin-bottom: 14px;">
            <span class="subhead-bar gold"></span>
            <span>Struktur Pimpinan & Dewan Guru ${unit.name}:</span>
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px;">
            <div style="background: #FFFFFF; padding: 10px 14px; border-radius: 10px; border: 1.5px solid rgba(15, 76, 129, 0.25); display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 6px rgba(10,37,64,0.04);">
              ${unit.headmasterPhoto ? `
                <img src="${unit.headmasterPhoto}" alt="${unit.headmaster}" style="width: 42px; height: 52px; object-fit: cover; object-position: top center; border-radius: 6px; border: 1.5px solid #FBBF24; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.12);" onerror="this.style.display='none'">
              ` : ''}
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <span style="font-size: 0.70rem; font-weight: 800; color: #0F4C81; text-transform: uppercase; letter-spacing: 0.04em;">${unit.leadershipTitle || 'Kepala'}</span>
                <strong style="font-size: 0.90rem; color: #0A2540;">${unit.headmaster}</strong>
              </div>
            </div>
            ${unit.structural.kurikulum ? `
              <div style="background: #FFFFFF; padding: 11px 14px; border-radius: 10px; border: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 3px;">
                <span style="font-size: 0.70rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Waka Kurikulum</span>
                <strong style="font-size: 0.86rem; color: #0A2540;">${unit.structural.kurikulum}</strong>
              </div>
            ` : ''}
            ${unit.structural.kesiswaan ? `
              <div style="background: #FFFFFF; padding: 11px 14px; border-radius: 10px; border: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 3px;">
                <span style="font-size: 0.70rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Waka Kesiswaan</span>
                <strong style="font-size: 0.86rem; color: #0A2540;">${unit.structural.kesiswaan}</strong>
              </div>
            ` : ''}
            ${unit.structural.bk ? `
              <div style="background: #FFFFFF; padding: 11px 14px; border-radius: 10px; border: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 3px;">
                <span style="font-size: 0.70rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Bimbingan Konseling (BK)</span>
                <strong style="font-size: 0.86rem; color: #0A2540;">${unit.structural.bk}</strong>
              </div>
            ` : ''}
            ${unit.structural.humas ? `
              <div style="background: #FFFFFF; padding: 11px 14px; border-radius: 10px; border: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 3px;">
                <span style="font-size: 0.70rem; font-weight: 700; color: #64748B; text-transform: uppercase;">Humas Lembaga</span>
                <strong style="font-size: 0.86rem; color: #0A2540;">${unit.structural.humas}</strong>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Tab Sambutan Kepala Sekolah / Pemangku Pesantren (Format Eksekutif Institusional Pantas & Rapi)
  const headPhoto = unit.headmasterPhoto || unit.image || 'assets/pesantren_gedung.jpg';
  const speechHeadlineSuffix = (leaderMeta.type === 'pesantren')
    ? 'Pesantren Raudlatul Muta\'allimin'
    : (leaderMeta.unitFormalName || unit.name);

  const speechRawParagraphs = (unit.headmasterSpeech || '')
    .split(/\n\s*\n/)
    .filter(Boolean);

  const formattedSpeechHtml = speechRawParagraphs.map((p, idx) => {
    const trimmed = p.trim();
    const isSalam = trimmed.toLowerCase().startsWith('assalamu') || trimmed.toLowerCase().startsWith('bismillah');
    if (isSalam && idx === 0) {
      return `<p class="speech-opening-salam">${trimmed}</p>`;
    }
    return `<p class="speech-body-p">${trimmed}</p>`;
  }).join('');

  const speechThemeTitle = unit.headmasterSpeechTitle 
    ? `"${unit.headmasterSpeechTitle}"`
    : `${leaderMeta.speechTitlePrefix} ${speechHeadlineSuffix}`;

  const tabSpeechHtml = hasSpeech ? `
    <div class="unit-tab-pane" id="tab-sambutan">
      <div class="speech-ref-container">
        <!-- Header Sambutan Eksekutif (Bebas dari Blok Kuning Menyilaukan) -->
        <div class="speech-header-box">
          <div class="speech-kicker-row">
            <span class="speech-kicker-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Amanat & Pesan Pimpinan
            </span>
            <span class="speech-institution-pill">${unit.name}</span>
          </div>
          <h3 class="speech-editorial-title">
            ${speechThemeTitle}
          </h3>
          <div class="speech-gold-divider"></div>
        </div>

        <!-- Banner Profil Pimpinan Satuan (Elegan, Proporsional & Rapi) -->
        <div class="speech-leader-banner">
          <div class="speech-leader-avatar-wrap">
            <img src="${headPhoto}" alt="${unit.headmaster || leaderMeta.label}" class="speech-leader-avatar" onerror="this.onerror=null;this.src='assets/pesantren_gedung.jpg';">
          </div>
          <div class="speech-leader-meta">
            <div class="speech-leader-role-badge">${leaderMeta.label}</div>
            <h4 class="speech-leader-name">${unit.headmaster || leaderMeta.label}</h4>
            <p class="speech-leader-title">${leaderMeta.role || ('Kepala ' + unit.name)}</p>
          </div>
        </div>

        <!-- Alur Teks Sambutan Penuh (Legible, Pantas, dan Nyaman Dibaca di Layar Laptop Maupun HP) -->
        <div class="speech-text-wrapper">
          ${formattedSpeechHtml || `<p class="speech-body-p">${unit.shortDesc || unit.fullDesc}</p>`}
        </div>

        <!-- Blok Pengesahan & Tanda Tangan Resmi Eksekutif -->
        <div class="speech-editorial-signoff">
          <p class="speech-closing-salam">Wassalamu'alaikum Warahmatullahi Wabarakatuh.</p>
          <div class="speech-signature-plain">
            <span class="speech-signature-tag">Tertanda Resmi,</span>
            <strong class="speech-signature-name">${unit.headmaster || leaderMeta.label}</strong>
            <span class="speech-signature-role">${leaderMeta.role || ('Kepala ' + unit.name)}</span>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  // Tab 2: Sarana & Fasilitas
  const defaultFacilities = unit.facilities || [
    "Ruang Kelas Multimedia Ber-AC & Audio Visual",
    "Laboratorium Komputer & Riset Sains",
    "Perpustakaan & Pojok Literasi Digital",
    "Sarana Olahraga & Lapangan Terpadu",
    "Kantin Bersih, Koperasi & Layanan Kesehatan"
  ];
  const defaultEkskul = unit.extracurriculars || [
    "Tahfidzul Qur'an Bersanad",
    "Pramuka Gudep Pesantren",
    "Klub Sains & Robotika",
    "Seni Hadrah Banjari",
    "Olahraga Futsal & Beladiri"
  ];

  const tab2Subhead1 = isPoskestren
    ? 'Sarana Medis & Fasilitas Ruang Rawat:'
    : 'Sarana & Fasilitas Penunjang Belajar:';

  const tab2Subhead2 = isPoskestren
    ? 'Program Edukasi & Kader Kesehatan Santri:'
    : 'Pembinaan Bakat & Ekstrakurikuler:';

  const tab2Html = `
    <div class="unit-tab-pane" id="tab-fasilitas">
      <h4 class="unit-section-subhead">
        <span class="subhead-bar navy"></span>
        <span>${tab2Subhead1}</span>
      </h4>
      <div class="unit-facilities-grid">
        ${defaultFacilities.map(f => `
          <div class="unit-facility-item">
            <span class="facility-check">✓</span>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>

      <h4 class="unit-section-subhead">
        <span class="subhead-bar gold"></span>
        <span>${tab2Subhead2}</span>
      </h4>
      <div class="unit-ekskul-chips">
        ${defaultEkskul.map(e => `
          <span class="unit-ekskul-chip">
            ✦ ${e}
          </span>
        `).join('')}
      </div>
    </div>
  `;

  // Tab 3: Info Pendaftaran PSB / SOP Poskestren / Konsultasi KBIHU
  let tab3Html = '';
  if (isPoskestren) {
    tab3Html = `
      <div class="unit-tab-pane" id="tab-psb">
        <div class="unit-psb-official-box">
          <div class="unit-psb-head">
            <div class="unit-psb-crest" style="background: rgba(16, 185, 129, 0.15); color: #059669;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <div>
              <h4 class="unit-psb-title" style="color: #065F46;">Standar Operasional (SOP) Penanganan Medis</h4>
              <p class="unit-psb-subtitle">Layanan 24 Jam Binaan Dinkes & Puskesmas Babat</p>
            </div>
          </div>
          
          <div class="unit-psb-info-grid">
            <div class="unit-psb-info-item">
              <span class="psb-info-label" style="color:#059669;">1. Pelaporan & Skrining:</span>
              <p class="psb-info-desc">Pemeriksaan suhu, tensi, dan keluhan langsung oleh tenaga medis.</p>
            </div>
            <div class="unit-psb-info-item">
              <span class="psb-info-label" style="color:#059669;">2. Ruang Rawat Observasi:</span>
              <p class="psb-info-desc">Kamar istirahat terpisah putra dan putri berfasilitas ranjang medis.</p>
            </div>
            <div class="unit-psb-info-item">
              <span class="psb-info-label" style="color:#059669;">3. Pemberian Obat:</span>
              <p class="psb-info-desc">Obat-obatan dan vitamin terstandar Dinas Kesehatan.</p>
            </div>
            <div class="unit-psb-info-item">
              <span class="psb-info-label" style="color:#059669;">4. Komunikasi & Rujukan:</span>
              <p class="psb-info-desc">Keluarga dikabari berkala via WA; siap mobil siaga yayasan jika rujukan.</p>
            </div>
          </div>
        </div>

        <div class="unit-psb-notice" style="background:#F0FDF4; border-color:#BBF7D0; color:#166534;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span>Layanan pertolongan pertama dan observasi Poskestren sudah <strong>terfasilitasi penuh (All-in-One)</strong> bagi santri mukim YTPAI Raudlatul Muta'allimin tanpa dipungut biaya periksa harian tambahan.</span>
        </div>
      </div>
    `;
  } else if (isKbihu) {
    tab3Html = `
      <div class="unit-tab-pane" id="tab-psb">
        <div class="unit-psb-official-box">
          <div class="unit-psb-head">
            <div class="unit-psb-crest" style="background: rgba(5, 150, 105, 0.15); color: #059669;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h4 class="unit-psb-title" style="color: #065F46;">Pendaftaran Jamaah Haji & Umrah KBIHU</h4>
              <p class="unit-psb-subtitle">Manasik Resmi Izin Kemenag RI Bersama Masyayikh YTPAI</p>
            </div>
          </div>
          
          <div class="unit-psb-info-grid">
            <div class="unit-psb-info-item">
              <span class="psb-info-label" style="color:#059669;">Fasilitas Bimbingan:</span>
              <p class="psb-info-desc">Teori mendalam, simulasi miniatur Ka'bah, & pendampingan langsung.</p>
            </div>
            <div class="unit-psb-info-item">
              <span class="psb-info-label" style="color:#059669;">Sekretariat Layanan:</span>
              <p class="psb-info-desc">Kantor KBIHU Kompleks Pusat Yayasan, Datinawong, Babat, Lamongan.</p>
            </div>
          </div>
        </div>

        <div class="unit-psb-notice" style="background:#ECFDF5; border-color:#A7F3D0; color:#065F46;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Informasi jadwal manasik dan pendaftaran haji/umrah dapat dilihat selengkapnya di portal resmi <strong><a href="kbihu.html" style="color:#059669; font-weight:700;">Laman KBIHU Al-Muta'allimin</a></strong>.</span>
        </div>
      </div>
    `;
  } else {
    tab3Html = `
      <div class="unit-tab-pane" id="tab-psb">
        <div class="unit-psb-official-box">
          <div class="unit-psb-head">
            <div class="unit-psb-crest">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <h4 class="unit-psb-title">Penerimaan Murid Baru (SPMB) TA. 2027/2028</h4>
              <p class="unit-psb-subtitle">Online & Sekretariat Yayasan, Babat Lamongan</p>
            </div>
          </div>
          
          <div class="unit-psb-info-grid">
            <div class="unit-psb-info-item">
              <span class="psb-info-label">Jalur Beasiswa & Prestasi:</span>
              <p class="psb-info-desc">Tahfidz Qur'an, Prestasi OSN/KSM, & Keringanan Yatim/Dhuafa.</p>
            </div>
            <div class="unit-psb-info-item">
              <span class="psb-info-label">Jam Layanan Lembaga:</span>
              <p class="psb-info-desc">Sabtu–Kamis: 07.00–14.00 WIB (Pondok Pesantren 24 Jam).</p>
            </div>
          </div>
        </div>

        <div class="unit-psb-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Brosur resmi, rincian tabel biaya pendidikan, serta formulir pendaftaran dapat diakses melalui portal <strong><a href="psb.html">Pendaftaran Santri Baru (PSB)</a></strong>.</span>
        </div>
      </div>
    `;
  }

  // WhatsApp Pre-filled message
  const waPhone = unit.whatsappClean || (db.meta && db.meta.phoneClean) || '6285648847070';
  const waText = encodeURIComponent(`Assalamu'alaikum Warahmatullahi Wabarakatuh. Saya ingin berkonsultasi mengenai informasi dan fasilitas di ${unit.name}...`);
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

  // Contextual Footer Action Buttons
  let ctaButtonsHtml = '';
  let extraBtn = '';
  if (isPoskestren) {
    const waMedisUrl = `https://wa.me/${unit.whatsappClean || '6285648847070'}?text=${encodeURIComponent("Assalamu'alaikum Warahmatullahi Wabarakatuh. Saya ingin berkonsultasi mengenai fasilitas dan layanan kesehatan Poskestren YTPAI Raudlatul Muta'allimin...")}`;
    ctaButtonsHtml = `
      <a href="${waMedisUrl}" target="_blank" rel="noopener" class="btn-unit-primary-cta" style="background:#059669; border-color:#059669; color:#FFFFFF;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
        <span>Hubungi Petugas Medis (WA)</span>
      </a>
      <a href="#fasilitas" class="btn btn-outline btn-sm" onclick="closeGenericModal()" style="font-weight:700; border-color:#CBD5E1; color:#0A2540;">
        <span>Lihat Sarana Pesantren</span>
      </a>
    `;
  } else if (isKbihu) {
    ctaButtonsHtml = `
      <a href="kbihu.html" class="btn-unit-primary-cta" style="background:#059669; border-color:#059669; color:#FFFFFF;">
        <span>Laman Resmi KBIHU ↗</span>
      </a>
      <a href="${waUrl}" target="_blank" rel="noopener" class="btn-unit-wa">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
        <span>Konsultasi Jamaah (WA)</span>
      </a>
    `;
  } else if (isLbb) {
    ctaButtonsHtml = `
      <a href="lbb.html" class="btn-unit-primary-cta" style="background:#0284C7; border-color:#0284C7; color:#FFFFFF;">
        <span>Laman Resmi LBB ↗</span>
      </a>
      <a href="${waUrl}" target="_blank" rel="noopener" class="btn-unit-wa">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
        <span>Tanya Bimbel (WA)</span>
      </a>
    `;
  } else {
    ctaButtonsHtml = `
      ${extraBtn}
      <a href="#pendaftaran" class="btn-unit-primary-cta" onclick="handleRegisterUnit('${unit.id}', '${(unit.name || '').replace(/'/g, "\\'")}'); return false;">
        <span>Daftar di Unit Ini</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
      <a href="${waUrl}" target="_blank" rel="noopener" class="btn-unit-wa">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
        <span>Tanya Panitia (WA)</span>
      </a>
    `;
  }

  body.innerHTML = `
    <div class="unit-modal-view">
      <!-- Kolom Kiri: Galeri Media Slideshow & Quick-Facts Specs -->
      <div class="unit-modal-col-left">
        ${slideshowHtml}
        ${factsHtml}
      </div>

      <!-- Kolom Kanan: Segmented Tabs, Konten & Action CTA -->
      <div class="unit-modal-col-right">
        ${specialCallout}
        ${tabsNavHtml}
        <div class="unit-tab-panes-wrapper">
          ${tab1Html}
          ${tabSpeechHtml}
          ${tab2Html}
          ${tab3Html}
        </div>

        <div class="unit-modal-action-footer">
          <div class="unit-modal-cta-group">
            ${ctaButtonsHtml}
          </div>
          <button type="button" class="btn-modal-close-ghost" onclick="closeGenericModal()">
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (initialTabId) {
    setTimeout(() => {
      window.switchUnitTab(initialTabId);
    }, 50);
  }
};

/* --- FORMULIR KONSULTASI CALON JAMAAH KBIHU MANDIRI --- */
window.openKbihuConsultModal = function() {
  const db = getDB();
  const kbihu = db.kbihuInfo || {};
  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle');
  const body = document.getElementById('genericModalBody');

  title.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:1.4rem;">🕋</span>
      <div>
        <div style="font-size:1.1rem; font-weight:800; color:var(--color-primary); line-height:1.2;">Konsultasi Calon Jamaah Haji & Umrah</div>
        <div style="font-size:0.75rem; font-weight:700; color:#059669;">KBIHU RAUDLATUL MUTA'ALLIMIN LAMONGAN</div>
      </div>
    </div>
  `;

  body.innerHTML = `
    <div>
      <div style="background:#ECFDF5; border:1px solid #A7F3D0; padding:12px 16px; border-radius:10px; margin-bottom:18px; font-size:0.85rem; color:#065F46; line-height:1.5;">
        Silakan lengkapi formulir di bawah ini untuk terhubung langsung dengan <strong>Narahubung Khusus KBIHU</strong> mengenai jadwal manasik, porsi haji, dan paket umrah berkah:
      </div>

      <form id="kbihuConsultForm" onsubmit="submitKbihuConsult(event)">
        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label" style="font-size:0.85rem; font-weight:700; color:#0A2540;">Nama Lengkap Calon Jamaah *</label>
          <input type="text" id="kbihuNama" class="form-control" placeholder="Contoh: H. Abdul Wahab / Hj. Siti Aminah" required style="font-size:0.88rem; padding:10px 14px; border-radius:8px; border:1px solid #CBD5E1; width:100%;">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.85rem; font-weight:700; color:#0A2540;">Nomor WhatsApp Aktif *</label>
            <input type="tel" id="kbihuWa" class="form-control" placeholder="08xxxxxxxxxx" required style="font-size:0.88rem; padding:10px 14px; border-radius:8px; border:1px solid #CBD5E1; width:100%;">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.85rem; font-weight:700; color:#0A2540;">Kota / Kecamatan Domisili *</label>
            <input type="text" id="kbihuDomisili" class="form-control" placeholder="Contoh: Babat, Lamongan" required style="font-size:0.88rem; padding:10px 14px; border-radius:8px; border:1px solid #CBD5E1; width:100%;">
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label" style="font-size:0.85rem; font-weight:700; color:#0A2540;">Kategori Layanan Bimbingan *</label>
          <select id="kbihuKategori" class="form-select" style="font-size:0.82rem; padding:8px 12px; border-radius:6px; border:1.5px solid #CBD5E1; width:100%; color:#0A2540; font-weight:600;">
            <option value="Bimbingan Manasik Haji Reguler (Kemenag)">Manasik Haji Reguler (Kemenag)</option>
            <option value="Bimbingan Haji Plus / Khusus / Furoda">Haji Khusus / Plus / Furoda</option>
            <option value="Paket Umrah Bersama Masyayikh Pesantren">Umrah Masyayikh Pesantren</option>
            <option value="Cek Estimasi Tahun Keberangkatan / Porsi Haji">Cek Estimasi Nomor Porsi</option>
            <option value="Konsultasi Fiqih Haji & Kesehatan Jamaah">Konsultasi Fiqih & Lansia</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:18px;">
          <label class="form-label" style="font-size:0.85rem; font-weight:700; color:#0A2540;">Pertanyaan / Catatan Tambahan (Opsional)</label>
          <textarea id="kbihuPesan" class="form-control" rows="3" placeholder="Tuliskan nomor porsi haji jika sudah memiliki, atau pertanyaan mengenai waktu bimbingan manasik..." style="font-size:0.88rem; padding:10px 14px; border-radius:8px; border:1px solid #CBD5E1; width:100%;"></textarea>
        </div>

        <div style="background:#F8FAFC; border-radius:8px; padding:12px; margin-bottom:20px; border:1px solid #E2E8F0; display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.3rem;">👤</span>
          <div style="font-size:0.8rem; color:#475569;">
            Konsultasi Anda akan langsung diterima oleh <strong>${kbihu.coordinator || "Ust. Yusuf Afif Rifa'i"}</strong> (${kbihu.whatsapp || '+62 856-0630-7911'}).
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openUnitModal('kbihu')">← Kembali ke Profil KBIHU</button>
          <button type="submit" class="btn btn-success btn-sm" style="background:#059669; border-color:#059669; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
            <span>Kirim Konsultasi ke WhatsApp</span> ↗
          </button>
        </div>
      </form>
    </div>
  `;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.submitKbihuConsult = function(e) {
  e.preventDefault();
  const db = getDB();
  const kbihu = db.kbihuInfo || {};
  const nama = document.getElementById('kbihuNama').value.trim();
  const wa = document.getElementById('kbihuWa').value.trim();
  const domisili = document.getElementById('kbihuDomisili').value.trim();
  const kategori = document.getElementById('kbihuKategori').value;
  const pesan = document.getElementById('kbihuPesan').value.trim();

  const waTarget = kbihu.whatsappClean || '6285606307911';
  const textMsg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `*KONSULTASI CALON JAMAAH KBIHU RAUDLATUL MUTA'ALLIMIN*\n` +
    `• *Nama Calon Jamaah:* ${nama}\n` +
    `• *No. WhatsApp:* ${wa}\n` +
    `• *Domisili:* ${domisili}\n` +
    `• *Layanan yang Dituju:* ${kategori}\n` +
    (pesan ? `• *Catatan / Pertanyaan:* ${pesan}\n` : '') +
    `\nMohon informasi dan bimbingan lebih lanjut dari Sekretariat KBIHU. Terima kasih.`;

  const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(textMsg)}`;
  window.open(waUrl, '_blank');
  closeGenericModal();
};

/* --- BAGAN STRUKTUR ORGANISASI: MODAL DETAIL 14 SATUAN --- */
window.openStrukturDetail = function(unitKey) {
  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle');
  const body = document.getElementById('genericModalBody');
  if (!modal || !title || !body) return;

  const dataStruktur = {
    'kb-tk': {
      code: 'KB / TK',
      name: 'PAUD & TK Raudlatul Muta\'allimin',
      cluster: 'Pendidikan Formal',
      badge: 'Jenjang Usia Dini',
      icon: '🧸',
      desc: 'Pendidikan anak usia dini berbasis pembiasaan adab islami, motorik kreatif, tahfidz juz amma pilihan, dan lingkungan bermain yang aman serta menyenangkan.',
      programs: [
        'Tahfidz Surat Pendek & Doa Harian',
        'Pembiasaan Akhlak & Sholat Dhuha Berjamaah',
        'Sentra Motorik Halus & Kreativitas Edukatif',
        'Pengenalan Huruf Hijaiyah Metode Cepat'
      ],
      link: '#unit',
      actionText: 'Lihat Satuan Formal'
    },
    'mi': {
      code: 'MI',
      name: 'Madrasah Ibtidaiyah (MI) Raudlatul Muta\'allimin',
      cluster: 'Pendidikan Formal',
      badge: 'Kemenag RI • Akreditasi A',
      icon: '📖',
      desc: 'Pondasi pendidikan dasar 6 tahun yang memadukan kurikulum Kementerian Agama dengan muatan lokal kepesantrenan, pembiasaan ibadah istiqomah, dan literasi sains dasar.',
      programs: [
        'Tahfidzul Qur\'an Juz 30 Bersanad',
        'Bina Prestasi Olimpiade Sains & KSM',
        'Laboratorium Komputer & Bahasa Digital',
        'Pembiasaan Sholat Berjamaah & Tartil Al-Qur\'an'
      ],
      link: '#unit',
      actionText: 'Lihat Satuan Formal'
    },
    'mts': {
      code: 'MTs',
      name: 'Madrasah Tsanawiyah (MTs) Raudlatul Muta\'allimin',
      cluster: 'Pendidikan Formal',
      badge: 'Kemenag RI • Akreditasi A',
      icon: '🔬',
      desc: 'Jenjang madrasah lanjutan tingkat pertama dengan akselerasi sains, pengenalan kitab turats salaf, pembelajaran bilingual, dan pembinaan kedisiplinan mandiri.',
      programs: [
        'Kelas Unggulan Sains & Riset Madrasah',
        'Kajian Dasar Nahwu, Shorof & Akhlaq',
        'Bina Prestasi KSM, Robotik & Pramuka Santri',
        'Integrasi Kurikulum Asrama & Non-Mukim'
      ],
      link: '#unit',
      actionText: 'Lihat Satuan Formal'
    },
    'ma': {
      code: 'MA',
      name: 'Madrasah Aliyah (MA) Raudlatul Muta\'allimin',
      cluster: 'Pendidikan Formal',
      badge: 'Kemenag RI • Akreditasi A',
      icon: '📚',
      desc: 'Madrasah aliyah unggulan peminatan Keagamaan dan MIPA/IPS, membekali santri untuk tembus perguruan tinggi Islam ternama (UIN, Timur Tengah, Al-Azhar Kairo) dan PTN nasional.',
      programs: [
        'Pendalaman Kitab Fathul Qorib & Alfiyah Ibnu Malik',
        'Bimbingan Seleksi Beasiswa Al-Azhar & Timur Tengah',
        'Program Khidmah Da\'i Muda & Dakwah Masyarakat',
        'Laboratorium Komputer CBT & Sains Terpadu'
      ],
      link: '#unit',
      actionText: 'Lihat Satuan Formal'
    },
    'smp': {
      code: 'SMP',
      name: 'SMP Raudlatul Muta\'allimin',
      cluster: 'Pendidikan Formal',
      badge: 'Kemendikbudristek',
      icon: '💻',
      desc: 'Sekolah menengah pertama formal yang menerapkan kurikulum nasional merdeka dipadukan dengan nilai-nilai kepesantrenan luhur dan teknologi informasi modern.',
      programs: [
        'Kurikulum Nasional Terpadu Karakter Santri',
        'Penguatan Literasi Digital & Multimedia',
        'Ekstrakurikuler Seni Islami, Olahraga & Kepanduan',
        'Bilingual English & Arabic Environment'
      ],
      link: '#unit',
      actionText: 'Lihat Satuan Formal'
    },
    'sma': {
      code: 'SMA',
      name: 'SMA Raudlatul Muta\'allimin',
      cluster: 'Pendidikan Formal',
      badge: 'Kemendikbudristek',
      icon: '🎓',
      desc: 'Sekolah menengah atas formal dengan fokus persiapan masuk Perguruan Tinggi Negeri (PTN), kedinasan, pengembangan talenta sains, digital kreatif, dan kepemimpinan santri.',
      programs: [
        'Drilling Intensif Sukses SNBT / UTBK & Kedinasan',
        'Pengembangan Riset Sains & Karya Tulis Ilmiah',
        'Program Kepemimpinan Santri & Organisasi Siswa',
        'Konseling Karir & Pemetaan Minat Bakat'
      ],
      link: '#unit',
      actionText: 'Lihat Satuan Formal'
    },
    'ponpes': {
      code: 'PONPES',
      name: 'Pondok Pesantren Raudlatul Muta\'allimin (Putra & Putri)',
      cluster: 'Kepesantrenan & Keagamaan',
      badge: 'Pesantren Salafiyah Modern 24 Jam',
      icon: '🕌',
      desc: 'Kompleks asrama pesantren asri terpisah antara santri putra dan santri putri. Dipimpin langsung oleh Dewan Pengasuh dengan sanad keilmuan muttashil, sholat berjamaah 5 waktu, wirid ratib, dan pengkajian kitab salaf.',
      programs: [
        'Kompleks Asrama Representatif Putra & Putri Terpisah',
        'Kajian Rutin Kitab Turats Ulama Aswaja An-Nahdliyyah',
        'Pembiasaan Sholat Berjamaah, Dzikir & Qiyamul Lail',
        'Bimbingan Karakter & Disiplin Mandiri 24 Jam'
      ],
      link: '#unit',
      actionText: 'Detail Pondok Pesantren'
    },
    'madin': {
      code: 'MDT',
      name: 'Madrasah Diniyah Takmiliyah (MDT)',
      cluster: 'Kepesantrenan & Keagamaan',
      badge: 'Sub Ula & Wustho Berjenjang',
      icon: '📜',
      desc: 'Lembaga pendidikan keagamaan Islam non-formal berjenjang sub Ula dan Wustho yang mengkaji khazanah keilmuan Islam klasik karya ulama mu\'tabarah mencakup Fiqih, Nahwu, Shorof, Akhlak, Hadits, dan Tafsir.',
      programs: [
        'Jenjang MDT Ula & MDT Wustho Berjenjang',
        'Metode Sorogan, Bandongan, dan Wetonan',
        'Forum Musyawarah Ilmiah & Bahtsul Masail Santri',
        'Ujian Evaluasi Kitab Kuning & Syahadah Resmi'
      ],
      link: '#unit',
      actionText: 'Pelajari Kurikulum Diniyah'
    },
    'lpba': {
      code: 'LPBA',
      name: 'Lembaga Pengembangan Bahasa Asing (LPBA)',
      cluster: 'Kepesantrenan & Keagamaan',
      badge: 'Pusat Bahasa Asing (Arab & Inggris)',
      icon: '🌐',
      desc: 'Lembaga resmi yayasan yang mengelola program percepatan dan penguasaan bahasa asing bagi santri dan siswa, difokuskan pada kecakapan aktif Bahasa Arab dan Bahasa Inggris.',
      programs: [
        'English & Arabic Daily Habituation Zone',
        'Muhadhoroh & Pidato 3 Bahasa (Arab, Inggris, Indo)',
        'Laboratorium Bahasa Multimedia & Praktik Percakapan',
        'Klinik Persiapan Ujian Standar TOEFL & TOAFL'
      ],
      link: '#unit',
      actionText: 'Jelajahi Program Bahasa'
    },
    'lba': {
      code: 'LBA',
      name: 'Lembaga Bimbingan Al-Qur\'an (LBA)',
      cluster: 'Kepesantrenan & Keagamaan',
      badge: 'Pusat Standarisasi & Tahfidz Bersanad',
      icon: '📖',
      desc: 'Lembaga bimbingan dan kaderisasi Qur\'ani yang mengawal standarisasi bacaan tahsin (tartil, makharijul huruf, kaidah tajwid) serta bimbingan tahfidzul qur\'an 30 juz bersanad muttashil.',
      programs: [
        'Standarisasi Metode Tahsin Tilawah Al-Qur\'an',
        'Bimbingan Intensif Tahfidzul Qur\'an 30 Juz Bersanad',
        'Tasmi\' Al-Qur\'an Bil Ghoib & Khotmil Qur\'an Berkala',
        'Ijazah Sanad Qira\'ah dari Dewan Asatidz Huffadz'
      ],
      link: '#unit',
      actionText: 'Program Tahfidz & Tahsin'
    },
    'kbih': {
      code: 'KBIH',
      name: 'KBIHU Raudlatul Muta\'allimin Babat Lamongan',
      cluster: 'Layanan Ummat & Kesehatan',
      badge: 'Izin Operasional Resmi Kemenag RI',
      icon: '🕋',
      desc: 'Kelompok Bimbingan Ibadah Haji dan Umrah resmi terakreditasi Kemenag RI, melayani bimbingan manasik komprehensif, pengawalan fisik & ibadah di tanah suci, serta silaturahmi alumni jamaah mabrur.',
      programs: [
        'Bimbingan Manasik Teori & Praktik Miniatur Ka\'bah',
        'Pengawalan Fisik & Ibadah di Makkah & Madinah',
        'Muthawwif & Pembimbing Ibadah Bersertifikat',
        'Forum Silaturahmi & Pengajian Rutin Alumni Haji'
      ],
      link: 'kbihu.html',
      actionText: 'Buka Halaman Khusus KBIHU'
    },
    'poskestren': {
      code: 'Poskestren',
      name: 'Pos Kesehatan Pesantren (Poskestren)',
      cluster: 'Layanan Ummat & Kesehatan',
      badge: 'Layanan Medis & PHBS Pesantren',
      icon: '🏥',
      desc: 'Fasilitas kesehatan primer di lingkungan pesantren dan yayasan yang melayani pertolongan pertama, rawat jalan santri, edukasi Perilaku Hidup Bersih dan Sehat (PHBS), serta rujukan medis faskes.',
      programs: [
        'Pemeriksaan Medis Rutin & Pengobatan Santri',
        'Penyuluhan Sanitasi Lingkungan & Gizi Sehat',
        'Penyediaan Obat-Obatan Esensial & Rawat Sementara',
        'Kemitraan Terpadu dengan Puskesmas & Rumah Sakit'
      ],
      link: 'fasilitas.html',
      actionText: 'Lihat Fasilitas Kesehatan'
    },
    'junio-smart': {
      code: 'Junio Smart',
      name: 'Junio Smart Card & Manajemen Finansial Digital',
      cluster: 'Digitalisasi & Kemandirian',
      badge: 'Sistem Digital Terpadu Santri',
      icon: '💳',
      desc: 'Sistem digitalisasi keuangan dan administrasi santri bekerja sama dengan perbankan nasional; memungkinkan transaksi non-tunai (cashless), absensi digital RFID, dan pemantauan tabungan santri secara transparan oleh wali murid.',
      programs: [
        'Kartu Pintar Multifungsi (Identitas, Absensi & Transaksi)',
        'Sistem Pembayaran Cashless di Kantin & Koperasi',
        'Aplikasi Monitoring Uang Saku & Tabungan bagi Wali Santri',
        'Edukasi Literasi Finansial & Budaya Menabung Santri'
      ],
      link: '#kontak',
      actionText: 'Konsultasi Layanan Digital'
    },
    'ekonomi-mandiri': {
      code: 'Ekonomi Mandiri',
      name: 'Unit Usaha & Kemandirian Ekonomi Pesantren',
      cluster: 'Digitalisasi & Kemandirian',
      badge: 'Pilar Kemandirian Finansial Yayasan',
      icon: '🏪',
      desc: 'Badan usaha mandiri milik yayasan yang menaungi Koperasi Pondok Pesantren (Kopontren), minimarket santri, percetakan & konveksi atribut seragam, serta unit agribisnis santri untuk menopang ketahanan ekonomi yayasan.',
      programs: [
        'Koperasi Pondok Pesantren (Kopontren) Berbadan Hukum',
        'Minimarket Santri & Penyediaan Kebutuhan Asrama',
        'Unit Usaha Konveksi Seragam & Percetakan Kitab',
        'Laboratorium Kewirausahaan (Santripreneurship) Mandiri'
      ],
      link: '#kontak',
      actionText: 'Informasi Unit Usaha'
    }
  };

  const item = dataStruktur[unitKey];
  if (!item) return;

  title.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:1.4rem;">${item.icon}</span>
      <div>
        <div style="font-size:0.72rem; font-weight:800; color:#C59B27; letter-spacing:1px; text-transform:uppercase;">${item.cluster}</div>
        <h3 style="margin:0; font-size:1.15rem; color:#0A2540; line-height:1.25;">${item.name}</h3>
      </div>
    </div>
  `;

  body.innerHTML = `
    <div style="padding:4px 0;">
      <div style="display:inline-flex; align-items:center; gap:6px; background:#F1F5F9; border:1px solid #E2E8F0; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700; color:#0F4C81; margin-bottom:14px;">
        <span>Kode Unit: <strong>${item.code}</strong></span>
        <span>•</span>
        <span>${item.badge}</span>
      </div>

      <p style="font-size:0.88rem; color:#475569; line-height:1.6; margin-bottom:16px;">
        ${item.desc}
      </p>

      <div style="background:#FAF9F5; border:1px solid rgba(197, 155, 39, 0.25); border-radius:12px; padding:14px 16px; margin-bottom:20px;">
        <h4 style="margin:0 0 10px; font-size:0.85rem; font-weight:800; color:#0A2540; display:flex; align-items:center; gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C59B27" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Fokus & Program Kerja Unggulan:
        </h4>
        <ul style="margin:0; padding-left:18px; font-size:0.82rem; color:#334155; line-height:1.6;">
          ${item.programs.map(p => `<li style="margin-bottom:4px;">${p}</li>`).join('')}
        </ul>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; border-top:1px solid #E2E8F0; padding-top:16px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeGenericModal()" style="border-radius:8px;">Tutup</button>
        <a href="${item.link}" class="btn btn-primary btn-sm" onclick="closeGenericModal()" style="border-radius:8px; display:inline-flex; align-items:center; gap:6px; background:#0F4C81; font-weight:700;">
          <span>${item.actionText}</span>
          <span>→</span>
        </a>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.openSpeechModal = function(leaderId) {
  const db = getDB();
  const leader = (db.leadership || []).find(l => l.id === leaderId);
  if (!leader) return;

  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle');
  const body = document.getElementById('genericModalBody');

  const isKetua = leader.id === 'ketua-yayasan' || (leader.role || '').toLowerCase().includes('ketua yayasan');
  const isPengasuh = (leader.role || '').toLowerCase().includes('pengasuh') || leader.id.startsWith('pengasuh');

  // Institution & Leader Meta
  let catBadge = 'Yayasan & Pesantren';
  let statusBadge = 'Amanah Resmi';
  let modalMainTitle = 'YTPAI Raudlatul Muta\'allimin Lamongan';
  let speechTitlePrefix = 'Pesan Pimpinan Yayasan';
  let institutionSuffix = 'YTPAI Raudlatul Muta\'allimin Lamongan';
  let leaderRoleBadge = (leader.role || 'PIMPINAN').toUpperCase();
  let leaderSignatureBadge = 'Pimpinan Yayasan';
  let leaderFullRole = `${leader.role} YTPAI Raudlatul Muta'allimin Lamongan`;

  if (isKetua) {
    catBadge = 'Pimpinan Yayasan';
    statusBadge = 'Amanah Resmi';
    modalMainTitle = 'YTPAI Raudlatul Muta\'allimin Lamongan';
    speechTitlePrefix = 'Pesan Ketua Yayasan';
    institutionSuffix = 'YTPAI Raudlatul Muta\'allimin Lamongan';
    leaderRoleBadge = 'KETUA YAYASAN';
    leaderSignatureBadge = 'Ketua Yayasan';
    leaderFullRole = 'Ketua Yayasan YTPAI Raudlatul Muta\'allimin Lamongan';
  } else if (isPengasuh) {
    catBadge = 'Dewan Pengasuh & Pembina';
    statusBadge = 'Masyayikh Pesantren';
    modalMainTitle = 'YTPAI Raudlatul Muta\'allimin Lamongan';
    speechTitlePrefix = leader.role.toLowerCase().includes('ketua')
      ? 'Pesan Ketua Dewan Pengasuh'
      : (leader.role.toLowerCase().includes('sekretaris')
        ? 'Pesan Sekretaris Dewan Pengasuh'
        : (leader.role.toLowerCase().includes('bendahara')
          ? 'Pesan Bendahara Dewan Pengasuh'
          : `Pesan ${leader.role}`));
    institutionSuffix = 'YTPAI Raudlatul Muta\'allimin Lamongan';
    leaderRoleBadge = 'DEWAN PENGASUH';
    leaderSignatureBadge = 'Dewan Pengasuh';
    leaderFullRole = `${leader.role} YTPAI Raudlatul Muta'allimin Lamongan`;
  }

  // Format paragraphs
  let paragraphsHtml = '<p class="speech-ref-p">Teks amanah resmi yayasan.</p>';
  if (leader.speechContent) {
    const rawParagraphs = leader.speechContent.split(/\n\s*\n/).filter(Boolean);
    paragraphsHtml = rawParagraphs.map(p => {
      return `<p class="speech-ref-p">${p.trim()}</p>`;
    }).join('');
  }

  // Set Title Markup (matches unit modal header brand style exactly)
  title.innerHTML = `
    <div class="unit-modal-header-brand">
      <div class="unit-modal-cat-tag">
        <span class="unit-cat-badge">${catBadge}</span>
        <span class="unit-status-badge">${statusBadge}</span>
      </div>
      <h3 class="unit-modal-main-title">${modalMainTitle}</h3>
    </div>
  `;

  const modalCard = modal.querySelector('.modal-card');
  if (modalCard) modalCard.classList.add('modal-speech-mode');

  // Set Body Markup with Newspaper Editorial Flow (matches kepala sekolah exactly)
  body.innerHTML = `
    <div class="speech-ref-container" style="padding-top: 4px;">
      <!-- Header Dokumen Resmi Pesantren (Bersih & Elegan) -->
      <div class="speech-ref-title-box">
        <div class="speech-doc-kicker-row">
          <span class="speech-doc-kicker-badge">Amanah &amp; Taushiah Resmi</span>
          <span class="speech-doc-kicker-org">${catBadge} • ${statusBadge}</span>
        </div>
        <h3 class="speech-ref-highlight-title">
          <span class="speech-ref-title-main">${speechTitlePrefix}</span>
          <span class="speech-ref-title-sub">${institutionSuffix}</span>
        </h3>
      </div>

      <!-- Newspaper Editorial Flow: Foto Floated di Kiri, Teks Mengalir Bersisian & Membungkus Bawah -->
      <div class="speech-newspaper-article">
        <div class="speech-portrait-float">
          <div class="speech-portrait-frame">
            <img src="${leader.photo}" alt="${leader.name}" class="speech-portrait-img" 
                 style="transform: scale(${leader.photoScale || 1}) translateY(${leader.photoOffsetY || 0}%); transform-origin: center top;"
                 onerror="this.onerror=null; this.src='assets/leader_ketua.jpg';">
            <div class="speech-portrait-caption">
              <span class="caption-role">${leaderRoleBadge}</span>
            </div>
          </div>
        </div>

        <div class="speech-article-content">
          ${paragraphsHtml}
        </div>

        <!-- Blok Pengesahan & Tanda Tangan Resmi Eksekutif (Newspaper Editorial Sign-Off) -->
        <div class="speech-editorial-signoff">
          <p class="speech-closing-salam">Wassalamu'alaikum Warahmatullahi Wabarakatuh.</p>
          <div class="speech-signature-card">
            <div class="speech-signature-content">
              <h4 class="speech-ref-author-name">${leader.name}</h4>
              <p class="speech-ref-author-role">${leaderFullRole}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Tutup Naskah Ramping -->
      <div class="unit-modal-action-footer" style="margin-top:14px; padding-top:10px; border-top:1px solid #E2E8F0;">
        <button type="button" class="btn btn-outline btn-block" onclick="closeGenericModal()" style="border-radius:8px; padding:10px 18px; font-weight:700; width:100%; border:1.5px solid #CBD5E1; color:#334155; background:#FFFFFF;">
          Tutup Naskah
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.openFacilityDetail = function(identifier, fallbackDesc) {
  const db = getDB();
  const facList = db.facilities || [];
  // Support lookup by id or name
  let fac = facList.find(f => f.id === identifier || f.name === identifier);
  if (!fac) {
    fac = {
      id: 'fac-custom',
      name: identifier,
      desc: fallbackDesc || 'Fasilitas sarana dan prasarana terpadu Yayasan YTPAI Raudlatul Muta\'allimin Lamongan.',
      image: 'assets/pesantren_gedung.jpg',
      category: 'Sarana Pesantren',
      capacity: 'Kapasitas Representatif',
      target: 'Santri Putra & Putri',
      operational: 'Sesuai Jadwal Pesantren',
      features: [
        'Kebersihan dan kenyamanan terjaga dengan tata tertib asrama',
        'Didukung sarana penunjang kegiatan belajar dan ibadah santri'
      ],
      fullDesc: fallbackDesc || 'Fasilitas sarana dan prasarana terpadu di lingkungan yayasan dan pondok pesantren YTPAI Raudlatul Muta\'allimin Lamongan dirancang untuk menciptakan atmosfer belajar dan ibadah yang nyaman, asri, serta penuh berkah bagi seluruh santri.'
    };
  }

  const modal = document.getElementById('genericModal');
  const title = document.getElementById('genericModalTitle');
  const body = document.getElementById('genericModalBody');

  // Header Modal: Bersih, Rapi & Elegan dengan Pill Kategori
  title.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
      <span style="font-size:1.05rem; font-weight:800; color:#0A2540;">${fac.name}</span>
      <span style="font-size:0.72rem; font-weight:700; background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:999px; border:1px solid #FDE68A; letter-spacing:0.02em;">${fac.category || 'Fasilitas'}</span>
    </div>
  `;
  
  const features = fac.features && Array.isArray(fac.features) ? fac.features : [];
  const fullNarrative = fac.fullDesc || fac.desc;

  body.innerHTML = `
    <div class="facility-dialog-view">
      <!-- Media Hero Showcase - Ramping, Estetik & Bebas Teks Ganda -->
      <div class="facility-dialog-hero-compact">
        <img src="${fac.image}" alt="${fac.name}" class="facility-dialog-img" onerror="this.onerror=null; this.src='assets/pesantren_gedung.jpg';">
        <div class="facility-dialog-scrim-subtle"></div>
        <div class="facility-dialog-badge-float">
          <span class="facility-dialog-pill-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${fac.category || 'Fasilitas Pesantren'}
          </span>
        </div>
      </div>

      <!-- Quick Specifications Strip - Modern Bento Style dengan Ikon Halus -->
      <div class="facility-dialog-specs-modern">
        <div class="dialog-spec-bento">
          <div class="spec-bento-icon icon-gold" title="Kapasitas Sarana">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10a3 3 0 0 1 6 0v11H9V10z"/></svg>
          </div>
          <div class="spec-bento-content">
            <span class="spec-bento-label">Kapasitas Sarana</span>
            <span class="spec-bento-val">${fac.capacity || 'Representatif'}</span>
          </div>
        </div>

        <div class="dialog-spec-bento">
          <div class="spec-bento-icon icon-navy" title="Peruntukan Pengguna">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="spec-bento-content">
            <span class="spec-bento-label">Peruntukan Pengguna</span>
            <span class="spec-bento-val">${fac.target || 'Santri Putra & Putri'}</span>
          </div>
        </div>

        <div class="dialog-spec-bento">
          <div class="spec-bento-icon icon-emerald" title="Jadwal Akses">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="spec-bento-content">
            <span class="spec-bento-label">Jadwal Akses</span>
            <span class="spec-bento-val">${fac.operational || '24 Jam (Terjadwal)'}</span>
          </div>
        </div>
      </div>

      <!-- Authentic Narrative -->
      <div class="facility-dialog-narrative">
        <h4 class="dialog-section-heading">
          <span class="heading-dot-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </span>
          <span>Fungsi Utama & Dinamika Santri</span>
        </h4>
        <p class="dialog-narrative-text">${fullNarrative}</p>
      </div>

      <!-- Concrete Amenities / Specifications -->
      ${features.length > 0 ? `
        <div class="facility-dialog-features">
          <h4 class="dialog-section-heading" style="color:#065F46; margin-bottom:10px;">
            <span class="heading-dot-icon" style="background:#D1FAE5; color:#059669;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </span>
            <span>Kelengkapan & Sarana Penunjang:</span>
          </h4>
          <div class="dialog-features-grid">
            ${features.map(f => `
              <div class="dialog-feature-item">
                <span class="feature-check-modern">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>${f}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Action Bar: Authentic, Useful, and Dignified -->
      <div class="facility-dialog-footer">
        <div class="dialog-footer-actions">
          ${fac.id === 'fac-poskestren' ? `
            <a href="https://wa.me/6285648847070?text=Assalamu%27alaikum%20Petugas%20Medis%20Poskestren%20YTPAI%20Lamongan,%20saya%20ingin%20berkonsultasi%20seputar%20fasilitas%20dan%20penanganan%20kesehatan%20santri..." target="_blank" class="btn btn-outline btn-sm dialog-wa-btn" style="color:#059669; border-color:#10B981;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              Hubungi Petugas Medis (WA)
            </a>
          ` : `
            <a href="https://wa.me/${(db.yayasan && db.yayasan.wa ? db.yayasan.wa.replace(/[^0-9]/g, '') : '6285648847070')}?text=Halo%20Humas%20YTPAI%20Lamongan,%20saya%20ingin%20berkonsultasi%20dan%20menjadwalkan%20kunjungan/survei%20ke%20sarana%20*${encodeURIComponent(fac.name)}*..." target="_blank" class="btn btn-outline btn-sm dialog-wa-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              Jadwalkan Kunjungan Survei
            </a>
          `}
          <div class="dialog-footer-right">
            <button class="btn btn-outline btn-sm" onclick="closeGenericModal()">Tutup</button>
            ${fac.id === 'fac-poskestren' ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="openUnitModal('poskestren')">
                Lihat SOP & Ruang Rawat →
              </button>
            ` : `
              <a href="psb.html" class="btn btn-primary btn-sm" onclick="closeGenericModal()">
                Daftar Santri Baru (PSB) →
              </a>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

function selectUnitDropdown(unitName) {
  const select = document.getElementById('selectUnit');
  if (!select || !unitName) return;
  const target = String(unitName).toLowerCase();
  for (let i = 0; i < select.options.length; i++) {
    const optVal = select.options[i].value.toLowerCase();
    const optText = select.options[i].text.toLowerCase();
    if (optVal.includes(target) || optText.includes(target) || target.includes(optVal)) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      break;
    }
  }
}
window.selectUnitDropdown = selectUnitDropdown;

window.selectGenderAndUnit = function(gender, unitName, isBoarding = true) {
  const genderSelect = document.getElementById('ppdbGender');
  if (genderSelect) {
    genderSelect.value = gender;
    if (window.handleGenderChange) {
      window.handleGenderChange(gender);
    }
  }
  selectUnitDropdown(unitName);
  if (window.selectBoardingOption) {
    window.selectBoardingOption(isBoarding ? 'Mondok' : 'Tidak Mondok');
  }
};

/* 19. FORMULIR KONTAK & KOTAK PESAN SEKRETARIAT (PRD 5.2 K) */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const wa = document.getElementById('contactWA').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const unit = document.getElementById('contactUnit').value;
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const alertBox = document.getElementById('contactFormAlert');

    if (!name || !wa || !subject || !message) {
      if (alertBox) {
        alertBox.className = 'contact-alert-banner error';
        alertBox.style.display = 'block';
        alertBox.innerHTML = 'Mohon lengkapi seluruh kolom wajib (*) yang bertanda bintang.';
      }
      return;
    }

    const db = getDB();
    if (!db.contactMessages) db.contactMessages = [];

    const newMsg = {
      id: `msg-${Date.now()}`,
      name,
      whatsapp: wa,
      email: email || '-',
      targetUnit: unit,
      subject,
      message,
      status: 'Baru',
      createdAt: new Date().toISOString()
    };

    db.contactMessages.unshift(newMsg);
    saveDB(db);

    if (alertBox) {
      alertBox.className = 'contact-alert-banner success';
      alertBox.style.display = 'block';
      alertBox.innerHTML = `
        <div style="font-weight:700; margin-bottom:4px; font-size:1rem;">Alhamdulillah, Pesan Anda Berhasil Terkirim!</div>
        <div>Terima kasih <strong>${name}</strong>. Tim panitia/sekretariat yayasan telah menerima pesan Anda dan akan segera menghubungi nomor WhatsApp <strong>${wa}</strong>.</div>
      `;
    }

    form.reset();

    if (alertBox && alertBox.scrollIntoView) {
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

/* 19B. INTERACTIVE CONTACT MAP (LEAFLET + GOOGLE TILES - SMOOTH DRAG & PAN) */
function initInteractiveContactMap() {
  const mapEl = document.getElementById('interactiveLeafletMap');
  const iframeFallback = document.getElementById('contactMapFallbackIframe');
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    if (iframeFallback) iframeFallback.style.display = 'block';
    if (mapEl) mapEl.style.display = 'none';
    return;
  }

  try {
    const lat = -7.1029391;
    const lng = 112.2202677;

    const map = L.map('interactiveLeafletMap', {
      center: [lat, lng],
      zoom: 16,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      tap: true,
      zoomControl: true
    });

    // Google Maps official roadmap tiles
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    }).addTo(map);

    // Custom Bespoke Islamic Navy & Gold Teardrop Pin with Ground Pulse Beacon
    const pinHtml = `
      <div class="ytpai-pin-container">
        <div class="ytpai-pin-shadow"></div>
        <div class="ytpai-pin-pulse"></div>
        <div class="ytpai-pin-body" title="YTPAI Raudlatul Muta'allimin - Klik untuk Buka Peta">
          <svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
            <defs>
              <linearGradient id="ytpaiPinNavy" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#144A75"/>
                <stop offset="45%" stop-color="#0A2540"/>
                <stop offset="100%" stop-color="#051525"/>
              </linearGradient>
              <linearGradient id="ytpaiPinGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FDE68A"/>
                <stop offset="35%" stop-color="#FBBF24"/>
                <stop offset="75%" stop-color="#D97706"/>
                <stop offset="100%" stop-color="#92400E"/>
              </linearGradient>
            </defs>
            <!-- Sculpted Teardrop Pin Silhouette -->
            <path d="M 19 2 C 9.6 2 2 9.6 2 19 C 2 29 15.5 41.5 18.2 47.8 C 18.5 48.5 19.5 48.5 19.8 47.8 C 22.5 41.5 36 29 36 19 C 36 9.6 28.4 2 19 2 Z" fill="url(#ytpaiPinNavy)" stroke="url(#ytpaiPinGold)" stroke-width="2" stroke-linejoin="round"/>
            <!-- Inner Pearl White Disc -->
            <circle cx="19" cy="18" r="11" fill="#FFFFFF"/>
            <circle cx="19" cy="18" r="11" fill="none" stroke="rgba(217, 119, 6, 0.25)" stroke-width="0.8"/>
            <!-- Minimalist Mosque Dome Silhouette -->
            <path d="M 19 10.5 C 18.5 11.3 14.8 14.2 14.8 17.5 H 23.2 C 23.2 14.2 19.5 11.3 19 10.5 Z" fill="#0A2540"/>
            <path d="M 15.2 18 H 22.8 V 23.5 H 15.2 Z" fill="#0A2540"/>
            <!-- Golden Arch Doorway -->
            <path d="M 17.3 23.5 V 20.8 C 17.3 19.8 18.1 19 19 19 C 19.9 19 20.7 19.8 20.7 20.8 V 23.5 H 17.3 Z" fill="url(#ytpaiPinGold)"/>
            <!-- Golden Spire Finial -->
            <circle cx="19" cy="9.2" r="1" fill="#FBBF24"/>
            <line x1="19" y1="9.8" x2="19" y2="10.8" stroke="#FBBF24" stroke-width="0.9"/>
          </svg>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'ytpai-pin-marker',
      html: pinHtml,
      iconSize: [38, 54],
      iconAnchor: [19, 49],
      popupAnchor: [0, -50]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family:'Plus Jakarta Sans',sans-serif; padding:4px 2px; text-align:left; min-width:180px;">
        <strong style="font-size:0.86rem; color:#0A2540; display:block; margin-bottom:3px;">YTPAI Raudlatul Muta'allimin</strong>
        <p style="font-size:0.75rem; color:#475569; margin:0 0 8px; line-height:1.4;">Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan</p>
        <a href="https://maps.app.goo.gl/ePeaKwX8PnkgPYGy9" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; font-size:0.75rem; font-weight:700; color:#0A2540; text-decoration:none; background:#FEF3C7; padding:5px 10px; border-radius:6px; border:1px solid #FBBF24;">
          Buka di Google Maps ↗
        </a>
      </div>
    `);

    // Invalidate size once rendered
    setTimeout(() => { if (map) map.invalidateSize(); }, 350);
    window.addEventListener('resize', () => { if (map) map.invalidateSize(); });
  } catch (err) {
    console.warn('Leaflet map error, switching to iframe fallback:', err);
    if (iframeFallback) iframeFallback.style.display = 'block';
    if (mapEl) mapEl.style.display = 'none';
  }
}

/* ==========================================================================
   VIDEO SHOWCASE & PARALLAX SECTION RENDERING
   ========================================================================== */
function renderVideoShowcase(db) {
  const showcase = db.videoShowcase || (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.videoShowcase) || {};
  
  const badgeTextEl = document.getElementById('parallaxBadgeText');
  if (badgeTextEl && showcase.badge) badgeTextEl.textContent = showcase.badge;

  const headlineEl = document.getElementById('parallaxHeadline');
  if (headlineEl && showcase.headline) headlineEl.innerHTML = showcase.headline;

  const descEl = document.getElementById('parallaxDesc');
  if (descEl && showcase.description) descEl.textContent = showcase.description;

  const ctaTextEl = document.getElementById('parallaxCtaText');
  if (ctaTextEl && showcase.ctaText) ctaTextEl.textContent = showcase.ctaText;

  const ctaBtnEl = document.getElementById('parallaxCtaBtn');
  if (ctaBtnEl && showcase.ctaLink) ctaBtnEl.setAttribute('href', showcase.ctaLink);

  const videoTagEl = document.getElementById('parallaxVideoTag');
  if (videoTagEl && showcase.videoTag) videoTagEl.textContent = showcase.videoTag;

  const videoTitleEl = document.getElementById('parallaxVideoTitle');
  if (videoTitleEl && showcase.videoTitle) videoTitleEl.textContent = showcase.videoTitle;

  const speakerNameEl = document.getElementById('parallaxSpeakerName');
  if (speakerNameEl && showcase.speakerName) {
    speakerNameEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"></circle><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path></svg>
      <span>${showcase.speakerName}</span>
    `;
  }

  const iframeEl = document.getElementById('parallaxIframe');
  if (iframeEl) {
    const rawId = showcase.youtubeId || 'M7lc1UVf-VE';
    const cleanId = (rawId === 'dQw4w9WgXcQ' || !rawId) ? 'M7lc1UVf-VE' : rawId;
    const targetSrc = `https://www.youtube-nocookie.com/embed/${cleanId}?rel=0&modestbranding=1`;
    if (!iframeEl.src.includes(cleanId)) {
      iframeEl.src = targetSrc;
    }
  }

  const bgEl = document.getElementById('parallaxShowcaseBg');
  if (bgEl && showcase.bgImage) {
    bgEl.style.backgroundImage = `url('${showcase.bgImage}')`;
  }
}

function initParallaxScroll() {
  // Efek latar belakang menetap (stationary fixed background) dikelola secara native melalui
  // CSS modern clip-path: inset(0) + position: fixed untuk performa maksimal 60fps tanpa jeda.
}

/* --- MODAL PPDB BANNER LIGHTBOX (FALLBACK) --- */
function openPpdbBannerModal() {
  const modal = document.getElementById('ppdbBannerModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closePpdbBannerModal(e) {
  if (e && e.target && e.target.closest && e.target.closest('.ppdb-banner-modal-dialog') && !e.target.classList.contains('ppdb-banner-modal-close')) {
    return;
  }
  const modal = document.getElementById('ppdbBannerModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* --- PPDB GATEWAY BANNER SLIDER (PINTU UTAMA PENDAFTARAN SANTRI BARU) --- */
let ppdbGatewayAutoTimer = null;

function renderPpdbGatewaySlider(db) {
  const track = document.getElementById('ppdbSliderTrack');
  const progressTrack = document.getElementById('ppdbSliderProgressTrack');
  const dotsContainer = document.getElementById('ppdbSliderDots');
  if (!track) return;

  const slides = (db.ppdbGatewaySlides && db.ppdbGatewaySlides.length > 0)
    ? db.ppdbGatewaySlides
    : (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.ppdbGatewaySlides : []);

  if (!slides || slides.length === 0) return;

  track.innerHTML = slides.map((s, idx) => `
    <a href="${s.link || 'psb.html'}" class="ppdb-slide-item" title="${s.title || 'Pintu Pendaftaran Santri Baru - Klik untuk Masuk Mendaftar'}" aria-label="${s.title || 'Pintu Pendaftaran Santri Baru'}">
      <img src="${s.image}" alt="${s.title || 'Pintu Utama Pendaftaran Santri Baru'}" class="ppdb-slide-img" ${idx === 0 ? 'loading="eager"' : 'loading="lazy"'}>
    </a>
  `).join('');

  if (progressTrack) {
    progressTrack.innerHTML = slides.map((_, idx) => `
      <div class="ppdb-progress-segment ${idx === 0 ? 'active' : ''}" data-slide="${idx}" role="button" tabindex="0" aria-label="Lihat Slide ${idx + 1}">
        <span class="ppdb-progress-fill"></span>
      </div>
    `).join('');
  } else if (dotsContainer) {
    dotsContainer.innerHTML = slides.map((_, idx) => `
      <button type="button" class="ppdb-dot ${idx === 0 ? 'active' : ''}" data-slide="${idx}" aria-label="Lihat Slide ${idx + 1}"></button>
    `).join('');
  }

  initPpdbGatewaySlider();
}

function initPpdbGatewaySlider() {
  const track = document.getElementById('ppdbSliderTrack');
  if (!track) return;

  const slides = track.querySelectorAll('.ppdb-slide-item');
  const segments = document.querySelectorAll('.ppdb-progress-segment');
  const dots = document.querySelectorAll('.ppdb-dot');
  const prevBtn = document.getElementById('ppdbSlidePrev');
  const nextBtn = document.getElementById('ppdbSlideNext');
  const totalSlides = slides.length;
  if (totalSlides <= 1) return;

  let currentIndex = 0;

  const updateSlidePosition = (index) => {
    currentIndex = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    segments.forEach((seg, idx) => {
      seg.classList.toggle('active', idx === currentIndex);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    ppdbGatewayAutoTimer = setInterval(() => {
      updateSlidePosition(currentIndex + 1);
    }, 4200);
  };

  const stopAutoSlide = () => {
    if (ppdbGatewayAutoTimer) {
      clearInterval(ppdbGatewayAutoTimer);
      ppdbGatewayAutoTimer = null;
    }
  };

  if (prevBtn && !prevBtn._hasPpdbEvent) {
    prevBtn._hasPpdbEvent = true;
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateSlidePosition(currentIndex - 1);
      startAutoSlide();
    });
  }

  if (nextBtn && !nextBtn._hasPpdbEvent) {
    nextBtn._hasPpdbEvent = true;
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateSlidePosition(currentIndex + 1);
      startAutoSlide();
    });
  }

  segments.forEach(seg => {
    if (!seg._hasPpdbEvent) {
      seg._hasPpdbEvent = true;
      seg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetSlide = parseInt(seg.getAttribute('data-slide') || '0', 10);
        updateSlidePosition(targetSlide);
        startAutoSlide();
      });
      seg.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const targetSlide = parseInt(seg.getAttribute('data-slide') || '0', 10);
          updateSlidePosition(targetSlide);
          startAutoSlide();
        }
      });
    }
  });

  dots.forEach(dot => {
    if (!dot._hasPpdbEvent) {
      dot._hasPpdbEvent = true;
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetSlide = parseInt(dot.getAttribute('data-slide') || '0', 10);
        updateSlidePosition(targetSlide);
        startAutoSlide();
      });
    }
  });

  // Pause on hover so parent can comfortably view and click
  const container = track.closest('.ppdb-slider-container');
  if (container && !container._hasPpdbHover) {
    container._hasPpdbHover = true;
    container.addEventListener('mouseenter', stopAutoSlide);
    container.addEventListener('mouseleave', startAutoSlide);

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoSlide();
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 45) {
        updateSlidePosition(currentIndex + 1);
      } else if (touchEndX - touchStartX > 45) {
        updateSlidePosition(currentIndex - 1);
      }
      startAutoSlide();
    }, { passive: true });
  }

  startAutoSlide();
}

/**
 * 20. VISITOR TELEMETRY & GEOLOCATION ANALYTICS
 * Lightweight, privacy-respecting client analytics logger for YTPAI Central Dashboard.
 */
function initVisitorTelemetry() {
  try {
    const db = getDB();
    if (!db || !db.analytics) return;

    // Optional Google Analytics 4 (GA4) Tag injection if configured in settings
    if (db.meta && db.meta.gaId && db.meta.gaId.trim().startsWith('G-') && !window._gaInitialized) {
      window._gaInitialized = true;
      const gaId = db.meta.gaId.trim();
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(gaScript);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', gaId);
    }

    // Check if current session already tracked for today
    const sessionKey = 'ytpai_visit_session_' + new Date().toISOString().slice(0, 10);
    const hasVisitedSession = sessionStorage.getItem(sessionKey);

    // Identify page name
    const rawPath = window.location.pathname || 'index.html';
    let pageName = 'Beranda Utama';
    if (rawPath.includes('psb')) pageName = 'Pendaftaran Santri Baru (PPDB)';
    else if (rawPath.includes('lbb')) pageName = 'LBB Sukses PTN & CBT';
    else if (rawPath.includes('kbihu')) pageName = 'KBIHU Haji & Umrah';
    else if (rawPath.includes('prestasi')) pageName = 'Etalase Prestasi';
    else if (rawPath.includes('sejarah')) pageName = 'Sejarah & Profil';
    else if (rawPath.includes('fasilitas')) pageName = 'Fasilitas Yayasan';
    else if (rawPath.includes('berita')) pageName = 'Warta & Berita';

    // Device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /(iPad|Tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent);
    const deviceType = isTablet ? 'Tablet' : (isMobile ? 'Mobile (' + (navigator.userAgent.includes('iPhone') ? 'iOS' : 'Android') + ')' : 'Desktop (' + (navigator.userAgent.includes('Windows') ? 'Windows' : 'Mac/Linux') + ')');

    // Referrer detection
    let refSource = 'Direct / Ketik URL';
    const ref = document.referrer || '';
    if (ref.includes('whatsapp') || window.location.search.includes('wa') || window.location.search.includes('ppdb')) refSource = 'WhatsApp PPDB';
    else if (ref.includes('google')) refSource = 'Google Pencarian';
    else if (ref.includes('instagram')) refSource = 'Instagram';
    else if (ref.includes('facebook') || ref.includes('fb')) refSource = 'Facebook';
    else if (ref.includes('tiktok')) refSource = 'TikTok';
    else if (ref) refSource = 'Rujukan Web Eksternal';

    // If already logged this session, increment simple view counter only
    if (hasVisitedSession) {
      db.analytics.totalViews = (db.analytics.totalViews || 0) + 1;
      saveDB(db);
      return;
    }

    // Mark session
    sessionStorage.setItem(sessionKey, '1');

    // Update global counters
    db.analytics.totalViews = (db.analytics.totalViews || 0) + 1;
    db.analytics.uniqueVisitors = (db.analytics.uniqueVisitors || 0) + 1;
    db.analytics.todayViews = (db.analytics.todayViews || 0) + 1;
    db.analytics.todayUnique = (db.analytics.todayUnique || 0) + 1;

    // Update devices ratio
    if (isMobile) db.analytics.devices.mobile = (db.analytics.devices.mobile || 80) + 1;
    else if (isTablet) db.analytics.devices.tablet = (db.analytics.devices.tablet || 3) + 1;
    else db.analytics.devices.desktop = (db.analytics.devices.desktop || 17) + 1;

    // Update referrer source tally
    const srcObj = (db.analytics.sources || []).find(s => s.name === refSource || (refSource.includes('WhatsApp') && s.name.includes('WhatsApp')));
    if (srcObj) srcObj.count = (srcObj.count || 0) + 1;

    // Pre-record new log entry
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Default city fallback
    let detectedCity = 'Lamongan & Babat';
    
    const newLog = {
      timestamp: timeStr,
      page: pageName,
      city: detectedCity,
      device: deviceType,
      source: refSource
    };

    if (!db.analytics.recentLogs) db.analytics.recentLogs = [];
    db.analytics.recentLogs.unshift(newLog);
    if (db.analytics.recentLogs.length > 50) db.analytics.recentLogs = db.analytics.recentLogs.slice(0, 50);

    saveDB(db);

    // Asynchronously try fast free GeoIP (timeout 1800ms) to detect city
    if (window.fetch && navigator.onLine) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      fetch('https://ipapi.co/json/', { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          clearTimeout(timeoutId);
          if (data && (data.city || data.region)) {
            const locName = (data.city || data.region || 'Lamongan') + (data.country_name && data.country_name !== 'Indonesia' ? `, ${data.country_name}` : '');
            newLog.city = locName;
            
            // Check if city exists in list
            const currentDb = getDB();
            if (currentDb && currentDb.analytics && currentDb.analytics.cities) {
              const matchedCity = currentDb.analytics.cities.find(c => c.name.toLowerCase().includes((data.city || '').toLowerCase()));
              if (matchedCity) {
                matchedCity.count = (matchedCity.count || 0) + 1;
              } else {
                currentDb.analytics.cities.push({
                  name: data.city || data.region,
                  region: data.region || 'Jawa Timur',
                  count: 1,
                  percent: 1,
                  isLocal: false
                });
              }
              saveDB(currentDb);
            }
          }
        })
        .catch(() => {
          // Silent fallback
        });
    }
  } catch (err) {
    console.warn('Visitor telemetry skipped:', err);
  }
}

// Interactive Tab Switcher for Section #tentang (Visi & Misi Yayasan)
window.switchAboutVmTab = function(tabName) {
  const btnVisi = document.getElementById('tabBtnVisi');
  const btnMisi = document.getElementById('tabBtnMisi');
  const paneVisi = document.getElementById('paneVisi');
  const paneMisi = document.getElementById('paneMisi');
  if (!btnVisi || !btnMisi || !paneVisi || !paneMisi) return;

  if (tabName === 'misi') {
    btnMisi.classList.add('active');
    btnMisi.setAttribute('aria-selected', 'true');
    btnVisi.classList.remove('active');
    btnVisi.setAttribute('aria-selected', 'false');

    paneMisi.classList.add('active');
    paneVisi.classList.remove('active');
  } else {
    btnVisi.classList.add('active');
    btnVisi.setAttribute('aria-selected', 'true');
    btnMisi.classList.remove('active');
    btnMisi.setAttribute('aria-selected', 'false');

    paneVisi.classList.add('active');
    paneMisi.classList.remove('active');
  }
};

/* ========================================================================= */
/* 0D. HAUL AKBAR MUASSIS & MASYAYIKH INTERACTIVE KHIDMAH MODULE (MODULAR)   */
/* ========================================================================= */
let selectedHaulNominal = 100000;

window.switchHaulMethod = function(method) {
  const btnQris = document.getElementById('haulBtnTabQris');
  const btnBank = document.getElementById('haulBtnTabBank');
  const panelQris = document.getElementById('haulPanelQris');
  const panelBank = document.getElementById('haulPanelBank');
  if (!btnQris || !btnBank || !panelQris || !panelBank) return;

  if (method === 'bank') {
    btnBank.classList.add('active');
    btnQris.classList.remove('active');
    panelBank.style.display = 'block';
    panelBank.classList.add('active');
    panelQris.style.display = 'none';
    panelQris.classList.remove('active');
  } else {
    btnQris.classList.add('active');
    btnBank.classList.remove('active');
    panelQris.style.display = 'block';
    panelQris.classList.add('active');
    panelBank.style.display = 'none';
    panelBank.classList.remove('active');
  }
};

window.copyHaulRekening = function(rekNum, btn) {
  if (!rekNum) return;
  navigator.clipboard.writeText(rekNum).then(() => {
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span class="copy-label">Tersalin!</span>`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalHtml;
      }, 2200);
    }
  }).catch(() => {
    // Fallback prompt jika clipboard API diblokir
    prompt('Salin nomor rekening:', rekNum);
  });
};

window.selectHaulAmount = function(nominal, btn) {
  const chips = document.querySelectorAll('#haulAmountChips .amount-chip');
  chips.forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const customWrap = document.getElementById('haulCustomAmountWrap');
  if (nominal === 'custom') {
    if (customWrap) customWrap.style.display = 'block';
    const input = document.getElementById('haulCustomAmountInput');
    if (input) {
      input.focus();
      selectedHaulNominal = parseInt(input.value || '0', 10);
    }
  } else {
    if (customWrap) customWrap.style.display = 'none';
    selectedHaulNominal = nominal;
  }
  updateHaulWaLink();
};

window.updateHaulCustomAmount = function(val) {
  const num = parseInt(val || '0', 10);
  selectedHaulNominal = num > 0 ? num : 0;
  updateHaulWaLink();
};

function formatRupiahDisplay(num) {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

function updateHaulWaLink() {
  const btn = document.getElementById('btnConfirmHaulWa');
  if (!btn) return;

  const nominalText = selectedHaulNominal > 0 ? `sebesar Rp ${formatRupiahDisplay(selectedHaulNominal)}` : '(nominal disesuaikan)';
  const message = `Assalamu'alaikum Wr. Wb. Panitia Majlis Dzikir Maulidurrasul SAW & Haul Ke-16 YTPAI Raudlatul Muta'allimin Lamongan,

Saya berniat menyalurkan infaq khidmah untuk agenda Majlis Dzikir Maulidurrasul SAW & Haul Ke-16 ${nominalText} via Rekening Bank BRI (A.N. Haul Muassis & Masyayikh YTPAI RML).

Nama / Hamba Allah: 
Asal Alumni / Wali Santri / Jamaah: 
Mohon bimbingan konfirmasi dan titip doa mahabbah. Terima kasih.`;

  const phone = '6285648847070';
  btn.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Inisialisasi Status Tanggal Majlis Dzikir & Haul Ke-16
function initHaulCountdown() {
  const pillText = document.getElementById('haulCountdownText');
  if (!pillText) return;
  pillText.textContent = 'Tanggal Segera Diumumkan';
}

document.addEventListener('DOMContentLoaded', () => {
  updateHaulWaLink();
  initHaulCountdown();
});

// =========================================================================
// VISITOR LATEST INFORMATION POPUP MODAL SYSTEM (BESPOKE LUXURY & ADMIN DRIVEN)
// =========================================================================
window._currentPopupNewsId = null;
window._currentPopupActionLink = null;

function renderPopupContentFromData(data) {
  if (!data) return;
  window._currentPopupNewsId = data.id || null;
  window._currentPopupActionLink = data.actionLink || null;

  const badgeEl = document.getElementById('popupInfoBadge');
  const imgEl = document.getElementById('popupInfoImg');
  const catEl = document.getElementById('popupInfoCategory');
  const dateEl = document.getElementById('popupInfoDateText');
  const headEl = document.getElementById('popupInfoHeadline');
  const excEl = document.getElementById('popupInfoExcerpt');
  const tag1El = document.getElementById('popupInfoTag1');
  const tag2El = document.getElementById('popupInfoTag2');
  const btnTextEl = document.getElementById('popupBtnReadText');

  if (badgeEl) badgeEl.textContent = data.badge || 'INFORMASI & WARTA UTAMA';
  if (imgEl && data.image) imgEl.src = data.image;
  if (catEl) catEl.textContent = data.category || 'Akademik';
  if (dateEl) dateEl.textContent = data.date || 'Terkini';
  if (headEl) headEl.textContent = data.title || 'Warta Resmi YTPAI Raudlatul Muta\'allimin Lamongan';
  if (excEl) excEl.textContent = data.excerpt || '';
  if (tag1El) tag1El.textContent = data.tag1 || 'SPMB TA. 2027/2028 Terbuka';
  if (tag2El) tag2El.textContent = data.tag2 || 'Tahfidz & Sains Unggul';
  if (btnTextEl) btnTextEl.textContent = data.actionText || 'Baca Selengkapnya';
}

function getActivePopupData(db) {
  const cfg = db.popupAnnouncement || { enabled: true, mode: 'auto' };
  if (cfg.enabled === false) return null;

  if (cfg.mode === 'custom' && cfg.title) {
    return {
      id: cfg.newsId || null,
      badge: cfg.badge || 'PENGUMUMAN RESMI YAYASAN',
      title: cfg.title,
      category: cfg.category || 'Pengumuman',
      date: cfg.date || 'Terkini',
      image: cfg.image || 'assets/berita_santri_prestasi.jpg',
      excerpt: cfg.excerpt || '',
      actionText: cfg.actionText || 'Baca Selengkapnya',
      actionLink: cfg.actionLink || '#berita',
      tag1: cfg.tag1 || 'SPMB TA. 2027/2028 Terbuka',
      tag2: cfg.tag2 || 'Tahfidz & Sains Unggul'
    };
  }

  // Fallback: auto mode from news
  const newsList = db.news || [];
  if (!newsList || newsList.length === 0) return null;
  const topNews = newsList.find(n => n.isFeatured) || newsList[0];
  if (!topNews) return null;

  return {
    id: topNews.id,
    badge: cfg.badge || 'INFORMASI & WARTA UTAMA',
    title: topNews.title,
    category: topNews.category || 'Akademik',
    date: topNews.date || 'Terkini',
    image: topNews.image || 'assets/berita_santri_prestasi.jpg',
    excerpt: topNews.excerpt || (topNews.content ? topNews.content.substring(0, 150) + '...' : ''),
    actionText: 'Baca Selengkapnya',
    actionLink: '#berita',
    tag1: cfg.tag1 || 'SPMB TA. 2027/2028 Terbuka',
    tag2: cfg.tag2 || 'Tahfidz & Sains Unggul'
  };
}

function initLatestInfoPopup() {
  const popupModal = document.getElementById('popupInfoModal');
  if (!popupModal) return;

  // Check if visitor dismissed it within last 24 hours
  try {
    const dismissedUntil = localStorage.getItem('ytpai_popup_dismissed_until');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }
  } catch (e) {}

  const db = (typeof getDB === 'function' ? getDB() : window.APP_DB) || {};
  const data = getActivePopupData(db);
  if (!data) return;

  renderPopupContentFromData(data);

  // Delayed trigger for serene landing
  setTimeout(() => {
    if (document.querySelector('.modal-overlay.active:not(#popupInfoModal)')) return;
    popupModal.classList.add('active');
    document.body.classList.add('popup-info-open');
  }, 1400);
}

window.closePopupInfoModal = function() {
  const popupModal = document.getElementById('popupInfoModal');
  if (!popupModal) return;

  try {
    const chk = document.getElementById('popupDismissCheck');
    if (chk && chk.checked) {
      localStorage.setItem('ytpai_popup_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000));
    }
  } catch (e) {}

  popupModal.classList.remove('active');
  document.body.classList.remove('popup-info-open');
};

window.handlePopupReadMore = function() {
  const newsId = window._currentPopupNewsId;
  const link = window._currentPopupActionLink;
  closePopupInfoModal();

  if (newsId && typeof window.openNewsModal === 'function' && (!link || link === '#berita' || link.includes('news'))) {
    setTimeout(() => {
      window.openNewsModal(newsId);
    }, 250);
  } else if (link && link.startsWith('#')) {
    setTimeout(() => {
      const target = document.querySelector(link);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }, 250);
  } else if (link) {
    window.location.href = link;
  }
};

window.openLatestInfoPopup = function(newsId) {
  const popupModal = document.getElementById('popupInfoModal');
  if (!popupModal) return;

  const db = (typeof getDB === 'function' ? getDB() : window.APP_DB) || {};
  let data = null;

  if (newsId) {
    const newsList = db.news || [];
    const item = newsList.find(n => String(n.id) === String(newsId) || Number(n.id) === Number(newsId));
    if (item) {
      data = {
        id: item.id,
        badge: 'INFORMASI & WARTA UTAMA',
        title: item.title,
        category: item.category || 'Akademik',
        date: item.date || 'Terkini',
        image: item.image || 'assets/berita_santri_prestasi.jpg',
        excerpt: item.excerpt || (item.content ? item.content.substring(0, 150) + '...' : ''),
        actionText: 'Baca Selengkapnya',
        actionLink: '#berita',
        tag1: 'SPMB TA. 2027/2028 Terbuka',
        tag2: 'Tahfidz & Sains Unggul'
      };
    }
  }

  if (!data) {
    data = getActivePopupData(db);
  }
  if (!data) return;

  renderPopupContentFromData(data);
  popupModal.classList.add('active');
  document.body.classList.add('popup-info-open');
};

// Global ESC key listener for popup
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    const popupModal = document.getElementById('popupInfoModal');
    if (popupModal && popupModal.classList.contains('active')) {
      closePopupInfoModal();
    }
  }
});


