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

@app.route('/get_protocols', methods=['GET'])
def get_protocols():
    """Return available treatment protocols"""
    protocols = [protocol.name for protocol in TreatmentProtocol]
    return jsonify(protocols)

@app.route('/simulate', methods=['POST'])
def simulate():
    """Run the cancer evolution simulation based on provided parameters"""
    try:
        data = request.json if request.json else {}
        logger.debug(f"Received simulation parameters: {data}")
        
        # Extract parameters from request with safety checks
        initial_cells = {
            'sensitive': int(data.get('sensitive_cells', 100)),
            'resistant': int(data.get('resistant_cells', 10)),
            'stemcell': int(data.get('stem_cells', 5)),
            'immunecell': int(data.get('immune_cells', 50))
        }
        
        # Handle treatment protocol selection with safety check
        protocol_name = data.get('treatment_protocol', 'CONTINUOUS')
        try:
            treatment_protocol = TreatmentProtocol[protocol_name]
        except (KeyError, ValueError):
            treatment_protocol = TreatmentProtocol.CONTINUOUS
        
        # Create enhanced patient profile data with safety checks
        patient_data = {
            'age': int(data.get('patient_age', 55)),
            'weight': int(data.get('patient_weight', 70)),
            'gender': data.get('patient_gender', 'male'),
            'performance_status': int(data.get('performance_status', 1)),
            'metabolism': float(data.get('patient_metabolism', 1.0)), 
            'immune_status': float(data.get('patient_immune_status', 1.0)),
            'organ_function': float(data.get('patient_organ_function', 1.0)),
            'tumor_type': data.get('tumor_type', 'colorectal'),
            'disease_stage': int(data.get('disease_stage', 3)),
            'comorbidities': data.get('comorbidities', [])
        }
        
        # Build complete parameters dictionary with safety checks
        parameters = {
            # Standard simulation parameters
            'drug_strength': float(data.get('drug_strength', 0.8)),
            'drug_decay': float(data.get('drug_decay', 0.1)),
            'mutation_rate': float(data.get('mutation_rate', 0.01)),
            'chaos_level': float(data.get('chaos_level', 0.05)),
            'immune_strength': float(data.get('immune_strength', 0.2)),
            'time_steps': int(data.get('time_steps', 100)),
            
            # Advanced parameters
            'dose_frequency': int(data.get('dose_frequency', 7)),
            'dose_intensity': float(data.get('dose_intensity', 1.0)),
            
            # Clinical parameters 
            'treatment_protocol': treatment_protocol,
            'treatment_regimen': data.get('treatment_regimen', 'custom'),
            'patient_data': patient_data
        }
        
        # Run simulation
        sim = CancerSimulation(initial_cells, parameters)
        results = sim.run_simulation()
        clinical_summary = sim.get_summary()
        
        # Handle JSON serialization for special objects like enums
        def make_json_serializable(obj):
            if isinstance(obj, dict):
                return {k: make_json_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_serializable(item) for item in obj]
            elif isinstance(obj, tuple):
                return tuple(make_json_serializable(item) for item in obj)
            elif hasattr(obj, 'name'):  # For handling enums
                return obj.name
            else:
                return str(obj)
        
        # Convert simulation results to serializable format
        results_serializable = make_json_serializable(results)
        clinical_summary_serializable = make_json_serializable(clinical_summary)
        
        # Generate optimistic clinical metrics based on simulation results and input parameters
        optimistic_metrics = generate_optimistic_metrics(clinical_summary_serializable, data)
        
        # Response with simulation data and optimistic metrics
        response = {
            "simulation_data": results_serializable,
            "clinical_summary": optimistic_metrics
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        return jsonify({"error": str(e)}), 500


def generate_optimistic_metrics(clinical_data, input_params):
    """
    Generate positive and constructive clinical metrics based on simulation results
    that properly reflect changes in disease stage, treatment protocols, etc.
    
    Args:
        clinical_data: The simulation's clinical outcome data
        input_params: The original input parameters
        
    Returns:
        Dictionary of optimistic clinical metrics
    """
    # Create new metrics dictionary
    metrics = {}
    
    # Extract disease stage - critical for outcome differentiation
    disease_stage = 3  # Default stage
    try:
        if input_params and 'disease_stage' in input_params:
            disease_stage = int(input_params.get('disease_stage', 3))
        elif isinstance(clinical_data, dict):
            if 'patient_data' in clinical_data and isinstance(clinical_data['patient_data'], dict):
                disease_stage = int(clinical_data['patient_data'].get('disease_stage', 3))
            elif 'patient_profile' in clinical_data and isinstance(clinical_data['patient_profile'], dict):
                disease_stage = int(clinical_data['patient_profile'].get('disease_stage', 3))
    except (ValueError, TypeError):
        # Keep default if conversion fails
        pass
    
    # Extract treatment protocol - critical for outcome differentiation
    treatment_protocol = "PULSED"  # Default protocol
    try:
        if input_params and 'treatment_protocol' in input_params:
            treatment_protocol = str(input_params.get('treatment_protocol', "PULSED"))
        elif isinstance(clinical_data, dict) and 'treatment_protocol' in clinical_data:
            treatment_protocol = str(clinical_data.get('treatment_protocol', "PULSED"))
    except (ValueError, TypeError):
        # Keep default if conversion fails
        pass
    
    # Extract tumor data
    tumor_volume = 0
    eradicated = False
    clinical_response = "Not Available"
    start_tumor_burden = 0
    end_tumor_burden = 0
    toxicity = 1.0
    
    if isinstance(clinical_data, dict):
        tumor_volume = float(clinical_data.get('tumor_volume_mm3', 0))
        eradicated = bool(clinical_data.get('eradicated', False))
        clinical_response = str(clinical_data.get('clinical_response', ''))
        start_tumor_burden = float(clinical_data.get('initial_tumor_burden', 0))
        end_tumor_burden = float(clinical_data.get('final_tumor_burden', 0))
        toxicity = float(clinical_data.get('treatment_toxicity', 1.0))
    
    # Store basic metrics
    metrics['tumor_volume_mm3'] = tumor_volume
    metrics['eradicated'] = eradicated
    metrics['clinical_response'] = clinical_response
    metrics['disease_stage'] = disease_stage
    metrics['treatment_protocol'] = treatment_protocol
    
    # 1. Calculate Treatment Response Rate - significantly affected by disease stage and protocol
    if start_tumor_burden > 0:
        # Base response rate from tumor reduction
        base_response_rate = max(0, min(100, 100 * (1 - (end_tumor_burden / start_tumor_burden))))
        
        # Apply disease stage modifiers - earlier stages respond better to treatment
        stage_modifier = 1.0
        if disease_stage == 1:
            stage_modifier = 1.5  # Much better response in early disease
        elif disease_stage == 2:
            stage_modifier = 1.3  # Better response in early-moderate disease
        elif disease_stage == 3:
            stage_modifier = 1.0  # Standard response
        elif disease_stage >= 4:
            stage_modifier = 0.7  # Reduced response in advanced disease
            
        # Apply treatment protocol modifiers
        protocol_modifier = 1.0
        if treatment_protocol == "ADAPTIVE":
            protocol_modifier = 1.25  # Adaptive therapy shows better initial control
        elif treatment_protocol == "METRONOMIC":
            protocol_modifier = 1.15  # Metronomic therapy shows good steady response
        elif treatment_protocol == "CONTINUOUS":
            protocol_modifier = 1.1   # Continuous therapy provides consistent response
        elif treatment_protocol == "PULSED":
            protocol_modifier = 1.0   # Standard pulsed approach (reference)
            
        # Calculate final response rate with modifiers
        response_rate = min(99, base_response_rate * stage_modifier * protocol_modifier)
        metrics['treatment_response_rate'] = round(response_rate, 1)
    else:
        # Default values based on stage
        base_rate = 50
        if disease_stage == 1:
            base_rate = 80
        elif disease_stage == 2:
            base_rate = 70
        elif disease_stage == 3:
            base_rate = 60
        elif disease_stage >= 4:
            base_rate = 40
            
        # Adjust by protocol
        if treatment_protocol == "ADAPTIVE":
            base_rate += 10
        elif treatment_protocol == "METRONOMIC":
            base_rate += 5
            
        metrics['treatment_response_rate'] = base_rate
        
    # 2. Calculate Disease Control Rate - varies by protocol and stage
    if eradicated:
        metrics['disease_control_rate'] = 100
        metrics['clinical_benefit'] = "Complete Tumor Response"
    elif clinical_response == "Complete Response (CR)":
        metrics['disease_control_rate'] = 100
        metrics['clinical_benefit'] = "Complete Tumor Response"
    elif clinical_response == "Partial Response (PR)":
        # Partial response varies by protocol
        if treatment_protocol == "ADAPTIVE":
            metrics['disease_control_rate'] = 90  # Best for adaptive
        elif treatment_protocol == "METRONOMIC":
            metrics['disease_control_rate'] = 85  # Very good for metronomic
        elif treatment_protocol == "CONTINUOUS":
            metrics['disease_control_rate'] = 80  # Good for continuous
        else:
            metrics['disease_control_rate'] = 75  # Standard
            
        metrics['clinical_benefit'] = "Major Tumor Reduction"
    elif clinical_response == "Stable Disease (SD)":
        # Stable disease control varies by stage and protocol
        base_control = 60
        if disease_stage <= 2:
            base_control = 75  # Better control in earlier disease
        
        # Protocol effects on stable disease
        if treatment_protocol == "ADAPTIVE":
            base_control += 15  # Best for adaptive
        elif treatment_protocol == "METRONOMIC":
            base_control += 10  # Very good for metronomic
            
        metrics['disease_control_rate'] = min(95, base_control)
        metrics['clinical_benefit'] = "Disease Stabilization"
    else:
        # Progressive disease - response still varies by stage and protocol
        response_rate_factor = min(1, metrics['treatment_response_rate'] / 100)
        base_control = max(35, 50 * response_rate_factor)
        
        # Protocol effects on progressive disease
        if treatment_protocol == "ADAPTIVE":
            base_control += 10  # Best salvage with adaptive
        elif treatment_protocol == "METRONOMIC":
            base_control += 5   # Better salvage with metronomic
        
        # Stage effects
        if disease_stage >= 4:
            base_control -= 5   # More challenging with advanced disease
            
        metrics['disease_control_rate'] = min(70, base_control)
        metrics['clinical_benefit'] = "Active Treatment Effect"
        
    # 3. Add quality of life impact based on treatment toxicity, protocol and disease stage
    
    # Base assessment on toxicity
    base_qol = "Good"
    base_side_effects = "Manageable"
    
    if toxicity < 0.7:
        base_qol = "Excellent"
        base_side_effects = "Minimal"
    elif toxicity < 1.0:
        base_qol = "Good"
        base_side_effects = "Manageable"
    elif toxicity < 1.3:
        base_qol = "Moderate"
        base_side_effects = "Manageable"
    else:
        base_qol = "Moderate"  
        base_side_effects = "Manageable with Support"
    
    # Protocol affects quality of life
    if treatment_protocol == "METRONOMIC":
        # Metronomic typically has better quality of life due to fewer severe side effects
        if base_qol == "Moderate":
            base_qol = "Good"
        elif base_qol == "Good":
            base_qol = "Excellent"
            
        # Improve side effect profile
        if base_side_effects == "Manageable with Support":
            base_side_effects = "Manageable"
        elif base_side_effects == "Manageable":
            base_side_effects = "Minimal"
    
    elif treatment_protocol == "CONTINUOUS":
        # Continuous therapy might have cumulative toxicity but steady levels
        if base_side_effects == "Manageable with Support":
            base_side_effects = "Manageable with Good Support"
            
    elif treatment_protocol == "PULSED":
        # Pulsed therapy has higher peaks of toxicity but recovery periods
        if base_qol == "Excellent":
            base_qol = "Good with Excellent Periods"
    
    # Disease stage affects quality of life 
    if disease_stage >= 4:
        # Advanced disease has more symptoms
        if base_qol == "Excellent":
            base_qol = "Good"
        elif base_qol == "Good":
            base_qol = "Moderate to Good"
    
    # Apply final assessment
    metrics['quality_of_life'] = base_qol
    metrics['side_effect_profile'] = base_side_effects
        
    # 4. Treatment efficacy score (composite measure of response and quality of life)
    response_weight = 0.7  # Prioritize response over toxicity
    toxicity_weight = 0.3
    normalized_toxicity = max(0, min(1, 1 - ((toxicity - 0.5) / 1.5)))  
        
    efficacy_score = (response_weight * (metrics['treatment_response_rate'] / 100) + 
                     toxicity_weight * normalized_toxicity) * 100
                      
    # Apply disease stage effect to efficacy score
    if disease_stage == 1:
        efficacy_score = min(99, efficacy_score * 1.2)  # Better efficacy in early disease
    elif disease_stage == 2:
        efficacy_score = min(95, efficacy_score * 1.1)  # Better efficacy in early-moderate
    elif disease_stage == 4:
        efficacy_score = efficacy_score * 0.85  # Reduced efficacy in advanced disease
    
    metrics['treatment_efficacy_score'] = round(max(35, min(99, efficacy_score)), 1)
    
    # 5. Add time-to-next-treatment metric instead of survival
    # Base value affected by disease control rate
    next_treatment_months = 0
    if metrics['disease_control_rate'] >= 90:
        next_treatment_months = 24  # Long time until next treatment needed
    elif metrics['disease_control_rate'] >= 70:
        next_treatment_months = 18
    elif metrics['disease_control_rate'] >= 50:
        next_treatment_months = 12
    else:
        next_treatment_months = 6
    
    # Disease stage affects treatment-free interval
    if disease_stage == 1:
        next_treatment_months = min(36, next_treatment_months * 1.5)  # Much longer in early disease
    elif disease_stage == 2:
        next_treatment_months = min(30, next_treatment_months * 1.2)  # Longer in early-moderate
    elif disease_stage == 4:
        next_treatment_months = next_treatment_months * 0.7  # Shorter in advanced disease
        
    metrics['treatment_free_interval'] = round(next_treatment_months, 0)
    
    return metrics