/**
 * js/player_details.js - Controller for BTD Battles Stats "More Player Details" page
 *
 * Integration Points:
 * 1. `window.decodeProfile(id)` (from decoder.js) fetches & decodes Profile.save.
 * 2. `apiGet('player.php?id=' + id)` (from utils.js) fetches public profile & leaderboards.
 * 3. `window.AssetMap` (from asset-map.js) resolves images & readable names.
 * 4. Badge enhancement helpers integrated for regional & prestige overlays.
 * 5. Strict Allowlist filtering prevents reading/rendering restricted privacy fields.
 */

document.addEventListener("DOMContentLoaded", () => {
  const playerID = queryParam("id");
  const detailsLoader = document.getElementById("detailsLoader");
  const detailsError = document.getElementById("detailsError");
  const detailsContent = document.getElementById("detailsContent");
  const backToLookupLink = document.getElementById("backToLookupLink");

  if (backToLookupLink && playerID) {
    backToLookupLink.href = `player.html?id=${encodeURIComponent(playerID)}`;
  }

  if (!playerID) {
    showError("No Player ID provided in URL parameters. Please select a player from Lookup.");
    return;
  }

  loadAllDetails(playerID);
});

/**
 * Display top error banner message
 */
function showError(message) {
  const detailsLoader = document.getElementById("detailsLoader");
  const detailsError = document.getElementById("detailsError");
  if (detailsLoader) detailsLoader.hidden = true;
  if (detailsError) {
    detailsError.textContent = message;
    detailsError.hidden = false;
  }
}

/**
 * Helper to safely parse deck structures (handles Array, JSON strings, objects)
 */
function safeParseDecks(rawVal) {
  if (!rawVal) return [];
  let parsed = rawVal;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      if (parsed.includes(",")) return [parsed.split(",")];
      return [];
    }
  }

  if (!parsed) return [];

  if (!Array.isArray(parsed) && typeof parsed === "object") {
    parsed = Object.values(parsed);
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map((deck) => {
    if (!deck) return [];
    let inner = deck;
    if (typeof inner === "string") {
      try {
        inner = JSON.parse(inner);
      } catch (e) {
        if (inner.includes(",")) return inner.split(",");
      }
    }
    if (Array.isArray(inner)) return inner;
    if (inner && typeof inner === "object") {
      return Array.isArray(inner.Cards)
        ? inner.Cards
        : Array.isArray(inner.cards)
          ? inner.cards
          : Object.values(inner);
    }
    return [];
  });
}

/**
 * Helper to dynamically locate card decks across all possible save keys
 */
function findCardDecksInSave(obj) {
  if (!obj || typeof obj !== "object") return [];

  const candidateKeys = [
    "BattleCardDecksNew",
    "battleCardDecksNew",
    "BattleCardDecks",
    "battleCardDecks",
    "CardDecksNew",
    "cardDecksNew",
    "CardDecks",
    "cardDecks",
    "BattleCardDeck",
    "battleCardDeck",
    "Decks",
    "decks",
  ];

  for (const k of candidateKeys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const parsed = safeParseDecks(obj[k]);
      if (parsed && parsed.length > 0) return parsed;
    }
  }

  if (obj.Items && typeof obj.Items === "object") {
    for (const k of candidateKeys) {
      if (obj.Items[k] !== undefined && obj.Items[k] !== null) {
        const parsed = safeParseDecks(obj.Items[k]);
        if (parsed && parsed.length > 0) return parsed;
      }
    }
  }

  // Dynamic scan of all top-level keys containing "deck" (case-insensitive)
  for (const key of Object.keys(obj)) {
    if (/deck/i.test(key)) {
      const parsed = safeParseDecks(obj[key]);
      if (parsed && parsed.length > 0) return parsed;
    }
  }

  return [];
}

/**
 * PRIVACY ALLOWLIST ENFORCEMENT
 * Extracts ONLY explicitly allowed fields from Profile.save payload.
 * Forbidden fields (IAPHistory, analytics, StreamID, CompletedPurchases, etc.) are NEVER accessed or logged.
 */
function extractAllowlistedSaveData(saveData) {
  if (!saveData || typeof saveData !== "object") {
    return {};
  }

  const levels = saveData.Levels || saveData.levels || saveData || {};
  const items = saveData.Items || saveData.items || {};
  const unlocks = saveData.Unlocks || saveData.unlocks || {};
  const achievementProgress = saveData.AchievementProgressObject || {};
  const tracking = saveData.AchievementAndScoreTracking || {};

  return {
    Levels: {
      Wins: Number(levels.Wins ?? levels.wins ?? 0),
      Losses: Number(levels.Losses ?? levels.losses ?? 0),
      CurrentWinStreak: Number(levels.CurrentWinStreak ?? levels.currentWinStreak ?? 0),
      BestWinStreak: Number(levels.BestWinStreak ?? levels.bestWinStreak ?? 0),
      BattleScore: Number(levels.BattleScore ?? levels.xp ?? levels.XP ?? 0),
      Medallions: Number(levels.Medallions ?? levels.medallions ?? 0),
      MedallionWinsTotal: Number(levels.MedallionWinsTotal ?? levels.medallionWinsTotal ?? 0),
      MedallionWinsWeekly: Number(levels.MedallionWinsWeekly ?? levels.medallionWinsWeekly ?? 0),
      TournamentWins: Number(levels.TournamentWins ?? levels.tournamentWins ?? 0),
      TournamentLosses: Number(levels.TournamentLosses ?? levels.tournamentLosses ?? 0),
      WinsCard: Number(levels.WinsCard ?? levels.winsCard ?? 0),
      LossesCard: Number(levels.LossesCard ?? levels.lossesCard ?? 0),
      WinsStandard: Number(levels.WinsStandard ?? levels.winsStandard ?? 0),
      LossesStandard: Number(levels.LossesStandard ?? levels.lossesStandard ?? 0),
    },
    Items: {
      TowerInventory: items.TowerInventory || items.towerInventory || saveData.TowerInventory || saveData.towerInventory || {},
      BloonDecal: String(items.BloonDecal || items.bloonDecal || ""),
      ProfileSkin: String(items.ProfileSkin || items.profileSkin || ""),
      ProjectileSkin: String(items.ProjectileSkin || items.projectileSkin || ""),
      ActiveTowerSkins: items.ActiveTowerSkins || items.activeTowerSkins || {},
    },
    Unlocks: {
      Decals: Array.isArray(unlocks.Decals) ? unlocks.Decals : Array.isArray(unlocks.decals) ? unlocks.decals : [],
      Towers: unlocks.Towers || unlocks.towers || [],
      TowerUpgrades: unlocks.TowerUpgrades || unlocks.towerUpgrades || {},
    },
    AchievementProgressArray: Array.isArray(achievementProgress.AchievementProgressArray)
      ? achievementProgress.AchievementProgressArray
      : Array.isArray(achievementProgress.achievementProgressArray)
        ? achievementProgress.achievementProgressArray
        : [],
    CurrentPlayedInfo: Array.isArray(saveData.CurrentPlayedInfo)
      ? saveData.CurrentPlayedInfo
      : Array.isArray(saveData.currentPlayedInfo)
        ? saveData.currentPlayedInfo
        : [],
    BloonsTracking: {
      TotalBloonsPopped: Number(tracking.TotalBloonsPopped ?? tracking.totalBloonsPopped ?? 0),
      TotalBloonsSent: Number(tracking.TotalBloonsSent ?? tracking.totalBloonsSent ?? 0),
      TimesUsedBoosts: Number(tracking.TimesUsedBoosts ?? tracking.timesUsedBoosts ?? 0),
    },
    BadgeFeatured: saveData.BadgeFeatured || saveData.badgeFeatured || null,
    BadgesList: Array.isArray(saveData.BadgesList)
      ? saveData.BadgesList
      : Array.isArray(saveData.Badges)
        ? saveData.Badges
        : Array.isArray(saveData.badgesList)
          ? saveData.badgesList
          : [],
    BattleCardDecksNew: findCardDecksInSave(saveData),
    CurrentBattleCardDeckNew: Number(
      saveData.CurrentBattleCardDeckNew ??
      saveData.currentBattleCardDeckNew ??
      saveData.CurrentBattleCardDeck ??
      saveData.currentBattleCardDeck ??
      0
    ),
    Following: Array.isArray(saveData.Following) ? saveData.Following : Array.isArray(saveData.following) ? saveData.following : [],
    Guilds: Array.isArray(saveData.Guilds) ? saveData.Guilds : Array.isArray(saveData.guilds) ? saveData.guilds : [],
    ProfileSkinUnlocks: Array.isArray(saveData.ProfileSkinUnlocks)
      ? saveData.ProfileSkinUnlocks
      : Array.isArray(saveData.profileSkinUnlocks)
        ? saveData.profileSkinUnlocks
        : [],
    ProjectileSkinUnlocks: Array.isArray(saveData.ProjectileSkinUnlocks)
      ? saveData.ProjectileSkinUnlocks
      : Array.isArray(saveData.projectileSkinUnlocks)
        ? saveData.projectileSkinUnlocks
        : [],
    TowerSkinUnlocks: Array.isArray(saveData.TowerSkinUnlocks)
      ? saveData.TowerSkinUnlocks
      : Array.isArray(saveData.towerSkinUnlocks)
        ? saveData.towerSkinUnlocks
        : [],
    Premiums: findPremiumsInSave({}, saveData),
    CompletedPurchases: findCompletedPurchasesInSave({}, saveData),
    PowerTrees: saveData.power_trees || saveData.PowerTrees || saveData.powerTrees || null,
  };
}

/**
 * Main Controller: Fetches Public Profile + Decodes Full Profile.save
 */
