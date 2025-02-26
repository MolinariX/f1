let raceCount = 0;
let totalRaces = 0;
let raceHistory = {};
let driverStandingsData = []; // Store the driver standings data globally
let activeTable = 'final-positions'; // Track which table is currently visible

// Dark mode functionality
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    // Save user preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Initialize dark mode based on user's saved preference
document.addEventListener('DOMContentLoaded', () => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
    
    // Initialize event listener for dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
    
    // Initialize event listeners for table buttons
    document.querySelectorAll('.table-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tableId = e.target.getAttribute('data-table');
            showTable(tableId);
        });
    });
    
    // Show the final positions table by default
    showTable('final-positions');
});

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
    driverStandingsData = [];
    activeTable = 'final-positions';
    
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
    
    // Show the final positions table by default
    showTable('final-positions');
    
    // Reset backend state
    await fetch('/reset', { method: 'POST' });
});

document.getElementById('simulate-race').addEventListener('click', async () => {
    if (raceCount < totalRaces) {
        raceCount++;
        document.getElementById('race-count').textContent = raceCount;
        await fetchData();
        
        if (raceCount === totalRaces) {
            showChampions();
            document.getElementById('simulate-race').style.display = 'none';
        }
    }
});

// Table switching functionality
function showTable(tableId) {
    // Hide all tables
    document.querySelectorAll('.standings-table').forEach(table => {
        table.style.display = 'none';
    });
    
    // Show the selected table
    document.getElementById(tableId).style.display = 'table';
    activeTable = tableId;
    
    // Update active button state
    document.querySelectorAll('.table-btn').forEach(btn => {
        btn.classList.remove('active-btn');
    });
    document.getElementById(tableId + '-btn').classList.add('active-btn');
}

async function fetchData() {
    const response = await fetch('/data');
    const data = await response.json();

    if (data.race_history) {
        raceHistory = data.race_history;
    }

    // Store driver standings data globally
    driverStandingsData = data.driver_standings;

    populateTable('final-positions', data.final_positions, ['position', 'driver', 'team']);
    populateDriverStandings('driver-standings', driverStandingsData);
    populateConstructorStandings('constructor-standings', data.constructor_standings);
    
    return data;
}

function showChampions() {
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
    for (let i = 0; i < 3; i++) {
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
    for (let i = 0; i < 3; i++) {
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
}

function showDriverDetails(driver, team, logo) {
    // Get the total points from the globally stored driver standings data
    let totalPoints = 0;
    for (let i = 0; i < driverStandingsData.length; i++) {
        if (driverStandingsData[i].driver === driver) {
            totalPoints = driverStandingsData[i].points;
            break;
        }
    }

    document.getElementById('driverDetailLogo').src = logo;
    document.getElementById('driverDetailName').textContent = driver;
    document.getElementById('driverDetailTeam').textContent = team;
    document.getElementById('driverDetailPoints').textContent = totalPoints;

    const history = [];
    raceHistory.forEach(race => {
        const driverResult = race.positions.find(pos => pos.driver === driver);
        if (driverResult) {
            history.push({
                race: race.race_number,
                position: driverResult.position,
                points: driverResult.points
            });
        }
    });

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
}

function showTeamDetails(team, logo, points) {
    // Find the team's drivers from the global driver standings data
    const teamDrivers = driverStandingsData.filter(driver => driver.team === team);
    
    document.getElementById('driverDetailLogo').src = logo;
    document.getElementById('driverDetailName').textContent = team;
    document.getElementById('driverDetailTeam').textContent = 'Constructor';
    document.getElementById('driverDetailPoints').textContent = points;

    const historyContainer = document.getElementById('driverRaceHistory');
    historyContainer.innerHTML = '<h3>Team Drivers</h3>';
    
    // Show each driver's details
    teamDrivers.forEach(driver => {
        const div = document.createElement('div');
        div.className = 'race-history-item driver-item';
        div.innerHTML = `
            <span><img src="${driver.logo}" class="team-logo-small" alt="${driver.team}"> ${driver.driver}</span>
            <span>${driver.points} pts</span>
        `;
        historyContainer.appendChild(div);
    });
    
    // Add total points summary
    const totalDiv = document.createElement('div');
    totalDiv.className = 'race-history-item total-points';
    totalDiv.innerHTML = `
        <span><strong>Total Team Points</strong></span>
        <span><strong>${points}</strong></span>
    `;
    historyContainer.appendChild(totalDiv);

    document.getElementById('overlay').style.display = 'block';
    document.getElementById('driverDetailsPanel').style.display = 'block';
}

function closeDriverDetails() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('driverDetailsPanel').style.display = 'none';
}

function populateTable(tableId, data, columns) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.onclick = () => showDriverDetails(row.driver, row.team, row.logo);
        
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
}

function populateDriverStandings(tableId, data) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.onclick = () => showDriverDetails(row.driver, row.team, row.logo);
        
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
}

function populateConstructorStandings(tableId, data) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.onclick = () => showTeamDetails(row.team, row.logo, row.points);
        tr.style.cursor = 'pointer'; // Add pointer cursor to indicate clickable
        
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
}

document.getElementById('overlay').addEventListener('click', closeDriverDetails);