let raceCount = 0;
let totalRaces = 0;
let raceHistory = {};

document.getElementById('set-races').addEventListener('click', () => {
    const input = document.getElementById('total-races');
    const newTotal = parseInt(input.value);
    
    if (newTotal && newTotal > 0) {
        totalRaces = newTotal;
        document.getElementById('total-race-count').textContent = totalRaces;
        document.getElementById('simulate-race').style.display = 'inline-block';
        document.getElementById('reset-game').style.display = 'inline-block';
        input.disabled = true;
        document.getElementById('set-races').disabled = true;
    }
});

document.getElementById('reset-game').addEventListener('click', async () => {
    // Reset all game state
    raceCount = 0;
    totalRaces = 0;
    raceHistory = {};
    
    // Reset UI elements
    document.getElementById('race-count').textContent = '0';
    document.getElementById('total-race-count').textContent = '-';
    document.getElementById('total-races').value = '';
    document.getElementById('total-races').disabled = false;
    document.getElementById('set-races').disabled = false;
    document.getElementById('simulate-race').style.display = 'none';
    document.getElementById('reset-game').style.display = 'none';
    document.getElementById('champions-podium').style.display = 'none';
    
    // Clear all tables
    ['final-positions', 'driver-standings', 'constructor-standings'].forEach(tableId => {
        const tableBody = document.getElementById(tableId).querySelector('tbody');
        tableBody.innerHTML = '';
    });
    
    // Reset backend state
    try {
        await fetch('/reset', { method: 'POST' });
        console.log("Game reset successfully");
    } catch (error) {
        console.error("Error resetting game:", error);
    }
});

document.getElementById('simulate-race').addEventListener('click', async () => {
    if (raceCount < totalRaces) {
        console.log("Simulating race", raceCount + 1, "of", totalRaces);
        raceCount++;
        document.getElementById('race-count').textContent = raceCount;
        try {
            await fetchData();
            console.log("Race data fetched successfully");
            
            if (raceCount === totalRaces) {
                showChampions();
                document.getElementById('simulate-race').style.display = 'none';
            }
        } catch (error) {
            console.error("Error fetching race data:", error);
        }
    }
});

async function fetchData() {
    try {
        console.log("Fetching data from /data");
        const response = await fetch('/data');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received data:", data);

        if (data.race_history) {
            raceHistory = data.race_history;
        }

        if (data.final_positions) {
            populateTable('final-positions', data.final_positions, ['position', 'driver', 'team']);
        } else {
            console.error("Missing final_positions in response:", data);
        }
        
        if (data.driver_standings) {
            populateDriverStandings('driver-standings', data.driver_standings);
        } else {
            console.error("Missing driver_standings in response:", data);
        }
        
        if (data.constructor_standings) {
            populateConstructorStandings('constructor-standings', data.constructor_standings);
        } else {
            console.error("Missing constructor_standings in response:", data);
        }
        
        return data;
    } catch (error) {
        console.error("Error in fetchData:", error);
        throw error;
    }
}

function showChampions() {
    try {
        const driversStandings = document.getElementById('driver-standings')
            .getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const constructorsStandings = document.getElementById('constructor-standings')
            .getElementsByTagName('tbody')[0].getElementsByTagName('tr');

        const podiumDrivers = document.querySelector('.podium-drivers');
        const podiumConstructors = document.querySelector('.podium-constructors');
        
        // Clear existing podiums
        podiumDrivers.innerHTML = '';
        podiumConstructors.innerHTML = '';

        // Show top 3 drivers
        for (let i = 0; i < 3 && i < driversStandings.length; i++) {
            const driverRow = driversStandings[i];
            const driverName = driverRow.cells[1].querySelector('.driver-name-cell').textContent;
            const driverTeam = driverRow.cells[1].querySelector('img').alt;
            const driverLogo = driverRow.cells[1].querySelector('img').src;
            const driverPoints = driverRow.cells[2].textContent;

            const position = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
            
            podiumDrivers.innerHTML += `
                <div class="podium-place ${position}">
                    <div class="position-medal">${i + 1}</div>
                    <img src="${driverLogo}" alt="${driverTeam}">
                    <div class="winner-details">
                        <div class="winner-name">${driverName}</div>
                        <div class="winner-points">${driverPoints} points</div>
                    </div>
                </div>
            `;
        }

        // Show top 3 constructors
        for (let i = 0; i < 3 && i < constructorsStandings.length; i++) {
            const constructorRow = constructorsStandings[i];
            const constructorName = constructorRow.cells[1].textContent.trim();
            const constructorLogo = constructorRow.cells[1].querySelector('img').src;
            const constructorPoints = constructorRow.cells[2].textContent;

            const position = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
            
            podiumConstructors.innerHTML += `
                <div class="podium-place ${position}">
                    <div class="position-medal">${i + 1}</div>
                    <img src="${constructorLogo}" alt="${constructorName}">
                    <div class="winner-details">
                        <div class="winner-name">${constructorName}</div>
                        <div class="winner-points">${constructorPoints} points</div>
                    </div>
                </div>
            `;
        }

        document.getElementById('champions-podium').style.display = 'block';
    } catch (error) {
        console.error("Error showing champions:", error);
    }
}

