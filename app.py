import os
import logging
from flask import Flask, render_template, request, jsonify
from simulation import CancerSimulation, TreatmentProtocol

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
            'stemcell': int(data.get('stem_cells', 5)),
            'immunecell': int(data.get('immune_cells', 50))
        }
        
        # Handle treatment protocol selection
        protocol_name = data.get('treatment_protocol', 'CONTINUOUS')
        try:
            treatment_protocol = TreatmentProtocol[protocol_name]
        except (KeyError, ValueError):
            treatment_protocol = TreatmentProtocol.CONTINUOUS
        
        # Create patient profile data
        patient_data = {
            'age': int(data.get('patient_age', 55)),
            'metabolism': float(data.get('patient_metabolism', 1.0)), 
            'immune_status': float(data.get('patient_immune_status', 1.0)),
            'organ_function': float(data.get('patient_organ_function', 1.0))
        }
        
        # Build complete parameters dictionary
        parameters = {
            # Standard simulation parameters
            'drug_strength': float(data.get('drug_strength', 0.8)),
            'drug_decay': float(data.get('drug_decay', 0.1)),
            'mutation_rate': float(data.get('mutation_rate', 0.01)),
            'immune_strength': float(data.get('immune_strength', 0.2)),
            'chaos_level': float(data.get('chaos_level', 0.05)),
            'time_steps': int(data.get('time_steps', 100)),
            'game_matrix': data.get('game_matrix', None),
            
            # Clinical parameters
            'treatment_protocol': treatment_protocol,
            'dose_frequency': int(data.get('dose_frequency', 7)),
            'dose_intensity': float(data.get('dose_intensity', 1.0)),
            'doubling_time': float(data.get('doubling_time', 150)),
            'treatment_threshold': float(data.get('treatment_threshold', 500)),
            'patient': patient_data
        }
        
        # Initialize and run simulation
        simulation = CancerSimulation(initial_cells, parameters)
        results = simulation.run_simulation()
        
        # Get additional clinical summary
        clinical_summary = simulation.get_summary()
        
        # Combine results and clinical information
        response = {
            "simulation_data": results,
            "clinical_summary": clinical_summary
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/protocols', methods=['GET'])
def get_protocols():
    """Return available treatment protocols"""
    protocols = [protocol.name for protocol in TreatmentProtocol]
    return jsonify({"protocols": protocols})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
