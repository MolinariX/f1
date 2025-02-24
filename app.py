from flask import Flask, jsonify, render_template
import random

app = Flask(__name__)

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

LOGOS = {
    "Red Bull": "/static/logos/red_bull.png",
    "Ferrari": "/static/logos/ferrari.png",
    "Mercedes": "/static/logos/mercedes.png",
    "McLaren": "/static/logos/mclaren.png",
    "Aston Martin": "/static/logos/aston_martin.png",
    "Alpine": "/static/logos/alpine.png",
    "Sauber Audi": "/static/logos/sauber_audi.png",
    "RB": "/static/logos/rb.png",
    "Haas": "/static/logos/haas.png",
    "Williams": "/static/logos/williams.png"
}

PUNTOS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

mundial_pilotos = {piloto: 0 for piloto in PILOTOS}
mundial_constructores = {equipo: 0 for equipo in CONSTRUCTORES.keys()}
historial_carreras = []

def get_team_for_driver(driver):
    """Helper function to get a driver's team"""
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
    
    resultados_carrera = {
        "race_number": len(historial_carreras) + 1,
        "positions": []
    }

    for i, piloto in enumerate(posiciones_finales):
        puntos_carrera = PUNTOS[i] if i < 10 else 0
        resultado_piloto = {
            "position": i + 1,
            "driver": piloto,
            "team": get_team_for_driver(piloto),
            "points": puntos_carrera
        }
        resultados_carrera["positions"].append(resultado_piloto)

        if i < 10:
            mundial_pilotos[piloto] += puntos_carrera
            mundial_constructores[get_team_for_driver(piloto)] += puntos_carrera

    historial_carreras.append(resultados_carrera)

    final_positions = [
        {
            "position": i + 1,
            "driver": piloto,
            "team": get_team_for_driver(piloto),
            "logo": LOGOS[get_team_for_driver(piloto)],
            "points": mundial_pilotos[piloto]
        }
        for i, piloto in enumerate(posiciones_finales)
    ]

    driver_standings = [
        {
            "position": i + 1,
            "driver": piloto,
            "points": puntos,
            "team": get_team_for_driver(piloto),
            "logo": LOGOS[get_team_for_driver(piloto)]
        }
        for i, (piloto, puntos) in enumerate(sorted(mundial_pilotos.items(), key=lambda x: x[1], reverse=True))
    ]

    constructor_standings = [
        {
            "position": i + 1,
            "team": equipo,
            "points": puntos,
            "logo": LOGOS[equipo]
        }
        for i, (equipo, puntos) in enumerate(sorted(mundial_constructores.items(), key=lambda x: x[1], reverse=True))
    ]

    return jsonify({
        "final_positions": final_positions,
        "driver_standings": driver_standings,
        "constructor_standings": constructor_standings,
        "race_history": historial_carreras
    })

if __name__ == '__main__':
    app.run(debug=True)