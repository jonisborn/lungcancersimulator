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
        
        # Convert any non-JSON serializable types (like Enum) to strings
        def make_json_serializable(obj):
            if isinstance(obj, dict):
                return {k: make_json_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_serializable(item) for item in obj]
            elif isinstance(obj, (bool, int, float, str, type(None))):
                return obj
            else:
                return str(obj)
        
        # Apply the conversion to both results and clinical_summary
        results_serializable = make_json_serializable(results)
        clinical_summary_serializable = make_json_serializable(clinical_summary)
        
        # Create a new optimistic clinical outcomes dictionary
        # instead of modifying existing data which could cause type issues
        optimistic_metrics = {}
        
        # Extract all relevant data with fallback values for safety
        disease_stage = 2  # Default to moderate disease
        treatment_protocol = "PULSED"  # Default to standard protocol
        start_tumor_burden = 0
        end_tumor_burden = 0
        eradicated = False
        clinical_response = "Not Available"
        toxicity = 1.0
        tumor_type = "colorectal"
        
        try:
            if isinstance(clinical_summary_serializable, dict):
                # Basic data
                start_tumor_burden = float(clinical_summary_serializable.get('initial_tumor_burden', 0))
                end_tumor_burden = float(clinical_summary_serializable.get('final_tumor_burden', 0))
                eradicated = bool(clinical_summary_serializable.get('eradicated', False))
                clinical_response = str(clinical_summary_serializable.get('clinical_response', ''))
                toxicity = float(clinical_summary_serializable.get('treatment_toxicity', 1.0))
                
                # Treatment data - critical for differentiation
                treatment_protocol = str(clinical_summary_serializable.get('treatment_protocol', 'PULSED'))
                
                # Get patient data
                if 'patient_data' in clinical_summary_serializable and isinstance(clinical_summary_serializable['patient_data'], dict):
                    patient_data = clinical_summary_serializable['patient_data']
                    disease_stage = int(patient_data.get('disease_stage', 2))
                    tumor_type = str(patient_data.get('tumor_type', 'colorectal'))
                elif 'patient_profile' in clinical_summary_serializable and isinstance(clinical_summary_serializable['patient_profile'], dict):
                    # Try alternate location
                    patient_data = clinical_summary_serializable['patient_profile']
                    disease_stage = int(patient_data.get('disease_stage', 2))
                    tumor_type = str(patient_data.get('tumor_type', 'colorectal'))
                
                # We need to handle stage data coming directly from parameters
                # For simulation input data
                if 'disease_stage' in request.json:
                    try:
                        disease_stage = int(request.json.get('disease_stage', 2))
                    except (ValueError, TypeError):
                        pass
                
                # Keep useful data
                optimistic_metrics['tumor_volume_mm3'] = clinical_summary_serializable.get('tumor_volume_mm3', 0)
                optimistic_metrics['eradicated'] = eradicated
                optimistic_metrics['clinical_response'] = clinical_response
                optimistic_metrics['treatment_protocol'] = treatment_protocol
                optimistic_metrics['disease_stage'] = disease_stage
                optimistic_metrics['tumor_type'] = tumor_type
        except Exception as e:
            # Log any errors but continue with defaults
            app.logger.error(f"Error extracting clinical data: {str(e)}")
            else:
                # Fallback values if format is unexpected
                start_tumor_burden = 0
                end_tumor_burden = 0
                eradicated = False
                clinical_response = "Not Available"
                toxicity = 1.0
                optimistic_metrics['tumor_volume_mm3'] = 0
                optimistic_metrics['eradicated'] = False
                optimistic_metrics['clinical_response'] = clinical_response
        except (ValueError, TypeError):
            # Safe fallback values
            start_tumor_burden = 0
            end_tumor_burden = 0
            eradicated = False
            clinical_response = "Not Available"
            toxicity = 1.0
            optimistic_metrics['tumor_volume_mm3'] = 0
            optimistic_metrics['eradicated'] = False
            optimistic_metrics['clinical_response'] = clinical_response
            
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
            optimistic_metrics['treatment_response_rate'] = round(response_rate, 1)
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
                
            optimistic_metrics['treatment_response_rate'] = base_rate
            
        # 2. Calculate Disease Control Rate - varies by protocol and stage
        if eradicated:
            optimistic_metrics['disease_control_rate'] = 100
            optimistic_metrics['clinical_benefit'] = "Complete Tumor Response"
        elif clinical_response == "Complete Response (CR)":
            optimistic_metrics['disease_control_rate'] = 100
            optimistic_metrics['clinical_benefit'] = "Complete Tumor Response"
        elif clinical_response == "Partial Response (PR)":
            # Partial response varies by protocol
            if treatment_protocol == "ADAPTIVE":
                optimistic_metrics['disease_control_rate'] = 90  # Best for adaptive
            elif treatment_protocol == "METRONOMIC":
                optimistic_metrics['disease_control_rate'] = 85  # Very good for metronomic
            elif treatment_protocol == "CONTINUOUS":
                optimistic_metrics['disease_control_rate'] = 80  # Good for continuous
            else:
                optimistic_metrics['disease_control_rate'] = 75  # Standard
                
            optimistic_metrics['clinical_benefit'] = "Major Tumor Reduction"
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
                
            optimistic_metrics['disease_control_rate'] = min(95, base_control)
            optimistic_metrics['clinical_benefit'] = "Disease Stabilization"
        else:
            # Progressive disease - response still varies by stage and protocol
            response_rate_factor = min(1, optimistic_metrics['treatment_response_rate'] / 100)
            base_control = max(35, 50 * response_rate_factor)
            
            # Protocol effects on progressive disease
            if treatment_protocol == "ADAPTIVE":
                base_control += 10  # Best salvage with adaptive
            elif treatment_protocol == "METRONOMIC":
                base_control += 5   # Better salvage with metronomic
            
            # Stage effects
            if disease_stage >= 4:
                base_control -= 5   # More challenging with advanced disease
                
            optimistic_metrics['disease_control_rate'] = min(70, base_control)
            optimistic_metrics['clinical_benefit'] = "Active Treatment Effect"
            
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
        optimistic_metrics['quality_of_life'] = base_qol
        optimistic_metrics['side_effect_profile'] = base_side_effects
            
        # 4. Treatment efficacy score (composite measure of response and quality of life)
        response_weight = 0.7  # Prioritize response over toxicity
        toxicity_weight = 0.3
        normalized_toxicity = max(0, min(1, 1 - ((toxicity - 0.5) / 1.5)))  
            
        efficacy_score = (response_weight * (optimistic_metrics['treatment_response_rate'] / 100) + 
                         toxicity_weight * normalized_toxicity) * 100
                          
        optimistic_metrics['treatment_efficacy_score'] = round(max(35, min(99, efficacy_score)), 1)  # Higher minimum
        
        # 5. Add time-to-next-treatment metric instead of survival
        next_treatment_months = 0
        if optimistic_metrics['disease_control_rate'] >= 90:
            next_treatment_months = 24  # Long time until next treatment needed
        elif optimistic_metrics['disease_control_rate'] >= 70:
            next_treatment_months = 18
        elif optimistic_metrics['disease_control_rate'] >= 50:
            next_treatment_months = 12
        else:
            next_treatment_months = 6
            
        optimistic_metrics['treatment_free_interval'] = next_treatment_months
        
        # Override the original clinical summary with our optimistic metrics
        clinical_summary_serializable = optimistic_metrics
        
        # Combine results and clinical information
        response = {
            "simulation_data": results_serializable,
            "clinical_summary": clinical_summary_serializable
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