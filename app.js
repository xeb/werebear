/**
 * WEREBEAR — The Ursa Codex
 * Interactive exhibition client application
 */

const FOLIOS = [
  {
    id: "folio-1",
    num: "I",
    title: "The Right to Bear Arms",
    subtitle: "The Metamorphic Brute of Krosa",
    category: "art",
    badgeLabel: "Classic Fantasy Art",
    artist: "Carl Critchlow",
    year: "2001",
    source: "Magic: The Gathering (Odyssey)",
    medium: "Traditional Acrylic & Ink Illustration",
    img: "assets/01_carl_critchlow_odyssey.jpg",
    webp: "assets/01_carl_critchlow_odyssey.webp",
    desktop: "assets/wallpapers/01_carl_critchlow_odyssey-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/01_carl_critchlow_odyssey-iphone-1320x2868.jpg",
    quote: "“He exercises his right to bear arms.”",
    gloss: [
      "The single most celebrated pun and cult-classic creature illustration in trading card history. Illustrated by British fantasy veteran Carl Critchlow for Magic: The Gathering’s Odyssey set in October 2001, the piece depicts a Krosan druid mid-metamorphosis.",
      "Wooden splints and rope bindings violently burst as thick sinewy bear arms and razor claws erupt under a glowing harvest moon. Critchlow struck an iconic balance between ferocious wilderness power and tongue-in-cheek humor that forever entered the fantasy hall of fame."
    ],
    details: {
      origin: "Krosan Forest, Dominaria",
      alignment: "Green Druidic Mana",
      transformation: "Partial Spontaneous Rupture",
      legacy: "Iconic MtG Odyssey Threshold Staple"
    }
  },
  {
    id: "folio-2",
    num: "II",
    title: "The Primal Unleashed",
    subtitle: "The Feral Hunter of the Primeval Taiga",
    category: "art",
    badgeLabel: "Dark Fantasy Art",
    artist: "Filip Burburan",
    year: "2016",
    source: "Magic: The Gathering (Eternal Masters)",
    medium: "Digital Painting & Textural Gouache",
    img: "assets/02_filip_burburan_eternal.jpg",
    webp: "assets/02_filip_burburan_eternal.webp",
    desktop: "assets/wallpapers/02_filip_burburan_eternal-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/02_filip_burburan_eternal-iphone-1320x2868.jpg",
    quote: "“The mind of man drowned in claws and marrow.”",
    gloss: [
      "A dark reimagining by Croatian illustrator Filip Burburan for Eternal Masters. Stripping away the humorous playfulness of the 2001 original, Burburan leans into visceral, terrifying wilderness folklore.",
      "The beast crouches predatory amongst silver birch trees, adorned with fetishes of crow skulls and sinew cords tangled into its matted hide. It captures the horrifying psychological threshold where human reason is completely consumed by primal ursine instincts."
    ],
    details: {
      origin: "Ancient Boreal Woodlands",
      alignment: "Feral / Primal Fury",
      transformation: "Full Feral Berserker State",
      legacy: "Dark Fantasy Modern Re-interpretation"
    }
  },
  {
    id: "folio-3",
    num: "III",
    title: "The Polar Shaman",
    subtitle: "Oyaminartok, Guardian of the Endless Ice",
    category: "art",
    badgeLabel: "High Fantasy Art",
    artist: "Borja Pindado",
    year: "2022",
    source: "D&D / Baldur's Gate (Commander Legends)",
    medium: "Digital Character Masterwork",
    img: "assets/03_borja_pindado_polar.jpg",
    webp: "assets/03_borja_pindado_polar.webp",
    desktop: "assets/wallpapers/03_borja_pindado_polar-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/03_borja_pindado_polar-iphone-1320x2868.jpg",
    quote: "“The ice tests all men, but spares those who respect the white bear.”",
    gloss: [
      "Borja Pindado brings to life Oyaminartok, the legendary Goliath polar werebear of Icewind Dale. In tabletop Dungeons & Dragons lore, werebears are uniquely recognized as Lawful Good guardians, standing in stark contrast to evil lycanthropes.",
      "Clad in walrus tusk necklaces, braided ceremonial feathers, and a grizzled eye-patch, Oyaminartok kneels beside a frozen fjord holding the day's catch. She represents the benevolent warden archetype: guiding frozen travelers to safety and fiercely crushing poachers in the subzero tundra."
    ],
    details: {
      origin: "Icewind Dale, Faerûn",
      alignment: "Lawful Good / Shamanic",
      transformation: "Controlled Goliath Skin-Changing",
      legacy: "Iconic Arctic D&D Werebear Legend"
    }
  },
  {
    id: "folio-4",
    num: "IV",
    title: "The Spirit of Bǫðvarr Bjarki",
    subtitle: "The Great Shadow of the Bjarkamál",
    category: "art",
    badgeLabel: "Mythic Norse Saga",
    artist: "Classical Saga Oil Study",
    year: "Mythic c. 1400",
    source: "Hrólfs saga kraka & Saxo Grammaticus",
    medium: "Epic Museum-Grade Oil Painting",
    img: "assets/04_norse_bodvar_bjarki_spirit.jpg",
    webp: "assets/04_norse_bodvar_bjarki_spirit.webp",
    desktop: "assets/wallpapers/04_norse_bodvar_bjarki_spirit-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/04_norse_bodvar_bjarki_spirit-iphone-1320x2868.jpg",
    quote: "“A bear went before King Hrólfr’s men, always nearest where the fight was fiercest.”",
    gloss: [
      "The primordial ancestor of all werebear lore in Western civilization. In the 14th-century Icelandic saga Hrólfs saga kraka, champion Bǫðvarr Bjarki (literally 'Little Bear of Battle') enters a deep catatonic trance in his pavilion during the final stand at Lejre.",
      "While his physical body rested motionless, his hamr (spirit-form) manifested on the snowfield as a towering, invincible phantom bear that slaughtered ranks of King Hjörvarðr’s army, immune to flying spears and biting steel. It is the defining literary depiction of the Norse berserkir ('bear-shirt')."
    ],
    details: {
      origin: "Lejre, Denmark / Old Norse Lore",
      alignment: "Sacred Oath / King's Champion",
      transformation: "Hamr-skipti (Astral Bear-Shifting)",
      legacy: "Foundational Origin of the Berserker Myth"
    }
  },
  {
    id: "folio-5",
    num: "V",
    title: "The Boreal Apex",
    subtitle: "A Twilight Photographic Study in Subzero Taiga",
    category: "photo",
    badgeLabel: "Photorealistic 8K",
    artist: "Primal Wildlife Cinematic Study",
    year: "Contemporary",
    source: "Boreal Wildlife Specimen Archive",
    medium: "Ultra-Detailed Photorealistic Render",
    img: "assets/05_photoreal_blizzard_apex.jpg",
    webp: "assets/05_photoreal_blizzard_apex.webp",
    desktop: "assets/wallpapers/05_photoreal_blizzard_apex-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/05_photoreal_blizzard_apex-iphone-1320x2868.jpg",
    quote: "“Nine feet of frost and bone, breathing steam into the dark.”",
    gloss: [
      "An uncompromising look at an apex lycanthrope through the visual language of high-end wilderness photography. Standing over nine feet on hind legs in the subzero twilight of an old-growth pine forest, this specimen bridges raw ursine anatomy with predatory humanoid biomechanics.",
      "The coarse guard fur is crusted with real wind-driven frost; breath condenses into thick vapor plumes in the freezing air; glowing amber eyes reflect the lingering twilight; and an ancient runic bone pendant hangs from weathered leather around its massive chest."
    ],
    details: {
      origin: "Old-Growth Northern Taiga",
      alignment: "Apex Apex Wilderness Sovereign",
      transformation: "True Anatomical Bipedal Hybrid",
      legacy: "Cinema-Grade Photorealistic Vision"
    }
  },
  {
    id: "folio-6",
    num: "VI",
    title: "The River Sovereign",
    subtitle: "High-Shutter Golden Hour Study in Redwood Rapids",
    category: "photo",
    badgeLabel: "Photorealistic 8K",
    artist: "Wildlife Action Lens Master",
    year: "Contemporary",
    source: "Pacific Northwest Wilderness Reel",
    medium: "Ultra-High-Speed Photorealistic Study",
    img: "assets/06_photoreal_river_rapids.jpg",
    webp: "assets/06_photoreal_river_rapids.webp",
    desktop: "assets/wallpapers/06_photoreal_river_rapids-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/06_photoreal_river_rapids-iphone-1320x2868.jpg",
    quote: "“The mountain water breaks on its chest like foam on a rock.”",
    gloss: [
      "Captured as if through a telephoto lens at 1/2000s shutter speed: thousands of glistening water droplets freeze mid-air around the massive shoulders of a 10-foot river werebear wading through turbulent alpine rapids.",
      "Backlit by rich golden hour sunbeams filtering through ancient coastal redwoods, this frame emphasizes athletic power, glistening drenched pelts, and colossal claw anatomy capable of bisecting a migrating salmon or an armored poacher in a single sweep."
    ],
    details: {
      origin: "Cascade Mountain Range",
      alignment: "Territorial River Apex",
      transformation: "Wetland Bipedal Foraging Stance",
      legacy: "Hyperrealistic High-Speed Photography Study"
    }
  },
  {
    id: "folio-7",
    num: "VII",
    title: "The Earth Warder",
    subtitle: "Runic Druidic Titan of the Sacred Grove",
    category: "game",
    badgeLabel: "Epic Fantasy Game Art",
    artist: "High-Fantasy Key Art Studio",
    year: "Contemporary",
    source: "Inspired by WoW Mage Tower & Diablo Druid",
    medium: "Digital Key Art Masterpiece",
    img: "assets/07_game_art_guardian_werebear.jpg",
    webp: "assets/07_game_art_guardian_werebear.webp",
    desktop: "assets/wallpapers/07_game_art_guardian_werebear-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/07_game_art_guardian_werebear-iphone-1320x2868.jpg",
    quote: "“When the paws strike stone, the very mountains awaken.”",
    gloss: [
      "The definitive game-art aesthetic that took the gaming world by storm through World of Warcraft’s legendary Guardian Druid Mage Tower appearance (the 'Might of the Grizzlemaw') and Diablo IV’s pulverizing earth-magic shapeshifter.",
      "Carved with glowing emerald nature runes etched directly into its muscle and fur, and bound by ancient dwarven-forged iron bracers, this bipedal titan slams both fists into the flagstones of a ruined temple, sending concussive shockwaves of verdant druidic energy through the forest floor."
    ],
    details: {
      origin: "Cenarian Sacred Groves",
      alignment: "Guardian of the Earth Cycle",
      transformation: "Arcane Druidic Ursine Form",
      legacy: "The Legendary 'Hulk Bear' Archetype"
    }
  },
  {
    id: "folio-8",
    num: "VIII",
    title: "Saturday Morning Savage",
    subtitle: "The Heroic Mountain Brawler",
    category: "cartoon",
    badgeLabel: "1990s Action Cartoon",
    artist: "Vintage Cel-Shade Studio",
    year: "1990s Era",
    source: "Saturday Morning Action Series",
    medium: "Cel-Shaded Digital Animation Keyframe",
    img: "assets/08_90s_action_cartoon_werebear.jpg",
    webp: "assets/08_90s_action_cartoon_werebear.webp",
    desktop: "assets/wallpapers/08_90s_action_cartoon_werebear-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/08_90s_action_cartoon_werebear-iphone-1320x2868.jpg",
    quote: "“By the power of the full moon—claws out!”",
    gloss: [
      "A pure tribute to the golden age of 1990s televised action animation (think Gargoyles, Teenage Mutant Ninja Turtles, and Street Sharks). Bold hand-drawn ink contours, muscular heroic anatomy, and high-energy cel-shaded coloring.",
      "Complete with a torn denim vest, spiked leather gauntlets, and a stylized roaring bear-head belt buckle, this werebear roars triumphantly from a rocky summit against a glowing full moon and twilight sky—charismatic, formidable, and delightfully nostalgic."
    ],
    details: {
      origin: "Saturday Morning Broadcasts",
      alignment: "Chaotic Hero / Vigilante",
      transformation: "Full Moon Action Trigger",
      legacy: "Iconic 90s Animated Series Character"
    }
  },
  {
    id: "folio-9",
    num: "IX",
    title: "The Twilight Sentinel",
    subtitle: "Visual Development Study for an Animated Legend",
    category: "cartoon",
    badgeLabel: "Animated Feature Concept",
    artist: "Feature Animation Visual Dev Team",
    year: "Contemporary",
    source: "Mythic Folklore Animated Feature",
    medium: "Stylized Concept Painting",
    img: "assets/09_animated_feature_werebear.jpg",
    webp: "assets/09_animated_feature_werebear.webp",
    desktop: "assets/wallpapers/09_animated_feature_werebear-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/09_animated_feature_werebear-iphone-1320x2868.jpg",
    quote: "“He who remembers the speech of the first trees.”",
    gloss: [
      "A masterclass in modern stylized visual development art, blending the lyrical environmental magic of Studio Ghibli with the rich character silhouettes of high-end feature animation. A gentle giant who carries the weight of ancient vows.",
      "The sentinel stands under a crescent moon amongst colossal moss-draped trunks, surrounded by glowing blue fungi and dancing warm fireflies. Worn leather harness straps and soft amber eyes reveal a tragic, soulful protector who guards secrets long forgotten by mortal men."
    ],
    details: {
      origin: "The Deep Enchanted Valley",
      alignment: "Gentle Protector / Ancient Warden",
      transformation: "Ritual Clan Metamorphosis",
      legacy: "Modern Feature Film Concept Art"
    }
  },
  {
    id: "folio-10",
    num: "X",
    title: "The Ruined Abbey",
    subtitle: "A Chiaroscuro Tale in Blood & Charcoal",
    category: "cartoon",
    badgeLabel: "Gothic Horror Comic",
    artist: "Graphic Novel Ink Master",
    year: "Contemporary",
    source: "Gothic Dark Fantasy Graphic Novel",
    medium: "Heavy Chiaroscuro Comic Art & Inks",
    img: "assets/10_gothic_comic_graphic_novel.jpg",
    webp: "assets/10_gothic_comic_graphic_novel.webp",
    desktop: "assets/wallpapers/10_gothic_comic_graphic_novel-desktop-1920x1080.jpg",
    iphone: "assets/wallpapers/10_gothic_comic_graphic_novel-iphone-1320x2868.jpg",
    quote: "“The bell had ceased its ringing; only the stones bore witness.”",
    gloss: [
      "Evoking the stark, gothic graphic-novel brilliance of Mike Mignola’s Hellboy and Bernie Wrightson’s classic horror illustrations. Characterized by angular silhouettes, crushing solid-black shadow pools, and a restricted palette of bone, charcoal, blood crimson, and cold night navy.",
      "The werebear stalks through the broken pointed arches of a collapsed 12th-century cathedral, accompanied by perched stone gargoyles and skeletal trees under a sliver of waning moon. It reclaims the werebear as an atmospheric creature of dark folkloric dread."
    ],
    details: {
      origin: "Ruins of Saint Jude's Priory",
      alignment: "Unbound Gothic Creature",
      transformation: "Cursed Hereditary Affliction",
      legacy: "Dark Graphic Novel Chiaroscuro Masterwork"
    }
  }
];

