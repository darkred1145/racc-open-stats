// ═══════════════════════════════════════════════════════════════
//  STATE & CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const EMPTY_DATASET = {
    compactData: [],
    tournamentRaceResults: {},
    tournamentWinners: {},
    tournamentBans: {}
};

const AppState = {
    _rawData: [],
    _dataset: null,
    _liveData: [],
    _stats: null,

    get rawData() { return this._rawData; },
    set rawData(v) { this._rawData = v; },

    get dataset() { return this._dataset; },
    set dataset(v) { this._dataset = v; },

    get liveData() { return this._liveData; },
    set liveData(v) { this._liveData = v; },

    get stats() { return this._stats; },
    set stats(v) { this._stats = v; }
};

// ═══════════════════════════════════════════════════════════════
//  DOM HELPERS
// ═══════════════════════════════════════════════════════════════

// --- Helper: Generate Icon HTML ---
function getIconHtml(name, type, outfitName = 'Original') {
    if (!name || name === "Unknown") return "";

    // For uma characters, try to use gametora.com URLs
    if (type === 'uma') {
        const outfitId = getOutfitId(name, outfitName);
        if (outfitId) {
            const baseId = Math.floor(outfitId / 100);
            const gametoraUrl = `https://gametora.com/images/umamusume/characters/chara_stand_${baseId}_${outfitId}.png`;
            const fallbackLogic = "this.onerror=null; this.src='uma/${name.toLowerCase().replace(/['.]/g, '').replace(/\s+/g, '_')}.png';";
            return `<img src="${gametoraUrl}" class="char-icon" loading="lazy" decoding="async" onerror="${fallbackLogic}" alt="">`;
        }
    }

    // Fallback to local icons for trainers or if gametora URL not available
    const fileName = name.toLowerCase()
        .replace(/['.]/g, '')
        .replace(/\s+/g, '_');

    const folder = type === 'uma' ? 'uma' : 'trainer';
    const repoBaseUrl = 'darkred1145.github.io/racc-open-stats';
    const localPath = `${folder}/${fileName}.png`;
    const cdnPath = `https://wsrv.nl/?url=${repoBaseUrl}/${localPath}&w=96&output=webp`;
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const finalSrc = isLocal ? localPath : cdnPath;
    const fallbackLogic = "if (this.src.includes('.png')) { this.src = this.src.replace('.png', '.jpg'); } else if (this.src.includes('.jpg')) { this.src = this.src.replace('.jpg', '.gif'); } else { this.style.display='none'; }";

    return `<img src="${finalSrc}" class="char-icon" loading="lazy" decoding="async" onerror="${fallbackLogic}" alt="">`;
}

// --- Helper: Preload Images ---
function preloadImages(nameList, type) {
    const folder = type === 'uma' ? 'uma' : 'trainer';
    const uniqueNames = [...new Set(nameList)]; 

    uniqueNames.forEach(name => {
        if (!name || name === "Unknown") return;
        const fileName = name.toLowerCase().replace(/['.]/g, '').replace(/\s+/g, '_');
        const img = new Image();
        img.onerror = function() {
            if (this.src.includes('.png')) { this.src = this.src.replace('.png', '.jpg'); } 
            else if (this.src.includes('.jpg')) { this.src = this.src.replace('.jpg', '.gif'); }
        };
        img.src = `${folder}/${fileName}.png`;
    });
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

function withButtonLoading(button, loadingText) {
    if (!button) return () => {};

    const originalState = {
        html: button.innerHTML,
        disabled: button.disabled,
        opacity: button.style.opacity
    };

    button.innerHTML = loadingText;
    button.disabled = true;
    button.style.opacity = "0.7";

    return () => {
        button.innerHTML = originalState.html;
        button.disabled = originalState.disabled;
        button.style.opacity = originalState.opacity;
    };
}

function safeSetHtml(id, value) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = value;
}

// --- Helper: Distance Category ---
function getDistanceCategory(surfaceString) {
    const match = surfaceString.match(/(\d+)m/);
    if (!match) return "Unknown";
    const dist = parseInt(match[1]);

    if (dist <= 1400) return "Short";
    if (dist <= 1800) return "Mile";
    if (dist <= 2400) return "Medium";
    return "Long";
}

// --- Formatting Helper ---
function formatName(fullName, type = 'uma') {
    if (!fullName) return "Unknown";

    let mainName = fullName;
    let variantHtml = "";
    let outfitName = 'Original';

    if (fullName.includes('(')) {
        const parts = fullName.split('(');
        mainName = parts[0].trim();
        const variant = parts[1].replace(')', '').trim();
        variantHtml = ` <span class="variant-tag">${variant}</span>`;
        outfitName = variant;
    }

    const icon = getIconHtml(mainName, type, outfitName);

    return `<div class="name-cell">${icon}${mainName}${variantHtml}</div>`;
}

// ═══════════════════════════════════════════════════════════════
//  LIVE DATA (FIREBASE)
// ═══════════════════════════════════════════════════════════════

// --- FIREBASE LIVE DATA LISTENER ---
window.addEventListener('liveDataReady', (e) => {
    AppState.liveData = e.detail; 
    renderLiveTournaments();
});

function renderLiveTournaments() {
    const container = document.getElementById('liveDataOutput');
    if (!container) return;
    
    if (AppState.liveData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px;">No live tournaments found.</div>`;
        return;
    }

    let html = '';

    AppState.liveData.forEach(t => {
        // Ensure all iterable fields are strictly arrays to prevent Firebase coercion errors
        const tPlayers = Array.isArray(t.players) ? t.players : (t.players ? Object.values(t.players) : []);
        const tRaces = Array.isArray(t.races) ? t.races : (t.races ? Object.values(t.races) : []);
        const tBans = Array.isArray(t.bans) ? t.bans : (t.bans ? Object.values(t.bans) : []);
        const tTeams = Array.isArray(t.teams) ? t.teams : (t.teams ? Object.values(t.teams) : []);

        const playerMap = {};
        tPlayers.forEach(p => {
            playerMap[p.id] = { name: p.name, uma: p.uma };
        });

        html += `<div class="live-tourney-card">`;
        
        // --- 1. HEADER ---
        let statusClass = t.status === 'active' ? 'status-active' : 'status-completed';
        html += `
            <div class="live-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h2>${t.name}</h2>
                    <span class="live-badge ${statusClass}">${t.status.toUpperCase()}</span>
                </div>
                
                <button onclick="copyTournamentResults('${t.id}')" class="copy-btn" title="Copy Results to Clipboard">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Text</span>
                </button>
            </div>
            <div class="live-meta">
                <span><strong>Stage:</strong> ${t.stage || '-'}</span>
                <span><strong>Teams:</strong> ${tTeams.length}</span>
                <span><strong>ID:</strong> <span style="font-family:monospace; opacity:0.7;">${t.id}</span></span>
            </div>
        `;

        // --- 2. LIVE BANS ---
        if (tBans.length > 0) {
            const banHtml = tBans.map(b => `<span class="variant-tag" style="border: 1px solid var(--border-color); font-size: 0.85em; padding: 4px 8px;">🚫 ${b}</span>`).join('');
            html += `
            <div style="margin-bottom: 20px;">
                <strong style="color: var(--accent-color); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em;">Banned Umas</strong>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">${banHtml}</div>
            </div>`;
        }

        // --- 3. INDIVIDUAL RACE RESULTS ---
        if (tRaces.length > 0) {
            const groupOrder = { 'A': 1, 'B': 2, 'C': 3, 'Finals': 4 };
            const sortedRaces = [...tRaces].sort((a, b) => {
                const rankA = groupOrder[a.group] || 99;
                const rankB = groupOrder[b.group] || 99;
                if (rankA !== rankB) return rankA - rankB;
                return a.raceNumber - b.raceNumber;
            });

            html += `<div class="table-wrapper">
                <table class="live-table">
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th style="width:65px;">Group</th>
                            <th>Race Results</th>
                        </tr>
                    </thead>
                    <tbody>`;

            sortedRaces.forEach(race => {
                const resultsArray = Object.entries(race.placements || {});
                resultsArray.sort((a, b) => a[1] - b[1]);

                const resultItems = resultsArray.map(([pid, rank]) => {
                    const pInfo = playerMap[pid] || { name: "Unknown", uma: "?" };
                    let rankColor = '';
                    if(rank === 1) rankColor = '#ffd700';
                    if(rank === 2) rankColor = '#c0c0c0';
                    if(rank === 3) rankColor = '#cd7f32';
                    
                    const style = rankColor ? `style="color:${rankColor}; font-weight:bold;"` : '';
                    
                    return `<div class="live-result-row">
                        <span class="lr-rank" ${style}>${rank}.</span>
                        <span class="lr-name">${pInfo.name}</span>
                        <span class="lr-uma">[${pInfo.uma}]</span>
                    </div>`;
                }).join('');

                html += `<tr>
                    <td style="text-align:center; font-weight:bold; color:var(--accent-color);">${race.raceNumber}</td>
                    <td style="text-align:center;">${race.group}</td>
                    <td><div class="live-results-grid">${resultItems}</div></td>
                </tr>`;
            });

            html += `</tbody></table></div>`;
        } else {
            html += `<div style="padding:15px; opacity:0.6; font-style:italic; border: 1px dashed var(--border-color); border-radius: 8px; text-align: center;">No individual race results uploaded yet.</div>`;
        }

        html += `</div>`; 
    });

    container.innerHTML = html;
}

// --- Copy to Clipboard Logic ---
function copyTournamentResults(tournamentId) {
    const tournament = AppState.liveData.find(t => t.id === tournamentId);
    if (!tournament) return;
    let text = `${tournament.name}\n\n`;
    
    const tPlayers = Array.isArray(tournament.players) ? tournament.players : (tournament.players ? Object.values(tournament.players) : []);
    const tRaces = Array.isArray(tournament.races) ? tournament.races : (tournament.races ? Object.values(tournament.races) : []);

    const getPlayer = (id) => {
        const p = tPlayers.find(pl => pl.id === id);
        return p ? { name: p.name, uma: p.uma || "Unknown" } : { name: "Unknown", uma: "Unknown" };
    };

    const groups = ["A", "B", "C", "Finals"];
    groups.forEach(group => {
        const races = tRaces.filter(r => {
            if (group === "Finals") return r.stage === "finals";
            return r.group === group && r.stage === "groups";
        });
        races.sort((a, b) => a.raceNumber - b.raceNumber);

        if (races.length > 0) {
            races.forEach(race => {
                const groupName = group === "Finals" ? "Finals" : `Group ${group}`;
                text += `${groupName} Round ${race.raceNumber}\n`;

                const placements = Object.entries(race.placements || {})
                    .map(([id, rank]) => ({ id, rank: Number(rank) }))
                    .sort((a, b) => a.rank - b.rank);

                placements.forEach(p => {
                    const player = getPlayer(p.id);
                    text += `${p.rank}. ${player.name} [${player.uma}]\n`;
                });
                text += "\n"; 
            });
        }
    });

    navigator.clipboard.writeText(text.trim())
        .then(() => alert("Results copied to clipboard!"))
        .catch(err => {
            console.error("Clipboard copy failed:", err);
            alert("Failed to copy. See console.");
        });
}

// ═══════════════════════════════════════════════════════════════
//  DATA PIPELINE (SEASON SWITCH, FILTER, ACCESS)
// ═══════════════════════════════════════════════════════════════

// --- SEASON SWITCHER LOGIC ---
function switchSeason() {
    const seasonEl = document.getElementById('seasonSelector');
    if (!seasonEl) return;
    const season = seasonEl.value;
    
    const s1 = typeof S1_DATA !== 'undefined' ? S1_DATA : EMPTY_DATASET;
    const s2 = typeof S2_DATA !== 'undefined' ? S2_DATA : EMPTY_DATASET;

    if (season === 's1') {
        AppState.dataset = s1;
    } else if (season === 's2') {
        AppState.dataset = s2;
    } else if (season === 'all') {
        AppState.dataset = {
            compactData: [...(s1.compactData || []), ...(s2.compactData || [])],
            tournamentRaceResults: { ...(s1.tournamentRaceResults || {}), ...(s2.tournamentRaceResults || {}) },
            tournamentWinners: { ...(s1.tournamentWinners || {}), ...(s2.tournamentWinners || {}) },
            tournamentBans: { ...(s1.tournamentBans || {}), ...(s2.tournamentBans || {}) }
        };
    }

    if (AppState.dataset && AppState.dataset.compactData) {
        const umaToPreload = [];
        const trainerToPreload = [];

        AppState.rawData = AppState.dataset.compactData.map(r => {
            let umaBase = r[1];
            if(umaBase.includes('(')) umaBase = umaBase.split('(')[0].trim();
            umaToPreload.push(umaBase);
            trainerToPreload.push(r[0]);

            const distCat = getDistanceCategory(r[3]);
            return {
                Trainer: r[0],
                UniqueName: r[1],
                Wins: r[2],
                Surface: r[3],
                RawLength: r[4], 
                DistanceCategory: distCat,
                UmaPick: r[5],
                Variant: r[6],
                RacesRun: r[7] 
            };
        });
        preloadImages(umaToPreload, 'uma'); 
        preloadImages(trainerToPreload, 'trainer'); 
    } else {
        AppState.rawData = [];
    }

    updateData();
    if (document.getElementById('points-table-body')) renderStatsTable();
}

// ═══════════════════════════════════════════════════════════════
//  UI CONTROLLERS (TABS, TIER VIEWS, FILTER, THEME)
// ═══════════════════════════════════════════════════════════════

// --- UI Logic: Tabs ---
function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
    });
    
    const targetSection = document.getElementById(tabId);
    if (targetSection) targetSection.classList.add('active');

    const tabBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (tabBtn) {
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
    }
    
    if (tabId === 'theorycrafter' && typeof generateTheorycraft === 'function') generateTheorycraft(); 
}

document.querySelector('.tabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (tab) switchTab(tab.dataset.tab);
});