async function loadAllDetails(id) {
  let publicData = null;
  let rawSaveData = null;
  let saveFetchError = null;

  try {
    // 1. Fetch Public Profile for Name, Country, Rank info
    publicData = await apiGet(`player.php?id=${encodeURIComponent(id)}`);
  } catch (err) {
    // Keep publicData as null if public profile lookup fails
  }

  try {
    // 2. Fetch and decode full Profile.save binary file
    if (typeof window.decodeProfile !== "function") {
      throw new Error("Decoder module (js/decoder.js) is missing.");
    }
    rawSaveData = await window.decodeProfile(id);
  } catch (err) {
    saveFetchError = err.message || "Failed to load Profile.save";
  }

  const detailsLoader = document.getElementById("detailsLoader");
  const detailsContent = document.getElementById("detailsContent");

  if (detailsLoader) detailsLoader.hidden = true;

  if (saveFetchError && !publicData) {
    showError(`Unable to load profile data: ${saveFetchError}`);
    return;
  }

  if (saveFetchError) {
    // Show non-fatal warning message if Profile.save is missing/CORS blocked but public profile loaded
    const detailsError = document.getElementById("detailsError");
    if (detailsError) {
      detailsError.textContent = `Warning: Full profile binary save (Profile.save) could not be loaded (${saveFetchError}). Displaying available public stats.`;
      detailsError.hidden = false;
    }
  }

  if (detailsContent) detailsContent.hidden = false;

  // Extract allowlisted properties
  const allowlisted = extractAllowlistedSaveData(rawSaveData || {});

  // Render all sections
  renderHeaderBanner(id, publicData, allowlisted);
  renderStatsOverview(publicData, allowlisted);
  renderBattleTypeSplit(allowlisted);
  renderFarmers(allowlisted);
  renderPowers(allowlisted, rawSaveData);
  renderBloonDecals(allowlisted);
  renderAchievements(allowlisted);
  renderCurrentPlayedInfo(allowlisted);
  renderBloonsStats(allowlisted);
  try {
    renderBadgesShowcase(publicData, allowlisted);
  } catch (err) {
    console.error("Error rendering badges showcase:", err);
  }
  renderCardDecks(allowlisted, rawSaveData);
  renderFollowingList(allowlisted);
  renderGuildHistory(allowlisted);
  renderPurchasedItems(allowlisted, rawSaveData);
  renderUnlocks(allowlisted);
}

/**
 * POWERS SECTION RENDERER
 */
function renderPowers(save, rawSaveData) {
  const container = document.getElementById("powersContainer");
  if (!container) return;

  const powerTreesData = rawSaveData || save;

  if (window.PowersMap && typeof window.PowersMap.renderPowersTree === "function") {
    window.PowersMap.renderPowersTree(container, powerTreesData);
  } else {
    container.innerHTML = `<p class="empty-state">Powers visualizer module is not loaded.</p>`;
  }
}

/**
 * 1. HEADER BANNER
 */
function renderHeaderBanner(id, publicData, save) {
  const profile = publicData?.profile || {};
  const rawPublic = publicData?.raw || {};

  const username = profile.username || save.Levels.displayName || "Unknown Player";
  const countryCode = rawPublic.CountryCode || profile.countryCode || null;
  const clanID = profile.clanID || null;
  const clanName = profile.clan || null;

  const usernameEl = document.getElementById("detailsUsername");
  const playerIdEl = document.getElementById("detailsPlayerId");
  const countryEl = document.getElementById("detailsCountry");
  const clanEl = document.getElementById("detailsClan");
  const avatarEl = document.getElementById("detailsAvatar");

  if (usernameEl) usernameEl.textContent = username;
  if (playerIdEl) playerIdEl.textContent = `Player ID: ${id}`;

  if (countryEl) {
    const meta = typeof resolveCountryMeta === "function" ? resolveCountryMeta(countryCode) : null;
    if (meta) {
      countryEl.innerHTML = `Country: <span class="country-meta"><span>${escapeHtml(meta.displayName)}</span><img src="${meta.flagPath}" alt="${escapeHtml(meta.displayName)}" class="country-badge-image" /></span>`;
    } else {
      countryEl.textContent = `Country: ${countryCode || "N/A"}`;
    }
  }

  if (clanEl) {
    if (clanID) {
      clanEl.innerHTML = `Clan: <a class="mini-link" href="player.html?id=${encodeURIComponent(clanID)}&kind=clan">${escapeHtml(clanName || clanID)}</a>`;
    } else {
      clanEl.textContent = "Clan: None";
    }
  }

  if (avatarEl) {
    avatarEl.textContent = "";
  }
}

/**
 * Helper to compute win rate string
 */
function formatWinRate(wins, losses) {
  const total = wins + losses;
  if (total <= 0) return "0.0%";
  const rate = ((wins / total) * 100).toFixed(1);
  return `${rate}%`;
}

/**
 * 2. OVERVIEW & LEADERBOARD STATS (Two Columns)
 */
function renderStatsOverview(publicData, save) {
  const levels = save.Levels || {};
  const profile = publicData?.profile || {};
  const leaderboards = profile.leaderboards || {};
  const weekly = leaderboards.weekly || {};
  const prestige = leaderboards.prestige || {};

  const wins = levels.Wins || Number(profile.stats?.wins || 0);
  const losses = levels.Losses || Number(profile.stats?.losses || 0);
  const winRateStr = formatWinRate(wins, losses);

  const leftRows = [
    { label: "Win Rate", value: `${formatNumber(wins)} / ${formatNumber(losses)} (${winRateStr})` },
    { label: "Current Win Streak", value: formatNumber(levels.CurrentWinStreak) },
    { label: "Best Win Streak", value: formatNumber(levels.BestWinStreak) },
    { label: "Battlescore", value: formatNumber(levels.BattleScore || profile.xp) },
    { label: "Medallions", value: formatNumber(levels.Medallions || profile.medallions) },
    { label: "Total Medallions from Wins", value: formatNumber(levels.MedallionWinsTotal) },
  ];

  const tournamentPlayed = (levels.TournamentWins || 0) + (levels.TournamentLosses || 0);

  const rightRows = [
    { label: "Medallions this Week", value: formatNumber(levels.MedallionWinsWeekly) },
    { label: "Tournament Played", value: formatNumber(tournamentPlayed) },
    { label: "Tournament Wins", value: formatNumber(levels.TournamentWins) },
    { label: "Tournament Losses", value: formatNumber(levels.TournamentLosses) },
    {
      label: "Weekly Leaderboard",
      value: weekly.rank ? `#${formatNumber(weekly.rank)} (${formatNumber(weekly.score)})` : "-",
    },
    {
      label: "Prestige Leaderboard",
      value: prestige.rank ? `#${formatNumber(prestige.rank)} (${formatNumber(prestige.score)})` : "-",
    },
  ];

  renderTableRowsId("statsLeftBody", leftRows);
  renderTableRowsId("statsRightBody", rightRows);
}

/**
 * 3. BATTLE TYPE SPLIT (Card vs Standard Cards)
 */
function renderBattleTypeSplit(save) {
  const levels = save.Levels || {};
  const winsCard = levels.WinsCard || 0;
  const lossesCard = levels.LossesCard || 0;
  const cardPlayed = winsCard + lossesCard;

  const winsStd = levels.WinsStandard || 0;
  const lossesStd = levels.LossesStandard || 0;
  const stdPlayed = winsStd + lossesStd;

  const cardRows = [
    { label: "Played", value: formatNumber(cardPlayed) },
    { label: "Wins", value: formatNumber(winsCard) },
    { label: "Losses", value: formatNumber(lossesCard) },
    { label: "Win Rate", value: formatWinRate(winsCard, lossesCard) },
  ];

  const stdRows = [
    { label: "Played", value: formatNumber(stdPlayed) },
    { label: "Wins", value: formatNumber(winsStd) },
    { label: "Losses", value: formatNumber(lossesStd) },
    { label: "Win Rate", value: formatWinRate(winsStd, lossesStd) },
  ];

  renderTableRowsId("cardBattlesBody", cardRows);
  renderTableRowsId("standardBattlesBody", stdRows);
}

/**
 * 4. FARMERS
 */
function renderFarmers(save) {
  const inv = save.Items?.TowerInventory || save.TowerInventory || save.items?.TowerInventory || save.items?.towerInventory || {};

  const getFarmerCount = (farmerType) => {
    if (!inv) return 0;
    if (Array.isArray(inv)) {
      const found = inv.find(
        (item) => item && String(item.Type || item.type || item.ID || item.id || "").toLowerCase() === farmerType.toLowerCase()
      );
      return found ? Number(found.Amount ?? found.amount ?? found.Count ?? found.count ?? 0) : 0;
    }
    if (typeof inv === "object") {
      for (const [key, val] of Object.entries(inv)) {
        if (key.toLowerCase() === farmerType.toLowerCase()) {
          if (typeof val === "object" && val !== null) {
            return Number(val.Amount ?? val.amount ?? val.Count ?? val.count ?? 0);
          }
          return Number(val ?? 0);
        }
      }
    }
    return 0;
  };

  const monkeyFarmers = getFarmerCount("MonkeyFarmer");
  const roboFarmers = getFarmerCount("RoboFarmer");

  const container = document.getElementById("farmersGrid");
  if (!container) return;

  const readableFn = window.readableName || ((i) => i);
  container.innerHTML = "";

  const createFarmerCard = (id, count, cellName) => {
    const card = document.createElement("div");
    card.className = "glass-card";
    card.style.cssText = "margin-bottom:0; display:flex; align-items:center; gap:1rem;";

    if (window.BasicAvatars && typeof window.BasicAvatars.renderAvatarIcon === "function") {
      card.appendChild(window.BasicAvatars.renderAvatarIcon(cellName, 52, 52));
    } else {
      const img = document.createElement("img");
      img.src = window.getImage ? window.getImage("farmer", id) : "";
      img.onerror = () => { img.src = AssetMap.createSvgPlaceholder(id); };
      img.style.cssText = "width:48px; height:48px; object-fit:contain;";
      card.appendChild(img);
    }

    const info = document.createElement("div");
    info.innerHTML = `
      <h4 style="margin:0; color:#fff;">${escapeHtml(readableFn(id))}</h4>
      <p style="margin:0.2rem 0 0; color:#ddb6e6; font-weight:bold;">Count: ${formatNumber(count)}</p>
    `;
    card.appendChild(info);
    return card;
  };

  container.append(
    createFarmerCard("MonkeyFarmer", monkeyFarmers, "MonkeyFarmer_avatar"),
    createFarmerCard("RoboFarmer", roboFarmers, "RoboFarmer_avatar")
  );
}

