// === STORAGE KEYS ===
const STORAGE_KEY_PLAYERS = "crusadePlayers_v1";
const STORAGE_KEY_UNITS = "crusadeUnits_v1";
const STORAGE_KEY_LOGS = "crusadeLogs_v1";

// In-memory data (loaded from localStorage)
let players = [];
let crusadeUnits = [];
let battleLogs = [];

// === HEADER LOADER ===
function loadHeader() {
  const headerContainer = document.getElementById("site-header");
  if (!headerContainer) return;

  fetch("header.html")
    .then((res) => res.text())
    .then((html) => {
      headerContainer.innerHTML = html;
    })
    .catch((err) => {
      console.error("Failed to load header.html", err);
    });
}

// === DATA LOAD / SAVE ===
function loadData() {
  try {
    const storedPlayers = JSON.parse(
      localStorage.getItem(STORAGE_KEY_PLAYERS) || "[]"
    );
    if (Array.isArray(storedPlayers)) {
      players = storedPlayers;
    }
  } catch (err) {
    console.error("Error loading players from storage", err);
    players = [];
  }

  try {
    const storedUnits = JSON.parse(
      localStorage.getItem(STORAGE_KEY_UNITS) || "[]"
    );
    if (Array.isArray(storedUnits)) {
      crusadeUnits = storedUnits;
    }
  } catch (err) {
    console.error("Error loading units from storage", err);
    crusadeUnits = [];
  }

  try {
    const storedLogs = JSON.parse(
      localStorage.getItem(STORAGE_KEY_LOGS) || "[]"
    );
    if (Array.isArray(storedLogs)) {
      battleLogs = storedLogs;
    }
  } catch (err) {
    console.error("Error loading logs from storage", err);
    battleLogs = [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(crusadeUnits));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(battleLogs));
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
  } else if (path.endsWith("unit.html")) {
    initUnitPage();
  } else if (path.endsWith("log.html")) {
    initLogPage();
  }
}

