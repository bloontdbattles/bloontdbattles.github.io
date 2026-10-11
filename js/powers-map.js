/**
 * js/powers-map.js - Powers decoding (AES-CTR) + tree visualizer
 * Needs: images/extra/powers_icons.png + images/extra/powers_icons.xml
 * Needs the .powers-* CSS (see powers-map.css).
 */
(function () {
  "use strict";

  const KEY_HEX = "2cb1306b9681ff6aec642e14810c2210";

  const NAMES = {
    10: "Red Hot Spikes", 11: "Better Bundles", 12: "Even Better Bundles", 13: "Better Bundles", 14: "Spike Storm",
    15: "Monkey Glue", 16: "Lots of Glue", 17: "Monkey Acid", 18: "Glue Storm",
    19: "Exploding Pineapple", 20: "Lightning Bolt", 21: "Juggerlanche", 22: "Shield",
    24: "Bloon Boost", 25: "Crowded Bloons", 26: "Jam Packed", 27: "Upgrade Bloons", 28: "Camo Regrow Efficiency",
    29: "Improved Bloon Boost", 30: "One Shot", 31: "Long Boost", 32: "Super Bloon Boost",
    33: "MOAB Boost", 34: "Beefy MOAB", 35: "Turbo MOABs", 36: "Empowered MOABs",
    38: "Tower Boost", 39: "Range Boost", 40: "Camo Detect", 41: "Pop Boost", 42: "Damage Boost",
    43: "Improved Tower Boost", 44: "Long Tower Boost", 45: "Intense Tower Boost", 46: "Empowered Towers",
    47: "Big Bloon Beatdown", 48: "Big Bloon Buster", 49: "Big Bloon Slow", 50: "Bloon Snipe",
    51: "Slow", 52: "Long Slow", 53: "Extra Slow", 54: "Tower Blindness", 55: "Cripple",
    56: "Sell Freeze", 57: "Eco Nerf", 58: "Eco Choke", 59: "Price Gouge",
    60: "Deactivated Abilities", 61: "Knock Out", 62: "Team Tower Stun", 63: "Power Lock",
    64: "Eco Boost", 65: "Salted Wounds", 66: "Cash Injection", 67: "Rubber to Gold", 68: "Budget Bloons",
    69: "Copy Eco", 70: "Improved Eco Boost", 71: "Eco Doubler", 72: "Super Eco Boost",
    73: "Better Soil", 74: "Fertile Soil", 75: "Genetically Enhanced Crops", 76: "Dual Eco Boost"
  };

  const ICON_OVERRIDE = {
    13: "budget_bundles",
    44: "long_tower_boost"
  };

  // Icon name = power name as snake_case (matches icon_<name> in the XML)
  const slug = (id) =>
    ICON_OVERRIDE[id] || (NAMES[id] ? NAMES[id].toLowerCase().replace(/[^a-z]+/g, "_") : "unknown");

  const CATS = [
    { key: "track", name: "Track", full: "TRACK", sel: "track_power_selected", un: "track_power_unlocks", xp: "track_power_xp", root: 10, rows: [[11, 12, 13, 14], [15, 16, 17, 18], [19, 20, 21, 22]] },
    { key: "bloon", name: "Bloon", full: "BLOON", sel: "bloon_power_selected", un: "bloon_power_unlocks", xp: "bloon_power_xp", root: 24, rows: [[25, 26, 27, 28], [29, 30, 31, 32], [33, 34, 35, 36]] },
    { key: "tower", name: "Tower", full: "TOWER", sel: "tower_power_selected", un: "tower_power_unlocks", xp: "tower_power_xp", root: 38, rows: [[39, 40, 41, 42], [43, 44, 45, 46], [47, 48, 49, 50]] },
    { key: "sabotage", name: "Sabotage", full: "SABOTAGE", sel: "sabotage_power_selected", un: "sabotage_power_unlocks", xp: "sabotage_power_xp", root: 51, rows: [[52, 53, 54, 55], [56, 57, 58, 59], [60, 61, 62, 63]] },
    { key: "economy", name: "Eco", full: "ECONOMY", sel: "economy_power_selected", un: "economy_power_unlocks", xp: "economy_power_xp", root: 64, rows: [[65, 66, 67, 68], [69, 70, 71, 72], [73, 74, 75, 76]] }
  ];

  const SPRITE_SHEET_URL = "images/extra/powers_icons.png";
  const XML_DESCRIPTOR_URL = "images/extra/powers_icons.xml";
  const TW = 948, TH = 584;
  let CELLS_CACHE = null;

  const DEFAULT_CELLS = {
    "icon_beefy_moab": [603, 97, 60, 39, 0, 10, 65, 65],
    "icon_beefy_moab_greyed": [667, 52, 60, 39, 0, 10, 65, 65],
    "icon_better_bundles": [444, 200, 65, 51, 0, 8, 65, 65],
    "icon_better_bundles_greyed": [1, 235, 65, 51, 0, 8, 65, 65],
    "icon_better_soil": [1, 448, 63, 51, 1, 14, 65, 65],
    "icon_better_soil_greyed": [69, 408, 63, 51, 1, 14, 65, 65],
    "icon_big_bloon_beatdown": [204, 338, 63, 49, 0, 8, 65, 65],
    "icon_big_bloon_beatdown_greyed": [338, 206, 63, 49, 0, 8, 65, 65],
    "icon_big_bloon_buster": [376, 141, 65, 62, 0, 2, 65, 65],
    "icon_big_bloon_buster_greyed": [444, 135, 65, 62, 0, 2, 65, 65],
    "icon_big_bloon_slow": [812, 1, 57, 53, 2, 9, 65, 65],
    "icon_big_bloon_slow_greyed": [638, 147, 57, 53, 2, 9, 65, 65],
    "icon_bloon_boost": [495, 1, 61, 51, 4, 9, 65, 65],
    "icon_bloon_boost_greyed": [475, 71, 61, 51, 4, 9, 65, 65],
    "icon_bloon_snipe": [237, 141, 67, 67, 0, 0, 67, 67],
    "icon_bloon_snipe_greyed": [425, 1, 67, 67, 0, 0, 67, 67],
    "icon_budget_bloons": [336, 490, 44, 54, 9, 8, 65, 65],
    "icon_budget_bloons_greyed": [383, 490, 44, 54, 9, 8, 65, 65],
    "icon_budget_bundles": [1, 289, 65, 51, 0, 8, 65, 65],
    "icon_budget_bundles_greyed": [69, 235, 65, 51, 0, 8, 65, 65],
    "icon_camo_detect": [430, 508, 43, 55, 10, 6, 65, 65],
    "icon_camo_detect_greyed": [476, 508, 43, 55, 10, 6, 65, 65],
    "icon_camo_regrow_efficiency": [512, 167, 60, 44, 3, 14, 65, 65],
    "icon_camo_regrow_efficiency_greyed": [687, 1, 60, 44, 3, 14, 65, 65],
    "icon_cash_injection": [794, 465, 39, 56, 9, 7, 65, 65],
    "icon_cash_injection_greyed": [786, 524, 39, 56, 9, 7, 65, 65],
    "icon_copy_eco": [463, 462, 48, 43, 7, 13, 65, 65],
    "icon_copy_eco_greyed": [743, 465, 48, 43, 7, 13, 65, 65],
    "icon_cripple": [146, 513, 45, 37, 11, 16, 65, 65],
    "icon_cripple_greyed": [194, 513, 45, 37, 11, 16, 65, 65],
    "icon_crowded_bloons": [667, 94, 59, 50, 2, 9, 65, 65],
    "icon_crowded_bloons_greyed": [468, 294, 59, 50, 2, 9, 65, 65],
    "icon_damage_boost": [137, 270, 64, 63, 0, 3, 66, 66],
    "icon_damage_boost_greyed": [69, 342, 64, 63, 0, 3, 66, 66],
    "icon_deactivated_abilities": [205, 218, 64, 63, 0, 2, 65, 65],
    "icon_deactivated_abilities_greyed": [137, 336, 64, 63, 0, 2, 65, 65],
    "icon_dual_eco_boost": [870, 163, 50, 57, 9, 6, 65, 65],
    "icon_dual_eco_boost_greyed": [814, 232, 50, 57, 9, 6, 65, 65],
    "icon_eco_boost": [909, 342, 30, 52, 17, 8, 65, 65],
    "icon_eco_boost_greyed": [912, 508, 30, 52, 17, 8, 65, 65],
    "icon_eco_choke": [870, 110, 51, 50, 7, 8, 65, 65],
    "icon_eco_choke_greyed": [814, 179, 51, 50, 7, 8, 65, 65],
    "icon_eco_doubler": [403, 312, 61, 59, 2, 4, 65, 65],
    "icon_eco_doubler_greyed": [335, 428, 61, 59, 2, 4, 65, 65],
    "icon_eco_nerf": [872, 1, 55, 48, 7, 12, 65, 65],
    "icon_eco_nerf_greyed": [527, 349, 55, 48, 7, 12, 65, 65],
    "icon_empowered_moabs": [67, 462, 61, 48, 0, 10, 65, 65],
    "icon_empowered_moabs_greyed": [623, 1, 61, 48, 0, 10, 65, 65],
    "icon_empowered_towers": [307, 141, 66, 61, 0, 5, 66, 66],
    "icon_empowered_towers_greyed": [406, 71, 66, 61, 0, 5, 66, 66],
    "icon_even_better_bundles": [1, 343, 65, 50, 0, 9, 65, 65],
    "icon_even_better_bundles_greyed": [69, 289, 65, 50, 0, 9, 65, 65],
    "icon_exploding_pineapple": [522, 508, 41, 59, 11, 3, 65, 65],
    "icon_exploding_pineapple_greyed": [566, 487, 41, 59, 11, 3, 65, 65],
    "icon_extra_slow": [795, 408, 48, 53, 8, 8, 65, 65],
    "icon_extra_slow_greyed": [858, 349, 48, 53, 8, 8, 65, 65],
    "icon_fertile_soil": [204, 284, 63, 51, 1, 14, 65, 65],
    "icon_fertile_soil_greyed": [272, 211, 63, 51, 1, 14, 65, 65],
    "icon_generic_power": [895, 458, 46, 47, 0, 0, 46, 47],
    "icon_generic_power_greyed": [1, 502, 46, 47, 0, 0, 46, 47],
    "icon_generic_tower": [95, 141, 68, 74, 0, 0, 68, 74],
    "icon_generic_tower_greyed": [166, 141, 68, 74, 0, 0, 68, 74],
    "icon_genetically_enhanced_crops": [590, 261, 54, 53, 7, 7, 65, 65],
    "icon_genetically_enhanced_crops_greyed": [698, 199, 54, 53, 7, 7, 65, 65],
    "icon_glue_storm": [270, 318, 62, 60, 4, 0, 66, 66],
    "icon_glue_storm_greyed": [204, 390, 62, 60, 4, 0, 66, 66],
    "icon_improved_bloon_boost": [272, 265, 63, 50, 2, 11, 65, 65],
    "icon_improved_bloon_boost_greyed": [136, 402, 63, 50, 2, 11, 65, 65],
    "icon_improved_eco_boost": [791, 63, 55, 57, 3, 3, 65, 65],
    "icon_improved_eco_boost_greyed": [464, 402, 55, 57, 3, 3, 65, 65],
    "icon_improved_tower_boost": [610, 487, 41, 59, 11, 4, 65, 65],
    "icon_improved_tower_boost_greyed": [654, 491, 41, 59, 11, 4, 65, 65],
    "icon_intense_tower_boost": [704, 255, 51, 61, 6, 5, 65, 66],
    "icon_intense_tower_boost_greyed": [585, 370, 51, 61, 6, 5, 65, 66],
    "icon_jam_packed": [400, 374, 61, 55, 1, 7, 65, 65],
    "icon_jam_packed_greyed": [399, 432, 61, 55, 1, 7, 65, 65],
    "icon_juggerlanche": [576, 139, 59, 59, 6, 0, 65, 66],
    "icon_juggerlanche_greyed": [750, 1, 59, 59, 6, 0, 65, 66],
    "icon_knock_out": [758, 243, 51, 50, 7, 8, 65, 65],
    "icon_knock_out_greyed": [639, 370, 51, 50, 7, 8, 65, 65],
    "icon_lightning_bolt": [522, 402, 53, 64, 6, 0, 65, 65],
    "icon_lightning_bolt_greyed": [758, 176, 53, 64, 6, 0, 65, 65],
    "icon_long_boost": [467, 347, 57, 52, 4, 8, 65, 65],
    "icon_long_boost_greyed": [530, 294, 57, 52, 4, 8, 65, 65],
    "icon_long_slow": [812, 292, 48, 54, 8, 7, 65, 65],
    "icon_long_slow_greyed": [756, 351, 48, 54, 8, 7, 65, 65],
    "icon_long_tower_boost": [698, 491, 41, 59, 11, 4, 65, 65],
    "icon_long_tower_boost_greyed": [742, 511, 41, 59, 11, 4, 65, 65],
    "icon_lots_of_glue": [815, 123, 52, 53, 4, 6, 65, 65],
    "icon_lots_of_glue_greyed": [647, 308, 52, 53, 4, 6, 65, 65],
    "icon_moab_boost": [512, 214, 60, 37, 0, 15, 65, 65],
    "icon_moab_boost_greyed": [468, 254, 60, 37, 0, 15, 65, 65],
    "icon_monkey_acid": [758, 123, 54, 50, 5, 8, 65, 65],
    "icon_monkey_acid_greyed": [590, 317, 54, 50, 5, 8, 65, 65],
    "icon_monkey_glue": [647, 255, 54, 50, 5, 8, 65, 65],
    "icon_monkey_glue_greyed": [849, 57, 54, 50, 5, 8, 65, 65],
    "icon_one_shot": [335, 375, 62, 50, 3, 12, 65, 65],
    "icon_one_shot_greyed": [269, 444, 62, 50, 3, 12, 65, 65],
    "icon_pop_boost": [575, 201, 58, 57, 5, 3, 65, 65],
    "icon_pop_boost_greyed": [730, 63, 58, 57, 5, 3, 65, 65],
    "icon_power_lock": [578, 434, 51, 50, 7, 8, 65, 65],
    "icon_power_lock_greyed": [702, 319, 51, 50, 7, 8, 65, 65],
    "icon_price_gouge": [50, 513, 45, 58, 10, 3, 65, 65],
    "icon_price_gouge_greyed": [98, 513, 45, 58, 10, 3, 65, 65],
    "icon_range_boost": [135, 455, 62, 55, 1, 11, 65, 66],
    "icon_range_boost_greyed": [200, 455, 62, 55, 1, 11, 65, 66],
    "icon_red_hot_spikes": [137, 218, 65, 49, 0, 8, 65, 65],
    "icon_red_hot_spikes_greyed": [1, 396, 65, 49, 0, 8, 65, 65],
    "icon_rubber_to_gold": [242, 513, 44, 56, 9, 6, 65, 65],
    "icon_rubber_to_gold_greyed": [289, 497, 44, 56, 9, 6, 65, 65],
    "icon_salted_wounds": [836, 500, 35, 54, 15, 5, 65, 65],
    "icon_salted_wounds_greyed": [874, 508, 35, 54, 15, 5, 65, 65],
    "icon_sell_freeze": [693, 372, 48, 59, 8, 4, 65, 65],
    "icon_sell_freeze_greyed": [868, 223, 48, 59, 8, 4, 65, 65],
    "icon_shield": [846, 447, 46, 50, 9, 12, 65, 65],
    "icon_shield_greyed": [897, 405, 46, 50, 9, 12, 65, 65],
    "icon_slow": [692, 434, 48, 54, 8, 8, 65, 65],
    "icon_slow_greyed": [867, 285, 48, 54, 8, 8, 65, 65],
    "icon_spike_storm": [338, 258, 62, 60, 4, 0, 66, 65],
    "icon_spike_storm_greyed": [270, 381, 62, 60, 4, 0, 66, 65],
    "icon_super_bloon_boost": [636, 203, 57, 49, 4, 12, 65, 65],
    "icon_super_bloon_boost_greyed": [698, 147, 57, 49, 4, 12, 65, 65],
    "icon_super_eco_boost": [335, 321, 62, 51, 2, 9, 65, 65],
    "icon_super_eco_boost_greyed": [403, 258, 62, 51, 2, 9, 65, 65],
    "icon_team_tower_stun": [807, 351, 48, 54, 8, 3, 65, 65],
    "icon_team_tower_stun_greyed": [744, 408, 48, 54, 8, 3, 65, 65],
    "icon_tower_blindness": [514, 469, 48, 36, 8, 16, 65, 65],
    "icon_tower_blindness_greyed": [846, 408, 48, 36, 8, 16, 65, 65],
    "icon_tower_boost": [559, 1, 61, 51, 2, 8, 65, 65],
    "icon_tower_boost_greyed": [539, 55, 61, 51, 2, 8, 65, 65],
    "icon_turbo_moabs": [512, 125, 61, 39, 0, 10, 65, 65],
    "icon_turbo_moabs_greyed": [603, 55, 61, 39, 0, 10, 65, 65],
    "icon_upgrade_bloons": [758, 296, 50, 52, 9, 8, 65, 65],
    "icon_upgrade_bloons_greyed": [639, 423, 50, 52, 9, 8, 65, 65]
  };

  async function loadCells() {
    if (CELLS_CACHE) return CELLS_CACHE;
    try {
      const res = await fetch(XML_DESCRIPTOR_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const xml = new DOMParser().parseFromString(await res.text(), "text/xml");
      const cells = Object.assign({}, DEFAULT_CELLS);
      for (const n of xml.getElementsByTagName("Cell")) {
        const name = n.getAttribute("name");
        if (!name) continue;
        const g = (a, d = 0) => {
          const v = n.getAttribute(a);
          return (v !== null && v !== "") ? Number(v) : d;
        };
        cells[name] = [g("x", 0), g("y", 0), g("w", 0), g("h", 0), g("ax", 0), g("ay", 0), g("aw", 65), g("ah", 65)];
      }
      CELLS_CACHE = cells;
      return cells;
    } catch (err) {
      CELLS_CACHE = DEFAULT_CELLS;
      return CELLS_CACHE;
    }
  }

  // ---------- AES-CTR decryption (same method as test.html) ----------
  const hexToBytes = (hex) => new Uint8Array(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));

  function decodeBase64(value) {
    const c = value.replace(/\s/g, "");
    if (!c || !/^[A-Za-z0-9+/]*={0,2}$/.test(c) || c.length % 4 !== 0) {
      throw new Error("The internal field is not valid Base64.");
    }
    return Uint8Array.from(atob(c), (ch) => ch.charCodeAt(0));
  }

  async function decryptPowerTrees(pt) {
    if (!window.crypto || !crypto.subtle) throw new Error("Web Crypto unavailable (page must be HTTPS or localhost).");
    if (!pt || !Array.isArray(pt.data)) throw new Error("power_trees.data must be an array.");
    if (typeof pt.internal !== "string") throw new Error("Missing power_trees.internal string.");
    if (pt.data.length !== 17 || pt.data.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) {
      throw new Error("Expected 17 data bytes, each an integer from 0 to 255.");
    }
    const counter = new Uint8Array(pt.data.slice(1)); // skip first byte, use remaining 16
    const key = await crypto.subtle.importKey("raw", hexToBytes(KEY_HEX), { name: "AES-CTR" }, false, ["decrypt"]);
    const buf = await crypto.subtle.decrypt({ name: "AES-CTR", counter, length: 128 }, key, decodeBase64(pt.internal));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buf));
  }

  const looksDecoded = (o) =>
    o && typeof o === "object" && CATS.some((c) => o[c.un] !== undefined || o[c.sel] !== undefined);

  /**
   * Accepts: full save, { power_trees: {...} }, the encrypted power_trees object, or already-decoded JSON.
   * Returns a Promise of the decoded object (or null).
   */
  async function decodePowerTrees(input) {
    let obj = input;
    if (typeof obj === "string") {
      try { obj = JSON.parse(obj.trim()); } catch { return null; }
    }
    if (!obj || typeof obj !== "object") return null;

    const pt = obj.power_trees || obj.PowerTrees || obj.powerTrees || obj;
    if (looksDecoded(pt)) return pt;
    if (pt && typeof pt.internal === "string") {
      try { return await decryptPowerTrees(pt); }
      catch (e) { console.warn("Powers decryption failed:", e); return null; }
    }
    return null;
  }

  const fmt = (n) => (n ?? 0).toLocaleString("en-US");

  function createIconElement(id, grey, k, cells) {
    const iconName = "icon_" + slug(id) + (grey ? "_greyed" : "");
    const c = cells[iconName] || DEFAULT_CELLS[iconName];
    const box = document.createElement("div");
    box.className = "powers-ico";
    if (!c) { box.textContent = "?"; return box; }
    const [x, y, w, h, ax, ay, aw, ah] = c;
    box.style.width = (aw || 65) * k + "px";
    box.style.height = (ah || 65) * k + "px";
    const i = document.createElement("i");
    Object.assign(i.style, {
      left: ax * k + "px", top: ay * k + "px", width: w * k + "px", height: h * k + "px",
      backgroundImage: `url('${SPRITE_SHEET_URL}')`,
      backgroundSize: `${TW * k}px ${TH * k}px`,
      backgroundPosition: `${-x * k}px ${-y * k}px`
    });
    box.appendChild(i);
    return box;
  }

  async function renderPowersTree(containerEl, raw) {
    if (!containerEl) return;
    const data = await decodePowerTrees(raw);
    if (!data) {
      containerEl.innerHTML = `<p class="empty-msg" style="text-align:center;padding:1.5rem;color:var(--muted);">No Powers data found for this player profile.</p>`;
      return;
    }
    const cells = await loadCells();
    let cur = 0;

    const unlockedSet = (c) => new Set([...(data[c.un] || []), ...(data[c.sel] != null ? [data[c.sel]] : [])]);
    const stateOf = (c, id) => (id === data[c.sel] ? "sel" : unlockedSet(c).has(id) ? "un" : "locked");

    function nodeBtn(c, id) {
      const s = stateOf(c, id);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "powers-node " + (s === "locked" ? "locked" : s);
      b.title = NAMES[id] || "Power " + id;
      b.appendChild(createIconElement(id, s === "locked", 0.85, cells));
      if (s === "sel") {
        const badge = document.createElement("div");
        badge.className = "powers-badge";
        badge.textContent = "★";
        b.appendChild(badge);
      }
      return b;
    }

    function draw() {
      const c = CATS[cur];
      containerEl.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "powers-wrap";

      const top = document.createElement("div");
      top.className = "powers-top";
      top.innerHTML = `<h3>${c.full} POWERS</h3>`;

      const xp = document.createElement("div");
      xp.className = "powers-xp";
      xp.innerHTML = `<span class="xp-cat">${c.full} XP: ${fmt(data[c.xp])}</span><span class="xp-univ">UNIVERSAL XP: ${fmt(data.universal_xp)}</span>`;

      const tabs = document.createElement("div");
      tabs.className = "powers-tabs";
      CATS.forEach((k, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "powers-tab" + (i === cur ? " on" : "");
        b.appendChild(createIconElement(k.root, false, 0.4, cells));
        b.append(" " + k.name);
        b.onclick = () => { cur = i; draw(); };
        tabs.appendChild(b);
      });

      const scroll = document.createElement("div");
      scroll.className = "powers-tree-scroll";
      const tree = document.createElement("div");
      tree.className = "powers-tree";
      const u = unlockedSet(c);

      c.rows.forEach((ids, ri) => {
        const row = document.createElement("div");
        row.className = "powers-row";
        const slot = document.createElement("div");
        slot.className = "powers-slot";
        if (ri === 1) slot.appendChild(nodeBtn(c, c.root));
        const trunk = document.createElement("div");
        trunk.className = "powers-trunk" + (ri === 0 ? " first" : ri === 2 ? " last" : "");
        row.append(slot, trunk);
        let prev = c.root;
        ids.forEach((id, i) => {
          const arr = document.createElement("div");
          arr.className = "powers-arr" + (u.has(id) && (i > 0 ? u.has(prev) : true) ? " on" : "");
          row.append(arr, nodeBtn(c, id));
          prev = id;
        });
        tree.appendChild(row);
      });

      scroll.appendChild(tree);
      wrap.append(top, xp, tabs, scroll);
      containerEl.appendChild(wrap);
    }
    draw();
  }

  window.PowersMap = { decodePowerTrees, decryptPowerTrees, renderPowersTree, loadCells };
})();