const decalXmlCache = new Map();

async function getDecalCropInfo(decalId) {
  const cleanId = String(decalId || "").replace(/^(Decal_|BloonDecal_|Decals\/)/i, "").toLowerCase();
  if (!cleanId) return null;

  if (decalXmlCache.has(cleanId)) {
    return decalXmlCache.get(cleanId);
  }

  try {
    const response = await fetch(`images/decals/${cleanId}.xml`);
    if (!response.ok) throw new Error("XML file not found");
    const xmlText = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const frameInfo = xmlDoc.querySelector("FrameInformation");
    if (!frameInfo) throw new Error("No FrameInformation tag");

    const texw = parseFloat(frameInfo.getAttribute("texw") || "100");
    const texh = parseFloat(frameInfo.getAttribute("texh") || "100");
    const cells = Array.from(xmlDoc.querySelectorAll("Cell"));
    if (!cells.length) throw new Error("No Cell tags");

    // Search cell priority: moab_colour -> moab -> zomg -> bfb -> colour -> first cell
    let cell = cells.find(c => {
      const name = (c.getAttribute("name") || "").toLowerCase();
      return name === `${cleanId}_moab_colour` || name.endsWith("_moab_colour");
    }) || cells.find(c => {
      const name = (c.getAttribute("name") || "").toLowerCase();
      return name === `${cleanId}_moab` || name.endsWith("_moab");
    }) || cells.find(c => {
      const name = (c.getAttribute("name") || "").toLowerCase();
      return name.includes("moab") || name.includes("zomg") || name.includes("bfb") || name.includes("colour");
    }) || cells[0];

    const x = parseFloat(cell.getAttribute("x") || "0");
    const y = parseFloat(cell.getAttribute("y") || "0");
    const w = parseFloat(cell.getAttribute("w") || "100");
    const h = parseFloat(cell.getAttribute("h") || "100");

    const info = {
      imageSrc: `images/decals/${cleanId}.png`,
      x, y, w, h, texw, texh
    };
    decalXmlCache.set(cleanId, info);
    return info;
  } catch (e) {
    const info = {
      imageSrc: `images/decals/${cleanId}.png`,
      isFallback: true
    };
    decalXmlCache.set(cleanId, info);
    return info;
  }
}

async function applyDecalCrop(cardEl, decalId) {
  const container = cardEl.querySelector(".decal-sprite-container");
  if (!container) return;

  const info = await getDecalCropInfo(decalId);
  if (!info || info.isFallback) return;

  const maxW = 56;
  const maxH = 56;
  const scale = Math.min(maxW / info.w, maxH / info.h, 1);
  const targetW = Math.round(info.w * scale);
  const targetH = Math.round(info.h * scale);
  const bgW = Math.round(info.texw * scale);
  const bgH = Math.round(info.texh * scale);
  const bgX = Math.round(-info.x * scale);
  const bgY = Math.round(-info.y * scale);

  container.innerHTML = `
    <div class="decal-cropped-img" style="
      width: ${targetW}px;
      height: ${targetH}px;
      background-image: url('${info.imageSrc}');
      background-position: ${bgX}px ${bgY}px;
      background-size: ${bgW}px ${bgH}px;
      background-repeat: no-repeat;
    "></div>
  `;
}

/**
 * 5. BLOON DECALS
 */
function renderBloonDecals(save) {
  const decals = save.Unlocks?.Decals || [];
  const rawEquipped = save.Items?.BloonDecal || "";
  const cleanEquipped = String(rawEquipped).replace(/^(Decal_|BloonDecal_|Decals\/)/i, "").toLowerCase();

  const container = document.getElementById("decalsGrid");
  if (!container) return;

  if (!decals.length) {
    container.innerHTML = `<p class="empty-state">No decals unlocked.</p>`;
    return;
  }

  const getImageFn = window.getImage || ((t, i) => "");
  const readableFn = window.readableName || ((i) => i);

  container.innerHTML = decals
    .map((id) => {
      const cleanId = String(id).replace(/^(Decal_|BloonDecal_|Decals\/)/i, "").toLowerCase();
      const isEquipped = cleanId === cleanEquipped && cleanEquipped !== "";
      return `
        <div class="decal-card ${isEquipped ? 'equipped-card' : ''}" data-decal-id="${escapeHtml(id)}">
          ${isEquipped ? `<span class="equipped-pill">Equipped</span>` : ""}
          <div class="decal-sprite-container">
            <img src="${getImageFn("decal", id)}" onerror="this.src='${AssetMap.createSvgPlaceholder(id)}'" alt="${escapeHtml(id)}" loading="lazy" />
          </div>
          <div class="item-name">${escapeHtml(readableFn(id))}</div>
        </div>
      `;
    })
    .join("");

  // Crop decals asynchronously based on XML metadata
  const decalCards = container.querySelectorAll(".decal-card[data-decal-id]");
  decalCards.forEach(card => {
    const decalId = card.getAttribute("data-decal-id");
    if (decalId) {
      applyDecalCrop(card, decalId);
    }
  });
}

/**
 * 6. ACHIEVEMENTS
 */
function renderAchievements(save) {
  const achievements = save.AchievementProgressArray || [];
  const container = document.getElementById("achievementsGrid");
  if (!container) return;

  if (!achievements.length) {
    container.innerHTML = `<p class="empty-state">No achievements progress found.</p>`;
    return;
  }

  const readableFn = window.readableName || ((i) => i);
  container.innerHTML = "";

  achievements.forEach((item) => {
    const id = item.Identifier || item.identifier || "Unknown";
    const rawProgress = Number(item.Progress ?? item.progress ?? 0);
    const progress = Math.min(100, Math.max(0, rawProgress));
    const isCompleted = progress >= 100;

    const card = document.createElement("div");
    card.className = `achievement-card ${isCompleted ? "" : "dimmed"}`;

    const header = document.createElement("div");
    header.className = "achievement-header";

    if (window.BasicAvatars && typeof window.BasicAvatars.renderAvatarIcon === "function") {
      const iconCell = isCompleted ? id : "locked_icon";
      header.appendChild(window.BasicAvatars.renderAvatarIcon(iconCell, 46, 46));
    } else {
      const img = document.createElement("img");
      img.src = window.getImage ? window.getImage("achievement", id) : "";
      img.onerror = () => { img.src = AssetMap.createSvgPlaceholder("Ach"); };
      img.alt = id;
      header.appendChild(img);
    }

    const title = document.createElement("div");
    title.className = "achievement-title";
    title.textContent = readableFn(id);
    header.appendChild(title);

    card.appendChild(header);
    card.insertAdjacentHTML("beforeend", `
      <div class="progress-track">
        <div class="progress-fill" style="width: ${progress}%;"></div>
      </div>
      <div class="progress-text">${progress.toFixed(0)}%</div>
    `);

    container.appendChild(card);
  });
}

/**
 * 7. CURRENT PLAYED INFO (Arenas)
 */
const arenaComposeCache = new Map();
const arenaImageLoadCache = new Map();

function loadArenaSubImage(src) {
  if (!src) return Promise.reject(new Error("No src"));
  if (arenaImageLoadCache.has(src)) return arenaImageLoadCache.get(src);

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
  arenaImageLoadCache.set(src, promise);
  return promise;
}

async function getMergedArenaImage(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) return "";

  if (arenaComposeCache.has(cleanId)) {
    return arenaComposeCache.get(cleanId);
  }

  const isCard = /Card/i.test(cleanId);
  const isClub = /Club/i.test(cleanId);

  const baseSrc = window.getImage ? window.getImage("arena", cleanId) : `images/arenas/${cleanId}.png`;

  if (!isCard && !isClub) {
    arenaComposeCache.set(cleanId, Promise.resolve(baseSrc));
    return baseSrc;
  }

  // Layer order (bottom to top):
  // 1. Base arena image (Bottom layer)
  // 2. card.png (Middle layer if isCard)
  // 3. club.png (Top layer if isClub)
  const layerSources = [baseSrc];
  if (isCard) layerSources.push("images/arenas/card.png");
  if (isClub) layerSources.push("images/arenas/club.png");

  const promise = (async () => {
    try {
      const loadedImgs = await Promise.all(layerSources.map(loadArenaSubImage));
      const width = Math.max(...loadedImgs.map((img) => img.naturalWidth || img.width || 64));
      const height = Math.max(...loadedImgs.map((img) => img.naturalHeight || img.height || 64));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return baseSrc;

      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;

      for (const img of loadedImgs) {
        const w = img.naturalWidth || img.width || width;
        const h = img.naturalHeight || img.height || height;
        const x = Math.round((width - w) / 2);
        const y = Math.round((height - h) / 2);
        ctx.drawImage(img, x, y, w, h);
      }

      return canvas.toDataURL("image/png");
    } catch (err) {
      return "images/arenas/idk.png";
    }
  })();

  arenaComposeCache.set(cleanId, promise);
  return promise;
}