// App State
let currentFolioIndex = 0;
let currentHeroIndex = 4; // Start hero on Folio V (Photoreal Blizzard Apex)

// DOM Elements
const heroBg = document.getElementById("hero-bg");
const heroTitle = document.getElementById("hero-title");
const heroSub = document.getElementById("hero-sub");
const heroThumbContainer = document.getElementById("hero-thumbnails");
const codexContainer = document.getElementById("codex-gallery");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbCapTitle = document.getElementById("lb-cap-title");
const lbCapDesc = document.getElementById("lb-cap-desc");
const lbDownloadDesk = document.getElementById("lb-dl-desktop");
const lbDownloadIphone = document.getElementById("lb-dl-iphone");
const btnViewStill = document.getElementById("btn-view-still");
const btnReturn = document.getElementById("btn-return");

/**
 * Initialize the Ursa Codex
 */
function init() {
  buildHeroThumbs();
  setHeroScene(currentHeroIndex);
  renderCodex(FOLIOS);
  bindEvents();
}

/**
 * Build the quick thumbnail carousel in the Hero section
 */
function buildHeroThumbs() {
  heroThumbContainer.innerHTML = "";
  FOLIOS.forEach((folio, idx) => {
    const thumb = document.createElement("button");
    thumb.className = `hero-thumb ${idx === currentHeroIndex ? "active" : ""}`;
    thumb.setAttribute("data-num", folio.num);
    thumb.setAttribute("aria-label", `Show ${folio.title}`);
    thumb.innerHTML = `<img src="${folio.webp}" alt="${folio.title}" loading="lazy">`;
    thumb.addEventListener("click", () => {
      setHeroScene(idx);
    });
    heroThumbContainer.appendChild(thumb);
  });
}

