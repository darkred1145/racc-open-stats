function calculateStats(filteredData) {
    const umaMap = {};
    const trainerMap = {};

    // 1. Identify which tournaments are currently active based on filters
    // We create a Set of Tournament IDs (e.g., "Open 1", "Open 28") from the filtered race data
    const activeTournaments = new Set();
    filteredData.forEach(row => activeTournaments.add(row.RawLength));

    // 2. Process Race Data (Picks & Wins)
    filteredData.forEach(row => {
        // --- Uma Stats ---
        if (!umaMap[row.UniqueName]) { 
            umaMap[row.UniqueName] = { 
                name: row.UniqueName, 
                picks: 0, 
                wins: 0, 
                totalShare: 0, 
                tourneyWins: 0,
                bans: 0 
            }; 
        }
        umaMap[row.UniqueName].picks++;
        umaMap[row.UniqueName].wins += row.Wins;
        umaMap[row.UniqueName].totalShare += row.WinShare;

        // Check tourney wins (only if tournament matches filters)
        if (typeof tournamentWinners !== 'undefined' && tournamentWinners[row.RawLength]) {
            if (tournamentWinners[row.RawLength].includes(row.Trainer)) {
                umaMap[row.UniqueName].tourneyWins++;
            }
        }

        // --- Trainer Stats ---
        if (!trainerMap[row.Trainer]) {
            trainerMap[row.Trainer] = {
                name: row.Trainer,
                entries: 0,
                wins: 0,
                totalShare: 0,
                characterHistory: {},
                playedTourneys: new Set(),
                tournamentWins: 0
            };
        }

        let t = trainerMap[row.Trainer];
        t.entries++;
        t.wins += row.Wins;
        t.totalShare += row.WinShare;
        t.playedTourneys.add(row.RawLength);

        if (!t.characterHistory[row.UniqueName]) {
            t.characterHistory[row.UniqueName] = { picks: 0, wins: 0 };
        }
        t.characterHistory[row.UniqueName].picks++;
        t.characterHistory[row.UniqueName].wins += row.Wins;
    });

    // 3. Process Trainer Tourney Wins
    Object.values(trainerMap).forEach(t => {
        t.playedTourneys.forEach(tourneyID => {
            if (typeof tournamentWinners !== 'undefined' && tournamentWinners[tourneyID]) {
                if (tournamentWinners[tourneyID].includes(t.name)) {
                    t.tournamentWins++;
                }
            }
        });
    });

    // 4. Process Bans (DYNAMICALLY FILTERED)
    let validBanTourneyCount = 0;

    if (typeof tournamentBans !== 'undefined') {
        // Iterate through ALL known bans
        Object.keys(tournamentBans).forEach(tourneyID => {
            // CRITICAL CHECK: Only process bans if this tournament is in our filtered set
            if (activeTournaments.has(tourneyID)) {
                validBanTourneyCount++; // Increment denominator
                
                const banList = tournamentBans[tourneyID];
                banList.forEach(umaName => {
                    // Ensure Uma exists in map (even if 0 picks)
                    if (!umaMap[umaName]) {
                        umaMap[umaName] = { 
                            name: umaName, 
                            picks: 0, wins: 0, totalShare: 0, tourneyWins: 0, 
                            bans: 0 
                        };
                    }
                    umaMap[umaName].bans++;
                });
            }
        });
    }

    // 5. Formatting
    const formatStats = (obj, type) => Object.values(obj).map(item => {
        const stats = {
            ...item,
            displayName: formatName(item.name),
            dom: item[type === 'uma' ? 'picks' : 'entries'] > 0 
                 ? (item.totalShare / item[type === 'uma' ? 'picks' : 'entries'] * 100).toFixed(1) 
                 : 0
        };

        if (type === 'uma') {
            // Tourney Win Rate
            const tWinRate = item.picks > 0 ? (item.tourneyWins / item.picks * 100).toFixed(1) : "0.0";
            stats.tourneyStatsDisplay = `${tWinRate}% <span style="font-size:0.8em; color:#888">(${item.tourneyWins}/${item.picks})</span>`;

            // Ban Rate (Calculated using only validBanTourneyCount)
            const banRate = validBanTourneyCount > 0 ? (item.bans / validBanTourneyCount * 100).toFixed(1) : "0.0";
            stats.banStatsDisplay = `${banRate}% <span style="font-size:0.8em; color:#888">(${item.bans}/${validBanTourneyCount})</span>`;
        }

        if (type === 'trainer') {
            const tourneyCount = item.playedTourneys.size;
            const tWinRate = tourneyCount > 0 ? (item.tournamentWins / tourneyCount * 100).toFixed(1) : "0.0";
            stats.tourneyStatsDisplay = `${tWinRate}% <span style="font-size:0.8em; color:#888">(${item.tournamentWins}/${tourneyCount})</span>`;

            const historyArr = Object.entries(item.characterHistory).map(([key, val]) => ({ name: key, ...val }));
            
            historyArr.sort((a, b) => b.picks - a.picks);
            const fav = historyArr[0];
            stats.favorite = fav ? `${formatName(fav.name)} <span class="stat-badge">x${fav.picks}</span>` : '-';

            historyArr.sort((a, b) => b.wins - a.wins || a.picks - b.picks);
            const best = historyArr[0];
            stats.ace = (best && best.wins > 0) ? `${formatName(best.name)} <span class="stat-badge win-badge">★${best.wins}</span>` : '<span style="color:#666">-</span>';
        }

        return stats;
    });

    return {
        umaStats: formatStats(umaMap, 'uma'),
        trainerStats: formatStats(trainerMap, 'trainer')
    };
}