function renderCurrentPlayedInfo(save) {
  const infoList = save.CurrentPlayedInfo || [];
  const container = document.getElementById("arenasGrid");
  if (!container) return;

  if (!infoList.length) {
    container.innerHTML = `<p class="empty-state">No arena play records found.</p>`;
    return;
  }

  // Sort by WinTotal descending
  const sorted = [...infoList].sort((a, b) => {
    const totalA = Number(a.WinTotal ?? a.winTotal ?? 0);
    const totalB = Number(b.WinTotal ?? b.winTotal ?? 0);
    return totalB - totalA;
  });

  const getImageFn = window.getImage || ((t, i) => "");
  const readableFn = window.readableName || ((i) => i);

  container.innerHTML = sorted
    .map((item) => {
      const id = item.ID || item.id || "Arena";
      const winTotal = Number(item.WinTotal ?? item.winTotal ?? 0);
      const winStreak = Number(item.WinStreak ?? item.winStreak ?? 0);

      return `
        <div class="arena-card">
          <img class="js-arena-card-img" data-arena-id="${escapeHtml(id)}" src="${getImageFn("arena", id)}" onerror="if(!this.dataset.triedIdk){this.dataset.triedIdk='1';this.src='images/arenas/idk.png';}else{this.src='${AssetMap.createSvgPlaceholder(id)}';}" alt="${escapeHtml(id)}" loading="lazy" />
          <div class="arena-info">
            <h4>${escapeHtml(readableFn(id))}</h4>
            <p>Wins: <strong>${formatNumber(winTotal)}</strong></p>
            <p>Streak: <strong>${formatNumber(winStreak)}</strong></p>
          </div>
        </div>
      `;
    })
    .join("");

  // Merge card / club overlays onto arena images asynchronously
  const arenaImgs = container.querySelectorAll(".js-arena-card-img[data-arena-id]");
  arenaImgs.forEach(async (imgEl) => {
    const arenaId = imgEl.getAttribute("data-arena-id");
    if (!arenaId) return;

    try {
      const mergedSrc = await getMergedArenaImage(arenaId);
      if (mergedSrc) {
        imgEl.src = mergedSrc;
      }
    } catch (_) {}
  });
}

/**
 * 8. BLOONS & BOOST STATISTICS
 */
function renderBloonsStats(save) {
  const tracking = save.BloonsTracking || {};
  const rows = [
    { label: "Total Bloons Popped", value: formatNumber(tracking.TotalBloonsPopped) },
    { label: "Total Bloons Sent", value: formatNumber(tracking.TotalBloonsSent) },
    { label: "Times Used Boosts", value: formatNumber(tracking.TimesUsedBoosts) },
  ];

  renderTableRowsId("bloonsStatsBody", rows);
}

const LOCAL_BADGE_KEYS = new Set(["localbronze", "localsilver", "localgold"]);
const PRESTIGE_OVERLAY_CANDIDATE_PATHS = [
  "images/badges/prestige.png",
  "images/badges/prestge.png",
];

const BADGE_FILE_BY_KEY = {
  blackdiamond: "black_diamond",
  blackdiamondprestige: "black_diamond_prestige",
  bronzex1: "bronzex1",
  bronzeprestige: "bronze_prestige",
  bronzesilverprestige: "bronze_silver_prestige",
  diamond: "diamond",
  diamondprestige: "diamond_prestige",
  gold: "gold",
  goldblackdiamondprestige: "gold_black_diamond_prestige",
  golddiamondprestige: "gold_diamond_prestige",
  goldprestige: "gold_prestige",
  goldreddiamondprestige: "gold_red_diamond_prestige",
  localbronze: "local_bronze",
  localgold: "local_gold",
  localsilver: "local_silver",
  reddiamond: "red_diamond",
  reddiamondprestige: "red_diamond_prestige",
  silvergold: "silvergold",
  silverx1: "silverx1",
  silverx2: "silverx2",
  silvergoldprestige: "silver_gold_prestige",
  silverprestige: "silver_prestige",
};

const COUNTRY_FLAG_FILE_BY_KEY = {
  ar: "AR", argentina: "AR", au: "AU", australia: "AU", at: "AT", austria: "AT",
  be: "BE", belgium: "BE", br: "BR", brazil: "BR", bg: "BG", bulgaria: "BG",
  ca: "CA", canada: "CA", cl: "CL", chile: "CL", cn: "CN", china: "CN",
  co: "CO", colombia: "CO", hr: "HR", croatia: "HR", cz: "CZ", czechrepublic: "CZ", czechia: "CZ",
  dk: "DK", denmark: "DK", ee: "EE", estonia: "EE", fi: "FI", finland: "FI",
  fr: "FR", france: "FR", gb: "GB", uk: "GB", unitedkingdom: "GB", de: "DE", germany: "DE",
  gr: "GR", greece: "GR", hk: "HK", hongkong: "HK", hongkongsar: "HK", hu: "HU", hungary: "HU",
  in: "IN", india: "IN", id: "ID", indonesia: "ID", ie: "IE", ireland: "IE",
  il: "IL", israel: "IL", it: "IT", italy: "IT", jp: "JP", japan: "JP",
  lv: "LV", latvia: "LV", lt: "LT", lithuania: "LT", lithunia: "LT", my: "MY", malaysia: "MY",
  mx: "MX", mexico: "MX", nl: "NL", netherlands: "NL", nz: "NZ", newzealand: "NZ",
  no: "NO", norway: "NO", ph: "PH", philippines: "PH", pl: "PL", poland: "PL",
  pt: "PT", portugal: "PT", portugual: "PT", tw: "TW", taiwan: "TW", ro: "RO", romania: "RO",
  ru: "RU", russia: "RU", sa: "SA", saudiarabia: "SA", sg: "SG", singapore: "SG",
  si: "SI", slovenia: "SI", za: "ZA", southafrica: "ZA", kr: "KR", southkorea: "KR",
  es: "ES", spain: "ES", se: "SE", sweden: "SE", ch: "CH", switzerland: "CH",
  th: "TH", thailand: "TH", tr: "TR", turkey: "TR", ua: "UA", ukraine: "UA",
  ae: "AE", unitedarabemirates: "AE", us: "US", unitedstates: "US", vn: "VN", vietnam: "VN"
};

const badgeImageCache = new Map();
const badgeComposeCache = new Map();

function normalizeAssetKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function resolveBadgeImagePath(badgeId) {
  const key = normalizeAssetKey(badgeId);
  const file = BADGE_FILE_BY_KEY[key];
  if (!file) {
    return null;
  }
  return `images/badges/${encodeURIComponent(file)}.png`;
}

function resolveCountryFlagCandidatePaths(countryValue) {
  const rawValue = String(countryValue || "").trim();
  if (!rawValue) {
    return [];
  }

  const key = normalizeAssetKey(rawValue);
  const mapped = COUNTRY_FLAG_FILE_BY_KEY[key];
  const codeLike = rawValue.toUpperCase();

  const candidates = [mapped, rawValue, codeLike, codeLike.slice(0, 2)].filter(
    Boolean,
  );

  return [...new Set(candidates)].map(
    (name) => `images/Country%20Flags/${encodeURIComponent(name)}.png`,
  );
}

function isRegionalBadgeId(badgeId) {
  return LOCAL_BADGE_KEYS.has(normalizeAssetKey(badgeId));
}

function isPrestigeBadgeId(badgeId) {
  return normalizeAssetKey(badgeId).endsWith("prestige");
}

function isBlackDiamondPrestigeBadgeId(badgeId) {
  return normalizeAssetKey(badgeId) === "blackdiamondprestige";
}

