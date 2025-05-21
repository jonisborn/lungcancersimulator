/**
 * Main application logic for cancer simulator frontend
 */

// Global variables for the cancer simulator
window.lastSimulationData = null;

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();
    
    // Set up UI event listeners
    setupEventListeners();
    
    // Set up clinical interface listeners
    setupClinicalFormListeners();
    
    // Update parameter display values
    updateAllDisplayValues();
});

/**
 * Set up all user interface event listeners
 */
function setupEventListeners() {
    // Form submission handler
    document.getElementById('simulation-form').addEventListener('submit', function(event) {
        event.preventDefault();
        runSimulation();
    });
    
    // Reset parameters button
    document.getElementById('reset-params').addEventListener('click', resetParameters);
    
    // Save profile button (if it exists)
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', savePatientProfile);
    }
    
    // Toggle log scale button
    document.getElementById('toggle-log-scale').addEventListener('click', toggleLogScale);
    
    // Setup sliders to update their value displays
    setupSliderListeners();
}

/**
 * Set up listeners for the clinical interface elements
 */
function setupClinicalFormListeners() {
    // Event listener for protocol selection
    const protocolSelect = document.getElementById('treatment-protocol');
    if (protocolSelect) {
        protocolSelect.addEventListener('change', function() {
            updateProtocolVisualization();
        });
    }
    
    // Event listener for regimen selection - adjust protocol parameters
    const regimenSelect = document.getElementById('treatment-regimen');
    if (regimenSelect) {
        regimenSelect.addEventListener('change', function() {
            // Set treatment parameters based on regimen
            const regimen = this.value;
            if (regimen === 'carboplatin') {
                setTreatmentParameters(0.8, 0.1, 21, 'PULSED');
            } else if (regimen === 'cisplatin') {
                setTreatmentParameters(0.9, 0.15, 21, 'PULSED');
            } else if (regimen === 'tyrosine') {
                setTreatmentParameters(0.7, 0.05, 1, 'CONTINUOUS');
            } else if (regimen === 'immunotherapy') {
                setTreatmentParameters(0.6, 0.2, 14, 'PULSED');
            }
            
            updateProtocolVisualization();
        });
    }
    
    // Disease stage affects initial populations
    const diseaseStageSelect = document.getElementById('disease-stage');
    if (diseaseStageSelect) {
        diseaseStageSelect.addEventListener('change', function() {
            const stage = parseInt(this.value);
            
            // Set initial populations based on disease stage
            if (stage === 1) {
                setInitialPopulations(50, 5, 2);
            } else if (stage === 2) {
                setInitialPopulations(100, 10, 5);
            } else if (stage === 3) {
                setInitialPopulations(200, 20, 10);
            } else if (stage === 4) {
                setInitialPopulations(300, 30, 15);
            }
        });
    }
    
    // Immune status dropdown affects patient immune status
    const immuneStatusDropdown = document.getElementById('immune-status-select');
    if (immuneStatusDropdown) {
        immuneStatusDropdown.addEventListener('change', function() {
            const immuneStatus = parseFloat(this.value);
            document.getElementById('patient-immune-status').value = immuneStatus;
        });
    }
}

/**
 * Helper function to set treatment parameters based on regimen
 */
function setTreatmentParameters(drugStrength, drugDecay, doseFrequency, protocol) {
    document.getElementById('drug-strength').value = drugStrength;
    document.getElementById('drug-strength-value').textContent = drugStrength.toFixed(2);
    
    document.getElementById('drug-decay').value = drugDecay;
    document.getElementById('drug-decay-value').textContent = drugDecay.toFixed(2);
    
    document.getElementById('dose-frequency').value = doseFrequency;
    document.getElementById('dose-frequency-value').textContent = doseFrequency;
    
    document.getElementById('treatment-protocol').value = protocol;
}

/**
 * Helper function to set initial cell populations based on disease stage
 */
function setInitialPopulations(sensitive, resistant, stem) {
    document.getElementById('sensitive-cells').value = sensitive;
    document.getElementById('sensitive-value').textContent = sensitive;
    
    document.getElementById('resistant-cells').value = resistant;
    document.getElementById('resistant-value').textContent = resistant;
    
    document.getElementById('stem-cells').value = stem;
    document.getElementById('stem-value').textContent = stem;
}

/**
 * Set up all slider input handlers to update displayed values
 */