/**
 * Set the hero background and text to a specific folio
 */
function setHeroScene(index) {
  currentHeroIndex = index;
  const folio = FOLIOS[index];

  // Update background image
  heroBg.style.backgroundImage = `url("${folio.desktop || folio.img}")`;

  // Update active thumb
  document.querySelectorAll(".hero-thumb").forEach((th, idx) => {
    th.classList.toggle("active", idx === index);
  });
}

/**
 * Render all folios into the codex exhibition gallery
 */
function renderCodex(items) {
  codexContainer.innerHTML = "";

  items.forEach((folio, idx) => {
    const article = document.createElement("article");
    article.className = `folio-item`;
    article.id = folio.id;
    article.setAttribute("data-category", folio.category);

    article.innerHTML = `
      <div class="folio-marker" aria-hidden="true">
        <span class="num">${folio.num}</span>
        <span class="label">Folio <b>${folio.num}</b></span>
      </div>
      <div class="folio-content">
        <header class="folio-header">
          <div class="folio-tags">
            <span class="badge ${folio.category}">${folio.badgeLabel}</span>
            <span class="badge">${folio.artist} · ${folio.year}</span>
          </div>
          <h2 class="folio-title">${folio.title}</h2>
          <p class="folio-subtitle">${folio.subtitle}</p>
        </header>

        <figure class="plate" data-index="${idx}" tabindex="0" role="button" aria-label="Open full resolution view of ${folio.title}">
          <picture>
            <source srcset="${folio.webp}" type="image/webp">
            <img src="${folio.img}" alt="${folio.title} — ${folio.subtitle}" loading="lazy">
          </picture>
        </figure>

        <div class="folio-gloss">
          ${folio.gloss.map(p => `<p>${p}</p>`).join("")}
        </div>

        <div class="folio-details">
          <div class="detail-col">
            <span class="label">Source / Lore</span>
            <span class="val">${folio.source}</span>
          </div>
          <div class="detail-col">
            <span class="label">Medium</span>
            <span class="val">${folio.medium}</span>
          </div>
          <div class="detail-col">
            <span class="label">Transformation</span>
            <span class="val">${folio.details.transformation}</span>
          </div>
          <div class="detail-col">
            <span class="label">Significance</span>
            <span class="val">${folio.details.legacy}</span>
          </div>
        </div>

        <div class="folio-downloads">
          <span class="label" style="font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:var(--ash)">Wallpapers:</span>
          <a class="download-link" href="${folio.desktop}" download="werebear-folio-${folio.num.toLowerCase()}-desktop-1920x1080.jpg">
            Desktop (1920×1080) <span>↓</span>
          </a>
          <a class="download-link" href="${folio.iphone}" download="werebear-folio-${folio.num.toLowerCase()}-iphone-1320x2868.jpg">
            iPhone (1320×2868) <span>↓</span>
          </a>
          <a class="download-link" href="${folio.img}" download="werebear-folio-${folio.num.toLowerCase()}-master.jpg">
            Master File <span>↓</span>
          </a>
        </div>
      </div>
    `;

    // Click handler for plate zoom
    const plate = article.querySelector("figure.plate");
    plate.addEventListener("click", () => openLightbox(idx));
    plate.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(idx);
      }
    });

    codexContainer.appendChild(article);
  });
}