function loadBadgeImage(src) {
  if (!src) {
    return Promise.reject(new Error("Missing image source"));
  }

  if (badgeImageCache.has(src)) {
    return badgeImageCache.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch (_) {}
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

  badgeImageCache.set(src, promise);
  return promise;
}

async function ensurePrestigeFontLoaded() {
  if (!document.fonts || typeof document.fonts.load !== "function") {
    return;
  }

  try {
    await document.fonts.load('24px "OETZTYP"');
  } catch (_) {
    // Fall back to whatever font is available.
  }
}

function drawPrestigeRank(ctx, width, height, rankText) {
  const text = String(rankText || "").trim();
  if (!text) {
    return;
  }

  const maxWidth = Math.round(width * 0.82);
  const minFontSize = Math.max(4, Math.round(height * 0.09));
  let fontSize = Math.max(minFontSize, Math.round(height * 0.18));

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  while (fontSize >= minFontSize) {
    ctx.font = `${fontSize}px "OETZTYP", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    fontSize -= 1;
  }

  const x = Math.round(width / 2);
  const y = Math.round(height * 0.86);
  ctx.fillText(text, x, y);
}

function shouldShowBadgeCountOverlay(imgEl) {
  const badgeType = String(imgEl?.getAttribute("data-badge-type") || "")
    .trim()
    .toUpperCase();
  const isPrestige = imgEl?.getAttribute("data-merge-prestige") === "1";
  const count = Number(imgEl?.getAttribute("data-badge-count") || 0);

  if (isPrestige) {
    return false;
  }

  if (badgeType !== "WORLD" && badgeType !== "REGION") {
    return false;
  }

  return Number.isFinite(count) && count > 1;
}

async function mergeBadgeCountOverlay(baseSrc, countText, options) {
  const opts = options || {};
  const fontScale = Number(opts.fontScale) || 1;
  const text = String(countText || "").trim();
  if (!baseSrc || !text) {
    return null;
  }

  const key = JSON.stringify(["count", baseSrc, text, fontScale]);
  if (badgeComposeCache.has(key)) {
    return badgeComposeCache.get(key);
  }

  const promise = (async () => {
    const baseImg = await loadBadgeImage(baseSrc);
    await ensurePrestigeFontLoaded();

    const width = Math.max(1, baseImg.naturalWidth || baseImg.width || 64);
    const height = Math.max(1, baseImg.naturalHeight || baseImg.height || 64);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseImg, 0, 0, width, height);

    const maxWidth = Math.round(width * 0.42);
    const minFontSize = Math.max(7, Math.round(height * 0.12 * fontScale));
    let fontSize = Math.max(minFontSize, Math.round(height * 0.24 * fontScale));

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    while (fontSize >= minFontSize) {
      ctx.font = `${fontSize}px "OETZTYP", sans-serif`;
      if (ctx.measureText(text).width <= maxWidth) {
        break;
      }
      fontSize -= 1;
    }

    const x = Math.round(width * 0.95);
    const y = Math.round(height * 0.88);
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.2));
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x, y);

    return canvas.toDataURL("image/png");
  })();

  badgeComposeCache.set(key, promise);
  return promise;
}

async function applyBadgeCountToImage(imgEl) {
  if (!imgEl || !shouldShowBadgeCountOverlay(imgEl)) {
    return;
  }

  const count = Number(imgEl.getAttribute("data-badge-count") || 0);
  const badgeType = String(imgEl.getAttribute("data-badge-type") || "")
    .trim()
    .toUpperCase();
  const countText = `x${Math.trunc(count)}`;
  const baseForCount =
    imgEl.getAttribute("data-count-base-src") ||
    imgEl.getAttribute("data-base-src") ||
    imgEl.src;

  if (!baseForCount) {
    return;
  }

  const mergedSrc = await mergeBadgeCountOverlay(baseForCount, countText, {
    fontScale: badgeType === "REGION" ? 1.35 : badgeType === "WORLD" ? 1.1 : 1,
  });
  if (mergedSrc) {
    imgEl.src = mergedSrc;
  }
}

function enhanceBadgeCountOverlays() {
  const imageNodes = document.querySelectorAll(".js-badge-count-image");
  imageNodes.forEach((node) => {
    applyBadgeCountToImage(node).catch(() => {});
  });
}

async function mergeBadgeOverlay(baseSrc, overlaySrc, options) {
  const opts = options || {};
  const offsetY = Number(opts.offsetY) || 0;
  const scale = Number(opts.scale) || 1;
  const rankText = String(opts.rankText || "").trim();
  const key = JSON.stringify([baseSrc, overlaySrc, offsetY, scale, rankText]);
  if (badgeComposeCache.has(key)) {
    return badgeComposeCache.get(key);
  }

  const promise = (async () => {
    const [baseImg, overlayImg] = await Promise.all([
      loadBadgeImage(baseSrc),
      loadBadgeImage(overlaySrc),
    ]);

    await ensurePrestigeFontLoaded();

    const baseW = Math.max(1, baseImg.naturalWidth || baseImg.width || 64);
    const baseH = Math.max(1, baseImg.naturalHeight || baseImg.height || 64);
    const overlayW =
      Math.max(1, overlayImg.naturalWidth || overlayImg.width || 64) * scale;
    const overlayH =
      Math.max(1, overlayImg.naturalHeight || overlayImg.height || 64) * scale;

    const width = Math.max(baseW, overlayW);
    const height = Math.max(baseH, overlayH) + Math.max(0, Math.round(offsetY));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    const baseX = Math.round((width - baseW) / 2);
    const baseY = height - baseH;
    const overlayX = Math.round((width - overlayW) / 2);
    const overlayY = height - overlayH + Math.round(offsetY);

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseImg, baseX, baseY, baseW, baseH);
    ctx.drawImage(overlayImg, overlayX, overlayY, overlayW, overlayH);

    drawPrestigeRank(ctx, width, height, rankText);

    return canvas.toDataURL("image/png");
  })();

  badgeComposeCache.set(key, promise);
  return promise;
}

async function mergeBadgeOverlayWithFallback(
  baseSrc,
  candidateOverlaySources,
  options,
) {
  const uniqueCandidates = [
    ...new Set((candidateOverlaySources || []).filter(Boolean)),
  ];

  for (const overlaySrc of uniqueCandidates) {
    try {
      const merged = await mergeBadgeOverlay(baseSrc, overlaySrc, options);
      if (merged) {
        return merged;
      }
    } catch (_) {
      // Try next candidate path.
    }
  }

  return null;
}

async function applyPrestigeMergeToImage(imgEl) {
  if (!imgEl) {
    return;
  }

  const shouldMerge = imgEl.getAttribute("data-merge-prestige") === "1";
  const baseSrc = imgEl.getAttribute("data-base-src") || "";
  if (!shouldMerge || !baseSrc) {
    return;
  }

  const rankValue = imgEl.getAttribute("data-prestige-rank") || "";

  const mergedSrc = await mergeBadgeOverlayWithFallback(
    baseSrc,
    PRESTIGE_OVERLAY_CANDIDATE_PATHS,
    {
      offsetY: 4,
      scale: 1.2,
      rankText:
        Number.isFinite(Number(rankValue)) && Number(rankValue) > 0
          ? typeof formatNumber === "function" ? formatNumber(Number(rankValue)) : String(rankValue)
          : "",
    },
  );

  if (mergedSrc) {
    imgEl.src = mergedSrc;
  }
}

function enhancePrestigeBadges() {
  const imageNodes = document.querySelectorAll(".js-prestige-badge-image");
  imageNodes.forEach((node) => {
    applyPrestigeMergeToImage(node).catch(() => {});
  });
}

function getRegionalMergeOptions(badgeId, countryValue) {
  const cfg = window.RegionalBadgePositionConfig || {};
  const defaults = cfg.defaults || {};
  const badgeKey = normalizeAssetKey(badgeId);
  const byBadge = (cfg.byBadge && cfg.byBadge[badgeKey]) || {};

  const countryCode = String(countryValue || "")
    .trim()
    .toUpperCase();
  const byBadgeCountryMap =
    (cfg.byBadgeCountry && cfg.byBadgeCountry[badgeKey]) || {};
  const byBadgeCountry = (countryCode && byBadgeCountryMap[countryCode]) || {};

  return {
    flagScale: Number(defaults.flagScale) || 1.2,
    offsetX:
      Number(byBadgeCountry.offsetX ?? byBadge.offsetX ?? defaults.offsetX) ||
      0,
    offsetY:
      Number(byBadgeCountry.offsetY ?? byBadge.offsetY ?? defaults.offsetY) ||
      0,
  };
}

async function applyRegionalMergeToImage(imgEl, fallbackCountryValue) {
  if (!imgEl) {
    return;
  }

  const composer = window.RegionalBadgeComposer;
  if (
    !composer ||
    typeof composer.mergeRegionalBadgeWithFallback !== "function"
  ) {
    return;
  }

  const baseSrc = imgEl.getAttribute("data-base-src") || "";
  const badgeId = imgEl.getAttribute("data-badge-id") || "";
  if (!baseSrc || !isRegionalBadgeId(badgeId)) {
    return;
  }

  const perBadgeCountry = imgEl.getAttribute("data-country") || "";
  const countryForBadge = perBadgeCountry || fallbackCountryValue;
  const flagCandidates = resolveCountryFlagCandidatePaths(countryForBadge);
  const mergeOptions = getRegionalMergeOptions(badgeId, countryForBadge);
  if (!flagCandidates.length) {
    const badgeEl = imgEl.closest(".badge");
    if (badgeEl) {
      badgeEl.remove();
    }
    return;
  }

  const mergedSrc = await composer.mergeRegionalBadgeWithFallback(
    baseSrc,
    flagCandidates,
    mergeOptions,
  );

  if (mergedSrc) {
    imgEl.setAttribute("data-count-base-src", mergedSrc);
    imgEl.src = mergedSrc;
    applyBadgeCountToImage(imgEl).catch(() => {});
    return;
  }

  const badgeEl = imgEl.closest(".badge");
  if (badgeEl) {
    badgeEl.remove();
  }
}

function enhanceRegionalBadges(fallbackCountryValue) {
  const imageNodes = document.querySelectorAll(".js-regional-badge-image");
  imageNodes.forEach((node) => {
    applyRegionalMergeToImage(node, fallbackCountryValue).catch(() => {});
  });
}

/**
 * 9. BADGES SHOWCASE
 */
function renderBadgesShowcase(publicData, save) {
  const featuredWrap = document.getElementById("detailsFeaturedBadgeWrap");
  const badgesWrap = document.getElementById("detailsBadgesWrap");

  const featured = publicData?.raw?.FeaturedBadge || save?.BadgeFeatured || null;
  const badges = (Array.isArray(publicData?.raw?.Badges) && publicData.raw.Badges.length)
    ? publicData.raw.Badges
    : (Array.isArray(save?.BadgesList) && save.BadgesList.length ? save.BadgesList : []);

  const countryCode = publicData?.raw?.CountryCode || save?.CountryCode || save?.cc || "";

  if (featured && featured.id && featuredWrap) {
    renderSingleBadge(featuredWrap, featured, countryCode);
  } else if (featuredWrap) {
    featuredWrap.innerHTML = "<span class='empty-state'>No featured badge.</span>";
  }

  if (!badgesWrap) return;

  if (!badges || !badges.length) {
    badgesWrap.innerHTML = "<span class='empty-state'>No badges found.</span>";
    return;
  }

  badgesWrap.innerHTML = badges
    .map((badge) => {
      const badgeId = String(badge.id || badge.Id || "");
      const badgeIsPrestige = isPrestigeBadgeId(badgeId);
      const badgeIsBlackDiamondPrestige = isBlackDiamondPrestigeBadgeId(badgeId);
      const rawScore = Number(badge.score || badge.Score) || 0;
      const score = badgeIsPrestige ? rawScore / 10 : rawScore;
      const badgeRankValue = Number(badge.rank ?? badge.Rank ?? (badgeIsPrestige ? (publicData?.profile?.leaderboards?.prestige?.rank ?? save?.Levels?.PrestigeRank) : null));
      const rank = Number.isFinite(badgeRankValue) ? Math.trunc(badgeRankValue) + 1 : badgeIsBlackDiamondPrestige ? 1 : 0;
      const badgeImg = typeof resolveBadgeImagePath === "function" ? resolveBadgeImagePath(badgeId) : null;
      const badgeAttr = escapeHtml(badgeId);
      const badgeType = String(badge.type || badge.Type || "")
        .trim()
        .toUpperCase();
      const badgeCount = Number(badge.count || badge.Count) || 0;
      const badgeCountry = String(badge.cc || badge.CountryCode || "").trim();
      const badgePrestigeRankRaw = rank > 0 ? String(rank) : "";

      return `
        <span class="badge" title="${escapeHtml(badgeId)} (Rank: ${formatNumber(rank)}, Score: ${formatNumber(score)})">
          ${badgeImg ? `<img src="${badgeImg}" data-base-src="${badgeImg}" data-count-base-src="${badgeImg}" data-badge-id="${badgeAttr}" data-badge-type="${escapeHtml(badgeType)}" data-badge-count="${escapeHtml(String(badgeCount))}" data-country="${escapeHtml(badgeCountry)}" data-merge-prestige="${badgeIsPrestige ? "1" : "0"}" data-prestige-rank="${escapeHtml(badgePrestigeRankRaw)}" alt="${escapeHtml(badgeId)}" class="badge-image js-regional-badge-image js-prestige-badge-image js-badge-count-image" loading="lazy" />` : `<span>${escapeHtml(badgeId)}</span>`}
        </span>
      `;
    })
    .join("");

  if (typeof enhancePrestigeBadges === "function") enhancePrestigeBadges();
  if (typeof enhanceBadgeCountOverlays === "function") enhanceBadgeCountOverlays();
  if (typeof enhanceRegionalBadges === "function") enhanceRegionalBadges(countryCode);
}

function renderSingleBadge(wrapEl, badge, fallbackCountry) {
  const badgeId = String(badge.id || badge.Id || "");
  const badgeIsPrestige = isPrestigeBadgeId(badgeId);
  const badgeIsBlackDiamondPrestige = isBlackDiamondPrestigeBadgeId(badgeId);
  const rawScore = Number(badge.score || badge.Score) || 0;
  const score = badgeIsPrestige ? rawScore / 10 : rawScore;
  const badgeImg = typeof resolveBadgeImagePath === "function" ? resolveBadgeImagePath(badgeId) : null;
  const badgeAttr = escapeHtml(badgeId);
  const badgeType = String(badge.type || badge.Type || "")
    .trim()
    .toUpperCase();
  const badgeCount = Number(badge.count || badge.Count) || 0;
  const badgeRankValue = Number(badge.rank ?? badge.Rank);
  const displayRank = Number.isFinite(badgeRankValue) ? Math.trunc(badgeRankValue) + 1 : badgeIsBlackDiamondPrestige ? 1 : 0;
  const prestigeRankRaw = displayRank > 0 ? String(displayRank) : "";
  const country = String(badge.cc || badge.CountryCode || "").trim();

  wrapEl.innerHTML = `
    <span class="badge" title="${escapeHtml(badgeId)} (Rank: ${formatNumber(displayRank)}, Score: ${formatNumber(score)})">
      ${badgeImg ? `<img src="${badgeImg}" data-base-src="${badgeImg}" data-count-base-src="${badgeImg}" data-badge-id="${badgeAttr}" data-badge-type="${escapeHtml(badgeType)}" data-badge-count="${escapeHtml(String(badgeCount))}" data-country="${escapeHtml(country)}" data-merge-prestige="${badgeIsPrestige ? "1" : "0"}" data-prestige-rank="${escapeHtml(prestigeRankRaw)}" alt="${escapeHtml(badgeId)}" class="badge-image js-regional-badge-image js-prestige-badge-image js-badge-count-image" loading="lazy" />` : `<span>${escapeHtml(badgeId)}</span>`}
    </span>
  `;
}

/**
 * 10. BATTLE CARD DECKS
 */
function renderCardDecks(save, rawSaveData) {
  const container = document.getElementById("cardDecksContainer");
  if (!container) return;

  const data = rawSaveData || save || {};

  // Retrieve decks data from any available key
  let decksData =
    data.BattleCardDecksNew ??
    data.battleCardDecksNew ??
    data.BattleCardDecks ??
    data.battleCardDecks ??
    save?.BattleCardDecksNew;

  if (typeof decksData === "string") {
    try {
      decksData = JSON.parse(decksData);
    } catch (e) {
      decksData = [];
    }
  }

  if (decksData && typeof decksData === "object" && !Array.isArray(decksData)) {
    decksData = Object.values(decksData);
  }

  if (!Array.isArray(decksData) || !decksData.length) {
    container.innerHTML = `<p class="empty-state">No card decks saved.</p>`;
    return;
  }

  const activeIdx = Number(
    data.CurrentBattleCardDeckNew ??
    data.currentBattleCardDeckNew ??
    data.CurrentBattleCardDeck ??
    data.currentBattleCardDeck ??
    save?.CurrentBattleCardDeckNew ??
    0
  );

  const html = decksData.map((deck, deckIdx) => {
    const isActive = deckIdx === activeIdx;

    let cardList = deck;
    if (typeof cardList === "string") {
      try {
        cardList = JSON.parse(cardList);
      } catch (e) {
        cardList = cardList.includes(",") ? cardList.split(",") : [];
      }
    }
    if (cardList && typeof cardList === "object" && !Array.isArray(cardList)) {
      cardList = Array.isArray(cardList.Cards) ? cardList.Cards : Object.values(cardList);
    }
    if (!Array.isArray(cardList)) cardList = [];

    const slots = cardList.map((c) => {
      let cardId = "";
      if (c !== null && c !== undefined) {
        cardId = typeof c === "object" ? String(c.CardID ?? c.cardID ?? c.id ?? c.ID ?? "").trim() : String(c).trim();
      }

      if (cardId === "") {
        return `<div class="card-slot"><span class="slot-empty">Empty</span></div>`;
      }

      const imgSrc = `images/cards/${encodeURIComponent(cardId)}.png`;
      const label = window.AssetMap && window.AssetMap.readableName
        ? window.AssetMap.readableName(cardId)
        : `Card #${cardId}`;
      const placeholder = window.AssetMap && window.AssetMap.createSvgPlaceholder
        ? window.AssetMap.createSvgPlaceholder(cardId)
        : "";

      return `<div class="card-slot" title="${escapeHtml(label)}">
        <img src="${imgSrc}" onerror="this.onerror=null;${placeholder ? `this.src='${placeholder}';` : ''}" alt="${escapeHtml(label)}" loading="lazy" />
      </div>`;
    }).join("");

    const hasCards = cardList.some((c) => c !== null && c !== undefined && String(typeof c === "object" ? (c.CardID ?? c.id ?? "") : c).trim() !== "");

    return `
      <div class="deck-container ${isActive ? "active-deck" : ""}">
        <div class="deck-title-bar">
          <h4>Deck ${deckIdx + 1}</h4>
          ${isActive ? `<span class="equipped-pill">Active Deck</span>` : ""}
        </div>
        ${hasCards
        ? `<div class="deck-grid">${slots}</div>`
        : `<p class="empty-state">Empty deck</p>`}
      </div>`;
  }).join("");

  container.innerHTML = html;
}

