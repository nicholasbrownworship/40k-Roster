// === HEADER LOADER ===
function loadHeader() {
  const headerContainer = document.getElementById("site-header");
  if (!headerContainer) return;

  fetch("header.html")
    .then(res => res.text())
    .then(html => {
      headerContainer.innerHTML = html;
    })
    .catch(err => {
      console.error("Failed to load header.html", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  initCrusadeApp();
});

// === CRUSADE DATA MODEL (Crusade Mode Required Fields) ===
// This is a small starter array so you can see everything working.
// You can replace this later with loading from JSON or localStorage.
const crusadeUnits = [
  {
    id: "unit_001",
    unitName: "Intercessor Squad",
    faction: "Space Marines",
    subfactionOrDetachment: "Ultramarines – Gladius Task Force",

    battlefieldRole: "Battleline", // Character | Battleline | Dedicated Transport | Other Datasheets
    isEpicHero: false,

    keywords: ["INFANTRY", "ADEPTUS ASTARTES", "PRIMARIS"],
    uniqueName: "Squad Baelor",

    points: 110,
    models: 5,

    experience: 7,
    rank: "Battle-hardened",
    crusadePoints: 2,

    weapons: [
      {
        name: "Bolt rifle",
        type: "Ranged",
        profile: '24" A2 BS 3+ S4 AP-1 D1',
        keywords: ["ASSAULT"],
        notes: ""
      }
    ],
    wargear: [
      {
        name: "Frag & krak grenades",
        effect: "Once per battle, can be used instead of another ranged attack.",
        source: "Datasheet",
        notes: ""
      }
    ],
    upgrades: [],
    relics: [],

    battleHonours: [
      {
        name: "Grizzled Veterans",
        category: "Battle Trait",
        effect: "Once per phase, re-roll one Hit roll.",
        sessionEarned: 3,
        notes: ""
      }
    ],
    battleScars: [],

    notes: "Painted as 3rd Company; main objective holders.",
    image: "",

    playerId: "player_nick",
    playerName: "Nick Brown",
    armyName: "Angels of the Ozark",
    team: "Defenders",

    agendasCompleted: [],
    notableBattles: [],
    kills: {
      unitsDestroyed: 4,
      monstersOrVehiclesDestroyed: 1
    }
  },
  {
    id: "unit_002",
    unitName: "Hive Tyrant",
    faction: "Tyranids",
    subfactionOrDetachment: "Leviathan",

    battlefieldRole: "Other Datasheets",
    isEpicHero: false,

    keywords: ["MONSTER", "TYRANIDS", "FLY", "SYNAPSE"],
    uniqueName: "The Ozark Maw",

    points: 195,
    models: 1,

    experience: 10,
    rank: "Heroic",
    crusadePoints: 3,

    weapons: [],
    wargear: [],
    upgrades: [],
    relics: [],

    battleHonours: [],
    battleScars: [],

    notes: "",
    image: "",

    playerId: "player_other",
    playerName: "Other Player",
    armyName: "Hive Fleet Ozarka",
    team: "Attackers",

    agendasCompleted: [],
    notableBattles: [],
    kills: {
      unitsDestroyed: 6,
      monstersOrVehiclesDestroyed: 2
    }
  }
];

// === APP INITIALISATION ===
function initCrusadeApp() {
  const path = window.location.pathname;

  if (path.endsWith("index.html") || path.endsWith("/") || path === "") {
    initRosterPage();
  } else if (path.endsWith("players.html")) {
    initPlayersPage();
  }
}

// === ROSTER PAGE ===
function initRosterPage() {
  const rosterSection = document.getElementById("roster-section");
  if (!rosterSection) return;

  const filterTeam = document.getElementById("filter-team");
  const filterPlayer = document.getElementById("filter-player");
  const filterRole = document.getElementById("filter-role");
  const filterSearch = document.getElementById("filter-search");
  const metaTotalUnits = document.getElementById("meta-total-units");
  const metaLastUpdated = document.getElementById("meta-last-updated");

  // Populate player filter options
  populatePlayerFilter(filterPlayer, crusadeUnits);

  // Set last updated (for now just "today")
  if (metaTotalUnits) {
    metaTotalUnits.textContent = crusadeUnits.length.toString();
  }
  if (metaLastUpdated) {
    const now = new Date();
    metaLastUpdated.textContent = now.toLocaleDateString();
  }

  const render = () => {
    const filters = {
      team: filterTeam?.value || "",
      playerId: filterPlayer?.value || "",
      role: filterRole?.value || "",
      search: (filterSearch?.value || "").toLowerCase().trim()
    };
    renderRoster(rosterSection, crusadeUnits, filters);
  };

  filterTeam && filterTeam.addEventListener("change", render);
  filterPlayer && filterPlayer.addEventListener("change", render);
  filterRole && filterRole.addEventListener("change", render);
  filterSearch && filterSearch.addEventListener("input", render);

  render();
}

function populatePlayerFilter(selectEl, units) {
  if (!selectEl) return;
  const seen = new Map(); // playerId -> name

  units.forEach(u => {
    if (!seen.has(u.playerId)) {
      seen.set(u.playerId, u.playerName);
    }
  });

  for (const [id, name] of seen.entries()) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = name;
    selectEl.appendChild(opt);
  }
}

function renderRoster(container, units, filters) {
  container.innerHTML = "";

  // Apply filters
  const filtered = units.filter(unit => {
    if (filters.team && unit.team !== filters.team) return false;
    if (filters.playerId && unit.playerId !== filters.playerId) return false;
    if (filters.role && unit.battlefieldRole !== filters.role) return false;

    if (filters.search) {
      const haystack = [
        unit.unitName || "",
        unit.uniqueName || "",
        unit.faction || "",
        unit.armyName || ""
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(filters.search)) return false;
    }

    return true;
  });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.textContent = "No units match the current filters.";
    empty.style.color = "#9ca3af";
    container.appendChild(empty);
    return;
  }

  // Group by playerId
  const byPlayer = new Map();
  filtered.forEach(unit => {
    const key = unit.playerId;
    if (!byPlayer.has(key)) {
      byPlayer.set(key, {
        playerName: unit.playerName,
        team: unit.team,
        armyName: unit.armyName,
        units: []
      });
    }
    byPlayer.get(key).units.push(unit);
  });

  for (const [playerId, group] of byPlayer.entries()) {
    const block = document.createElement("section");
    block.className = "player-block";

    const header = document.createElement("div");
    header.className = "player-block-header";

    const title = document.createElement("div");
    title.className = "player-title";
    title.innerHTML = `<strong>${group.playerName}</strong> <span>– ${group.armyName}</span>`;

    const meta = document.createElement("div");
    meta.className = "player-meta";

    const teamPill = document.createElement("div");
    teamPill.className = "pill";
    if (group.team === "Defenders") teamPill.classList.add("team-defenders");
    if (group.team === "Attackers") teamPill.classList.add("team-attackers");
    if (group.team === "Raiders") teamPill.classList.add("team-raiders");
    teamPill.textContent = group.team;

    const countPill = document.createElement("div");
    countPill.className = "pill";
    countPill.textContent = `${group.units.length} unit${group.units.length !== 1 ? "s" : ""}`;

    meta.appendChild(teamPill);
    meta.appendChild(countPill);

    header.appendChild(title);
    header.appendChild(meta);

    const grid = document.createElement("div");
    grid.className = "unit-grid";

    group.units.forEach(unit => {
      grid.appendChild(renderUnitCard(unit));
    });

    block.appendChild(header);
    block.appendChild(grid);
    container.appendChild(block);
  }
}

