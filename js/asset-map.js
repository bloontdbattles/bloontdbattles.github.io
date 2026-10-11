/**
 * js/asset-map.js - Maps asset IDs to image paths and readable names
 *
 * =========================================================================
 * EXACT IMAGE FILES TO ADD TO YOUR REPOSITORY (under images/ directory):
 * =========================================================================
 * 1. Decals (images/decals/):
 *    - images/decals/{DecalID}.png
 *    Examples: FaceWithTearsOfJoy.png, FaceThinking.png, Fire.png, ThumbsUp.png, etc.
 *
 * 2. Achievements (images/achievements/):
 *    - images/achievements/{AchievementID}.png
 *    Examples: BTDB_Winner.png, BTDB_TheBiggerTheyAre.png, BTDB_BloonSlayer.png, etc.
 *
 * 3. Arenas (images/arenas/):
 *    - images/arenas/{ArenaID}.png
 *    Examples: Assault.png, BFB_Club.png, BFB_Standard.png, Boss_Vortex.png, Ceramic.png, MOAB_Club.png, CardBattle_Yellow.png, etc.
 *
 * 4. Cards (images/cards/):
 *    - images/cards/{CardID}.png
 *    Examples: DartMonkey.png, SuperMonkey.png, TackShooter.png, etc.
 *
 * 5. Skins (images/skins/):
 *    - images/skins/{SkinID}.png
 *    Examples: ProfileSkin_..., TowerSkin_..., ProjectileSkin_...
 *
 * 6. Towers (images/towers/):
 *    - images/towers/{TowerID}.png
 *    Examples: DartMonkey.png, NinjaMonkey.png, SuperMonkey.png, MonkeyFarmer.png, RoboFarmer.png, etc.
 * =========================================================================
 *
 * INTEGRATION & PLACEHOLDER REPLACEMENT:
 * - Call `AssetMap.getImage(type, id)` to retrieve relative image paths.
 * - Image `onerror` events automatically invoke SVG data URI fallback placeholders.
 * - Call `AssetMap.readableName(id)` to get human-formatted strings for IDs.
 */