/**
 * 11. FOLLOWING PLAYERS LIST
 * Concurrency limited to 5 requests at a time. LocalStorage cached.
 */
let followingCurrentPage = 20;
let followingListGlobal = [];

function renderFollowingList(save) {
  const following = save.Following || [];
  followingListGlobal = following;

  const container = document.getElementById("followingGrid");
  const showMoreBtn = document.getElementById("showMoreFollowingBtn");
  if (!container) return;

  if (!following.length) {
    container.innerHTML = `<p class="empty-state">Not following any players.</p>`;
    if (showMoreBtn) {
      showMoreBtn.hidden = true;
      showMoreBtn.style.display = "none";
    }
    return;
  }

  const visibleIds = following.slice(0, followingCurrentPage);
  container.innerHTML = visibleIds
    .map((id) => {
      return `
        <a id="following-item-${escapeHtml(id)}" href="player_details.html?id=${encodeURIComponent(id)}" class="following-item">
          <img class="following-avatar" src="images/extra/follower.png" alt="Follower" />
          <div class="following-name" id="following-name-${escapeHtml(id)}">${escapeHtml(id)}</div>
        </a>
      `;
    })
    .join("");

  if (showMoreBtn) {
    const hasMore = following.length > visibleIds.length;
    showMoreBtn.hidden = !hasMore;
    showMoreBtn.style.display = hasMore ? "block" : "none";
    showMoreBtn.onclick = () => {
      followingCurrentPage += 20;
      renderFollowingList(save);
    };
  }

  // Resolve player names concurrently with batch limit of 5
  resolveFollowingNames(visibleIds);
}

async function resolveFollowingNames(ids) {
  const CONCURRENCY_LIMIT = 5;
  const queue = [...ids];

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;

      const cacheKey = `btd_player_name_${id}`;
      let name = null;

      try {
        name = localStorage.getItem(cacheKey);
      } catch (_) {
        // LocalStorage fallback
      }

      if (!name) {
        try {
          const res = await apiGet(`player.php?id=${encodeURIComponent(id)}`);
          name = res?.profile?.username || null;
          if (name) {
            try {
              localStorage.setItem(cacheKey, name);
            } catch (_) { }
          }
        } catch (_) {
          name = id; // Fall back to raw ID on failure
        }
      }

      const nameEl = document.getElementById(`following-name-${id}`);
      if (nameEl && name) {
        nameEl.textContent = name;
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, ids.length) }, () => worker());
  await Promise.all(workers);
}

/**
 * 12. PREVIOUS GUILD HISTORY
 * Groups repeated entries for the same clan ID into a single row with multiple join/leave date ranges.
 */