function renderUnitCard(unit) {
  const card = document.createElement("article");
  card.className = "unit-card";

  const header = document.createElement("div");
  header.className = "unit-card-header";

  const nameBlock = document.createElement("div");
  nameBlock.className = "unit-name-block";

  const unitName = document.createElement("div");
  unitName.className = "unit-name";
  unitName.textContent = unit.unitName;

  nameBlock.appendChild(unitName);

  if (unit.uniqueName) {
    const uniqueName = document.createElement("div");
    uniqueName.className = "unit-unique-name";
    uniqueName.textContent = unit.uniqueName;
    nameBlock.appendChild(uniqueName);
  }

  const rolePill = document.createElement("div");
  rolePill.className = "unit-role-pill";

  const role = unit.battlefieldRole || "Other Datasheets";
  rolePill.textContent = role;

  switch (role) {
    case "Character":
      rolePill.classList.add("role-character");
      break;
    case "Battleline":
      rolePill.classList.add("role-battleline");
      break;
    case "Dedicated Transport":
      rolePill.classList.add("role-dedicated-transport");
      break;
    default:
      rolePill.classList.add("role-other");
  }

  header.appendChild(nameBlock);
  header.appendChild(rolePill);

  // Badges: epic / warlord
  const badgesRow = document.createElement("div");
  badgesRow.className = "unit-badges";

  if (unit.isEpicHero) {
    const epic = document.createElement("div");
    epic.className = "badge badge-epic";
    epic.textContent = "Epic Hero";
    badgesRow.appendChild(epic);
  }

  if (unit.keywords && unit.keywords.includes("WARLORD")) {
    const warlord = document.createElement("div");
    warlord.className = "badge badge-warlord";
    warlord.textContent = "Warlord";
    badgesRow.appendChild(warlord);
  }

  // Core line: points, models, faction
  const coreLine = document.createElement("div");
  coreLine.className = "unit-core-line";

  const pts = document.createElement("span");
  pts.textContent = `${unit.points} pts`;
  coreLine.appendChild(pts);

  const mdl = document.createElement("span");
  mdl.textContent = `${unit.models} model${unit.models !== 1 ? "s" : ""}`;
  coreLine.appendChild(mdl);

  const fac = document.createElement("span");
  fac.textContent = unit.faction;
  coreLine.appendChild(fac);

  // Crusade line: xp, rank, crusade points
  const crusadeLine = document.createElement("div");
  crusadeLine.className = "unit-crusade-line";

  const xpTag = document.createElement("div");
  xpTag.className = "tag tag-xp";
  xpTag.textContent = `XP ${unit.experience}`;
  crusadeLine.appendChild(xpTag);

  const rankTag = document.createElement("div");
  rankTag.className = "tag tag-rank";
  rankTag.textContent = unit.rank;
  crusadeLine.appendChild(rankTag);

  const cpTag = document.createElement("div");
  cpTag.className = "tag tag-cp";
  cpTag.textContent = `CP ${unit.crusadePoints}`;
  crusadeLine.appendChild(cpTag);

  // Footer: quick honours/scars indicator + kills pips
  const footer = document.createElement("div");
  footer.className = "unit-footer";

  const footerLeft = document.createElement("div");
  footerLeft.className = "unit-footer-left";

  const honoursCount = unit.battleHonours ? unit.battleHonours.length : 0;
  const scarsCount = unit.battleScars ? unit.battleScars.length : 0;

  const honourLabel = document.createElement("span");
  honourLabel.textContent = `Honours: ${honoursCount}`;
  footerLeft.appendChild(honourLabel);

  const scarLabel = document.createElement("span");
  scarLabel.textContent = `Scars: ${scarsCount}`;
  footerLeft.appendChild(scarLabel);

  const footerRight = document.createElement("div");

  const killsLabel = document.createElement("span");
  killsLabel.textContent = "Kills: ";
  footerRight.appendChild(killsLabel);

  const pipRow = document.createElement("span");
  pipRow.className = "pip-row";

  const totalKills = (unit.kills?.unitsDestroyed || 0) + (unit.kills?.monstersOrVehiclesDestroyed || 0);
  const pipCount = Math.min(5, totalKills);

  for (let i = 0; i < 5; i++) {
    const pip = document.createElement("span");
    pip.className = "pip";
    if (i < pipCount) pip.classList.add("pip-filled");
    pipRow.appendChild(pip);
  }

  footerRight.appendChild(pipRow);

  footer.appendChild(footerLeft);
  footer.appendChild(footerRight);

  card.appendChild(header);
  if (badgesRow.childElementCount > 0) card.appendChild(badgesRow);
  card.appendChild(coreLine);
  card.appendChild(crusadeLine);
  card.appendChild(footer);

  return card;
}