// Helper: player name lookup
function getPlayerNameById(id) {
  const p = players.find((pl) => pl.id === id);
  return p ? p.name : "(Unknown)";
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

  players.forEach((p) => {
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
    msg.textContent =
      "Select a player from the dropdown above to view their Crusade roster.";
    msg.style.color = "#9ca3af";
    container.appendChild(msg);
    return;
  }

  const filtered = crusadeUnits.filter((unit) => {
    if (unit.playerId !== filters.playerId) return false;
    if (filters.team && unit.team !== filters.team) return false;
    if (filters.role && unit.battlefieldRole !== filters.role) return false;

    if (filters.search) {
      const haystack = [unit.unitName || "", unit.uniqueName || "", unit.faction || "", unit.armyName || ""]
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

  const player = players.find((p) => p.id === filters.playerId);
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
  countPill.textContent = `${filtered.length} unit${
    filtered.length !== 1 ? "s" : ""
  }`;

  meta.appendChild(teamPill);
  meta.appendChild(countPill);

  header.appendChild(title);
  header.appendChild(meta);

  const grid = document.createElement("div");
  grid.className = "unit-grid";

  filtered.forEach((unit) => {
    grid.appendChild(renderUnitCard(unit, { showManageButton: true }));
  });

  block.appendChild(header);
  block.appendChild(grid);
  container.appendChild(block);
}

function renderUnitCard(unit, opts = {}) {
  const showManageButton = !!opts.showManageButton;

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
  mdl.textContent = `${unit.models} model${
    unit.models !== 1 ? "s" : ""
  }`;
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

  if (showManageButton) {
    const manageBar = document.createElement("div");
    manageBar.style.display = "flex";
    manageBar.style.justifyContent = "flex-end";
    manageBar.style.marginTop = "0.4rem";

    const manageLink = document.createElement("a");
    manageLink.href = `unit.html?id=${encodeURIComponent(unit.id)}`;
    manageLink.textContent = "View & Edit Datacard";
    manageLink.className = "unit-manage-btn";

    manageBar.appendChild(manageLink);
    card.appendChild(manageBar);
  }

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

    players.forEach((player) => {
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
      if (player.team === "Defenders")
        teamPill.classList.add("team-defenders");
      if (player.team === "Attackers")
        teamPill.classList.add("team-attackers");
      if (player.team === "Raiders") teamPill.classList.add("team-raiders");
      teamPill.textContent = player.team;

      const unitCount = crusadeUnits.filter(
        (u) => u.playerId === player.id
      ).length;
      const countPill = document.createElement("div");
      countPill.className = "pill";
      countPill.textContent = `${unitCount} unit${
        unitCount !== 1 ? "s" : ""
      }`;

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
        .filter((u) => u.playerId === player.id)
        .forEach((unit) => {
          const li = document.createElement("li");
          li.style.padding = "0.2rem 0";
          li.style.display = "flex";
          li.style.justifyContent = "space-between";
          li.innerHTML = `
            <span>${unit.unitName}${
            unit.uniqueName ? ` – <em>${unit.uniqueName}</em>` : ""
          }</span>
            <span style="color:#9ca3af;">${unit.points} pts · XP ${
            unit.experience
          }</span>
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

        players = players.filter((p) => p.id !== player.id);
        crusadeUnits = crusadeUnits.filter((u) => u.playerId !== player.id);
        // Remove their logs too
        battleLogs = battleLogs.filter(
          (log) =>
            !log.attackerPlayerIds.includes(player.id) &&
            !log.defenderPlayerIds.includes(player.id)
        );
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

    if (players.some((p) => p.id === id)) {
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

  // Temporary arrays for this unit's detail editors
  let builderWeapons = [];
  let builderWargear = [];
  let builderHonours = [];
  let builderScars = [];

  // Populate player dropdown
  playerSelect.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = players.length ? "Select a player…" : "No players yet";
  playerSelect.appendChild(defaultOpt);

  players.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    playerSelect.appendChild(opt);
  });

  playerSelect.addEventListener("change", () => {
    const id = playerSelect.value;
    const player = players.find((p) => p.id === id);
    if (!player) {
      playerInfo.textContent =
        "Select a player to see their army and team.";
    } else {
      playerInfo.textContent = `${player.armyName} – ${player.team}`;
    }
  });

  if (!players.length) {
    playerInfo.textContent =
      "No players yet. Go to the Players page and create one first.";
  } else {
    playerInfo.textContent = "Select a player to see their army and team.";
  }

  // === DOM refs for sub-editors ===
  const weaponNameInput = document.getElementById("weapon-name");
  const weaponTypeInput = document.getElementById("weapon-type");
  const weaponProfileInput = document.getElementById("weapon-profile");
  const weaponKeywordsInput = document.getElementById("weapon-keywords");
  const weaponNotesInput = document.getElementById("weapon-notes");
  const weaponAddBtn = document.getElementById("weapon-add-btn");
  const weaponList = document.getElementById("weapon-list");

  const wargearNameInput = document.getElementById("wargear-name");
  const wargearEffectInput = document.getElementById("wargear-effect");
  const wargearSourceInput = document.getElementById("wargear-source");
  const wargearNotesInput = document.getElementById("wargear-notes");
  const wargearAddBtn = document.getElementById("wargear-add-btn");
  const wargearList = document.getElementById("wargear-list");

  const honourNameInput = document.getElementById("honour-name");
  const honourCategoryInput = document.getElementById("honour-category");
  const honourEffectInput = document.getElementById("honour-effect");
  const honourSessionInput = document.getElementById("honour-session");
  const honourNotesInput = document.getElementById("honour-notes");
  const honourAddBtn = document.getElementById("honour-add-btn");
  const honourList = document.getElementById("honour-list");

  const scarNameInput = document.getElementById("scar-name");
  const scarEffectInput = document.getElementById("scar-effect");
  const scarSessionInput = document.getElementById("scar-session");
  const scarNotesInput = document.getElementById("scar-notes");
  const scarAddBtn = document.getElementById("scar-add-btn");
  const scarList = document.getElementById("scar-list");

  // === RENDER HELPERS ===
  function renderWeaponList() {
    weaponList.innerHTML = "";
    if (!builderWeapons.length) {
      weaponList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No weapons added.</p>';
      return;
    }
    builderWeapons.forEach((w, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${w.name}</strong> <span style="color:#9ca3af;">(${w.type}) – ${w.profile}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        builderWeapons.splice(index, 1);
        renderWeaponList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      weaponList.appendChild(row);
    });
  }

  function renderWargearList() {
    wargearList.innerHTML = "";
    if (!builderWargear.length) {
      wargearList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No wargear added.</p>';
      return;
    }
    builderWargear.forEach((g, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${g.name}</strong> <span style="color:#9ca3af;">– ${g.effect}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        builderWargear.splice(index, 1);
        renderWargearList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      wargearList.appendChild(row);
    });
  }

  function renderHonourList() {
    honourList.innerHTML = "";
    if (!builderHonours.length) {
      honourList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No battle honours added.</p>';
      return;
    }
    builderHonours.forEach((h, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${h.name}</strong> <span style="color:#9ca3af;">[${h.category}] – ${h.effect}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        builderHonours.splice(index, 1);
        renderHonourList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      honourList.appendChild(row);
    });
  }

  function renderScarList() {
    scarList.innerHTML = "";
    if (!builderScars.length) {
      scarList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No battle scars added.</p>';
      return;
    }
    builderScars.forEach((s, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${s.name}</strong> <span style="color:#9ca3af;">– ${s.effect}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        builderScars.splice(index, 1);
        renderScarList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      scarList.appendChild(row);
    });
  }

  // Initial renders for empty lists
  renderWeaponList();
  renderWargearList();
  renderHonourList();
  renderScarList();

  // === ADD HANDLERS ===
  if (weaponAddBtn) {
    weaponAddBtn.addEventListener("click", () => {
      const name = weaponNameInput.value.trim();
      const type = weaponTypeInput.value.trim();
      const profile = weaponProfileInput.value.trim();
      const kwRaw = weaponKeywordsInput.value;
      const notes = weaponNotesInput.value.trim();

      if (!name || !profile) {
        alert("Weapon needs at least a name and profile.");
        return;
      }

      const keywords = kwRaw
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      builderWeapons.push({
        name,
        type: type || "Ranged",
        profile,
        keywords,
        notes
      });

      weaponNameInput.value = "";
      weaponTypeInput.value = "";
      weaponProfileInput.value = "";
      weaponKeywordsInput.value = "";
      weaponNotesInput.value = "";

      renderWeaponList();
    });
  }

  if (wargearAddBtn) {
    wargearAddBtn.addEventListener("click", () => {
      const name = wargearNameInput.value.trim();
      const effect = wargearEffectInput.value.trim();
      const source = wargearSourceInput.value.trim();
      const notes = wargearNotesInput.value.trim();

      if (!name || !effect) {
        alert("Wargear needs at least a name and effect.");
        return;
      }

      builderWargear.push({
        name,
        effect,
        source,
        notes
      });

      wargearNameInput.value = "";
      wargearEffectInput.value = "";
      wargearSourceInput.value = "";
      wargearNotesInput.value = "";

      renderWargearList();
    });
  }

  if (honourAddBtn) {
    honourAddBtn.addEventListener("click", () => {
      const name = honourNameInput.value.trim();
      const category = honourCategoryInput.value || "Battle Trait";
      const effect = honourEffectInput.value.trim();
      const sessionEarned = Number(honourSessionInput.value || 0);
      const notes = honourNotesInput.value.trim();

      if (!name || !effect) {
        alert("Battle honour needs at least a name and effect.");
        return;
      }

      builderHonours.push({
        name,
        category,
        effect,
        sessionEarned,
        notes
      });

      honourNameInput.value = "";
      honourCategoryInput.value = "";
      honourEffectInput.value = "";
      honourSessionInput.value = "";
      honourNotesInput.value = "";

      renderHonourList();
    });
  }

  if (scarAddBtn) {
    scarAddBtn.addEventListener("click", () => {
      const name = scarNameInput.value.trim();
      const effect = scarEffectInput.value.trim();
      const sessionEarned = Number(scarSessionInput.value || 0);
      const notes = scarNotesInput.value.trim();

      if (!name || !effect) {
        alert("Battle scar needs at least a name and effect.");
        return;
      }

      builderScars.push({
        name,
        effect,
        sessionEarned,
        notes
      });

      scarNameInput.value = "";
      scarEffectInput.value = "";
      scarSessionInput.value = "";
      scarNotesInput.value = "";

      renderScarList();
    });
  }

  updateBuilderPreview(preview);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedPlayerId = playerSelect.value;
    const player = players.find((p) => p.id === selectedPlayerId);

    if (!player) {
      alert("Select a valid player before adding a unit.");
      return;
    }

    const unitNameVal = document.getElementById("unit-name").value.trim();
    const uniqueName = document.getElementById("unique-name").value.trim();
    const faction = document.getElementById("faction").value.trim();
    const subfaction =
      document.getElementById("subfaction").value.trim();
    const battlefieldRole = document.getElementById(
      "battlefield-role"
    ).value;
    const isEpicHero = document.getElementById("is-epic-hero").checked;

    const points = Number(
      document.getElementById("points").value || 0
    );
    const models = Number(
      document.getElementById("models").value || 1
    );
    const experience = Number(
      document.getElementById("experience").value || 0
    );
    const rank = document.getElementById("rank").value;
    const crusadePoints = Number(
      document.getElementById("crusade-points").value || 0
    );

    const keywordsRaw = document.getElementById("keywords").value;
    const notes = document.getElementById("notes").value;
    const image = document.getElementById("image").value.trim();

    if (!unitNameVal || !faction || !battlefieldRole || !rank) {
      alert("Please fill in all required unit fields.");
      return;
    }

    const keywords = keywordsRaw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const id = `unit_${Date.now()}`;

    const newUnit = {
      id,
      unitName: unitNameVal,
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

      weapons: builderWeapons.slice(),
      wargear: builderWargear.slice(),
      upgrades: [],
      relics: [],

      battleHonours: builderHonours.slice(),
      battleScars: builderScars.slice(),

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
    builderWeapons = [];
    builderWargear = [];
    builderHonours = [];
    builderScars = [];
    renderWeaponList();
    renderWargearList();
    renderHonourList();
    renderScarList();

    playerSelect.value = keepPlayerId || "";
    playerSelect.dispatchEvent(new Event("change"));

    alert(
      "Unit added. You can now see it on the Roster page, or edit its datacard."
    );
  });
}

function updateBuilderPreview(previewEl) {
  try {
    previewEl.value = JSON.stringify(crusadeUnits, null, 2);
  } catch (err) {
    previewEl.value =
      "// Error serializing crusadeUnits:\n" + String(err);
  }
}

// =========================================
// UNIT PAGE (unit.html) – full editable datacard
// =========================================
function initUnitPage() {
  const params = new URLSearchParams(window.location.search);
  const unitId = params.get("id");

  const summaryContainer = document.getElementById("unit-summary-card");
  const form = document.getElementById("unit-detail-form");
  const preview = document.getElementById("unit-json-preview");
  const headerTitle = document.getElementById("unit-header-title");
  const ownerInfo = document.getElementById("unit-owner-info");
  const deleteBtn = document.getElementById("unit-delete-btn");

  if (!form || !preview || !summaryContainer) return;

  const idx = crusadeUnits.findIndex((u) => u.id === unitId);
  if (idx === -1) {
    summaryContainer.innerHTML =
      "<p style='color:#fca5a5;'>Unit not found. Maybe it was deleted?</p>";
    form.style.display = "none";
    if (headerTitle) headerTitle.textContent = "Unit not found";
    return;
  }

  let currentUnit = crusadeUnits[idx];

  // Per-unit editable arrays
  let detailWeapons = (currentUnit.weapons || []).slice();
  let detailWargear = (currentUnit.wargear || []).slice();
  let detailHonours = (currentUnit.battleHonours || []).slice();
  let detailScars = (currentUnit.battleScars || []).slice();

  // Fill header/owner info
  if (headerTitle) {
    const displayName = currentUnit.uniqueName
      ? `${currentUnit.uniqueName} (${currentUnit.unitName})`
      : currentUnit.unitName;
    headerTitle.textContent = displayName;
  }
  if (ownerInfo) {
    ownerInfo.textContent = `${currentUnit.playerName} – ${currentUnit.armyName} – ${currentUnit.team}`;
  }

  // Summary card
  function renderSummary() {
    summaryContainer.innerHTML = "";
    summaryContainer.appendChild(
      renderUnitCard(currentUnit, { showManageButton: false })
    );
  }

  // === DOM refs for form fields ===
  const unitNameInput = document.getElementById("unit-name");
  const uniqueNameInput = document.getElementById("unique-name");
  const factionInput = document.getElementById("faction");
  const subfactionInput = document.getElementById("subfaction");
  const battlefieldRoleSelect =
    document.getElementById("battlefield-role");
  const epicHeroCheckbox =
    document.getElementById("is-epic-hero");

  const pointsInput = document.getElementById("points");
  const modelsInput = document.getElementById("models");
  const experienceInput = document.getElementById("experience");
  const rankSelect = document.getElementById("rank");
  const crusadePointsInput =
    document.getElementById("crusade-points");

  const keywordsInput = document.getElementById("keywords");
  const notesInput = document.getElementById("notes");
  const imageInput = document.getElementById("image");

  // Sub-editors
  const weaponNameInput = document.getElementById("weapon-name");
  const weaponTypeInput = document.getElementById("weapon-type");
  const weaponProfileInput =
    document.getElementById("weapon-profile");
  const weaponKeywordsInput =
    document.getElementById("weapon-keywords");
  const weaponNotesInput = document.getElementById("weapon-notes");
  const weaponAddBtn = document.getElementById("weapon-add-btn");
  const weaponList = document.getElementById("weapon-list");

  const wargearNameInput = document.getElementById("wargear-name");
  const wargearEffectInput =
    document.getElementById("wargear-effect");
  const wargearSourceInput =
    document.getElementById("wargear-source");
  const wargearNotesInput =
    document.getElementById("wargear-notes");
  const wargearAddBtn = document.getElementById("wargear-add-btn");
  const wargearList = document.getElementById("wargear-list");

  const honourNameInput = document.getElementById("honour-name");
  const honourCategoryInput =
    document.getElementById("honour-category");
  const honourEffectInput =
    document.getElementById("honour-effect");
  const honourSessionInput =
    document.getElementById("honour-session");
  const honourNotesInput =
    document.getElementById("honour-notes");
  const honourAddBtn = document.getElementById("honour-add-btn");
  const honourList = document.getElementById("honour-list");

  const scarNameInput = document.getElementById("scar-name");
  const scarEffectInput = document.getElementById("scar-effect");
  const scarSessionInput =
    document.getElementById("scar-session");
  const scarNotesInput = document.getElementById("scar-notes");
  const scarAddBtn = document.getElementById("scar-add-btn");
  const scarList = document.getElementById("scar-list");

  // Pre-fill form with currentUnit
  unitNameInput.value = currentUnit.unitName || "";
  uniqueNameInput.value = currentUnit.uniqueName || "";
  factionInput.value = currentUnit.faction || "";
  subfactionInput.value =
    currentUnit.subfactionOrDetachment || "";
  battlefieldRoleSelect.value =
    currentUnit.battlefieldRole || "";
  epicHeroCheckbox.checked = !!currentUnit.isEpicHero;

  pointsInput.value = currentUnit.points ?? 0;
  modelsInput.value = currentUnit.models ?? 1;
  experienceInput.value = currentUnit.experience ?? 0;
  rankSelect.value = currentUnit.rank || "";
  crusadePointsInput.value = currentUnit.crusadePoints ?? 0;

  keywordsInput.value = (currentUnit.keywords || []).join(", ");
  notesInput.value = currentUnit.notes || "";
  imageInput.value = currentUnit.image || "";

  // === RENDER HELPERS FOR EDITABLE LISTS ===
  function renderWeaponList() {
    weaponList.innerHTML = "";
    if (!detailWeapons.length) {
      weaponList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No weapons added.</p>';
      return;
    }
    detailWeapons.forEach((w, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${w.name}</strong> <span style="color:#9ca3af;">(${w.type}) – ${w.profile}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        detailWeapons.splice(index, 1);
        renderWeaponList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      weaponList.appendChild(row);
    });
  }

  function renderWargearList() {
    wargearList.innerHTML = "";
    if (!detailWargear.length) {
      wargearList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No wargear added.</p>';
      return;
    }
    detailWargear.forEach((g, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${g.name}</strong> <span style="color:#9ca3af;">– ${g.effect}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        detailWargear.splice(index, 1);
        renderWargearList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      wargearList.appendChild(row);
    });
  }

  function renderHonourList() {
    honourList.innerHTML = "";
    if (!detailHonours.length) {
      honourList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No battle honours added.</p>';
      return;
    }
    detailHonours.forEach((h, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${h.name}</strong> <span style="color:#9ca3af;">[${h.category}] – ${h.effect}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        detailHonours.splice(index, 1);
        renderHonourList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      honourList.appendChild(row);
    });
  }

  function renderScarList() {
    scarList.innerHTML = "";
    if (!detailScars.length) {
      scarList.innerHTML =
        '<p style="font-size:.8rem; color:#9ca3af; margin:0;">No battle scars added.</p>';
      return;
    }
    detailScars.forEach((s, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.fontSize = ".8rem";
      row.style.padding = ".15rem 0";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${s.name}</strong> <span style="color:#9ca3af;">– ${s.effect}</span>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.style.border = "none";
      btn.style.borderRadius = "999px";
      btn.style.padding = "0 .4rem";
      btn.style.cursor = "pointer";
      btn.style.background = "#111827";
      btn.style.color = "#fca5a5";
      btn.addEventListener("click", () => {
        detailScars.splice(index, 1);
        renderScarList();
      });

      row.appendChild(left);
      row.appendChild(btn);
      scarList.appendChild(row);
    });
  }

  // Initial render of lists & summary
  renderWeaponList();
  renderWargearList();
  renderHonourList();
  renderScarList();
  renderSummary();
  updateUnitPreview();

  // === HANDLERS TO ADD ENTRIES ===
  if (weaponAddBtn) {
    weaponAddBtn.addEventListener("click", () => {
      const name = weaponNameInput.value.trim();
      const type = weaponTypeInput.value.trim();
      const profile = weaponProfileInput.value.trim();
      const kwRaw = weaponKeywordsInput.value;
      const notes = weaponNotesInput.value.trim();

      if (!name || !profile) {
        alert("Weapon needs at least a name and profile.");
        return;
      }

      const keywords = kwRaw
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      detailWeapons.push({
        name,
        type: type || "Ranged",
        profile,
        keywords,
        notes
      });

      weaponNameInput.value = "";
      weaponTypeInput.value = "";
      weaponProfileInput.value = "";
      weaponKeywordsInput.value = "";
      weaponNotesInput.value = "";

      renderWeaponList();
      updateUnitPreview();
    });
  }

  if (wargearAddBtn) {
    wargearAddBtn.addEventListener("click", () => {
      const name = wargearNameInput.value.trim();
      const effect = wargearEffectInput.value.trim();
      const source = wargearSourceInput.value.trim();
      const notes = wargearNotesInput.value.trim();

      if (!name || !effect) {
        alert("Wargear needs at least a name and effect.");
        return;
      }

      detailWargear.push({
        name,
        effect,
        source,
        notes
      });

      wargearNameInput.value = "";
      wargearEffectInput.value = "";
      wargearSourceInput.value = "";
      wargearNotesInput.value = "";

      renderWargearList();
      updateUnitPreview();
    });
  }

  if (honourAddBtn) {
    honourAddBtn.addEventListener("click", () => {
      const name = honourNameInput.value.trim();
      const category = honourCategoryInput.value || "Battle Trait";
      const effect = honourEffectInput.value.trim();
      const sessionEarned = Number(
        honourSessionInput.value || 0
      );
      const notes = honourNotesInput.value.trim();

      if (!name || !effect) {
        alert("Battle honour needs at least a name and effect.");
        return;
      }

      detailHonours.push({
        name,
        category,
        effect,
        sessionEarned,
        notes
      });

      honourNameInput.value = "";
      honourCategoryInput.value = "";
      honourEffectInput.value = "";
      honourSessionInput.value = "";
      honourNotesInput.value = "";

      renderHonourList();
      updateUnitPreview();
    });
  }

  if (scarAddBtn) {
    scarAddBtn.addEventListener("click", () => {
      const name = scarNameInput.value.trim();
      const effect = scarEffectInput.value.trim();
      const sessionEarned = Number(
        scarSessionInput.value || 0
      );
      const notes = scarNotesInput.value.trim();

      if (!name || !effect) {
        alert("Battle scar needs at least a name and effect.");
        return;
      }

      detailScars.push({
        name,
        effect,
        sessionEarned,
        notes
      });

      scarNameInput.value = "";
      scarEffectInput.value = "";
      scarSessionInput.value = "";
      scarNotesInput.value = "";

      renderScarList();
      updateUnitPreview();
    });
  }

  // === SAVE CHANGES ===
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const unitNameVal = unitNameInput.value.trim();
    const uniqueName = uniqueNameInput.value.trim();
    const faction = factionInput.value.trim();
    const subfaction = subfactionInput.value.trim();
    const battlefieldRole = battlefieldRoleSelect.value;
    const isEpicHero = epicHeroCheckbox.checked;

    const points = Number(pointsInput.value || 0);
    const models = Number(modelsInput.value || 1);
    const experience = Number(experienceInput.value || 0);
    const rank = rankSelect.value;
    const crusadePoints = Number(
      crusadePointsInput.value || 0
    );

    const keywordsRaw = keywordsInput.value;
    const notes = notesInput.value;
    const image = imageInput.value.trim();

    if (!unitNameVal || !faction || !battlefieldRole || !rank) {
      alert("Please fill in all required unit fields.");
      return;
    }

    const keywords = keywordsRaw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const updatedUnit = {
      ...currentUnit,
      unitName: unitNameVal,
      uniqueName,
      faction,
      subfactionOrDetachment: subfaction,
      battlefieldRole,
      isEpicHero,
      points,
      models,
      experience,
      rank,
      crusadePoints,
      keywords,
      notes,
      image: image || "",

      weapons: detailWeapons.slice(),
      wargear: detailWargear.slice(),
      battleHonours: detailHonours.slice(),
      battleScars: detailScars.slice()
    };

    crusadeUnits[idx] = updatedUnit;
    currentUnit = updatedUnit;
    saveData();
    renderSummary();
    updateUnitPreview();

    if (headerTitle) {
      const displayName = currentUnit.uniqueName
        ? `${currentUnit.uniqueName} (${currentUnit.unitName})`
        : currentUnit.unitName;
      headerTitle.textContent = displayName;
    }

    alert("Unit datacard updated.");
  });

  // === DELETE UNIT ===
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const ok = window.confirm(
        `Delete unit "${currentUnit.unitName}" from this Crusade roster? This cannot be undone.`
      );
      if (!ok) return;

      crusadeUnits = crusadeUnits.filter(
        (u) => u.id !== currentUnit.id
      );
      saveData();
      window.location.href = "index.html";
    });
  }

  // === JSON PREVIEW ===
  function updateUnitPreview() {
    try {
      preview.value = JSON.stringify(currentUnit, null, 2);
    } catch (err) {
      preview.value = "// Error serializing unit:\n" + String(err);
    }
  }
}

// =========================================
// LOG PAGE (log.html) – campaign log
// =========================================
function initLogPage() {
  const form = document.getElementById("log-form");
  const listEl = document.getElementById("log-list");
  const metaCount = document.getElementById("log-meta-count");
  const metaLatest = document.getElementById("log-meta-latest");

  if (!form || !listEl) return;

  const attackerPlayersSelect =
    document.getElementById("log-attacker-players");
  const defenderPlayersSelect =
    document.getElementById("log-defender-players");
  const filterTeam = document.getElementById("log-filter-team");
  const filterPlayer = document.getElementById("log-filter-player");
  const filterResult = document.getElementById("log-filter-result");
  const filterSearch = document.getElementById("log-filter-search");

  // Populate player multi-selects and filter
  function populatePlayerMulti(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    players.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      selectEl.appendChild(opt);
    });
  }

  function populatePlayerFilterSelect(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const defOpt = document.createElement("option");
    defOpt.value = "";
    defOpt.textContent = "Any player";
    selectEl.appendChild(defOpt);
    players.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      selectEl.appendChild(opt);
    });
  }

  populatePlayerMulti(attackerPlayersSelect);
  populatePlayerMulti(defenderPlayersSelect);
  populatePlayerFilterSelect(filterPlayer);

  // Helper: get selected values from multi-select
  function getSelectedValues(selectEl) {
    if (!selectEl) return [];
    const result = [];
    for (const opt of selectEl.options) {
      if (opt.selected && opt.value) {
        result.push(opt.value);
      }
    }
    return result;
  }

  // Render logs list
  function renderLogs() {
    const teamFilter = filterTeam?.value || "";
    const playerFilter = filterPlayer?.value || "";
    const resultFilter = filterResult?.value || "";
    const search = (filterSearch?.value || "").toLowerCase().trim();

    let logs = [...battleLogs];

    logs.sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) {
        return a.date < b.date ? 1 : -1;
      }
      return b.createdAt - a.createdAt;
    });

    if (teamFilter) {
      logs = logs.filter(
        (log) =>
          log.attackerTeam === teamFilter ||
          log.defenderTeam === teamFilter ||
          log.winnerTeam === teamFilter
      );
    }

    if (playerFilter) {
      logs = logs.filter(
        (log) =>
          log.attackerPlayerIds.includes(playerFilter) ||
          log.defenderPlayerIds.includes(playerFilter)
      );
    }

    if (resultFilter) {
      logs = logs.filter(
        (log) => log.winnerTeam === resultFilter
      );
    }

    if (search) {
      logs = logs.filter((log) => {
        const haystack = [
          log.sessionName || "",
          log.mission || "",
          log.location || "",
          log.notes || ""
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    listEl.innerHTML = "";

    if (!logs.length) {
      const msg = document.createElement("p");
      msg.textContent =
        "No log entries match the current filters.";
      msg.style.color = "#9ca3af";
      msg.style.fontSize = "0.85rem";
      listEl.appendChild(msg);
      if (metaCount) metaCount.textContent = String(battleLogs.length);
      if (metaLatest) {
        metaLatest.textContent =
          battleLogs.length && battleLogs[0].date
            ? battleLogs[0].date
            : "–";
      }
      return;
    }

    logs.forEach((log) => {
      const card = document.createElement("article");
      card.className = "log-card";

      const header = document.createElement("div");
      header.className = "log-card-header";

      const title = document.createElement("div");
      title.className = "log-card-title";
      title.textContent =
        log.sessionName || log.mission || "Unnamed Session";

      const sub = document.createElement("div");
      sub.className = "log-card-sub";
      const dateStr = log.date || "No date";
      const pointsStr = log.pointsLevel
        ? `${log.pointsLevel} pts`
        : "Points n/a";
      sub.textContent = `${dateStr} · ${pointsStr}`;

      header.appendChild(title);
      header.appendChild(sub);

      const metaRow = document.createElement("div");
      metaRow.className = "log-card-meta-row";

      const attackerPill = document.createElement("span");
      attackerPill.className = "log-pill " + log.attackerTeam.toLowerCase();
      attackerPill.textContent = `Attacker: ${log.attackerTeam}`;
      metaRow.appendChild(attackerPill);

      const defenderPill = document.createElement("span");
      defenderPill.className = "log-pill " + log.defenderTeam.toLowerCase();
      defenderPill.textContent = `Defender: ${log.defenderTeam}`;
      metaRow.appendChild(defenderPill);

      const winnerPill = document.createElement("span");
      winnerPill.className = "log-pill winner";
      winnerPill.textContent =
        log.winnerTeam === "Draw"
          ? "Result: Draw"
          : `Winner: ${log.winnerTeam}`;
      metaRow.appendChild(winnerPill);

      if (log.location) {
        const locPill = document.createElement("span");
        locPill.className = "log-pill";
        locPill.textContent = log.location;
        metaRow.appendChild(locPill);
      }

      if (log.mission) {
        const missPill = document.createElement("span");
        missPill.className = "log-pill";
        missPill.textContent = log.mission;
        metaRow.appendChild(missPill);
      }

      const playersRow = document.createElement("div");
      playersRow.className = "log-card-meta-row";

      if (log.attackerPlayerIds.length) {
        const names = log.attackerPlayerIds
          .map((id) => getPlayerNameById(id))
          .join(", ");
        const span = document.createElement("span");
        span.className = "log-pill";
        span.textContent = `Attacker players: ${names}`;
        playersRow.appendChild(span);
      }

      if (log.defenderPlayerIds.length) {
        const names = log.defenderPlayerIds
          .map((id) => getPlayerNameById(id))
          .join(", ");
        const span = document.createElement("span");
        span.className = "log-pill";
        span.textContent = `Defender players: ${names}`;
        playersRow.appendChild(span);
      }

      const footer = document.createElement("div");
      footer.className = "log-card-footer";

      const notes = (log.notes || "").trim();
      if (notes) {
        const maxLen = 260;
        footer.textContent =
          notes.length > maxLen
            ? notes.slice(0, maxLen) + "…"
            : notes;
      } else {
        footer.textContent =
          "No notes recorded for this session yet.";
      }

      card.appendChild(header);
      card.appendChild(metaRow);
      if (playersRow.childElementCount > 0) {
        card.appendChild(playersRow);
      }
      card.appendChild(footer);

      listEl.appendChild(card);
    });

    if (metaCount) metaCount.textContent = String(battleLogs.length);
    if (metaLatest) {
      const sorted = [...battleLogs].sort((a, b) => {
        if (a.date && b.date && a.date !== b.date) {
          return a.date < b.date ? 1 : -1;
        }
        return b.createdAt - a.createdAt;
      });
      metaLatest.textContent =
        sorted.length && sorted[0].date ? sorted[0].date : "–";
    }
  }

  // Initial render
  renderLogs();

  // Filter handlers
  filterTeam && filterTeam.addEventListener("change", renderLogs);
  filterPlayer && filterPlayer.addEventListener("change", renderLogs);
  filterResult && filterResult.addEventListener("change", renderLogs);
  filterSearch && filterSearch.addEventListener("input", renderLogs);

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const date = document.getElementById("log-date").value;
    const sessionName =
      document.getElementById("log-session").value.trim();
    const mission =
      document.getElementById("log-mission").value.trim();
    const location =
      document.getElementById("log-location").value.trim();
    const pointsLevel = Number(
      document.getElementById("log-points").value || 0
    );
    const attackerTeam =
      document.getElementById("log-attacker-team").value;
    const defenderTeam =
      document.getElementById("log-defender-team").value;
    const winnerTeam =
      document.getElementById("log-winner-team").value;
    const notes =
      document.getElementById("log-notes").value.trim();

    const attackerPlayerIds = getSelectedValues(attackerPlayersSelect);
    const defenderPlayerIds = getSelectedValues(defenderPlayersSelect);

    if (!attackerTeam || !defenderTeam || !winnerTeam) {
      alert("Please set attacker team, defender team, and winner.");
      return;
    }

    const logEntry = {
      id: `log_${Date.now()}`,
      createdAt: Date.now(),
      date,
      sessionName,
      mission,
      location,
      pointsLevel: pointsLevel || null,
      attackerTeam,
      defenderTeam,
      winnerTeam,
      attackerPlayerIds,
      defenderPlayerIds,
      notes
    };

    battleLogs.push(logEntry);
    saveData();

    form.reset();
    populatePlayerMulti(attackerPlayersSelect);
    populatePlayerMulti(defenderPlayersSelect);
    renderLogs();
  });
}