function showDriverDetails(driver, team, logo, points) {
    try {
        document.getElementById('driverDetailLogo').src = logo;
        document.getElementById('driverDetailName').textContent = driver;
        document.getElementById('driverDetailTeam').textContent = team;
        document.getElementById('driverDetailPoints').textContent = points;

        const history = [];
        if (raceHistory && Array.isArray(raceHistory)) {
            raceHistory.forEach(race => {
                if (race && race.positions) {
                    const driverResult = race.positions.find(pos => pos.driver === driver);
                    if (driverResult) {
                        history.push({
                            race: race.race_number,
                            position: driverResult.position,
                            points: driverResult.points
                        });
                    }
                }
            });
        }

        const historyContainer = document.getElementById('driverRaceHistory');
        historyContainer.innerHTML = '';
        history.forEach(race => {
            const div = document.createElement('div');
            div.className = 'race-history-item';
            div.innerHTML = `
                <span>Race ${race.race}</span>
                <span>P${race.position}</span>
                <span>${race.points} pts</span>
            `;
            historyContainer.appendChild(div);
        });

        document.getElementById('overlay').style.display = 'block';
        document.getElementById('driverDetailsPanel').style.display = 'block';
    } catch (error) {
        console.error("Error showing driver details:", error);
    }
}

function closeDriverDetails() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('driverDetailsPanel').style.display = 'none';
}

function populateTable(tableId, data, columns) {
    try {
        if (!data || !Array.isArray(data)) {
            console.error(`Invalid data for table ${tableId}:`, data);
            return;
        }
        
        const tableBody = document.getElementById(tableId).querySelector('tbody');
        tableBody.innerHTML = '';
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.onclick = () => showDriverDetails(row.driver, row.team, row.logo, row.points || 0);
            
            columns.forEach(col => {
                const td = document.createElement('td');
                if (col === 'driver') {
                    td.innerHTML = `
                        <img src="${row.logo}" class="team-logo" alt="${row.team}">
                        <span class="driver-name-cell">${row.driver}</span>
                    `;
                } else {
                    td.textContent = row[col];
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(`Error populating table ${tableId}:`, error);
    }
}

function populateDriverStandings(tableId, data) {
    try {
        if (!data || !Array.isArray(data)) {
            console.error(`Invalid data for driver standings:`, data);
            return;
        }
        
        const tableBody = document.getElementById(tableId).querySelector('tbody');
        tableBody.innerHTML = '';
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.onclick = () => showDriverDetails(row.driver, row.team, row.logo, row.points);
            
            const positionTd = document.createElement('td');
            positionTd.textContent = row.position;
            tr.appendChild(positionTd);

            const driverTd = document.createElement('td');
            driverTd.innerHTML = `
                <img src="${row.logo}" class="team-logo" alt="${row.team}">
                <span class="driver-name-cell">${row.driver}</span>
            `;
            tr.appendChild(driverTd);

            const pointsTd = document.createElement('td');
            pointsTd.textContent = row.points;
            tr.appendChild(pointsTd);

            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(`Error populating driver standings:`, error);
    }
}

function populateConstructorStandings(tableId, data) {
    try {
        if (!data || !Array.isArray(data)) {
            console.error(`Invalid data for constructor standings:`, data);
            return;
        }
        
        const tableBody = document.getElementById(tableId).querySelector('tbody');
        tableBody.innerHTML = '';
        
        data.forEach(row => {
            const tr = document.createElement('tr');

            const positionTd = document.createElement('td');
            positionTd.textContent = row.position;
            tr.appendChild(positionTd);

            const teamTd = document.createElement('td');
            teamTd.innerHTML = `<img src="${row.logo}" class="team-logo" alt="${row.team}"> ${row.team}`;
            tr.appendChild(teamTd);

            const pointsTd = document.createElement('td');
            pointsTd.textContent = row.points;
            tr.appendChild(pointsTd);

            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(`Error populating constructor standings:`, error);
    }
}

document.getElementById('overlay').addEventListener('click', closeDriverDetails);

// Inicializar - agregar logs para depuración
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    try {
        // Verificar que todos los elementos existen
        ['set-races', 'reset-game', 'simulate-race', 'total-races'].forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element with id '${id}' not found!`);
            }
        });
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});