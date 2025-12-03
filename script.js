// === STORAGE KEYS ===
const STORAGE_KEY_PLAYERS = "crusadePlayers_v1";
const STORAGE_KEY_UNITS = "crusadeUnits_v1";

// In-memory data (loaded from localStorage)
let players = [];
let crusadeUnits = [];

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

// === DATA LOAD / SAVE ===
function loadData() {
  try {
    const storedPlayers = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYERS) || "[]");
    if (Array.isArray(storedPlayers)) {
      players = storedPlayers;
    }
  } catch (err) {
    console.error("Error loading players from storage", err);
    players = [];
  }

  try {
    const storedUnits = JSON.parse(localStorage.getItem(STORAGE_KEY_UNITS) || "[]");
    if (Array.isArray(storedUnits)) {
      crusadeUnits = storedUnits;
    }
  } catch (err) {
    console.error("Error loading units from storage", err);
    crusadeUnits = [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(crusadeUnits));
  } catch (err) {
    console.error("Error saving data to storage", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  loadData();
  initCrusadeApp();
});

// === APP INITIALISATION / ROUTING ===
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

// =======================================================
// ROSTER PAGE (index.html) – player-scoped roster viewer
// =======================================================
function initRosterPage() {
  const rosterSection = document.getElementById("roster-section");
  if (!rosterSection) return;

  const filterTeam = document.getElementById("filter-team");
  const filterPlayer = document.getElementById("filter-player");
  const filterRole = document.getElementById("filter-role");
  const filterSearch = document.getElementById("filter-search");
  const metaTotalUnits = document.getElementById("meta-total-units");
  const metaLastUpdated = document.getElementById("meta-last-updated");

  populatePlayerFilter(filterPlayer);

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
    renderRoster(rosterSection, filters);
  };

  filterTeam && filterTeam.addEventListener("change", render);
  filterPlayer && filterPlayer.addEventListener("change", render);
  filterRole && filterRole.addEventListener("change", render);
  filterSearch && filterSearch.addEventListener("input", render);

  render();
}

function populatePlayerFilter(selectEl) {
  if (!selectEl) return;

  selectEl.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = players.length ? "Select a player…" : "No players yet";
  selectEl.appendChild(defaultOpt);

  players.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    selectEl.appendChild(opt);
  });
}

