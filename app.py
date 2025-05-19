import os
import logging
from flask import Flask, render_template, request, jsonify
from simulation import CancerSimulation

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

@app.route('/')
def index():
    """Render the main simulation page"""
    return render_template('index.html')

@app.route('/simulate', methods=['POST'])
def simulate():
    """Run the cancer evolution simulation based on provided parameters"""
    try:
        data = request.json
        logger.debug(f"Received simulation parameters: {data}")
        
        # Extract parameters from request
        initial_cells = {
            'sensitive': int(data.get('sensitive_cells', 100)),
            'resistant': int(data.get('resistant_cells', 10)),
            'stemcell': int(data.get('stem_cells', 5))
        }
        
        parameters = {
            'drug_strength': float(data.get('drug_strength', 0.8)),
            'drug_decay': float(data.get('drug_decay', 0.1)),
            'mutation_rate': float(data.get('mutation_rate', 0.01)),
            'immune_strength': float(data.get('immune_strength', 0.2)),
            'chaos_level': float(data.get('chaos_level', 0.05)),
            'time_steps': int(data.get('time_steps', 100)),
            'game_matrix': data.get('game_matrix', None)
        }
        
        # Initialize and run simulation
        simulation = CancerSimulation(initial_cells, parameters)
        results = simulation.run_simulation()
        
        return jsonify(results)
    
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