function setupSliderListeners() {
    // Initial cell population sliders
    setupSlider('sensitive-cells', 'sensitive-value');
    setupSlider('resistant-cells', 'resistant-value');
    setupSlider('stem-cells', 'stem-value');
    setupSlider('immune-cells', 'immune-value');
    
    // Treatment protocol sliders
    setupSlider('drug-strength', 'drug-strength-value', 2);
    setupSlider('drug-decay', 'drug-decay-value', 2);
    setupSlider('dose-frequency', 'dose-frequency-value', 0);
    setupSlider('dose-intensity', 'dose-intensity-value', 1);
    
    // Patient parameter sliders
    setupSlider('patient-age', 'patient-age-value', 0);
    setupSlider('patient-metabolism', 'patient-metabolism-value', 1);
    setupSlider('patient-immune-status', 'patient-immune-status-value', 1);
    setupSlider('immune-strength', 'immune-strength-value', 2);
    
    // Evolutionary parameter sliders
    setupSlider('mutation-rate', 'mutation-rate-value', 3);
    setupSlider('chaos-level', 'chaos-level-value', 2);
}

/**
 * Set up a single slider with its value display
 * @param {string} sliderId - The ID of the slider input element
 * @param {string} valueId - The ID of the element to display the value
 * @param {number} decimals - Number of decimal places to display (default 0)
 */
function setupSlider(sliderId, valueId, decimals = 0) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (slider && valueDisplay) {
        slider.addEventListener('input', function() {
            updateDisplayValue(this, valueDisplay, decimals);
        });
    }
}

/**
 * Update a single slider's display value
 * @param {HTMLElement} slider - The slider input element
 * @param {HTMLElement} valueDisplay - The element to display the value
 * @param {number} decimals - Number of decimal places to display
 */
function updateDisplayValue(slider, valueDisplay, decimals) {
    valueDisplay.textContent = parseFloat(slider.value).toFixed(decimals);
}

/**
 * Update all parameter displays to match current slider values
 */
function updateAllDisplayValues() {
    // Update all slider displays
    updateDisplayValue(document.getElementById('sensitive-cells'), document.getElementById('sensitive-value'), 0);
    updateDisplayValue(document.getElementById('resistant-cells'), document.getElementById('resistant-value'), 0);
    updateDisplayValue(document.getElementById('stem-cells'), document.getElementById('stem-value'), 0);
    updateDisplayValue(document.getElementById('immune-cells'), document.getElementById('immune-value'), 0);
    
    updateDisplayValue(document.getElementById('drug-strength'), document.getElementById('drug-strength-value'), 2);
    updateDisplayValue(document.getElementById('drug-decay'), document.getElementById('drug-decay-value'), 2);
    updateDisplayValue(document.getElementById('dose-frequency'), document.getElementById('dose-frequency-value'), 0);
    
    if (document.getElementById('dose-intensity')) {
        updateDisplayValue(document.getElementById('dose-intensity'), document.getElementById('dose-intensity-value'), 1);
    }
    
    updateDisplayValue(document.getElementById('patient-age'), document.getElementById('patient-age-value'), 0);
    updateDisplayValue(document.getElementById('patient-metabolism'), document.getElementById('patient-metabolism-value'), 1);
    updateDisplayValue(document.getElementById('patient-immune-status'), document.getElementById('patient-immune-status-value'), 1);
    updateDisplayValue(document.getElementById('immune-strength'), document.getElementById('immune-strength-value'), 2);
    
    updateDisplayValue(document.getElementById('mutation-rate'), document.getElementById('mutation-rate-value'), 3);
    updateDisplayValue(document.getElementById('chaos-level'), document.getElementById('chaos-level-value'), 2);
}

/**
 * Reset all parameters to their default values
 */
function resetParameters() {
    // Reset all sliders to their default values
    document.getElementById('sensitive-cells').value = 100;
    document.getElementById('resistant-cells').value = 10;
    document.getElementById('stem-cells').value = 5;
    document.getElementById('immune-cells').value = 50;
    
    document.getElementById('drug-strength').value = 0.8;
    document.getElementById('drug-decay').value = 0.1;
    document.getElementById('dose-frequency').value = 7;
    document.getElementById('dose-intensity').value = 1.0;
    
    document.getElementById('patient-age').value = 55;
    document.getElementById('patient-metabolism').value = 1.0;
    document.getElementById('patient-immune-status').value = 1.0;
    document.getElementById('immune-strength').value = 0.2;
    
    document.getElementById('mutation-rate').value = 0.01;
    document.getElementById('chaos-level').value = 0.05;
    
    // Reset select elements
    document.getElementById('treatment-protocol').value = 'PULSED';
    document.getElementById('treatment-regimen').value = 'carboplatin';
    document.getElementById('disease-stage').value = 3;
    
    // Clear any checkboxes
    document.getElementById('comorbidity-diabetes').checked = false;
    document.getElementById('comorbidity-hypertension').checked = false;
    document.getElementById('comorbidity-cardiac').checked = false;
    
    // Update all display values
    updateAllDisplayValues();
    
    // Update protocol visualization
    updateProtocolVisualization();
}