const AssetMap = (function () {
  // Override mapping for raw IDs to friendly human-readable titles
  const NAME_OVERRIDES = {
    // Achievements
    BTDB_Winner: "First Victory",
    BTDB_TheBiggerTheyAre: "The Bigger They Are",
    BTDB_BloonSlayer: "Bloon Slayer",
    BTDB_MedalCollector: "Medallion Collector",
    BTDB_CardMaster: "Card Battle Master",
    BTDB_ArenaChampion: "Arena Champion",
    BTDB_StreakMaster: "Streak Master",
    BTDB_ClubMember: "Club Member",

    // Arenas
    Assault: "Assault Arena",
    Defense: "Defense Arena",
    BFB_Club: "BFB Colosseum (Club)",
    BFB_Standard: "BFB Colosseum",
    MOAB_Club: "MOAB Pit (Club)",
    MOAB_Standard: "MOAB Pit",
    Ceramic: "Ceramic Crucible",
    Lead: "Lead Dungeon",
    Yellow: "Yellow Stadium",
    White: "White Wasteland",
    CardBattle_Yellow: "Card Battle (Yellow)",
    CardBattle_MOAB: "Card Battle (MOAB)",
    Boss_Vortex: "Vortex (Boss Event)",
    Boss_Bloonarius: "Bloonarius (Boss Event)",
    Boss_Dreadbloon: "Dreadbloon (Boss Event)",
    Boss_Blastapopoulos: "Blastapopoulos (Boss Event)",

    // Farmers & Items
    MonkeyFarmer: "Money Farmer",
    RoboFarmer: "Robo Farmer",
    CandyBananaFarm: "Candy Banana Farm",
    ChatPack_Pack2: "Chat Pack 2",
    btdbattles_chatpack_pack2: "Chat Pack 2",
    ClubRoomEntry: "Club Room Access",
    btdbattles_clubroom: "Club Room Access",
    btdbattles_clubroom_plus: "Club Room Plus",
    btdbattles_clubstarterpack: "Club Starter Pack",
    MedievalDartMonkey: "Medieval Dart Monkey",
    ChristmasDartMonkey: "Christmas Dart Monkey",
    BazookaDartlingGun: "Bazooka Dartling Gun",
    DrMonkeyEngineer: "Dr Monkey Engineer",
    EvilSuperMonkey: "Evil Super Monkey",
    FireworksMortarTower: "Fireworks Mortar Tower",
    HunterSniperMonkey: "Hunter Sniper Monkey",
    MechanicalTackTower: "Mechanical Tack Tower",
    MilitaryBombTower: "Military Bomb Tower",
    NavyMonkeyBuccaneer: "Navy Monkey Buccaneer",
    PowerCell: "Power Cell",
    RemoveAdverts: "Remove Ads",
    SamuraiNinjaMonkey: "Samurai Ninja Monkey",
    SorcererMonkeyApprentice: "Sorcerer Wizard Monkey",
    SteampunkMonkeySub: "Steampunk Monkey Sub",
    TopgunMonkeyAce: "Topgun Monkey Ace",
    TribalBoomerangThrower: "Tribal Boomerang Thrower",
    UFOHeliPilot: "UFO Heli Pilot",
    btdbattles_bagmedallions: "Bag of Medallions",
    btdbattles_chestmedallions: "Chest of Medallions",
    btdbattles_handfulmedallions: "Handful of Medallions",
    btdbattles_mountainmedallions: "Mountain of Medallions",
    btdbattles_pilemedallions: "Pile of Medallions",
    btdbattles_champion_pack: "Champion Pack",
    btdbattles_master_pack: "Master Pack",
    btdbattles_cleanslate: "Clean Slate",
    btdbattles_clanwarchestamplifier: "War Chest Amplifier",
    btdbattles_smallenergy: "Small Energy",
    btdbattles_largeenergy: "Large Energy",
    btdbattles_powerfulenergy: "Powerful Energy",
    btdbattles_tastyenergy: "Tasty Energy",
    btdbattles_powers_xp_multiplier_x3_5win: "3x Powers XP (5 Wins)",
    btdbattles_powers_xp_multiplier_x3_15win: "3x Powers XP (15 Wins)",
    btdbattles_powers_xp_multiplier_x3_50win: "3x Powers XP (50 Wins)",
    btdbattles_powers_xp_multiplier_x10_5win: "10x Powers XP (5 Wins)",
    DecalNaughtyOrNice: "Naughty or Nice Decal",

    // Common Towers
    DartMonkey: "Dart Monkey",
    TackShooter: "Tack Shooter",
    SniperMonkey: "Sniper Monkey",
    BoomerangMonkey: "Boomerang Monkey",
    NinjaMonkey: "Ninja Monkey",
    BombTower: "Bomb Shooter",
    IceMonkey: "Ice Monkey",
    GlueStriker: "Glue Gunner",
    MonkeyBuccaneer: "Monkey Buccaneer",
    MonkeySub: "Monkey Sub",
    MonkeyAce: "Monkey Ace",
    SuperMonkey: "Super Monkey",
    MonkeyApprentice: "Wizard Monkey",
    MonkeyVillage: "Monkey Village",
    BananaFarm: "Banana Farm",
    MortarTower: "Mortar Monkey",
    DartlingGunner: "Dartling Gunner",
    SpikeFactory: "Spike Factory",
    Helicopter: "Heli Pilot",
    EngineerMonkey: "Engineer Monkey",
    Bloonchipper: "Bloonchipper",
    Cobra: "COBRA",
  };

  const FOLDER_MAP = {
    decal: "images/decals",
    achievement: "images/achievements",
    arena: "images/arenas",
    card: "images/cards",
    skin: "images/skins",
    tower: "images/towers",
    farmer: "images/towers",
    item: "images/items",
  };

  /**
   * Helper to escape HTML/SVG strings
   */
  function escapeSvgText(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Generates a clean inline SVG placeholder data URI for missing images
   */
  function createSvgPlaceholder(label) {
    const text = String(label || "?").slice(0, 10);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="12" fill="#2d0a5e" stroke="#6b2fb3" stroke-width="2"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#ddb6e6" font-family="sans-serif" font-size="10" font-weight="bold">${escapeSvgText(text)}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  const KNOWN_ARENA_FILES = {
    "1": "1.png",
    "2": "2.png",
    "3": "3.png",
    "4": "4.png",
    "5": "5.png",
    "6": "6.png",
    assault: "Assault.png",
    bfb: "BFB.png",
    boss_blastapopoulos: "Boss_Blastapopoulos.png",
    boss_bloonarius: "Boss_Bloonarius.png",
    boss_dreadbloon: "Boss_Dreadbloon.png",
    boss_vortex: "Boss_Vortex.png",
    ceramic: "Ceramic.png",
    defense: "Defense.png",
    holiday_easter_1: "Holiday_Easter_1.png",
    holiday_easter_2: "Holiday_Easter_2.png",
    holiday_xmas_1: "Holiday_Xmas_1.png",
    holiday_xmas_2: "Holiday_Xmas_2.png",
    lead: "Lead.png",
    moab: "MOAB.png",
    nk20: "NK20.png",
    rainbow: "Rainbow.png",
    tournament: "Tournament.png",
    white: "White.png",
    white_holiday_winterwonderland: "White_Holiday_WinterWonderland.png",
    yellow: "Yellow.png",
    yellow_holiday_northpole: "Yellow_Holiday_NorthPole.png",
    zomg: "ZOMG.png",
  };

  /**
   * Returns image path for specified asset type and ID
   */
  function getImage(type, id) {
    let cleanId = String(id || "").trim();
    if (!cleanId) {
      return createSvgPlaceholder("-");
    }

    if (type === "decal") {
      cleanId = cleanId.replace(/^(Decal_|BloonDecal_|Decals\/)/i, "").toLowerCase();
    }

    if (type === "arena") {
      let base = cleanId
        .replace(/^(CardBattle|Card)\d*[_]?/i, "")
        .replace(/[_]?(CardBattle|Card)\d*[_]?/i, "")
        .replace(/[_]?(Club)\d*$/i, "")
        .replace(/[_]?(Club)\d*[_]?/i, "")
        .replace(/[_]?Standard\d*$/i, "")
        .replace(/[_]?Standard\d*[_]?/i, "")
        .trim();
      const baseFile = KNOWN_ARENA_FILES[base.toLowerCase()] || (base + ".png");
      return `images/arenas/${encodeURIComponent(baseFile)}`;
    }

    const folder = FOLDER_MAP[type] || `images/${type}s`;
    return `${folder}/${encodeURIComponent(cleanId)}.png`;
  }

  /**
   * Converts raw internal ID into a formatted readable title
   */
  function readableName(id) {
    const raw = String(id || "").trim();
    if (!raw) return "Unknown";

    if (NAME_OVERRIDES[raw]) {
      return NAME_OVERRIDES[raw];
    }

    if (/^\d+$/.test(raw)) {
      return `Card #${raw}`;
    }

    // Strip common prefixes
    let formatted = raw.replace(/^(BTDB_|ProfileSkin_|TowerSkin_|ProjectileSkin_|Decal_)/i, "");

    // Replace underscores with spaces
    formatted = formatted.replace(/_/g, " ");

    // Insert spaces between camelCase words
    formatted = formatted.replace(/([a-z])([A-Z])/g, "$1 $2");

    // Title Case
    return formatted
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return {
    getImage,
    readableName,
    createSvgPlaceholder,
    NAME_OVERRIDES,
  };
})();

/**
 * BasicAvatars - Sprite renderer using images/extra/basic_avatars.png & images/extra/basic_avatars.xml
 */
const BasicAvatars = (function () {
  const CELLS = {
    "achievement_bg": [319, 1, 293, 179],
    "BananaFarm_avatar": [917, 678, 137, 166],
    "Bloonchipper_avatar": [1403, 452, 130, 140],
    "BombTower_avatar": [959, 360, 156, 143],
    "BoomerangThrower_avatar": [1057, 656, 132, 155],
    "boosted_icon": [1, 573, 207, 160],
    "CobraMonkey_avatar": [1482, 153, 78, 120],
    "DartlingGun_avatar": [1332, 1, 152, 126],
    "DartMonkey_avatar": [877, 1, 118, 115],
    "getting_defensive_icon": [421, 489, 183, 169],
    "glint": [877, 119, 41, 41],
    "GlueGunner_avatar": [1264, 446, 136, 153],
    "gold_projectiles_store": [1, 1, 315, 192],
    "got_em_all_icon": [615, 170, 217, 166],
    "heavy_assault_icon": [1, 736, 195, 176],
    "HeliPilot_avatar": [421, 363, 186, 123],
    "IceTower_avatar": [1325, 602, 115, 162],
    "jack_of_all_towers_icon": [215, 391, 203, 149],
    "locked_icon": [1192, 626, 130, 154],
    "MonkeyAce_avatar": [1009, 173, 157, 155],
    "MonkeyApprentice_avatar": [1487, 1, 80, 149],
    "MonkeyBuccaneer_avatar": [1118, 331, 143, 141],
    "MonkeyEngineer_avatar": [1325, 767, 100, 148],
    "MonkeyFarmer_avatar": [835, 170, 171, 187],
    "MonkeySub_avatar": [199, 736, 177, 116],
    "MonkeyVillage_avatar": [1332, 130, 147, 155],
    "MortarTower_avatar": [788, 360, 168, 160],
    "NinjaMonkey_avatar": [1171, 168, 148, 147],
    "open_season_icon": [1, 391, 211, 179],
    "penultimate_icon": [215, 543, 193, 181],
    "popping_streak_icon": [411, 661, 170, 163],
    "RoboFarmer_avatar": [584, 681, 165, 197],
    "silver_projectiles_store": [1, 196, 315, 192],
    "SniperMonkey_avatar": [959, 506, 146, 147],
    "spawner_icon": [615, 1, 259, 166],
    "SpikeFactory_avatar": [1264, 318, 138, 125],
    "SuperMonkey_avatar": [778, 523, 164, 152],
    "TackTower_avatar": [1118, 475, 142, 148],
    "tattoo_you_icon": [752, 681, 162, 169],
    "the_bigger_they_are_icon": [610, 339, 175, 166],
    "top_tier_icon": [1171, 1, 158, 164],
    "towers_tower_shadow": [199, 855, 143, 48],
    "uber_popper_icon": [319, 183, 286, 177],
    "unspoppable_icon": [607, 508, 168, 170],
    "war_paint_icon": [1405, 288, 135, 161],
    "what_did_you_expect_icon": [1009, 1, 159, 169],
    "white_square": [319, 363, 2, 2],
    "winner_icon": [1443, 595, 111, 169]
  };

  const ACHIEVEMENT_MAP = {
    BTDB_Winner: "winner_icon",
    Winner: "winner_icon",
    BTDB_TheBiggerTheyAre: "the_bigger_they_are_icon",
    TheBiggerTheyAre: "the_bigger_they_are_icon",
    BTDB_BloonSlayer: "popping_streak_icon",
    BloonSlayer: "popping_streak_icon",
    BTDB_MedalCollector: "spawner_icon",
    MedalCollector: "spawner_icon",
    BTDB_CardMaster: "jack_of_all_towers_icon",
    CardMaster: "jack_of_all_towers_icon",
    BTDB_ArenaChampion: "top_tier_icon",
    ArenaChampion: "top_tier_icon",
    BTDB_StreakMaster: "unspoppable_icon",
    StreakMaster: "unspoppable_icon",
    BTDB_ClubMember: "got_em_all_icon",
    ClubMember: "got_em_all_icon",
    GettingDefensive: "getting_defensive_icon",
    HeavyAssault: "heavy_assault_icon",
    Boosted: "boosted_icon",
    OpenSeason: "open_season_icon",
    WarPaint: "war_paint_icon",
    TattooYou: "tattoo_you_icon"
  };

  function renderAvatarIcon(cellName, targetWidth = 54, targetHeight = 54) {
    const c = CELLS[cellName] || CELLS[cellName + "_avatar"] || CELLS[cellName + "_icon"] || CELLS[ACHIEVEMENT_MAP[cellName]];
    const box = document.createElement("div");
    box.className = "basic-avatar-ico";
    box.style.width = targetWidth + "px";
    box.style.height = targetHeight + "px";
    box.style.position = "relative";
    box.style.overflow = "hidden";
    box.style.borderRadius = "8px";
    box.style.flexShrink = "0";

    if (!c) {
      box.style.background = "rgba(255,255,255,0.05)";
      return box;
    }

    const [x, y, w, h] = c;
    const scale = Math.min(targetWidth / w, targetHeight / h);

    const i = document.createElement("i");
    Object.assign(i.style, {
      position: "absolute",
      display: "block",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: (w * scale) + "px",
      height: (h * scale) + "px",
      backgroundImage: "url('images/extra/basic_avatars.png')",
      backgroundRepeat: "no-repeat",
      backgroundSize: (1572 * scale) + "px " + (916 * scale) + "px",
      backgroundPosition: (-x * scale) + "px " + (-y * scale) + "px"
    });

    box.appendChild(i);
    return box;
  }

  return {
    CELLS,
    ACHIEVEMENT_MAP,
    renderAvatarIcon
  };
})();

// Attach to window object for browser access
if (typeof window !== "undefined") {
  window.AssetMap = AssetMap;
  window.getImage = AssetMap.getImage;
  window.readableName = AssetMap.readableName;
  window.BasicAvatars = BasicAvatars;
}