function renderGuildHistory(save) {
  const guilds = save.Guilds || [];
  const container = document.getElementById("guildHistoryContainer");
  if (!container) return;

  if (!guilds.length) {
    container.innerHTML = `<p class="empty-state">No clan history available.</p>`;
    return;
  }

  // Group by clan ID
  const clanMap = new Map();

  guilds.forEach((entry) => {
    const clanId = String(entry.id || entry.guildID || "").trim();
    if (!clanId) return;

    if (!clanMap.has(clanId)) {
      clanMap.set(clanId, {
        id: clanId,
        name: entry.name || entry.guildName || clanId,
        periods: [],
        isCurrent: false,
        isUnknown: false,
        latestMs: 0,
      });
    }

    const group = clanMap.get(clanId);
    const joinMS = Number(entry.joinMS ?? entry.joinMs ?? 0);
    const leaveMS = Number(entry.leaveMS ?? entry.leaveMs ?? 0);
    const left = Boolean(entry.left);

    group.periods.push({ joinMS, leaveMS, left });

    const maxMs = Math.max(joinMS, leaveMS);
    if (maxMs > group.latestMs) {
      group.latestMs = maxMs;
    }

    // Status: left:false AND leaveMS == 0 -> Current
    if (!left && leaveMS === 0) {
      group.isCurrent = true;
    } else if (!left && leaveMS > 0) {
      group.isUnknown = true;
    }
  });

  // Convert map to array and sort newest first
  const groupedList = Array.from(clanMap.values()).sort((a, b) => b.latestMs - a.latestMs);

  // Build HTML with badge placeholder elements keyed by clan ID
  container.innerHTML = groupedList
    .map((group) => {
      let statusBadge = `<span class="status-badge former">Former member</span>`;
      if (group.isCurrent) {
        statusBadge = `<span class="status-badge current">Current Clan</span>`;
      } else if (group.isUnknown) {
        statusBadge = `<span class="status-badge unknown">Unknown status</span>`;
      }

      const formattedPeriods = group.periods
        .map((p) => {
          const joinStr = p.joinMS ? new Date(p.joinMS).toLocaleDateString() : "Unknown";
          const leaveStr = p.leaveMS ? new Date(p.leaveMS).toLocaleDateString() : p.left ? "Left" : "Present";
          return `${joinStr} &rarr; ${leaveStr}`;
        })
        .join(" | ");

      const safeId = CSS.escape(group.id);

      return `
        <div class="history-item">
          <a href="player.html?id=${encodeURIComponent(group.id)}&kind=clan" class="history-clan-badge-link" title="${escapeHtml(group.name)}">
            <div class="history-clan-badge" data-clan-id="${escapeHtml(group.id)}" data-clan-name="${escapeHtml(group.name)}">
              ${escapeHtml(guildInitials(group.name))}
            </div>
          </a>
          <div class="history-clan-details">
            <div class="history-clan-info">
              <a href="player.html?id=${encodeURIComponent(group.id)}&kind=clan" class="history-clan-name">${escapeHtml(group.name)}</a>
              ${statusBadge}
            </div>
            <div class="history-periods">${formattedPeriods}</div>
          </div>
        </div>
      `;
    })
    .join("");

  // Asynchronously fetch and render clan badges
  const badgeEls = container.querySelectorAll(".history-clan-badge");
  badgeEls.forEach(async (badgeEl) => {
    const clanId = badgeEl.dataset.clanId;
    const clanName = badgeEl.dataset.clanName || clanId;
    if (!clanId) return;

    try {
      const data = await apiGet(`guild.php?id=${encodeURIComponent(clanId)}`);
      const guild = data.guild || {};
      const rawGuild = data.raw || null;

      // Re-use the guild.js helper if available, otherwise do it inline
      if (typeof renderGuildBadge === "function") {
        await renderGuildBadge(badgeEl, clanName, guild, rawGuild);
      } else {
        // Inline fallback: extract shield + icon from tagline / raw
        const tagline = guild.tagline || (rawGuild ? JSON.stringify(rawGuild) : "");
        const shieldMatch = tagline.match(/Shield_\d+/i);
        const iconMatch = tagline.match(/Icon_\d+(?:_[A-Za-z0-9]+)?/i);
        if (shieldMatch && iconMatch) {
          const shieldFile = normalizeClanLayerFileLocal(shieldMatch[0]);
          const iconFile = normalizeClanLayerFileLocal(iconMatch[0]);
          const shieldSrc = `images/clans/${encodeURIComponent(shieldFile)}`;
          const iconSrc = `images/clans/${encodeURIComponent(iconFile)}`;
          const composer = window.ClanBadgeComposer;
          if (composer && typeof composer.mergeClanBadge === "function") {
            const merged = await composer.mergeClanBadge(shieldSrc, iconSrc);
            if (merged) {
              badgeEl.innerHTML = `<img class="badge-merged-image" src="${merged}" alt="${escapeHtml(clanName)} badge" loading="lazy" decoding="async" />`;
            }
          }
        }
      }
    } catch (_) {
      // Leave initials fallback in place
    }
  });
}

/** Return up to 2 uppercase initials from a clan name (used as badge placeholder) */
function guildInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CL";
}

/** Normalise a raw shield/icon filename the same way guild.js does */
function normalizeClanLayerFileLocal(value) {
  const CLAN_ICON_FILE_BY_NUMBER = {
    "01": "Icon_01_ODS.png", "02": "Icon_02_Regen.png", "03": "Icon_03_Bloonjitsu.png",
    "04": "Icon_04_Sungod.png", "05": "Icon_05_Assassin.png", "06": "Icon_06_BFB.png",
    "07": "Icon_07_Blue.png", "08": "Icon_08_Bomb.png", "09": "Icon_09_Darts.png",
    10: "Icon_10_DartMonkey.png", 11: "Icon_11_Mauler.png", 12: "Icon_12_MOAB.png",
    13: "Icon_13_Pineapple.png", 14: "Icon_14_Red.png", 15: "Icon_15_Rockets.png",
    16: "Icon_16_Shurikens.png", 17: "Icon_17_TechTerror.png", 18: "Icon_18_ZOMG.png",
    19: "Icon_19_Buccaneer.png", 20: "Icon_20_Sub.png", 21: "Icon_21_SuperMonkey.png",
    22: "Icon_22_NKLogo.png", 23: "Icon_23_NKLogoGold.png", 24: "Icon_24_Bombs.png",
    25: "Icon_25_Sniper.png",
  };
  const raw = String(value || "").trim();
  if (!raw) return "";
  const name = raw.replace(/\.png$/i, "");
  const shieldMatch = name.match(/^shield_(\d{1,2})$/i);
  if (shieldMatch) return `Shield_${shieldMatch[1].padStart(2, "0")}.png`;
  const iconMatch = name.match(/^icon_(\d{1,2})(?:_.+)?$/i);
  if (iconMatch) {
    const num = iconMatch[1].padStart(2, "0");
    return CLAN_ICON_FILE_BY_NUMBER[num] || `Icon_${num}.png`;
  }
  return /\.png$/i.test(raw) ? raw : `${raw}.png`;
}

/**
 * 13. UNLOCKS & COSMETICS
 */
function renderUnlocks(save) {
  const container = document.getElementById("unlocksContainer");
  if (!container) return;

  const profileSkins = save.ProfileSkinUnlocks || [];
  const equippedProfileSkin = save.Items?.ProfileSkin || "";
  const projectileSkins = save.ProjectileSkinUnlocks || [];
  const equippedProjectileSkin = save.Items?.ProjectileSkin || "";
  const towerSkins = save.TowerSkinUnlocks || [];
  const activeTowerSkins = save.Items?.ActiveTowerSkins || {};

  const readableFn = window.readableName || ((i) => i);

  function renderSkinGroup(title, items, isEquippedFn, isProfileSkin = false) {
    let out = `<h4 class="unlocks-section-title">${title}</h4>`;
    if (!items.length) {
      out += `<p class="empty-state">None unlocked</p>`;
      return out;
    }

    out += `<div class="unlocks-grid ${isProfileSkin ? "unlocks-grid--profile" : ""}">`;
    out += items
      .map((skin) => {
        const isEquipped = isEquippedFn(skin);
        const imgFile = resolvePurchasedItemFile(skin);
        const displayName = readableFn(skin);

        return `
          <div class="unlock-card ${isProfileSkin ? "unlock-card--profile" : ""} ${isEquipped ? "equipped" : ""}">
            <div class="unlock-card-image-wrap ${isProfileSkin ? "unlock-card-image-wrap--profile" : ""}">
              ${
                imgFile
                  ? `<img src="images/items/${encodeURIComponent(imgFile)}" alt="${escapeHtml(displayName)}" class="unlock-card-img" loading="lazy" />`
                  : `<span class="empty-state" style="font-size:0.75rem;">No Img</span>`
              }
              ${isEquipped ? `<span class="equipped-badge">Equipped</span>` : ""}
            </div>
            <span class="unlock-card-name">${escapeHtml(displayName)}</span>
          </div>
        `;
      })
      .join("");
    out += `</div>`;
    return out;
  }

  let html = "";
  // 1. Profile Skins (150% size)
  html += renderSkinGroup("Profile Skins", profileSkins, (skin) => skin === equippedProfileSkin, true);

  // 2. Projectile Skins
  html += renderSkinGroup("Projectile Skins", projectileSkins, (skin) => skin === equippedProjectileSkin, false);

  // 3. Tower Skins
  const activeValues = Object.values(activeTowerSkins);
  html += renderSkinGroup("Tower Skins", towerSkins, (skin) => activeValues.includes(skin), false);

  container.innerHTML = html;
}

function findPremiumsInSave(save, rawSaveData) {
  const sources = [
    save,
    rawSaveData,
    rawSaveData?.Items,
    rawSaveData?.items,
    rawSaveData?.Unlocks,
    rawSaveData?.unlocks,
  ];

  const possibleKeys = [
    "Premiums",
    "premiums",
    "Premium",
    "premiumsList",
    "PremiumsList",
    "PurchasedPremiums",
    "Purchases",
    "PurchasedItems",
    "PremiumItems",
    "premiums_list",
  ];

  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const key of possibleKeys) {
      if (Array.isArray(src[key]) && src[key].length) {
        return src[key];
      }
    }
  }

  // Check object dictionaries (e.g. { CandyBananaFarm: true, ... })
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const key of possibleKeys) {
      if (src[key] && typeof src[key] === "object" && !Array.isArray(src[key])) {
        const keys = Object.keys(src[key]).filter((k) => Boolean(src[key][k]));
        if (keys.length) return keys;
      }
    }
  }

  // Deep search top-level keys matching /premiums?/i
  if (rawSaveData && typeof rawSaveData === "object") {
    for (const k of Object.keys(rawSaveData)) {
      if (/premiums?/i.test(k)) {
        const val = rawSaveData[k];
        if (Array.isArray(val) && val.length) return val;
        if (val && typeof val === "object") {
          const keys = Object.keys(val).filter((subK) => Boolean(val[subK]));
          if (keys.length) return keys;
        }
      }
    }
  }

  return [];
}

function extractCleanPurchaseItem(val) {
  let str = String(val || "").trim();
  if (!str) return "";
  if (str.includes(" - ")) {
    str = str.split(" - ")[0].trim();
  }
  str = str.replace(/\s*[-_]\s*\d{4}-\d{2}-\d{2}.*$/i, "").trim();
  str = str.replace(/^(com\.[a-z0-9_]+\.|bloons\.[a-z0-9_.]+\.)/i, "").trim();
  return str;
}