/**
 * Filter folios by category
 */
function filterCategory(category) {
  const items = document.querySelectorAll(".folio-item");
  let visibleCount = 0;

  items.forEach((item) => {
    const itemCat = item.getAttribute("data-category");
    if (category === "all" || itemCat === category) {
      item.classList.remove("hidden");
      visibleCount++;
    } else {
      item.classList.add("hidden");
    }
  });

  document.getElementById("filter-count").textContent = `${visibleCount} of 10 folios`;
}

/**
 * Lightbox Modal functionality
 */
function openLightbox(index) {
  currentFolioIndex = index;
  const folio = FOLIOS[index];

  lbImg.src = folio.img;
  lbImg.alt = folio.title;
  lbCapTitle.innerHTML = `<b>Folio ${folio.num}</b> ${folio.title} — ${folio.subtitle}`;
  lbCapDesc.textContent = `${folio.artist} · ${folio.source} · ${folio.badgeLabel}`;

  lbDownloadDesk.href = folio.desktop;
  lbDownloadDesk.setAttribute("download", `werebear-folio-${folio.num.toLowerCase()}-desktop-1920x1080.jpg`);

  lbDownloadIphone.href = folio.iphone;
  lbDownloadIphone.setAttribute("download", `werebear-folio-${folio.num.toLowerCase()}-iphone-1320x2868.jpg`);

  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

function nextLightbox() {
  currentFolioIndex = (currentFolioIndex + 1) % FOLIOS.length;
  openLightbox(currentFolioIndex);
}

function prevLightbox() {
  currentFolioIndex = (currentFolioIndex - 1 + FOLIOS.length) % FOLIOS.length;
  openLightbox(currentFolioIndex);
}

/**
 * Setup Event Listeners
 */
function bindEvents() {
  // Category Filter Buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterCategory(btn.getAttribute("data-filter"));
    });
  });

  // Lightbox Close & Navigation
  document.getElementById("lb-close").addEventListener("click", closeLightbox);
  document.getElementById("lb-next").addEventListener("click", (e) => {
    e.stopPropagation();
    nextLightbox();
  });
  document.getElementById("lb-prev").addEventListener("click", (e) => {
    e.stopPropagation();
    prevLightbox();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-content")) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
    } else if (document.body.classList.contains("still-mode")) {
      if (e.key === "Escape") toggleStillMode(false);
      if (e.key === "ArrowRight") setHeroScene((currentHeroIndex + 1) % FOLIOS.length);
      if (e.key === "ArrowLeft") setHeroScene((currentHeroIndex - 1 + FOLIOS.length) % FOLIOS.length);
    }
  });

  // Still Mode Toggle (Hide UI for distraction-free art appreciation)
  btnViewStill.addEventListener("click", () => toggleStillMode(true));
  btnReturn.addEventListener("click", () => toggleStillMode(false));
}

function toggleStillMode(enable) {
  if (enable) {
    document.body.classList.add("still-mode");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    document.body.classList.remove("still-mode");
  }
}

// Kickoff
document.addEventListener("DOMContentLoaded", init);
