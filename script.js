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
// Starter data – you'll replace/expand this with your own units later.
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

    weapons: [],
    wargear: [],
    upgrades: [],
    relics: [],

    battleHonours: [],
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
  } else if (path.endsWith("builder.html")) {
    initBuilderPage();
  }
}

// === ROSTER PAGE (player-scoped) ===
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

  // Set meta
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

  selectEl.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Select a player…";
  selectEl.appendChild(defaultOpt);

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

  if (!filters.playerId) {
    const msg = document.createElement("p");
    msg.textContent = "Select a player from the dropdown above to view their Crusade roster.";
    msg.style.color = "#9ca3af";
    container.appendChild(msg);
    return;
  }

  const filtered = units.filter(unit => {
    if (unit.playerId !== filters.playerId) return false;
    if (filters.team && unit.team !== filters.team) return false;
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
    empty.textContent = "This player has no units matching the current filters.";
    empty.style.color = "#9ca3af";
    container.appendChild(empty);
    return;
  }

  const playerName = filtered[0].playerName;
  const team = filtered[0].team;
  const armyName = filtered[0].armyName;

  const block = document.createElement("section");
  block.className = "player-block";

  const header = document.createElement("div");
  header.className = "player-block-header";

  const title = document.createElement("div");
  title.className = "player-title";
  title.innerHTML = `<strong>${playerName}</strong> <span>– ${armyName}</span>`;

  const meta = document.createElement("div");
  meta.className = "player-meta";

  const teamPill = document.createElement("div");
  teamPill.className = "pill";
  if (team === "Defenders") teamPill.classList.add("team-defenders");
  if (team === "Attackers") teamPill.classList.add("team-attackers");
  if (team === "Raiders") teamPill.classList.add("team-raiders");
  teamPill.textContent = team;

  const countPill = document.createElement("div");
  countPill.className = "pill";
  countPill.textContent = `${filtered.length} unit${filtered.length !== 1 ? "s" : ""}`;

  meta.appendChild(teamPill);
  meta.appendChild(countPill);

  header.appendChild(title);
  header.appendChild(meta);

  const grid = document.createElement("div");
  grid.className = "unit-grid";

  filtered.forEach(unit => {
    grid.appendChild(renderUnitCard(unit));
  });

  block.appendChild(header);
  block.appendChild(grid);
  container.appendChild(block);
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

  const totalKills =
    (unit.kills?.unitsDestroyed || 0) +
    (unit.kills?.monstersOrVehiclesDestroyed || 0);
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

// === BUILDER PAGE ===
function initBuilderPage() {
  const form = document.getElementById("unit-builder-form");
  const preview = document.getElementById("builder-json-preview");

  if (!form || !preview) return;

  // Initialize preview with existing units
  updateBuilderPreview(preview);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const playerName = document.getElementById("player-name").value.trim();
    const playerId = document.getElementById("player-id").value.trim();
    const armyName = document.getElementById("army-name").value.trim();
    const team = document.getElementById("team").value;

    const unitName = document.getElementById("unit-name").value.trim();
    const uniqueName = document.getElementById("unique-name").value.trim();
    const faction = document.getElementById("faction").value.trim();
    const subfaction = document.getElementById("subfaction").value.trim();
    const battlefieldRole = document.getElementById("battlefield-role").value;
    const isEpicHero = document.getElementById("is-epic-hero").checked;

    const points = Number(document.getElementById("points").value || 0);
    const models = Number(document.getElementById("models").value || 1);
    const experience = Number(document.getElementById("experience").value || 0);
    const rank = document.getElementById("rank").value;
    const crusadePoints = Number(document.getElementById("crusade-points").value || 0);

    const keywordsRaw = document.getElementById("keywords").value;
    const notes = document.getElementById("notes").value;

    const keywords = keywordsRaw
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const id = `unit_${Date.now()}`;

    const newUnit = {
      id,
      unitName,
      faction,
      subfactionOrDetachment: subfaction,

      battlefieldRole,
      isEpicHero,

      keywords,
      uniqueName,

      points,
      models,

      experience,
      rank,
      crusadePoints,

      weapons: [],
      wargear: [],
      upgrades: [],
      relics: [],

      battleHonours: [],
      battleScars: [],

      notes,
      image: "",

      playerId,
      playerName,
      armyName,
      team,

      agendasCompleted: [],
      notableBattles: [],
      kills: {
        unitsDestroyed: 0,
        monstersOrVehiclesDestroyed: 0
      }
    };

    crusadeUnits.push(newUnit);
    updateBuilderPreview(preview);

    form.reset();
    alert("Unit added to builder preview. Copy the JSON when you're ready to save it.");
  });
}

function updateBuilderPreview(previewEl) {
  try {
    previewEl.value = JSON.stringify(crusadeUnits, null, 2);
  } catch (err) {
    previewEl.value = "// Error serializing crusadeUnits:\n" + String(err);
  }
}
