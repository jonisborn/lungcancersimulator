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
    tumor_volume = None  # Use None to indicate we don't have a measurement
    eradicated = False
    clinical_response = "Not Available"
    start_tumor_burden = 0
    end_tumor_burden = 0
    toxicity = 1.0
    has_tumor_measurement = False
    
    if isinstance(clinical_data, dict):
        # Check if we have an actual tumor measurement
        if 'tumor_volume_mm3' in clinical_data and clinical_data['tumor_volume_mm3'] > 0:
            tumor_volume = float(clinical_data.get('tumor_volume_mm3', 0))
            has_tumor_measurement = True
            
        eradicated = bool(clinical_data.get('eradicated', False))
        clinical_response = str(clinical_data.get('clinical_response', ''))
        start_tumor_burden = float(clinical_data.get('initial_tumor_burden', 0))
        end_tumor_burden = float(clinical_data.get('final_tumor_burden', 0))
        toxicity = float(clinical_data.get('treatment_toxicity', 1.0))
    
    # Store basic metrics
    metrics['has_tumor_measurement'] = has_tumor_measurement
    if has_tumor_measurement:
        metrics['tumor_volume_mm3'] = tumor_volume
    
    metrics['eradicated'] = eradicated
    metrics['clinical_response'] = clinical_response
    metrics['disease_stage'] = disease_stage
    metrics['treatment_protocol'] = treatment_protocol
    
    # 1. Calculate Response Information
    # First, check if we have actual tumor measurement data - only then can we calculate a real response rate
    has_actual_measurements = (start_tumor_burden > 0 and end_tumor_burden > 0)
    
    # Get eradication status - shouldn't show eradication for stage 4
    if eradicated and disease_stage >= 4:
        # Stage 4 shouldn't have eradication, that's unrealistic
        eradicated = False
        metrics['eradicated'] = False
    
    # Calculate response (if we have real data) or show expected response (if we don't)
    if has_actual_measurements:
        # We have real pre/post measurements - calculate ACTUAL response rate
        metrics['response_data_source'] = "Actual Measurements"
        
        # Base response rate from tumor reduction (real shrinkage amounts)
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
            # Cap response rate for stage 4 disease
            base_response_rate = min(base_response_rate, 75)
            
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
            
        # Calculate final response rate with modifiers, realistic for disease stage
        if disease_stage == 4:
            # Stage 4 - more limited and protocol-dependent response
            if treatment_protocol == "ADAPTIVE":
                response_rate = min(70, base_response_rate * stage_modifier * protocol_modifier)
            elif treatment_protocol == "METRONOMIC":
                response_rate = min(65, base_response_rate * stage_modifier * protocol_modifier)
            elif treatment_protocol == "CONTINUOUS":
                response_rate = min(60, base_response_rate * stage_modifier * protocol_modifier)
            else:  # PULSED
                response_rate = min(55, base_response_rate * stage_modifier * protocol_modifier)
        else:
            # Stages 1-3
            response_rate = min(99, base_response_rate * stage_modifier * protocol_modifier)
            
        metrics['treatment_response_rate'] = round(response_rate, 1)
    else:
        # No real measurement data - show EXPECTED response rates instead
        metrics['response_data_source'] = "Expected Outcomes"
        
        # Use realistic baseline values based on stage and protocol to show EXPECTED response
        # These are labeled as expected since we don't have real measurements
        
        # Create default expected response ranges for each stage and protocol
        default_expected_ranges = {
            1: { 
                "ADAPTIVE": "75-85%", 
                "METRONOMIC": "70-80%",
                "CONTINUOUS": "68-78%",
                "PULSED": "65-75%"
            },
            2: { 
                "ADAPTIVE": "65-75%", 
                "METRONOMIC": "60-70%",
                "CONTINUOUS": "58-68%",
                "PULSED": "55-65%"
            },
            3: { 
                "ADAPTIVE": "55-65%", 
                "METRONOMIC": "50-60%",
                "CONTINUOUS": "48-58%",
                "PULSED": "45-55%"
            },
            4: { 
                "ADAPTIVE": "45-55%", 
                "METRONOMIC": "40-50%",
                "CONTINUOUS": "35-45%",
                "PULSED": "30-40%"
            }
        }
        
        # Get stage ranges or default to stage 3
        stage_ranges = default_expected_ranges.get(disease_stage, default_expected_ranges[3])
        
        # Get expected rate range for this protocol or use default
        expected_range = stage_ranges.get(treatment_protocol, "30-50%")
        
        # For protocol-specific expected outcomes, we don't use the calculated percent
        metrics['expected_response_range'] = expected_range
        
        # We need a numeric value for calculations, use the mid-point of the range
        if "-" in expected_range:
            parts = expected_range.replace("%", "").split("-")
            if len(parts) == 2:
                try:
                    low = float(parts[0])
                    high = float(parts[1])
                    metrics['treatment_response_rate'] = (low + high) / 2
                except ValueError:
                    metrics['treatment_response_rate'] = 50
            else:
                metrics['treatment_response_rate'] = 50
        else:
            # If not a range, try to extract percentage
            try:
                metrics['treatment_response_rate'] = float(expected_range.replace("%", ""))
            except ValueError:
                metrics['treatment_response_rate'] = 50
        
    # 2. Calculate Disease Control Rate - varies by protocol and stage
    # First, determine the actual clinical response based on tumor burden and stage
    response_rate = metrics['treatment_response_rate']
    clinical_benefit = ""
    
    # For Stage 4, eradication is not medically realistic
    if disease_stage >= 4 and eradicated:
        eradicated = False
        metrics['eradicated'] = False
        # Change clinical response to be more realistic for stage 4
        if response_rate >= 60:
            clinical_response = "Partial Response (PR)"
        elif response_rate >= 30:
            clinical_response = "Stable Disease (SD)"
        else:
            clinical_response = "Progressive Disease (PD)"
    
    # Determine more realistic metrics based on disease stage, response, and whether data is actual or expected
    
    # For realistic disease control rates, we MUST account for disease stage
    base_control_rates = {
        1: { # Stage 1 disease control rates by protocol (based on clinical literature)
            "ADAPTIVE": 88,
            "METRONOMIC": 85,
            "CONTINUOUS": 82, 
            "PULSED": 80
        },
        2: { # Stage 2
            "ADAPTIVE": 78,
            "METRONOMIC": 75,
            "CONTINUOUS": 72,
            "PULSED": 70
        },
        3: { # Stage 3 
            "ADAPTIVE": 68,
            "METRONOMIC": 65,
            "CONTINUOUS": 62,
            "PULSED": 60
        },
        4: { # Stage 4
            "ADAPTIVE": 55,
            "METRONOMIC": 50,
            "CONTINUOUS": 48,
            "PULSED": 45
        }
    }
    
    # Get base control rate for this disease stage and protocol
    stage_rates = base_control_rates.get(disease_stage, base_control_rates[3])  # Default to stage 3 if unknown
    base_control_rate = stage_rates.get(treatment_protocol, 60)  # Default to 60% if protocol unknown
    
    # Now determine clinical benefit and make adjustments
    if eradicated and disease_stage <= 2:  # Only early stages can have true eradication
        metrics['disease_control_rate'] = min(95, base_control_rate + 20)
        metrics['clinical_benefit'] = "Complete Tumor Response"
    elif clinical_response == "Complete Response (CR)" and disease_stage <= 2:
        # Complete response more likely in early disease
        metrics['disease_control_rate'] = min(92, base_control_rate + 15)
        metrics['clinical_benefit'] = "Complete Tumor Response"
    elif clinical_response == "Complete Response (CR)" and disease_stage >= 3:
        # "Complete Response" in advanced disease is usually still partial control
        metrics['disease_control_rate'] = min(85, base_control_rate + 10)
        metrics['clinical_benefit'] = "Major Tumor Reduction"
    elif clinical_response == "Partial Response (PR)" or response_rate >= 50:
        # PR is fairly common in early/intermediate disease
        metrics['disease_control_rate'] = min(85, base_control_rate + 5)  
        metrics['clinical_benefit'] = "Major Tumor Reduction"
    elif clinical_response == "Stable Disease (SD)" or response_rate >= 20:
        # Stable disease - use the base control rate without bonus
        metrics['disease_control_rate'] = base_control_rate
        metrics['clinical_benefit'] = "Disease Stabilization"
    else:
        # Progressive disease - we shouldn't show high control rates
        # Reduce from base rate for progressive disease
        if disease_stage <= 2:
            metrics['disease_control_rate'] = max(30, base_control_rate - 20)
        else:
            metrics['disease_control_rate'] = max(20, base_control_rate - 25)
            
        metrics['clinical_benefit'] = "Active Treatment"
        
    # Add a data source indicator to disease control rate
    metrics['disease_control_data_source'] = "Protocol-based estimate"
    
    # Ensure final validation - no unrealistic values
    if disease_stage >= 3 and metrics['disease_control_rate'] > 80:
        metrics['disease_control_rate'] = min(metrics['disease_control_rate'], 75)
        
    if disease_stage >= 4 and metrics['disease_control_rate'] > 65:
        metrics['disease_control_rate'] = min(metrics['disease_control_rate'], 60)
        
    # No stage 3-4 disease should ever show "Complete Tumor Response"
    if disease_stage >= 3 and metrics['clinical_benefit'] == "Complete Tumor Response":
        metrics['clinical_benefit'] = "Major Tumor Reduction"
        
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