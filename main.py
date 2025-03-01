from flask import Flask, jsonify, render_template, send_from_directory
import random

app = Flask(__name__, static_folder="static")

# Ruta para servir el favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory("static", "favicon.ico", mimetype="image/vnd.microsoft.icon")

PILOTOS = ["Verstappen", "Lawson", "Leclerc", "Sainz", "Hamilton", "Russell", "Norris", "Piastri", "Alonso", "Stroll",
            "Gasly", "Ocon", "Bortoleto", "Bearman", "Tsunoda", "Colapinto", "Hulkenberg", "Antonelli", "Albon", "Hadjar"]

# Ponderaciones mucho más extremas para reflejar la realidad de la F1
# La escala es de 1 a 20, dando más peso a los top drivers y equipos top
PONDERACIONES_PILOTOS = {
    "Verstappen": 20,    
    "Lawson": 6,         
    "Leclerc": 18,       
    "Sainz": 12,         
    "Hamilton": 20,      
    "Russell": 18,       
    "Norris": 19,       
    "Piastri": 15,      
    "Alonso": 12,        
    "Stroll": 4,         
    "Gasly": 10,         
    "Ocon": 8,         
    "Bortoleto": 4,      
    "Bearman": 4,        
    "Tsunoda": 7,        
    "Colapinto": 12, 
    "Hulkenberg": 7,     
    "Antonelli": 6,      
    "Albon": 10,         
    "Hadjar": 4       
}

# Factor adicional para equipos (multiplica la ponderación del piloto)
FACTOR_EQUIPO = {
    "Red Bull": 3,     
    "Ferrari": 3,      
    "Mercedes": 3,     
    "McLaren": 3,      
    "Aston Martin": 1.0, 
    "Alpine": 1.0,       
    "Sauber Audi": 0.1,  
    "RB": 0.1,           
    "Haas": 0.1,         
    "Williams": 0.7     
}

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

# Probabilidad de problemas técnicos o incidentes (porcentaje)
PROB_INCIDENTE = 15  # 15% de probabilidad de que un piloto tenga algún problema

mundial_pilotos = {piloto: 0 for piloto in PILOTOS}
mundial_constructores = {equipo: 0 for equipo in CONSTRUCTORES.keys()}
historial_carreras = []

def get_team_for_driver(driver):
    for team, drivers in CONSTRUCTORES.items():
        if driver in drivers:
            return team
    return None

def simular_carrera_realista():
    # Calculamos la ponderación combinada (piloto + equipo)
    ponderaciones_combinadas = {}
    for piloto in PILOTOS:
        equipo = get_team_for_driver(piloto)
        factor_equipo = FACTOR_EQUIPO[equipo]
        ponderaciones_combinadas[piloto] = PONDERACIONES_PILOTOS[piloto] * factor_equipo
    
    # Simulamos la qualy/rendimiento base - esto determina el orden "esperado"
    orden_esperado = []
    pilotos_disponibles = PILOTOS.copy()
    
    while pilotos_disponibles:
        # Calculamos la suma total de todas las ponderaciones disponibles
        total_ponderacion = sum(ponderaciones_combinadas[p] for p in pilotos_disponibles)
        
        # Elegimos un piloto con probabilidad proporcional a su ponderación
        valor_aleatorio = random.uniform(0, total_ponderacion)
        acumulado = 0
        
        for piloto in pilotos_disponibles:
            acumulado += ponderaciones_combinadas[piloto]
            if acumulado >= valor_aleatorio:
                orden_esperado.append(piloto)
                pilotos_disponibles.remove(piloto)
                break
    
    # Ahora simulamos la carrera con posibles incidentes
    posiciones_finales = orden_esperado.copy()
    
    # Simulamos posibles incidentes o problemas técnicos
    for i, piloto in enumerate(orden_esperado):
        # Hay una probabilidad de que ocurra un incidente (abandono o problema)
        if random.randint(1, 100) <= PROB_INCIDENTE:
            # Severidad del problema (1: leve, 2: moderado, 3: grave/abandono)
            severidad = random.choices([1, 2, 3], weights=[50, 30, 20])[0]
            
            if severidad == 3:
                # Abandono - movemos al piloto al final
                posiciones_finales.remove(piloto)
                posiciones_finales.append(piloto)
            elif severidad == 2:
                # Problema moderado - pierde varias posiciones
                posicion_actual = posiciones_finales.index(piloto)
                nueva_posicion = min(posicion_actual + random.randint(3, 8), len(posiciones_finales) - 1)
                posiciones_finales.remove(piloto)
                posiciones_finales.insert(nueva_posicion, piloto)
            elif severidad == 1:
                # Problema leve - pierde algunas posiciones
                posicion_actual = posiciones_finales.index(piloto)
                nueva_posicion = min(posicion_actual + random.randint(1, 3), len(posiciones_finales) - 1)
                posiciones_finales.remove(piloto)
                posiciones_finales.insert(nueva_posicion, piloto)
    
    return posiciones_finales

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
    # Usamos nuestra función de simulación realista
    posiciones_finales = simular_carrera_realista()
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