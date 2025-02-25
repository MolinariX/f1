from flask import Flask, jsonify, render_template, send_from_directory
import random

app = Flask(__name__, static_folder="static")

# Ruta para servir el favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory("static", "favicon.ico", mimetype="image/vnd.microsoft.icon")

PILOTOS = ["Verstappen", "Lawson", "Leclerc", "Sainz", "Hamilton", "Russell", "Norris", "Piastri", "Alonso", "Stroll",
            "Gasly", "Ocon", "Bortoleto", "Bearman", "Tsunoda", "Colapinto", "Hulkenberg", "Antonelli", "Albon", "Hadjar"]

CONSTRUCTORES = {
    "Red Bull": ["Verstappen", "Lawson"],
    "Ferrari": ["Leclerc", "Hamilton"],
    "Mercedes": ["Russell", "Antonelli"],
    "McLaren": ["Norris", "Piastri"],
    "Aston Martin": ["Alonso", "Stroll"],
    "Alpine": ["Gasly", "Colapinto"],
    "Sauber Audi": ["Hulkenberg", "Bortoleto"],
    "RB": ["Tsunoda", "Hadjar"],
    "Haas": ["Bearman", "Ocon"],
    "Williams": ["Albon", "Sainz"]
}

LOGOS = {k: f"/static/logos/{k.lower().replace(' ', '_')}.png" for k in CONSTRUCTORES}

PUNTOS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

mundial_pilotos = {piloto: 0 for piloto in PILOTOS}
mundial_constructores = {equipo: 0 for equipo in CONSTRUCTORES.keys()}
historial_carreras = []

def get_team_for_driver(driver):
    for team, drivers in CONSTRUCTORES.items():
        if driver in drivers:
            return team
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/reset', methods=['POST'])
def reset():
    global mundial_pilotos, mundial_constructores, historial_carreras
    mundial_pilotos = {piloto: 0 for piloto in PILOTOS}
    mundial_constructores = {equipo: 0 for equipo in CONSTRUCTORES.keys()}
    historial_carreras = []
    return jsonify({"status": "success"})

@app.route('/data')
def data():
    posiciones_finales = random.sample(PILOTOS, len(PILOTOS))
    resultados_carrera = {"race_number": len(historial_carreras) + 1, "positions": []}
    
    for i, piloto in enumerate(posiciones_finales):
        puntos_carrera = PUNTOS[i] if i < 10 else 0
        equipo = get_team_for_driver(piloto)
        resultado_piloto = {
            "position": i + 1,
            "driver": piloto,
            "team": equipo,
            "logo": LOGOS[equipo],
            "points": puntos_carrera
        }
        resultados_carrera["positions"].append(resultado_piloto)
        if i < 10:
            mundial_pilotos[piloto] += puntos_carrera
            mundial_constructores[equipo] += puntos_carrera
    
    historial_carreras.append(resultados_carrera)
    
    driver_standings = sorted(mundial_pilotos.items(), key=lambda x: x[1], reverse=True)
    constructor_standings = sorted(mundial_constructores.items(), key=lambda x: x[1], reverse=True)
    
    final_positions = [
        {"position": pos["position"], "driver": pos["driver"], "team": pos["team"], "logo": LOGOS[pos["team"]], "points": pos["points"]}
        for pos in resultados_carrera["positions"]
    ]
    
    return jsonify({
        "final_positions": final_positions,
        "driver_standings": [
            {"position": i + 1, "driver": piloto, "points": puntos, "team": get_team_for_driver(piloto), "logo": LOGOS[get_team_for_driver(piloto)]}
            for i, (piloto, puntos) in enumerate(driver_standings)
        ],
        "constructor_standings": [
            {"position": i + 1, "team": equipo, "points": puntos, "logo": LOGOS[equipo]}
            for i, (equipo, puntos) in enumerate(constructor_standings)
        ],
        "race_history": historial_carreras
    })

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=10000)