// === PLAYERS PAGE ===
function initPlayersPage() {
  const container = document.getElementById("players-list");
  if (!container) return;

  const byPlayer = new Map();

  crusadeUnits.forEach(unit => {
    if (!byPlayer.has(unit.playerId)) {
      byPlayer.set(unit.playerId, {
        playerName: unit.playerName,
        team: unit.team,
        armyName: unit.armyName,
        units: []
      });
    }
    byPlayer.get(unit.playerId).units.push(unit);
  });

  for (const [playerId, group] of byPlayer.entries()) {
    const block = document.createElement("section");
    block.className = "player-block";

    const header = document.createElement("div");
    header.className = "player-block-header";

    const title = document.createElement("div");
    title.className = "player-title";
    title.innerHTML = `<strong>${group.playerName}</strong> <span>– ${group.armyName}</span>`;

    const meta = document.createElement("div");
    meta.className = "player-meta";

    const teamPill = document.createElement("div");
    teamPill.className = "pill";
    if (group.team === "Defenders") teamPill.classList.add("team-defenders");
    if (group.team === "Attackers") teamPill.classList.add("team-attackers");
    if (group.team === "Raiders") teamPill.classList.add("team-raiders");
    teamPill.textContent = group.team;

    const countPill = document.createElement("div");
    countPill.className = "pill";
    countPill.textContent = `${group.units.length} unit${group.units.length !== 1 ? "s" : ""}`;

    meta.appendChild(teamPill);
    meta.appendChild(countPill);

    header.appendChild(title);
    header.appendChild(meta);

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.style.margin = "0.5rem 0 0";
    list.style.fontSize = "0.85rem";

    group.units.forEach(unit => {
      const li = document.createElement("li");
      li.style.padding = "0.2rem 0";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.innerHTML = `
        <span>${unit.unitName}${unit.uniqueName ? ` – <em>${unit.uniqueName}</em>` : ""}</span>
        <span style="color:#9ca3af;">${unit.points} pts · XP ${unit.experience}</span>
      `;
      list.appendChild(li);
    });

    block.appendChild(header);
    block.appendChild(list);
    container.appendChild(block);
  }
}