/**
 * Collect all simulation parameters from the UI
 * @returns {Object} - Object containing all simulation parameters
 */
function collectParameters() {
    // Get patient demographics
    const patientAge = document.getElementById('patient-age-direct') ? 
                       parseInt(document.getElementById('patient-age-direct').value) : 
                       parseInt(document.getElementById('patient-age').value || 55);
    
    const patientGender = document.getElementById('gender-male') && document.getElementById('gender-male').checked ? 
                          'male' : 'female';
    
    const patientWeight = document.getElementById('patient-weight') ? 
                          parseInt(document.getElementById('patient-weight').value) : 70;
    
    const performanceStatus = document.getElementById('performance-status') ? 
                             parseInt(document.getElementById('performance-status').value) : 1;
    
    // Get comorbidities
    const comorbidities = [];
    if (document.getElementById('comorbidity-diabetes') && document.getElementById('comorbidity-diabetes').checked) 
        comorbidities.push('diabetes');
    if (document.getElementById('comorbidity-hypertension') && document.getElementById('comorbidity-hypertension').checked) 
        comorbidities.push('hypertension');
    if (document.getElementById('comorbidity-cardiac') && document.getElementById('comorbidity-cardiac').checked) 
        comorbidities.push('cardiac');
    
    // Get disease characteristics
    const tumorType = document.getElementById('tumor-type') ? 
                     document.getElementById('tumor-type').value : 'colorectal';
    
    const diseaseStage = document.getElementById('disease-stage') ? 
                        parseInt(document.getElementById('disease-stage').value) : 3;
    
    // Get cell population values
    const sensitiveCells = parseInt(document.getElementById('sensitive-cells').value);
    const resistantCells = parseInt(document.getElementById('resistant-cells').value);
    const stemCells = parseInt(document.getElementById('stem-cells').value);
    const immuneCells = parseInt(document.getElementById('immune-cells').value);
    
    // Get treatment regimen and protocol
    const treatmentRegimen = document.getElementById('treatment-regimen') ? 
                            document.getElementById('treatment-regimen').value : 'custom';
    
    const treatmentProtocol = document.getElementById('treatment-protocol') ? 
                             document.getElementById('treatment-protocol').value : 'PULSED';
    
    // Get treatment parameters
    const drugStrength = parseFloat(document.getElementById('drug-strength').value);
    const drugDecay = parseFloat(document.getElementById('drug-decay').value);
    const doseFrequency = parseInt(document.getElementById('dose-frequency').value);
    
    const doseIntensity = document.getElementById('dose-intensity') ? 
                         parseFloat(document.getElementById('dose-intensity').value) : 1.0;
    
    // Get patient parameters
    const patientMetabolism = parseFloat(document.getElementById('patient-metabolism').value);
    const patientImmuneStatus = parseFloat(document.getElementById('patient-immune-status').value);
    const organFunction = document.getElementById('patient-organ-function') ? 
                         parseFloat(document.getElementById('patient-organ-function').value) : 1.0;
    
    const immuneStrength = parseFloat(document.getElementById('immune-strength').value);
    
    // Get evolutionary parameters
    const mutationRate = parseFloat(document.getElementById('mutation-rate').value);
    const chaosLevel = parseFloat(document.getElementById('chaos-level').value);
    
    // Get time steps
    const timeSteps = document.getElementById('time-steps') ? 
                     parseInt(document.getElementById('time-steps').value) : 100;
    
    // Return all parameters in an organized object
    return {
        // Cell populations
        sensitive_cells: sensitiveCells,
        resistant_cells: resistantCells,
        stem_cells: stemCells,
        immune_cells: immuneCells,
        
        // Treatment protocol
        treatment_protocol: treatmentProtocol,
        drug_strength: drugStrength,
        drug_decay: drugDecay,
        dose_frequency: doseFrequency,
        dose_intensity: doseIntensity,
        
        // Patient parameters
        patient_age: patientAge,
        patient_weight: patientWeight,
        patient_gender: patientGender,
        patient_metabolism: patientMetabolism,
        patient_immune_status: patientImmuneStatus,
        patient_organ_function: organFunction,
        immune_strength: immuneStrength,
        performance_status: performanceStatus,
        
        // Disease characteristics
        tumor_type: tumorType,
        disease_stage: diseaseStage,
        comorbidities: comorbidities,
        treatment_regimen: treatmentRegimen,
        
        // Evolutionary parameters
        mutation_rate: mutationRate,
        chaos_level: chaosLevel,
        time_steps: timeSteps
    };
}