function renderRoster(container, filters) {
  container.innerHTML = "";

  if (!players.length) {
    const msg = document.createElement("p");
    msg.textContent = "No players yet. Go to the Players page to create one.";
    msg.style.color = "#9ca3af";
    container.appendChild(msg);
    return;
  }

  if (!filters.playerId) {
    const msg = document.createElement("p");
    msg.textContent = "Select a player from the dropdown above to view their Crusade roster.";
    msg.style.color = "#9ca3af";
    container.appendChild(msg);
    return;
  }

  const filtered = crusadeUnits.filter(unit => {
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

  const player = players.find(p => p.id === filters.playerId);
  const playerName = player ? player.name : filtered[0].playerName;
  const team = player ? player.team : filtered[0].team;
  const armyName = player ? player.armyName : filtered[0].armyName;

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

// =========================================
// PLAYERS PAGE (players.html) – CRUD players
// =========================================
function initPlayersPage() {
  const container = document.getElementById("players-list");
  const form = document.getElementById("player-create-form");

  if (!container || !form) return;

  const render = () => {
    container.innerHTML = "";

    if (!players.length) {
      const msg = document.createElement("p");
      msg.textContent = "No players yet. Create one using the form above.";
      msg.style.color = "#9ca3af";
      container.appendChild(msg);
      return;
    }

    players.forEach(player => {
      const block = document.createElement("section");
      block.className = "player-block";

      const header = document.createElement("div");
      header.className = "player-block-header";

      const title = document.createElement("div");
      title.className = "player-title";
      title.innerHTML = `<strong>${player.name}</strong> <span>– ${player.armyName}</span>`;

      const meta = document.createElement("div");
      meta.className = "player-meta";

      const teamPill = document.createElement("div");
      teamPill.className = "pill";
      if (player.team === "Defenders") teamPill.classList.add("team-defenders");
      if (player.team === "Attackers") teamPill.classList.add("team-attackers");
      if (player.team === "Raiders") teamPill.classList.add("team-raiders");
      teamPill.textContent = player.team;

      const unitCount = crusadeUnits.filter(u => u.playerId === player.id).length;
      const countPill = document.createElement("div");
      countPill.className = "pill";
      countPill.textContent = `${unitCount} unit${unitCount !== 1 ? "s" : ""}`;

      meta.appendChild(teamPill);
      meta.appendChild(countPill);

      header.appendChild(title);
      header.appendChild(meta);

      const list = document.createElement("ul");
      list.style.listStyle = "none";
      list.style.padding = "0";
      list.style.margin = "0.5rem 0 0";
      list.style.fontSize = "0.85rem";

      crusadeUnits
        .filter(u => u.playerId === player.id)
        .forEach(unit => {
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

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove Player & Units";
      removeBtn.style.marginTop = "0.6rem";
      removeBtn.style.fontSize = "0.8rem";
      removeBtn.style.padding = "0.3rem 0.7rem";
      removeBtn.style.borderRadius = "999px";
      removeBtn.style.border = "1px solid #f97373";
      removeBtn.style.background = "#7f1d1d";
      removeBtn.style.color = "#fee2e2";
      removeBtn.style.cursor = "pointer";

      removeBtn.addEventListener("click", () => {
        const ok = window.confirm(
          `Remove player "${player.name}" and all their units? This cannot be undone.`
        );
        if (!ok) return;

        players = players.filter(p => p.id !== player.id);
        crusadeUnits = crusadeUnits.filter(u => u.playerId !== player.id);
        saveData();
        render();
      });

      block.appendChild(header);
      block.appendChild(list);
      block.appendChild(removeBtn);
      container.appendChild(block);
    });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("player-create-name");
    const idInput = document.getElementById("player-create-id");
    const armyInput = document.getElementById("player-create-army");
    const teamSelect = document.getElementById("player-create-team");

    const name = nameInput.value.trim();
    let id = idInput.value.trim();
    const armyName = armyInput.value.trim();
    const team = teamSelect.value;

    if (!name || !armyName || !team) {
      alert("Name, army name, and team are required.");
      return;
    }

    if (!id) {
      id =
        "player_" +
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
    }

    if (players.some(p => p.id === id)) {
      alert("That player ID already exists. Choose a different one.");
      return;
    }

    const newPlayer = {
      id,
      name,
      armyName,
      team
    };

    players.push(newPlayer);
    saveData();
    form.reset();
    render();
  });

  render();
}

// =========================================
// BUILDER PAGE (builder.html) – add units
// =========================================
function initBuilderPage() {
  const form = document.getElementById("unit-builder-form");
  const preview = document.getElementById("builder-json-preview");
  const playerSelect = document.getElementById("builder-player");
  const playerInfo = document.getElementById("builder-player-info");

  if (!form || !preview || !playerSelect) return;

  // Populate player dropdown
  playerSelect.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = players.length ? "Select a player…" : "No players yet";
  playerSelect.appendChild(defaultOpt);

  players.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    playerSelect.appendChild(opt);
  });

  playerSelect.addEventListener("change", () => {
    const id = playerSelect.value;
    const player = players.find(p => p.id === id);
    if (!player) {
      playerInfo.textContent = "Select a player to see their army and team.";
    } else {
      playerInfo.textContent = `${player.armyName} – ${player.team}`;
    }
  });

  if (!players.length) {
    playerInfo.textContent = "No players yet. Go to the Players page and create one first.";
  } else {
    playerInfo.textContent = "Select a player to see their army and team.";
  }

  updateBuilderPreview(preview);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedPlayerId = playerSelect.value;
    const player = players.find(p => p.id === selectedPlayerId);

    if (!player) {
      alert("Select a valid player before adding a unit.");
      return;
    }

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
    const image = document.getElementById("image").value.trim();

    if (!unitName || !faction || !battlefieldRole || !rank) {
      alert("Please fill in all required unit fields.");
      return;
    }

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
      image: image || "",

      playerId: player.id,
      playerName: player.name,
      armyName: player.armyName,
      team: player.team,

      agendasCompleted: [],
      notableBattles: [],
      kills: {
        unitsDestroyed: 0,
        monstersOrVehiclesDestroyed: 0
      }
    };

    crusadeUnits.push(newUnit);
    saveData();
    updateBuilderPreview(preview);

    const keepPlayerId = playerSelect.value;
    form.reset();
    playerSelect.value = keepPlayerId || "";
    playerSelect.dispatchEvent(new Event("change"));

    alert("Unit added. Copy the JSON if needed, or view it on the Roster page.");
  });
}

function updateBuilderPreview(previewEl) {
  try {
    previewEl.value = JSON.stringify(crusadeUnits, null, 2);
  } catch (err) {
    previewEl.value = "// Error serializing crusadeUnits:\n" + String(err);
  }
}