function setTierView(index) {
    const buttons = document.querySelectorAll('.switch-option');
    buttons.forEach((btn, i) => {
        if (i === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const glider = document.getElementById('tierGlider');
    if(glider) glider.style.transform = `translateX(${index * 100}%)`;

    const views = ['view-wr', 'view-dom', 'view-champ'];
    views.forEach((viewId, i) => {
        const el = document.getElementById(viewId);
        if(el) {
            if (i === index) el.classList.add('active');
            else el.classList.remove('active');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
//  STATS ENGINE (COMPUTATION, CLASSIFICATION)
// ═══════════════════════════════════════════════════════════════

// --- Calculate Points & Beat Rate & Placements ---
function getChampionshipPoints(activeTournaments, filteredData) {
    let stats = { trainer: {}, uma: {} };
    if (!AppState.dataset.tournamentRaceResults) return stats;

    const lookupMap = {};
    filteredData.forEach(row => {
        const key = `${row.RawLength}_${row.Trainer}`;
        lookupMap[key] = row.UniqueName;
    });

    for (const [tournamentName, stages] of Object.entries(AppState.dataset.tournamentRaceResults)) {
        if (!activeTournaments.has(tournamentName)) continue;

        for (const [stageName, races] of Object.entries(stages)) {
            races.forEach((raceResult) => {
                const lobbySize = raceResult.length; 
                const possibleOpponents = lobbySize - 1;

                raceResult.forEach((player, rankIndex) => {
                    if (player.includes("Player") || player === "DQ" || player === "NPC-chan") return;

                    const rank = rankIndex + 1;
                    const opponentsBeaten = (lobbySize - 1) - rankIndex;
                    const key = `${tournamentName}_${player}`;
                    const umaName = lookupMap[key] || "Unknown";
                    
                    let ptsEarned = 0;
                    if (rankIndex < POINTS_SYSTEM.length) { ptsEarned = POINTS_SYSTEM[rankIndex]; }

                    // Trainer stats accumulation
                    if (!stats.trainer[player]) {
                        stats.trainer[player] = { 
                            points: 0, races: 0, beaten: 0, totalOpp: 0, positions: [], 
                            history: [], tourneyPoints: {},
                            umaStats: {}, tourneyStats: {}
                        };
                    }
                    stats.trainer[player].points += ptsEarned;
                    stats.trainer[player].tourneyPoints[tournamentName] = (stats.trainer[player].tourneyPoints[tournamentName] || 0) + ptsEarned;
                    stats.trainer[player].races += 1;
                    stats.trainer[player].beaten += opponentsBeaten;
                    stats.trainer[player].totalOpp += possibleOpponents;
                    stats.trainer[player].positions.push(rank);
                    stats.trainer[player].history.push({ tournament: tournamentName, group: stageName, rank: rank, uma: umaName });

                    // Detailed Uma Stats Per Trainer
                    if (!stats.trainer[player].umaStats[umaName]) {
                        stats.trainer[player].umaStats[umaName] = { points: 0, races: 0, beaten: 0, totalOpp: 0, positions: [] };
                    }
                    stats.trainer[player].umaStats[umaName].points += ptsEarned;
                    stats.trainer[player].umaStats[umaName].races += 1;
                    stats.trainer[player].umaStats[umaName].beaten += opponentsBeaten;
                    stats.trainer[player].umaStats[umaName].totalOpp += possibleOpponents;
                    stats.trainer[player].umaStats[umaName].positions.push(rank);

                    // Detailed Tourney Stats Per Trainer
                    if (!stats.trainer[player].tourneyStats[tournamentName]) {
                        stats.trainer[player].tourneyStats[tournamentName] = { points: 0, beaten: 0, totalOpp: 0, umas: new Set() };
                    }
                    stats.trainer[player].tourneyStats[tournamentName].points += ptsEarned;
                    stats.trainer[player].tourneyStats[tournamentName].beaten += opponentsBeaten;
                    stats.trainer[player].tourneyStats[tournamentName].totalOpp += possibleOpponents;
                    stats.trainer[player].tourneyStats[tournamentName].umas.add(umaName);

                    // Uma global stats accumulation
                    if (umaName !== "Unknown") {
                        if (!stats.uma[umaName]) {
                            stats.uma[umaName] = { points: 0, races: 0, beaten: 0, totalOpp: 0, positions: [], history: [], tourneyPoints: {} };
                        }
                        stats.uma[umaName].points += ptsEarned;
                        stats.uma[umaName].tourneyPoints[tournamentName] = (stats.uma[umaName].tourneyPoints[tournamentName] || 0) + ptsEarned;
                        stats.uma[umaName].races += 1;
                        stats.uma[umaName].beaten += opponentsBeaten;
                        stats.uma[umaName].totalOpp += possibleOpponents;
                        stats.uma[umaName].positions.push(rank);
                    }
                });
            });
        }
    }
    return stats;
}

// --- Pure Computation Functions ---
function computeWinRate(wins, totalRacesRun) {
    return totalRacesRun > 0 ? (wins / totalRacesRun * 100) : 0;
}

function computeDominance(beaten, totalOpp) {
    return totalOpp > 0 ? (beaten / totalOpp * 100) : 0;
}

function computeAvgRank(positions) {
    if (!positions || positions.length === 0) return null;
    return positions.reduce((a, b) => a + b, 0) / positions.length;
}

function computeVolatility(positions) {
    if (!positions || positions.length === 0) return null;
    if (positions.length === 1) return positions[0];
    const mean = computeAvgRank(positions);
    const variance = positions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / positions.length;
    const stdDev = Math.sqrt(variance);
    let lower = Math.max(1, Math.round(mean - stdDev));
    let upper = Math.round(mean + stdDev);
    return lower === upper ? lower : [lower, upper];
}

function computePodiumRate(positions) {
    if (!positions || positions.length === 0) return 0;
    return (positions.filter(p => p <= 3).length / positions.length) * 100;
}

function computePickRate(picks, validEntries) {
    return validEntries > 0 ? (picks / validEntries * 100) : 0;
}

function computeTruePickRate(picks, validEntries, bannedEntries) {
    const available = validEntries - bannedEntries;
    return available > 0 ? (picks / available * 100) : 0;
}

function computeTourneyWinPct(tourneyWins, total) {
    return total > 0 ? (tourneyWins / total * 100) : 0;
}

function computeBanRate(bans, validTourneys) {
    return validTourneys > 0 ? (bans / validTourneys * 100) : 0;
}

function computePresenceRate(pickedSet, bannedSet, validTournaments) {
    const combined = new Set([...pickedSet, ...bannedSet]);
    return validTournaments > 0 ? (combined.size / validTournaments * 100) : 0;
}

function findBestTourney(tourneyPoints) {
    if (!tourneyPoints) return null;
    let best = null, maxPts = -1;
    for (const [name, pts] of Object.entries(tourneyPoints)) {
        if (pts > maxPts) { maxPts = pts; best = name; }
    }
    return best;
}

function getReleaseIndex(umaName) {
    if (typeof UMA_RELEASE_MAP === 'undefined' || !UMA_RELEASE_MAP[umaName]) return 0;
    if (typeof TOURNAMENT_ORDER === 'undefined') return 0;
    const idx = TOURNAMENT_ORDER.indexOf(UMA_RELEASE_MAP[umaName]);
    return idx === -1 ? 0 : idx;
}

function countValidTournaments(activeTournaments, releaseIndex) {
    let count = 0, entries = 0;
    if (typeof TOURNAMENT_ORDER === 'undefined') { return { count: activeTournaments.size, entries: 0 }; }
    activeTournaments.forEach(tId => {
        const tIdx = TOURNAMENT_ORDER.indexOf(tId);
        if (tIdx === -1 || tIdx >= releaseIndex) { count++; }
    });
    return { count, entries };
}

// --- Core Logic: Statistics Calculation ---
function calculateStats(filteredData) {
    const umaMap = {};
    const trainerMap = {};
    const activeTournaments = new Set();
    const tourneyEntryCount = {}; 
    const totalEntries = filteredData.length;

    filteredData.forEach(row => {
        activeTournaments.add(row.RawLength);
        tourneyEntryCount[row.RawLength] = (tourneyEntryCount[row.RawLength] || 0) + 1;
    });

    const pointsData = getChampionshipPoints(activeTournaments, filteredData);

    filteredData.forEach(row => {
        if (!umaMap[row.UniqueName]) { 
            umaMap[row.UniqueName] = { name: row.UniqueName, picks: 0, wins: 0, totalRacesRun: 0, tourneyWins: 0, bans: 0, pickedInTourneys: new Set(), bannedInTourneys: new Set() }; 
        }
        umaMap[row.UniqueName].picks++;
        umaMap[row.UniqueName].wins += row.Wins;
        umaMap[row.UniqueName].totalRacesRun += row.RacesRun;
        umaMap[row.UniqueName].pickedInTourneys.add(row.RawLength);

        if (AppState.dataset.tournamentWinners && AppState.dataset.tournamentWinners[row.RawLength] && AppState.dataset.tournamentWinners[row.RawLength].includes(row.Trainer)) {
            umaMap[row.UniqueName].tourneyWins++;
        }

        if (!trainerMap[row.Trainer]) {
            trainerMap[row.Trainer] = { name: row.Trainer, entries: 0, wins: 0, totalRacesRun: 0, characterHistory: {}, playedTourneys: new Set(), tournamentWins: 0 };
        }
        let t = trainerMap[row.Trainer];
        t.entries++;
        t.wins += row.Wins;
        t.totalRacesRun += row.RacesRun;
        t.playedTourneys.add(row.RawLength);

        if (!t.characterHistory[row.UniqueName]) t.characterHistory[row.UniqueName] = { picks: 0, wins: 0, racesRun: 0 };
        t.characterHistory[row.UniqueName].picks++;
        t.characterHistory[row.UniqueName].wins += row.Wins;
        t.characterHistory[row.UniqueName].racesRun += row.RacesRun;
    });

    Object.values(trainerMap).forEach(t => {
        t.playedTourneys.forEach(tourneyID => {
            if (AppState.dataset.tournamentWinners && AppState.dataset.tournamentWinners[tourneyID] && AppState.dataset.tournamentWinners[tourneyID].includes(t.name)) {
                t.tournamentWins++;
            }
        });
    });

    if (AppState.dataset.tournamentBans) {
        Object.keys(AppState.dataset.tournamentBans).forEach(tourneyID => {
            if (activeTournaments.has(tourneyID)) {
                AppState.dataset.tournamentBans[tourneyID].forEach(umaName => {
                    if (!umaMap[umaName]) { umaMap[umaName] = { name: umaName, picks: 0, wins: 0, totalRacesRun: 0, tourneyWins: 0, bans: 0, pickedInTourneys: new Set(), bannedInTourneys: new Set() }; }
                    umaMap[umaName].bans++;
                    umaMap[umaName].bannedInTourneys.add(tourneyID);
                });
            }
        });
    }

const formatRawData = (item) => {
        const pStats = pointsData.uma[item.name];
        const releaseIdx = getReleaseIndex(item.name);
        const tournamentInfo = countValidTournaments(activeTournaments, releaseIdx);

        let validBanTourneysAfterRelease = 0, validEntriesForUma = 0;
        if (AppState.dataset.tournamentBans) {
            Object.keys(AppState.dataset.tournamentBans).forEach(tId => {
                if (activeTournaments.has(tId)) {
                    const tIdx = typeof TOURNAMENT_ORDER !== 'undefined' ? TOURNAMENT_ORDER.indexOf(tId) : -1;
                    if (tIdx === -1 || tIdx >= releaseIdx) validBanTourneysAfterRelease++;
                }
            });
        }

        activeTournaments.forEach(tId => {
            const tIdx = typeof TOURNAMENT_ORDER !== 'undefined' ? TOURNAMENT_ORDER.indexOf(tId) : -1;
            if (tIdx === -1 || tIdx >= releaseIdx) validEntriesForUma += (tourneyEntryCount[tId] || 0);
        });

        let bannedEntriesAfterRelease = 0;
        item.bannedInTourneys.forEach(tId => {
            const tIdx = typeof TOURNAMENT_ORDER !== 'undefined' ? TOURNAMENT_ORDER.indexOf(tId) : -1;
            if (tIdx === -1 || tIdx >= releaseIdx) bannedEntriesAfterRelease += (tourneyEntryCount[tId] || 0);
        });

        return {
            pStats,
            releaseIdx,
            validTournamentsForUma: tournamentInfo.count,
            validEntriesForUma,
            validBanTourneysAfterRelease,
            bannedEntriesAfterRelease
        };
    };

    const formatRawDataTrainer = (item) => {
        return { pStats: pointsData.trainer[item.name] };
    };

    const formatItem = (item, type) => {
        const raw = type === 'uma' ? formatRawData(item) : formatRawDataTrainer(item);
        const pStats = raw.pStats;

        const winRate = computeWinRate(item.wins, item.totalRacesRun);
        const avgPos = pStats ? computeAvgRank(pStats.positions) : null;
        const podiumRate = pStats ? computePodiumRate(pStats.positions) : 0;
        const dominance = pStats ? computeDominance(pStats.beaten, pStats.totalOpp) : 0;
        const tourneyWinPct = type === 'uma'
            ? computeTourneyWinPct(item.tourneyWins, item.picks)
            : computeTourneyWinPct(item.tournamentWins, item.playedTourneys.size);
        const bestTourney = pStats ? findBestTourney(pStats.tourneyPoints) : null;

        const stats = {
            ...item,
            displayName: formatName(item.name, type === 'trainer' ? 'trainer' : 'uma'),
            winRate: winRate.toFixed(1),
            podiumRate: podiumRate.toFixed(1),
            dom: dominance.toFixed(1),
            avgPos: avgPos !== null ? avgPos.toFixed(2) : "-",
            volatility: formatVolatility(pStats ? pStats.positions : null),
            bestTourney: bestTourney || "-",
            tourneyWinPct: tourneyWinPct.toFixed(1),
            detailedUmaStats: pStats ? pStats.umaStats : {},
            detailedTourneyStats: pStats ? pStats.tourneyStats : {}
        };

        if (type === 'uma') {
            const wPct = tourneyWinPct.toFixed(1);
            stats.tourneyStatsDisplay = `${wPct}% <span style="font-size:0.8em; color:var(--text-color); opacity:0.7;">(${item.tourneyWins}/${item.picks})</span>`;

            const pickPct = computePickRate(item.picks, raw.validEntriesForUma);
            stats.pickPct = pickPct.toFixed(1);

            const banRate = computeBanRate(item.bans, raw.validBanTourneysAfterRelease);
            stats.banStatsDisplay = `${banRate.toFixed(1)}% <span style="font-size:0.8em; color:var(--text-color); opacity:0.7;">(${item.bans}/${raw.validBanTourneysAfterRelease})</span>`;

            const presenceRate = computePresenceRate(item.pickedInTourneys, item.bannedInTourneys, raw.validTournamentsForUma);
            stats.presenceDisplay = `${presenceRate.toFixed(1)}% <span style="font-size:0.8em; color:var(--text-color); opacity:0.7;">(${new Set([...item.pickedInTourneys, ...item.bannedInTourneys]).size}/${raw.validTournamentsForUma})</span>`;

            const truePickPct = computeTruePickRate(item.picks, raw.validEntriesForUma, raw.bannedEntriesAfterRelease);
            stats.truePickPct = truePickPct.toFixed(1);
        }

        if (type === 'trainer') {
            const pickPct = computePickRate(item.entries, totalEntries);
            stats.pickPct = pickPct.toFixed(1);

            const wPct = tourneyWinPct.toFixed(1);
            stats.tourneyStatsDisplay = `${wPct}% <span style="font-size:0.8em; color:var(--text-color); opacity:0.7;">(${item.tournamentWins}/${item.playedTourneys.size})</span>`;

            const historyArr = Object.entries(item.characterHistory).map(([key, val]) => ({ name: key, ...val }));
            historyArr.sort((a, b) => b.picks - a.picks);
            const fav = historyArr[0];
            stats.favorite = fav ? `${formatName(fav.name, 'uma')} <span class="stat-badge">x${fav.picks}</span>` : '-';

            historyArr.sort((a, b) => b.wins - a.wins || a.picks - b.picks);
            const best = historyArr[0];
            stats.ace = (best && best.wins > 0) ? `${formatName(best.name, 'uma')} <span class="stat-badge win-badge">★${best.wins}</span>` : '<span style="color:var(--text-color); opacity:0.5;">-</span>';
        }

        return stats;
    };

    function formatVolatility(positions) {
        if (!positions || positions.length === 0) return "-";
        const vol = computeVolatility(positions);
        if (vol === null) return "-";
        if (Array.isArray(vol)) {
            return `${vol[0]}${getOrdinal(vol[0])} - ${vol[1]}${getOrdinal(vol[1])}`;
        }
        return `${vol}${getOrdinal(vol)}`;
    }

    return {
        umaStats: Object.values(umaMap).map(i => formatItem(i, 'uma')),
        trainerStats: Object.values(trainerMap).map(i => formatItem(i, 'trainer'))
    };
}

// ═══════════════════════════════════════════════════════════════
//  RENDERERS (TABLES, TIER LISTS, CHAMPIONSHIP, CSV)
// ═══════════════════════════════════════════════════════════════

const TABLE_CONFIGS = {
    uma: {
        core: [
            { key: "name", label: "Name" },
            { key: "picks", label: "Picks", numeric: true },
            { key: "wins", label: "Wins", numeric: true },
            { key: "winRate", label: "Win Rate %", numeric: true },
            { key: "podiumRate", label: "Top 3 %", numeric: true },
            { key: "dom", label: "Dominance %", numeric: true }
        ],
        extended: [
            { key: "name", label: "Name" },
            { key: "picks", label: "Picks", numeric: true },
            { key: "wins", label: "Wins", numeric: true },
            { key: "winRate", label: "Win Rate %", numeric: true },
            { key: "avgPos", label: "Avg Rank", numeric: true },
            { key: "volatility", label: "Typical Finish", numeric: true },
            { key: "bestTourney", label: "Best Tourney" },
            { key: "tourneyStatsDisplay", label: "Tourney Win %" }
        ],
        meta: [
            { key: "name", label: "Name" },
            { key: "pickPct", label: "Pick Rate %", numeric: true },
            { key: "truePickPct", label: "True Pick %", numeric: true },
            { key: "dom", label: "Dominance %", numeric: true },
            { key: "banStatsDisplay", label: "Ban Rate" },
            { key: "presenceDisplay", label: "Presence" }
        ]
    },
    trainer: {
        core: [
            { key: "name", label: "Trainer" },
            { key: "entries", label: "Entries", numeric: true },
            { key: "wins", label: "Wins", numeric: true },
            { key: "winRate", label: "Win Rate %", numeric: true },
            { key: "podiumRate", label: "Top 3 %", numeric: true },
            { key: "dom", label: "Dominance %", numeric: true }
        ],
        performance: [
            { key: "name", label: "Trainer" },
            { key: "avgPos", label: "Avg Rank", numeric: true },
            { key: "volatility", label: "Typical Finish", numeric: true },
            { key: "bestTourney", label: "Best Tourney" },
            { key: "tourneyStatsDisplay", label: "Tourney Win %" },
            { key: "dom", label: "Dominance %", numeric: true }
        ],
        picks: [
            { key: "name", label: "Trainer" },
            { key: "entries", label: "Entries", numeric: true },
            { key: "favorite", label: "Most Picked" },
            { key: "ace", label: "Best Uma" }
        ]
    }
};

function renderTable(tableId, data, columns) {
    const table = document.getElementById(tableId);
    const thead = table ? table.querySelector("thead") : null;
    const tbody = table ? table.querySelector("tbody") : null;
    if (!thead || !tbody) return;

    thead.innerHTML = `<tr>${columns.map((col, index) =>
        `<th onclick="sortTable('${tableId}', ${index}${col.numeric ? ", true" : ""})">${col.label}</th>`
    ).join("")}</tr>`;

    tbody.innerHTML = data.map(row => {
        const cells = columns.map(col => {
            if (col.key === "name") return `<td>${row.displayName}</td>`;
            if (["winRate", "dom", "tourneyWinPct", "pickPct", "truePickPct", "podiumRate"].includes(col.key)) return `<td>${row[col.key]}%</td>`;
            return `<td>${row[col.key]}</td>`;
        });
        return `<tr>${cells.join("")}</tr>`;
    }).join('');
}

const TIER_CONFIGS = {
    winRate: [
        { label: 'S', min: 20 }, { label: 'A', min: 15 }, { label: 'B', min: 10 },
        { label: 'C', min: 5 }, { label: 'D', min: 1.1 }, { label: 'F', min: 0 }
    ],
    tourneyWinPct: [
        { label: 'S', min: 40 }, { label: 'A', min: 30 }, { label: 'B', min: 20 },
        { label: 'C', min: 10 }, { label: 'D', min: 0.1 }, { label: 'F', min: 0 }
    ],
    dominance: [
        { label: 'S', min: 65 }, { label: 'A', min: 50 }, { label: 'B', min: 35 },
        { label: 'C', min: 20 }, { label: 'D', min: 15.1 }, { label: 'F', min: 0 }
    ]
};

function classifyTier(val, sortKey) {
    const config = sortKey === 'winRate' ? TIER_CONFIGS.winRate
        : sortKey === 'tourneyWinPct' ? TIER_CONFIGS.tourneyWinPct
        : TIER_CONFIGS.dominance;
    for (const t of config) {
        if (val >= t.min) return t.label;
    }
    return config[config.length - 1].label;
}

function renderTierList(containerId, data, countKey, minReq, sortKey) {
    const tiers = { S: [], A: [], B: [], C: [], D: [], F: [] };

    data.forEach(item => {
        if (item[countKey] < minReq) return;
        const val = parseFloat(item[sortKey]); 
        tiers[classifyTier(val, sortKey)].push(item);
    });

    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';

    ['S', 'A', 'B', 'C', 'D', 'F'].forEach(tier => {
        if (tiers[tier].length === 0) return;
        tiers[tier].sort((a, b) => b[sortKey] - a[sortKey]);
        html += `
            <div class="tier-row">
                <div class="tier-label tier-${tier}">${tier}</div>
                <div class="tier-content">
                    ${tiers[tier].map(i => `<span class="tier-item">${i.displayName} <b>${i[sortKey]}%</b></span>`).join('')}
                </div>
            </div>`;
    });

    if (html === '') html = '<div style="padding:15px; color:var(--text-color); opacity:0.6; text-align:center;">No data fits these criteria.</div>';
    container.innerHTML = html;
}

// --- Filter Controller ---
const FilterReader = {
    get surface() { return document.getElementById('surfaceFilter')?.value || 'All'; },
    get length() { return document.getElementById('lengthFilter')?.value || 'All'; },
    get minEntries() { return document.getElementById('minEntries')?.value || 5; },
    get searchQuery() { return document.getElementById('searchInput')?.value.toLowerCase() || ''; },

    updateLabel() {
        const el = document.getElementById('minEntriesVal');
        if (el) el.textContent = this.minEntries;
    },

    getView(tableId) {
        return document.getElementById(tableId)?.value || 'core';
    }
};

function updateData() {
    const surface = FilterReader.surface;
    const length = FilterReader.length;
    const minEntries = FilterReader.minEntries;
    const searchQuery = FilterReader.searchQuery;
    FilterReader.updateLabel();

    const filtered = AppState.rawData.filter(d => {
        if (d.Trainer === "DQ") return false;
        const surfaceMatch = (surface === 'All' || d.Surface.includes(surface));
        const lengthMatch = (length === 'All' || d.DistanceCategory === length);
        const searchMatch = searchQuery === "" || d.Trainer.toLowerCase().includes(searchQuery) || d.UniqueName.toLowerCase().includes(searchQuery);

        return surfaceMatch && lengthMatch && searchMatch;
    });

    const stats = calculateStats(filtered);
    AppState.stats = stats;

    if (document.getElementById('umaTable')) {
        const view = FilterReader.getView('umaStatsView');
        stats.umaStats.sort((a, b) => b.dom - a.dom);
        renderTable('umaTable', stats.umaStats, TABLE_CONFIGS.uma[view] || TABLE_CONFIGS.uma.core);
    }

    if (document.getElementById('trainerTable')) {
        const view = FilterReader.getView('trainerStatsView');
        stats.trainerStats.sort((a, b) => b.dom - a.dom);
        renderTable('trainerTable', stats.trainerStats, TABLE_CONFIGS.trainer[view] || TABLE_CONFIGS.trainer.core);
    }

    if (document.getElementById('umaTierListWR')) {
        renderTierList('umaTierListWR', stats.umaStats, 'picks', minEntries, 'winRate');
        renderTierList('trainerTierListWR', stats.trainerStats, 'entries', minEntries, 'winRate');
        renderTierList('umaTierListDom', stats.umaStats, 'picks', minEntries, 'dom');
        renderTierList('trainerTierListDom', stats.trainerStats, 'entries', minEntries, 'dom');
        renderTierList('umaTierListChamp', stats.umaStats, 'picks', minEntries, 'tourneyWinPct');
        renderTierList('trainerTierListChamp', stats.trainerStats, 'entries', minEntries, 'tourneyWinPct');
    }
    
    if (typeof populateTrainerDropdown === 'function') populateTrainerDropdown(); 
    if (typeof populateTheorycrafterDropdown === 'function' && document.getElementById('tcrafTrainerSelector')) { populateTheorycrafterDropdown(); }
    if (typeof populateSimDropdowns === 'function' && document.getElementById('simTypeSelector')) { populateSimDropdowns(); }
}

let sortState = {};
function sortTable(tableId, colIndex, isNumeric = false) {
    const key = tableId + colIndex;
    sortState[key] = !sortState[key];
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    const rows = Array.from(tbody.rows);

    rows.sort((a, b) => {
        let x = a.cells[colIndex].innerText;
        let y = b.cells[colIndex].innerText;

        if (isNumeric) {
            x = parseFloat(x.split(' ')[0].replace(/[^\d.-]/g, ''));
            y = parseFloat(y.split(' ')[0].replace(/[^\d.-]/g, ''));
        }
        if (isNaN(x)) x = 0; if (isNaN(y)) y = 0;
        return sortState[key] ? (x < y ? -1 : 1) : (x > y ? -1 : 1);
    });
    tbody.append(...rows);

    const header = document.querySelector(`#${tableId} th:nth-child(${colIndex + 1})`);
    if (header) header.setAttribute('aria-sort', sortState[key] ? 'ascending' : 'descending');
}

function switchTheme() {
    const theme = document.getElementById('themeSelector').value;
    if (theme) { document.body.setAttribute('data-theme', theme); localStorage.setItem('siteTheme', theme); } 
    else { document.body.removeAttribute('data-theme'); localStorage.removeItem('siteTheme'); }
}

function calculateIndividualStats() {
    let stats = {};
    const searchEl = document.getElementById('searchInput');
    const searchQuery = searchEl ? searchEl.value.toLowerCase() : "";
    
    if (AppState.dataset && AppState.dataset.tournamentRaceResults) {
        for (const [tournamentName, stages] of Object.entries(AppState.dataset.tournamentRaceResults)) {
            for (const [stageName, races] of Object.entries(stages)) {
                races.forEach((raceResult) => {
                    raceResult.forEach((player, rankIndex) => {
                        if (player.includes("Player") || player === "DQ" || player === "NPC-chan") return;

                        if (!stats[player]) { stats[player] = { name: player, totalPoints: 0, racesRun: 0 }; }
                        if (rankIndex < POINTS_SYSTEM.length) { stats[player].totalPoints += POINTS_SYSTEM[rankIndex]; }
                        stats[player].racesRun += 1;
                    });
                });
            }
        }
    }
    const leaderboard = Object.values(stats)
        .filter(player => searchQuery === "" || player.name.toLowerCase().includes(searchQuery)) 
        .map(player => ({
            name: player.name,
            totalPoints: player.totalPoints,
            racesRun: player.racesRun,
            avgPoints: player.racesRun > 0 ? (player.totalPoints / player.racesRun).toFixed(2) : "0.00"
        }));
    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
}

function renderStatsTable() {
    const data = calculateIndividualStats(); 
    const tbody = document.getElementById('points-table-body');
    if (!tbody) return;
    tbody.innerHTML = data.map((player, index) => {
        const playerIcon = getIconHtml(player.name, 'trainer');
        return `
            <tr>
                <td><span class="stat-badge">${index + 1}</span></td>
                <td><div class="name-cell">${playerIcon}${player.name}</div></td>
                <td>${player.racesRun}</td>
                <td>${player.totalPoints}</td>
                <td>${player.avgPoints}</td>
            </tr>`;
    }).join('');
}

function exportCurrentTableToCSV() {
    const activeTabObj = document.querySelector('.view-section.active');
    if (!activeTabObj) return;
    
    const activeTab = activeTabObj.id;
    let tableId = '';
    
    if (activeTab === 'uma-stats') tableId = 'umaTable';
    else if (activeTab === 'trainer-stats') tableId = 'trainerTable';
    else if (activeTab === 'championship') tableId = 'champTable';
    else { alert("Please navigate to Uma Stats, Trainer Stats, or Championship to export a table."); return; }

    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csvContent = "";
    const headers = Array.from(table.querySelectorAll("thead th")).map(th => `"${th.innerText.trim()}"`);
    csvContent += headers.join(",") + "\n";

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.forEach(row => {
        const rowData = Array.from(row.querySelectorAll("td")).map(td => {
            let text = td.innerText.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
            return `"${text.trim()}"`;
        });
        csvContent += rowData.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `racc_open_${tableId}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Shared Utility ---
function populateSelect(selectId, options, defaultValue, onSelect) {
    const selector = document.getElementById(selectId);
    if (!selector) return;
    const current = selector.value;
    selector.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join('');
    if (options.includes(current)) selector.value = current;
    else if (defaultValue && options.includes(defaultValue)) selector.value = defaultValue;
    else if (options.length > 0) selector.value = options[0];
    if (onSelect) onSelect();
}

// --- TRAINER CARD LOGIC ---
function populateTrainerDropdown() {
    if (!AppState.stats) return;
    const trainers = AppState.stats.trainerStats.map(t => t.name).sort();
    populateSelect('cardTrainerSelector', trainers, 'Kenesu', updateTrainerCard);
}

function updateTrainerCard() {
    const selector = document.getElementById('cardTrainerSelector');
    if (!selector || !AppState.stats) return;

    const selectedName = selector.value;
    const tData = AppState.stats.trainerStats.find(t => t.name === selectedName);
    if (!tData) return;

    // Head Data
    const tcName = document.getElementById('tc-name');
    const tcWr = document.getElementById('tc-wr');
    const tcAvgPos = document.getElementById('tc-avg-pos');
    const tcVolatility = document.getElementById('tc-volatility');
    const tcDom = document.getElementById('tc-dom');
    const tcTwins = document.getElementById('tc-twins');

    if (tcName) tcName.innerText = tData.name;
    safeSetHtml('tc-avatar', getIconHtml(tData.name, 'trainer'));

    // Grid Data
    if (tcWr) tcWr.innerText = `${tData.winRate}%`;
    if (tcAvgPos) tcAvgPos.innerText = tData.avgPos;
    if (tcVolatility) tcVolatility.innerText = tData.volatility;
    if (tcDom) tcDom.innerText = `${tData.dom}%`;
    if (tcTwins) tcTwins.innerText = tData.tournamentWins;

    // Favorites
    safeSetHtml('tc-ace', tData.ace);
    safeSetHtml('tc-fav', tData.favorite);

    // --- UMAS LIST (Best to Worst Avg Score & Dom%) ---
    const umasObj = tData.detailedUmaStats || {};
    const umasList = Object.entries(umasObj).map(([name, data]) => {
        const avgPos = data.positions.length > 0 ? (data.positions.reduce((a,b)=>a+b,0) / data.positions.length) : 0;
        const avgPts = data.races > 0 ? (data.points / data.races) : 0;
        const dom = data.totalOpp > 0 ? (data.beaten / data.totalOpp * 100) : 0;
        return { name, avgPos, avgPts, dom };
    });
    
    // Sort highest avg pts, then dom%
    umasList.sort((a, b) => b.avgPts - a.avgPts || b.dom - a.dom);
    const topUmas = umasList.slice(0, 5);
    
    const umasContainer = document.getElementById('tc-umas-list');
    if (topUmas.length > 0) {
        umasContainer.innerHTML = topUmas.map(u => `
            <div class="tc-list-item">
                <span style="flex: 2; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 5px;" title="${u.name}">${u.name}</span>
                <span style="flex: 1; text-align: center;">${u.avgPos.toFixed(1)}</span>
                <span style="flex: 1; text-align: center; color: var(--accent-color); font-weight: bold;">${u.avgPts.toFixed(1)}</span>
                <span style="flex: 1; text-align: right; opacity: 0.8;">${u.dom.toFixed(1)}%</span>
            </div>
        `).join('');
    } else {
        umasContainer.innerHTML = `<div style="opacity:0.5; font-style:italic; padding-top:10px;">No data available.</div>`;
    }

    // --- TOURNEYS LIST (Best to Worst Total Score & Dom%) ---
    const tourneyObj = tData.detailedTourneyStats || {};
    const tourneyList = Object.entries(tourneyObj).map(([name, data]) => {
        const dom = data.totalOpp > 0 ? (data.beaten / data.totalOpp * 100) : 0;
        const umaStr = Array.from(data.umas).join(', ');
        return { name, umaStr, pts: data.points, dom };
    });
    
    // Sort highest total pts, then dom%
    tourneyList.sort((a, b) => b.pts - a.pts || b.dom - a.dom);
    const topTourneys = tourneyList.slice(0, 5);

    const tourneysContainer = document.getElementById('tc-tourneys-list');
    if (topTourneys.length > 0) {
        tourneysContainer.innerHTML = topTourneys.map(t => `
            <div class="tc-list-item">
                <span style="flex: 1.5; font-weight: 600;">${t.name}</span>
                <span style="flex: 1.5; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 5px;" title="${t.umaStr}">${t.umaStr}</span>
                <span style="flex: 1; text-align: center; color: var(--accent-color); font-weight: bold;">${t.pts}</span>
                <span style="flex: 1; text-align: right; opacity: 0.8;">${t.dom.toFixed(1)}%</span>
            </div>
        `).join('');
    } else {
        tourneysContainer.innerHTML = `<div style="opacity:0.5; font-style:italic; padding-top:10px;">No data available.</div>`;
    }
}

function downloadTrainerCard() {
    const cardElement = document.getElementById('captureCard');
    const selector = document.getElementById('cardTrainerSelector');
    if (!cardElement || !selector) return;
    
    const trainerName = selector.value;
    const btn = document.querySelector('button[onclick="downloadTrainerCard()"]');
    const resetButton = withButtonLoading(btn, "⏳ Generating...");

    html2canvas(cardElement, { useCORS: true, backgroundColor: null, scale: 2, logging: false }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${trainerName}_Racc_Open_Stats.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        resetButton();
    }).catch(err => {
        console.error("Card generation failed:", err);
        alert("Failed to generate the Trainer Card. See console for details.");
        resetButton();
    });
}

function downloadTierList() {
    const cardElement = document.getElementById('tierListCard');
    if (!cardElement) return;
    
    const btn = document.querySelector('button[onclick="downloadTierList()"]');
    const resetButton = withButtonLoading(btn, "⏳ Generating...");

    html2canvas(cardElement, { useCORS: true, backgroundColor: null, scale: 2, logging: false }).then(canvas => {
        const link = document.createElement('a');
        
        let viewName = "WinRate";
        if (document.getElementById('view-dom') && document.getElementById('view-dom').classList.contains('active')) viewName = "Dominance";
        if (document.getElementById('view-champ') && document.getElementById('view-champ').classList.contains('active')) viewName = "TourneyWins";
        
        link.download = `Racc_Open_TierList_${viewName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        resetButton();
    }).catch(err => {
        console.error("Tier list generation failed:", err);
        alert("Failed to generate the Tier List. See console for details.");
        resetButton();
    });
}

// --- TEAM THEORYCRAFTER LOGIC ---
function populateTheorycrafterDropdown() {
    if (!AppState.stats) return;
    const trainers = AppState.stats.trainerStats.map(t => t.name).sort();
    populateSelect('tcrafTrainerSelector', trainers, 'Kenesu', generateTheorycraft);
}

function getTheorycraftLensWeights(lens) {
    if (lens === 'comfort') return { familiarity: 0.5, winRate: 0.2, dominance: 0.15, sample: 0.15 };
    if (lens === 'ceiling') return { familiarity: 0.1, winRate: 0.45, dominance: 0.3, sample: 0.15 };
    if (lens === 'meta') return { familiarity: 0.05, winRate: 0.2, dominance: 0.35, sample: 0.15, antiMeta: 0.25 };
    return { familiarity: 0.3, winRate: 0.3, dominance: 0.25, sample: 0.15 };
}

function scoreTheorycraftCandidate(candidate, globalUma, lens) {
    const weights = getTheorycraftLensWeights(lens);
    const familiarity = Math.min(candidate.picks / 6, 1);
    const winRate = candidate.racesRun > 0 ? candidate.wins / candidate.racesRun : 0;
    const dominance = globalUma ? (parseFloat(globalUma.dom) / 100) : 0;
    const sample = Math.min(candidate.racesRun / 12, 1);
    const antiMeta = globalUma ? (1 - Math.min(parseFloat(globalUma.pickPct || 0) / 30, 1)) : 0.5;

    return (
        familiarity * weights.familiarity +
        winRate * weights.winRate +
        dominance * weights.dominance +
        sample * weights.sample +
        antiMeta * (weights.antiMeta || 0)
    );
}

function generateTheorycraft() {
    const selector = document.getElementById('tcrafTrainerSelector');
    const focusSelector = document.getElementById('tcrafFocusSelector');
    const container = document.getElementById('tcraf-results');
    const summary = document.getElementById('tcraf-summary');
    if (!selector || !AppState.stats || !container || !summary) return;

    const selectedName = selector.value;
    const lens = focusSelector ? focusSelector.value : 'balanced';
    const tData = AppState.stats.trainerStats.find(t => t.name === selectedName);

    if (!tData) {
        container.innerHTML = `<div style="text-align:center; padding:15px; opacity:0.7;">No data found for this trainer.</div>`;
        summary.innerHTML = "";
        return;
    }

    const historyArr = Object.entries(tData.characterHistory).map(([key, val]) => {
        const globalUma = AppState.stats.umaStats.find(u => u.name === key);
        const wr = val.racesRun > 0 ? (val.wins / val.racesRun * 100) : 0;
        return {
            name: key,
            ...val,
            globalUma,
            trainerWinRate: wr.toFixed(1),
            trainerDom: globalUma ? globalUma.dom : "0.0",
            theoryScore: scoreTheorycraftCandidate(val, globalUma, lens)
        };
    });

    historyArr.sort((a, b) => b.theoryScore - a.theoryScore);

    const comfortTeam = [...historyArr].sort((a, b) => b.picks - a.picks || b.theoryScore - a.theoryScore).slice(0, 3);
    const ceilingTeam = [...historyArr].sort((a, b) => (parseFloat(b.trainerWinRate) + parseFloat(b.trainerDom)) - (parseFloat(a.trainerWinRate) + parseFloat(a.trainerDom))).slice(0, 3);
    const signatureTeam = historyArr.slice(0, 3);
    const metaCounterTeam = [...AppState.stats.umaStats]
        .filter(u => !historyArr.some(h => h.name === u.name))
        .sort((a, b) => (parseFloat(a.pickPct || 0) - parseFloat(b.pickPct || 0)) || (parseFloat(b.dom) - parseFloat(a.dom)))
        .slice(0, 3);

    const trainerPoolSize = historyArr.length;
    const avgTrainerWr = trainerPoolSize > 0 ? (historyArr.reduce((sum, item) => sum + parseFloat(item.trainerWinRate), 0) / trainerPoolSize).toFixed(1) : "0.0";
    const avgTrainerDom = trainerPoolSize > 0 ? (historyArr.reduce((sum, item) => sum + parseFloat(item.trainerDom || 0), 0) / trainerPoolSize).toFixed(1) : "0.0";
    const mostReliable = historyArr.find(item => item.racesRun >= 3) || historyArr[0];
    const flexPick = [...historyArr].sort((a, b) => (b.racesRun - a.racesRun) || (parseFloat(b.trainerWinRate) - parseFloat(a.trainerWinRate)))[0];

    summary.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px;">
            <div class="tc-stat-box"><div class="tc-stat-label">Lens</div><div class="tc-stat-value" style="font-size:1rem;">${lens}</div></div>
            <div class="tc-stat-box"><div class="tc-stat-label">Uma Pool</div><div class="tc-stat-value">${trainerPoolSize}</div></div>
            <div class="tc-stat-box"><div class="tc-stat-label">Avg WR</div><div class="tc-stat-value">${avgTrainerWr}%</div></div>
            <div class="tc-stat-box"><div class="tc-stat-label">Avg Dom</div><div class="tc-stat-value">${avgTrainerDom}%</div></div>
        </div>
        <div style="margin-top: 12px; background: rgba(0,0,0,0.12); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px 16px;">
            <div style="font-weight:700; color:var(--accent-color); margin-bottom:6px;">Draft Notes</div>
            <div style="font-size:0.9rem; opacity:0.88;">
                Reliable anchor: <b>${mostReliable ? mostReliable.name : "N/A"}</b> •
                Flex pick: <b>${flexPick ? flexPick.name : "N/A"}</b> •
                Best plan for this lens: <b>${signatureTeam.map(u => u.name).join(", ") || "N/A"}</b>
            </div>
        </div>
    `;

    const renderTeam = (title, description, umas, typeDesc, accent = "var(--accent-color)") => {
        let html = `
        <div style="background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                <div>
                    <h3 style="margin: 0 0 5px 0; color: ${accent}; font-size: 1.05em;">${title}</h3>
                    <div style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 12px;">${description}</div>
                </div>
                <span class="stat-badge">${umas.length}/3 picks</span>
            </div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: space-evenly;">`;

        umas.forEach(u => {
            const baseName = u.name.split('(')[0].trim();
            const outfitName = u.name.includes('(') ? u.name.split('(')[1].replace(')', '').trim() : 'Original';
            const icon = getIconHtml(baseName, 'uma', outfitName);
            html += `<div style="display: flex; flex-direction: column; align-items: center; width: 120px; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 10px 8px; border-radius: 10px;">
                ${icon}
                <span style="font-size: 0.8rem; font-weight: 600; margin-top: 6px; line-height: 1.2;">${u.name}</span>
                <span style="font-size: 0.8rem; color: ${accent}; margin-top: 4px; font-weight: bold;">${typeDesc(u)}</span>
                ${u.trainerWinRate ? `<span style="font-size:0.72rem; opacity:0.75;">${u.trainerWinRate}% WR • ${u.trainerDom}% Dom</span>` : ""}
            </div>`;
        });

        for (let i = umas.length; i < 3; i++) {
            html += `<div style="display: flex; flex-direction: column; align-items: center; width: 120px; text-align: center; opacity: 0.3;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--border-color); margin-bottom: 6px;"></div>
                <span style="font-size: 0.8rem; font-weight: 500;">Empty Slot</span>
            </div>`;
        }
        return html + `</div></div>`;
    };

    let html = '';
    html += renderTeam("Comfort Zone", "Most familiar setup with the lowest execution risk.", comfortTeam, (u) => `${u.picks} Picks`);
    html += renderTeam("Signature Build", "Best overall fit for the selected theorycraft lens.", signatureTeam, (u) => `${(u.theoryScore * 100).toFixed(0)} Score`, "#60a5fa");
    html += renderTeam("Maximum Ceiling", "Highest upside based on trainer WR plus global dominance.", ceilingTeam, (u) => `${(parseFloat(u.trainerWinRate) + parseFloat(u.trainerDom)).toFixed(1)} Power`, "#f59e0b");
    html += renderTeam("Meta Counter Core", "Low-pick options that can dodge common prep while keeping value.", metaCounterTeam, (u) => `${u.pickPct}% Pick • ${u.dom}% Dom`, "#f472b6");
    container.innerHTML = html;
}

// --- NEW: CUSTOM TEAM SIMULATOR ---
function populateSimDropdowns() {
    const typeEl = document.getElementById('simTypeSelector');
    const s1 = document.getElementById('simSlot1'), s2 = document.getElementById('simSlot2'), s3 = document.getElementById('simSlot3');
    if (!typeEl || !s1 || !s2 || !s3 || !AppState.stats) return;

    const type = typeEl.value;
    let options = type === 'trainer' ? AppState.stats.trainerStats.map(t => t.name).sort() : AppState.stats.umaStats.map(u => u.name).sort();
    const html = `<option value="">-- Select --</option>` + options.map(o => `<option value="${o}">${o}</option>`).join('');
    
    const v1 = s1.value, v2 = s2.value, v3 = s3.value;
    s1.innerHTML = html; s2.innerHTML = html; s3.innerHTML = html;

    if (options.includes(v1)) s1.value = v1; else if(options.length > 0) s1.value = options[0];
    if (options.includes(v2)) s2.value = v2; else if(options.length > 1) s2.value = options[1];
    if (options.includes(v3)) s3.value = v3; else if(options.length > 2) s3.value = options[2];
    runSimulation();
}

function runSimulation() {
    const typeEl = document.getElementById('simTypeSelector');
    const lensEl = document.getElementById('simLensSelector');
    const container = document.getElementById('sim-results');
    const comparison = document.getElementById('sim-comparison');
    const s1 = document.getElementById('simSlot1'), s2 = document.getElementById('simSlot2'), s3 = document.getElementById('simSlot3');

    if (!typeEl || !container || !comparison || !AppState.stats || !s1) return;

    const type = typeEl.value;
    const lens = lensEl ? lensEl.value : 'balanced';
    const list = type === 'trainer' ? AppState.stats.trainerStats : AppState.stats.umaStats;
    const members = [list.find(x => x.name === s1.value), list.find(x => x.name === s2.value), list.find(x => x.name === s3.value)].filter(Boolean);

    if (members.length === 0) {
        container.innerHTML = `<div style="text-align:center; opacity:0.6;">Select members to simulate.</div>`;
        comparison.innerHTML = "";
        return;
    }

    const weightsMap = {
        balanced: { wr: 0.4, dom: 0.35, consistency: 0.25 },
        wins: { wr: 0.6, dom: 0.2, consistency: 0.2 },
        dom: { wr: 0.25, dom: 0.55, consistency: 0.2 },
        safe: { wr: 0.25, dom: 0.2, consistency: 0.55 }
    };
    const weights = weightsMap[lens] || weightsMap.balanced;

    let totalWins = 0, totalRaces = 0, totalDom = 0, totalAvgPos = 0, domCount = 0;
    let cardsHtml = '';

    members.forEach(m => {
        const wr = parseFloat(m.winRate) || 0;
        const dom = parseFloat(m.dom) || 0;
        const consistency = Math.max(0, 100 - ((parseFloat(m.avgPos) || 10) * 12));
        const score = (wr * weights.wr) + (dom * weights.dom) + (consistency * weights.consistency);

        totalWins += m.wins || 0;
        totalRaces += (m.totalRacesRun || m.entries || 0);
        totalDom += dom;
        totalAvgPos += parseFloat(m.avgPos) || 0;
        domCount++;

        const icon = getIconHtml(m.name.split('(')[0].trim(), type, m.name.includes('(') ? m.name.split('(')[1].replace(')', '').trim() : 'Original');
        cardsHtml += `<div style="display: flex; flex-direction: column; align-items: center; width: 110px; text-align: center; background: rgba(0,0,0,0.2); padding: 12px 8px; border-radius: 8px; border: 1px solid var(--border-color);">
            ${icon}
            <span style="font-size: 0.8rem; font-weight: 600; margin-top: 6px; line-height: 1.2;">${m.name}</span>
            <span style="font-size: 0.7rem; color: var(--accent-color); margin-top: 4px;">${m.winRate}% WR</span>
            <span style="font-size: 0.7rem; opacity: 0.8;">${m.dom}% Dom</span>
            <span style="font-size: 0.72rem; opacity: 0.75;">${score.toFixed(1)} Lens Score</span>
        </div>`;
    });

    const combinedWr = totalRaces > 0 ? ((totalWins / totalRaces) * 100).toFixed(1) : "0.0";
    const avgDom = domCount > 0 ? (totalDom / domCount).toFixed(1) : "0.0";
    const avgPos = domCount > 0 ? (totalAvgPos / domCount).toFixed(2) : "0.00";
    const teamScore = ((parseFloat(combinedWr) * weights.wr) + (parseFloat(avgDom) * weights.dom) + (Math.max(0, 100 - (parseFloat(avgPos) * 12)) * weights.consistency)).toFixed(1);

    container.innerHTML = `
    <div style="background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 12px 0; color: var(--accent-color); text-align: center;">Team Aggregate Performance</h3>
        <div style="display: flex; gap: 12px; justify-content: space-evenly; margin-bottom: 15px; flex-wrap: wrap;">${cardsHtml}</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; background: var(--bg-color); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="text-align: center;"><div style="font-size: 0.75em; opacity: 0.7; text-transform: uppercase;">Combined Win Rate</div><div style="font-size: 1.2em; font-weight: bold; color: var(--accent-color);">${combinedWr}%</div><div style="font-size: 0.7em; opacity: 0.5;">(${totalWins} / ${totalRaces})</div></div>
            <div style="text-align: center;"><div style="font-size: 0.75em; opacity: 0.7; text-transform: uppercase;">Average Dominance</div><div style="font-size: 1.2em; font-weight: bold; color: var(--accent-color);">${avgDom}%</div></div>
            <div style="text-align: center;"><div style="font-size: 0.75em; opacity: 0.7; text-transform: uppercase;">Average Rank</div><div style="font-size: 1.2em; font-weight: bold; color: var(--accent-color);">${avgPos}</div></div>
            <div style="text-align: center;"><div style="font-size: 0.75em; opacity: 0.7; text-transform: uppercase;">Lens Score</div><div style="font-size: 1.2em; font-weight: bold; color: var(--accent-color);">${teamScore}</div></div>
        </div>
    </div>`;

    const ranked = [...list].sort((a, b) => {
        const scoreA = (parseFloat(a.winRate || 0) * weights.wr) + (parseFloat(a.dom || 0) * weights.dom) + (Math.max(0, 100 - ((parseFloat(a.avgPos) || 10) * 12)) * weights.consistency);
        const scoreB = (parseFloat(b.winRate || 0) * weights.wr) + (parseFloat(b.dom || 0) * weights.dom) + (Math.max(0, 100 - ((parseFloat(b.avgPos) || 10) * 12)) * weights.consistency);
        return scoreB - scoreA;
    }).slice(0, 5);

    comparison.innerHTML = `
        <div style="background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
            <h3 style="margin: 0 0 10px 0; color: var(--accent-color);">Lens Comparison Board</h3>
            <div style="font-size: 0.85rem; opacity: 0.75; margin-bottom: 12px;">Top individual options for the current bias: <b>${lens}</b></div>
            <div style="display:grid; gap:10px;">
                ${ranked.map((item, index) => `<div style="display:flex; justify-content:space-between; gap:12px; align-items:center; background: rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:8px; padding:10px 12px;">
                    <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        <span class="stat-badge">#${index + 1}</span>
                        <span style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                    </div>
                    <div style="font-size:0.82rem; opacity:0.82;">${item.winRate}% WR • ${item.dom}% Dom • ${item.avgPos || "-"} Avg</div>
                </div>`).join("")}
            </div>
        </div>
    `;
}


window.onload = function() {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
        const themeSelector = document.getElementById('themeSelector');
        if(themeSelector) themeSelector.value = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
    }
    switchSeason();
};