/**
 * Run the simulation with current parameters
 */
function runSimulation() {
    // Show spinner, hide results
    document.getElementById('spinner-container').classList.remove('d-none');
    document.getElementById('results-container').classList.add('d-none');
    
    // Collect all parameters
    const parameters = collectParameters();
    
    // Send request to server
    fetch('/simulate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Store simulation data globally
        window.lastSimulationData = data.simulation_data;
        
        // Update charts with simulation results
        updateCharts(data.simulation_data);
        
        // Display summary stats
        displayResults(data.simulation_data, data.clinical_summary);
        
        // Hide spinner, show results
        document.getElementById('spinner-container').classList.add('d-none');
        document.getElementById('results-container').classList.remove('d-none');
    })
    .catch(error => {
        console.error('Simulation error:', error);
        
        // Show error message
        document.getElementById('spinner-container').classList.add('d-none');
        document.getElementById('results-container').classList.remove('d-none');
        document.getElementById('results-container').innerHTML = `
            <div class="alert alert-danger">
                <h5>Simulation Error</h5>
                <p>${error.message}</p>
            </div>
        `;
    });
}

/**
 * Display simulation results and summary statistics
 * @param {Object} data - Simulation results data
 * @param {Object} clinical - Clinical summary data
 */
function displayResults(data, clinical) {
    // Update charts with simulation data
    updateCharts(data);
    
    // Display clinical outcomes
    if (clinical) {
        updateClinicalOutcomes(clinical);
    }
}

/**
 * Update clinical outcome metrics in the results display
 * @param {Object} clinical - Clinical outcome data
 */
function updateClinicalOutcomes(clinical) {
    // Get clinical values
    const clinicalResponse = clinical.clinical_response || "Not Available";
    const clinicalBenefit = clinical.clinical_benefit || "Treatment Effect";
    const responseRate = clinical.treatment_response_rate || 0;
    const diseaseControlRate = clinical.disease_control_rate || 0;
    const qualityOfLife = clinical.quality_of_life || "Good";
    const sideEffectProfile = clinical.side_effect_profile || "Manageable";
    const efficacyScore = clinical.treatment_efficacy_score || 0;
    const responseDataSource = clinical.response_data_source || "Expected Outcomes";
    const expectedResponseRange = clinical.expected_response_range || "";
    const treatmentFreeInterval = clinical.treatment_free_interval || 0;
    
    // Get results container
    const resultsContainer = document.getElementById('results-container');
    
    // Create response display based on whether we have real measurements or just expectations
    let responseDisplay = "";
    if (responseDataSource === "Actual Measurements") {
        responseDisplay = `<p>Tumor Response: <strong>${responseRate.toFixed(1)}%</strong> <span class="badge bg-info">Measured</span></p>`;
    } else {
        responseDisplay = `<p>Expected Response: <strong>${expectedResponseRange}</strong> <span class="badge bg-secondary">Protocol-based</span></p>`;
    }
    
    // Updated results HTML with optimistic clinical metrics
    resultsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Treatment Results</h5>
                    </div>
                    <div class="card-body">
                        ${responseDisplay}
                        <p>Disease Control Rate: <strong>${diseaseControlRate.toFixed(1)}%</strong></p>
                        <p>Clinical Benefit: <strong>${clinicalBenefit}</strong></p>
                        <p>Treatment-Free Interval: <strong>${treatmentFreeInterval} months</strong></p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Quality Metrics</h5>
                    </div>
                    <div class="card-body">
                        <p>Treatment Efficacy: <strong>${efficacyScore.toFixed(1)}/10</strong></p>
                        <p>Quality of Life: <strong>${qualityOfLife}</strong></p>
                        <p>Side Effects: <strong>${sideEffectProfile}</strong></p>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <h5>Simulation Summary</h5>
            <div class="alert alert-info">
                <p><strong>Clinical Response: ${clinicalResponse}</strong></p>
                <p>This simulation suggests ${diseaseControlRate > 75 ? "good" : "moderate"} disease control with the selected treatment protocol.</p>
            </div>
        </div>
    `;
}