function findCompletedPurchasesInSave(save, rawSaveData) {
  const sources = [
    save,
    rawSaveData,
    rawSaveData?.Purchases,
    rawSaveData?.purchases,
    rawSaveData?.Items,
    rawSaveData?.items,
  ];

  const possibleKeys = [
    "CompletedPurchases",
    "completedPurchases",
    "completed_purchases",
    "Completed_Purchases",
    "Purchases",
    "purchases",
  ];

  let rawList = [];
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const key of possibleKeys) {
      if (Array.isArray(src[key]) && src[key].length) {
        rawList = src[key];
        break;
      }
    }
    if (rawList.length) break;
  }

  if (!rawList.length && rawSaveData && typeof rawSaveData === "object") {
    for (const k of Object.keys(rawSaveData)) {
      if (/completed.*purchases?/i.test(k) && Array.isArray(rawSaveData[k])) {
        rawList = rawSaveData[k];
        break;
      }
    }
  }

  const items = [];
  for (const item of rawList) {
    if (!item) continue;
    if (typeof item === "string") {
      const clean = extractCleanPurchaseItem(item);
      if (clean) items.push(clean);
    } else if (typeof item === "object") {
      const name =
        item.ProductID ||
        item.productId ||
        item.product_id ||
        item.ID ||
        item.id ||
        item.Item ||
        item.item ||
        item.Name ||
        item.name ||
        item.Sku ||
        item.sku;
      if (name && typeof name === "string") {
        const clean = extractCleanPurchaseItem(name);
        if (clean) items.push(clean);
      }
    }
  }

  return items;
}

const ITEM_IMAGE_MAP = {
  bazookadartlinggun: "BazookaDartlingGun.png",
  candybananafarm: "CandyBananaFarm.png",
  chatpack_pack2: "ChatPack_Pack2.png",
  btdbattles_chatpack_pack2: "ChatPack_Pack2.png",
  christmasdartmonkey: "ChristmasDartMonkey.png",
  drmonkeyengineer: "DrMonkeyEngineer.png",
  evilsupermonkey: "EvilSuperMonkey.png",
  fireworksmortartower: "FireworksMortarTower.png",
  huntersnipermonkey: "HunterSniperMonkey.png",
  mechanicaltacktower: "MechanicalTackTower.png",
  medievaldartmonkey: "MedievalDartMonkey.png",
  militarybombtower: "MilitaryBombTower.png",
  navymonkeybuccaneer: "NavyMonkeyBuccaneer.png",
  powercell: "PowerCell.png",
  removeadverts: "RemoveAdverts.png",
  samuraininjamonkey: "SamuraiNinjaMonkey.png",
  sorcerermonkeyapprentice: "SorcererMonkeyApprentice.png",
  steampunkmonkeysub: "SteampunkMonkeySub.png",
  topgunmonkeyace: "TopgunMonkeyAce.png",
  tribalboomerangthrower: "TribalBoomerangThrower.png",
  ufohelipilot: "UFOHeliPilot.png",
  clubroomentry: "btdbattles_clubroom.png",
  btdbattles_clubroom: "btdbattles_clubroom.png",
  btdbattles_clubroom_plus: "btdbattles_clubroom_plus.png",
  btdbattles_clubstarterpack: "btdbattles_clubstarterpack.png",
  btdbattles_bagmedallions: "btdbattles_bagmedallions.png",
  btdbattles_champion_pack: "btdbattles_champion_pack.png",
  btdbattles_chestmedallions: "btdbattles_chestmedallions.png",
  btdbattles_clanwarchestamplifier: "btdbattles_clanwarchestamplifier.png",
  btdbattles_cleanslate: "btdbattles_cleanslate.png",
  btdbattles_handfulmedallions: "btdbattles_handfulmedallions.png",
  btdbattles_largeenergy: "btdbattles_largeenergy.png",
  btdbattles_master_pack: "btdbattles_master_pack.png",
  btdbattles_mountainmedallions: "btdbattles_mountainmedallions.png",
  btdbattles_pilemedallions: "btdbattles_pilemedallions.png",
  btdbattles_powerfulenergy: "btdbattles_powerfulenergy.png",
  btdbattles_powers_xp_multiplier_x10_5win: "btdbattles_powers_xp_multiplier_x10_5win.png",
  btdbattles_powers_xp_multiplier_x3_15win: "btdbattles_powers_xp_multiplier_x3_15win.png",
  btdbattles_powers_xp_multiplier_x3_50win: "btdbattles_powers_xp_multiplier_x3_50win.png",
  btdbattles_powers_xp_multiplier_x3_5win: "btdbattles_powers_xp_multiplier_x3_5win.png",
  btdbattles_smallenergy: "btdbattles_smallenergy.png",
  btdbattles_tastyenergy: "btdbattles_tastyenergy.png",
  arctic: "Arctic.png",
  profileskin_arctic: "Arctic.png",
  barbedwire: "BarbedWire.png",
  profileskin_barbedwire: "BarbedWire.png",
  darts: "Darts.png",
  projectileskin_darts: "Darts.png",
  fire: "Fire.png",
  profileskin_fire: "Fire.png",
  goldendarts: "GoldenDarts.png",
  projectileskin_goldendarts: "GoldenDarts.png",
  pineapples: "Pineapples.png",
  projectileskin_pineapples: "Pineapples.png",
  radioactive: "Radioactive.png",
  profileskin_radioactive: "Radioactive.png",
  silverdarts: "SilverDarts.png",
  projectileskin_silverdarts: "SilverDarts.png",
  skulls: "Skulls.png",
  profileskin_skulls: "Skulls.png",
  snakeskin: "Snakeskin.png",
  profileskin_snakeskin: "Snakeskin.png",
  spikeballs: "SpikeBalls.png",
  projectileskin_spikeballs: "SpikeBalls.png",
  tigerfur: "TigerFur.png",
  profileskin_tigerfur: "TigerFur.png",
};

function resolvePurchasedItemFile(key) {
  const clean = extractCleanPurchaseItem(key)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (!clean) return null;

  if (ITEM_IMAGE_MAP[clean]) {
    return ITEM_IMAGE_MAP[clean];
  }

  const strippedSkin = clean.replace(/^(profileskin_|projectileskin_|towerskin_)/i, "");
  if (ITEM_IMAGE_MAP[strippedSkin]) {
    return ITEM_IMAGE_MAP[strippedSkin];
  }

  const stripped = clean.replace(/^btdbattles_/i, "");
  if (ITEM_IMAGE_MAP[stripped]) {
    return ITEM_IMAGE_MAP[stripped];
  }

  const prefixed = `btdbattles_${clean}`;
  if (ITEM_IMAGE_MAP[prefixed]) {
    return ITEM_IMAGE_MAP[prefixed];
  }

  return null;
}

/**
 * 14. PURCHASED ITEMS (Premiums & Completed Purchases)
 */
function renderPurchasedItems(save, rawSaveData) {
  const container = document.getElementById("purchasedItemsContainer");
  if (!container) return;

  const premiums = findPremiumsInSave(save, rawSaveData);
  const completedPurchases = findCompletedPurchasesInSave(save, rawSaveData);

  const readableFn = window.readableName || ((i) => i);
  const itemMap = new Map();

  function addItem(rawItem, isFromPremiums) {
    const rawStr = extractCleanPurchaseItem(rawItem);
    if (!rawStr) return;

    // Ignore Cobra Tower in premiums / purchases
    if (/cobra/i.test(rawStr)) {
      return;
    }

    const imageFile = resolvePurchasedItemFile(rawStr);
    // If no image found for purchased item, do not add it
    if (!imageFile) {
      return;
    }

    const cleanKey = rawStr.toLowerCase().replace(/[^a-z0-9_]/g, "");

    // Deduplicate chatpack2 and clubroom entry
    let canonicalKey = cleanKey;
    if (cleanKey === "btdbattles_chatpack_pack2" || cleanKey === "chatpack_pack2") {
      canonicalKey = "chatpack_pack2";
    } else if (cleanKey === "clubroomentry" || cleanKey === "btdbattles_clubroom") {
      canonicalKey = "btdbattles_clubroom";
    }

    if (itemMap.has(canonicalKey)) {
      const existing = itemMap.get(canonicalKey);
      if (!isFromPremiums && canonicalKey !== "chatpack_pack2" && canonicalKey !== "btdbattles_clubroom") {
        existing.count += 1;
      }
    } else {
      itemMap.set(canonicalKey, {
        id: rawStr,
        displayName: readableFn(rawStr),
        imageSrc: `images/items/${encodeURIComponent(imageFile)}`,
        count: 1,
      });
    }
  }

  // Process Premiums
  for (const item of premiums) {
    addItem(item, true);
  }

  // Process Completed Purchases (accumulates count for multiple purchases)
  for (const item of completedPurchases) {
    addItem(item, false);
  }

  const itemsList = Array.from(itemMap.values());

  if (!itemsList.length) {
    container.innerHTML = `<p class="empty-state">No purchased items found.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="purchased-items-grid">
      ${itemsList
        .map(
          (item) => `
        <div class="purchased-item-card">
          <div class="purchased-item-image-wrap">
            <img class="purchased-item-img" src="${item.imageSrc}" alt="${escapeHtml(item.displayName)}" loading="lazy" />
            ${item.count > 1 ? `<span class="purchased-item-count">x${item.count}</span>` : ""}
          </div>
          <span class="purchased-item-name">${escapeHtml(item.displayName)}</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

/**
 * Generic Table Renderer Helper
 */
function renderTableRowsId(targetId, rows) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <th>${escapeHtml(row.label)}</th>
        <td>${escapeHtml(row.value)}</td>
      </tr>
    `,
    )
    .join("");
}

/**
 * Helper to generate initials for avatars
 */
function createAvatarInitials(name) {
  const value = String(name || "").trim();
  if (!value) return "??";
  return value
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
