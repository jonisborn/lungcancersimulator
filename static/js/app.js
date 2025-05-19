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
    setupSlider('time-steps', 'time-steps-value', 0);
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
    
    if (!slider || !valueDisplay) {
        console.warn(`Slider setup failed: ${sliderId} or ${valueId} not found`);
        return;
    }
    
    // Initial update
    updateDisplayValue(slider, valueDisplay, decimals);
    
    // Update on change and input events
    slider.addEventListener('input', function() {
        updateDisplayValue(slider, valueDisplay, decimals);
    });
}

/**
 * Update a single slider's display value
 * @param {HTMLElement} slider - The slider input element
 * @param {HTMLElement} valueDisplay - The element to display the value
 * @param {number} decimals - Number of decimal places to display
 */
function updateDisplayValue(slider, valueDisplay, decimals) {
    valueDisplay.textContent = Number(slider.value).toFixed(decimals);
}

/**
 * Update all parameter displays to match current slider values
 */
function updateAllDisplayValues() {
    // Initial cell populations
    const sliders = [
        ['sensitive-cells', 'sensitive-value', 0],
        ['resistant-cells', 'resistant-value', 0],
        ['stem-cells', 'stem-value', 0],
        ['immune-cells', 'immune-value', 0],
        ['drug-strength', 'drug-strength-value', 2],
        ['drug-decay', 'drug-decay-value', 2],
        ['dose-frequency', 'dose-frequency-value', 0],
        ['dose-intensity', 'dose-intensity-value', 1],
        ['patient-age', 'patient-age-value', 0],
        ['patient-metabolism', 'patient-metabolism-value', 1],
        ['patient-immune-status', 'patient-immune-status-value', 1],
        ['immune-strength', 'immune-strength-value', 2],
        ['mutation-rate', 'mutation-rate-value', 3],
        ['chaos-level', 'chaos-level-value', 2],
        ['time-steps', 'time-steps-value', 0]
    ];
    
    sliders.forEach(([sliderId, valueId, decimals]) => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        if (slider && valueDisplay) {
            updateDisplayValue(slider, valueDisplay, decimals);
        }
    });
}

/**
 * Reset all parameters to their default values
 */
function resetParameters() {
    // Reset initial cell populations
    document.getElementById('sensitive-cells').value = 100;
    document.getElementById('resistant-cells').value = 10;
    document.getElementById('stem-cells').value = 5;
    document.getElementById('immune-cells').value = 50;
    
    // Reset treatment protocol
    document.getElementById('treatment-protocol').value = 'PULSED';
    document.getElementById('drug-strength').value = 0.8;
    document.getElementById('drug-decay').value = 0.1;
    document.getElementById('dose-frequency').value = 7;
    document.getElementById('dose-intensity').value = 1.0;
    
    // Reset patient parameters
    document.getElementById('patient-age').value = 55;
    document.getElementById('patient-metabolism').value = 1.0;
    document.getElementById('patient-immune-status').value = 1.0;
    document.getElementById('immune-strength').value = 0.2;
    
    // Reset evolutionary parameters
    document.getElementById('mutation-rate').value = 0.01;
    document.getElementById('chaos-level').value = 0.05;
    document.getElementById('time-steps').value = 100;
    
    // Update all display values
    updateAllDisplayValues();
}

/**
 * Collect all simulation parameters from the UI
 * @returns {Object} - Object containing all simulation parameters
 */
function collectParameters() {
    // Get cell population values
    const sensitiveCells = parseInt(document.getElementById('sensitive-cells').value);
    const resistantCells = parseInt(document.getElementById('resistant-cells').value);
    const stemCells = parseInt(document.getElementById('stem-cells').value);
    const immuneCells = parseInt(document.getElementById('immune-cells').value);
    
    // Get treatment protocol parameters
    const treatmentProtocol = document.getElementById('treatment-protocol').value;
    const drugStrength = parseFloat(document.getElementById('drug-strength').value);
    const drugDecay = parseFloat(document.getElementById('drug-decay').value);
    const doseFrequency = parseInt(document.getElementById('dose-frequency').value);
    const doseIntensity = parseFloat(document.getElementById('dose-intensity').value);
    
    // Get patient parameters
    const patientAge = parseInt(document.getElementById('patient-age').value);
    const patientMetabolism = parseFloat(document.getElementById('patient-metabolism').value);
    const patientImmuneStatus = parseFloat(document.getElementById('patient-immune-status').value);
    const immuneStrength = parseFloat(document.getElementById('immune-strength').value);
    
    // Get evolutionary parameters
    const mutationRate = parseFloat(document.getElementById('mutation-rate').value);
    const chaosLevel = parseFloat(document.getElementById('chaos-level').value);
    const timeSteps = parseInt(document.getElementById('time-steps').value);
    
    // Return complete parameter set
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
        patient_metabolism: patientMetabolism,
        patient_immune_status: patientImmuneStatus,
        patient_organ_function: 1.0, // Default to normal
        immune_strength: immuneStrength,
        
        // Evolutionary parameters
        mutation_rate: mutationRate,
        chaos_level: chaosLevel,
        time_steps: timeSteps
    };
}

/**
 * Save the current patient profile for future use
 */
function savePatientProfile() {
    // Get current parameters
    const profileData = collectParameters();
    
    // Get patient name from prompt
    const patientName = prompt("Enter a name for this patient profile:", "Patient " + (window.patientProfiles.length + 1));
    if (!patientName) return; // User cancelled
    
    // Add patient identifier
    profileData.patient_name = patientName;
    profileData.saved_date = new Date().toISOString();
    
    // Save to profiles array
    window.patientProfiles.push(profileData);
    
    // Show confirmation message
    alert(`Patient profile "${patientName}" saved successfully.`);
}

/**
 * Run the simulation with current parameters
 */
function runSimulation() {
    // Show spinner and hide previous results
    document.getElementById('spinner-container').classList.remove('d-none');
    
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
    try {
        // Calculate final values
        const finalDay = data.time_points.length - 1;
        const finalTotal = data.total[finalDay];
        const finalSensitive = data.sensitive[finalDay];
        const finalResistant = data.resistant[finalDay];
        const finalStemcell = data.stemcell[finalDay];
        
        // Get clinical outcomes
        const eradicated = clinical.eradicated || false;
        const clinicalResponse = clinical.clinical_response || "Not Available";
        const survivalProbability = clinical.survival_probability || 0;
        const medianSurvivalMonths = clinical.median_survival_months || 0;
        const tumorVolume = clinical.tumor_volume_mm3 || 0;
        
        // Get results container
        const resultsContainer = document.getElementById('results-container');
        
        // Simple results HTML that should work reliably
        resultsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Cell Populations</h5>
                        </div>
                        <div class="card-body">
                            <p>Total Cells: <strong>${finalTotal.toFixed(0)}</strong></p>
                            <p>Sensitive Cells: <strong>${finalSensitive.toFixed(0)}</strong></p>
                            <p>Resistant Cells: <strong>${finalResistant.toFixed(0)}</strong></p>
                            <p>Stem Cells: <strong>${finalStemcell.toFixed(0)}</strong></p>
                            <p>Tumor Volume: <strong>${tumorVolume.toFixed(2)} mm³</strong></p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">Clinical Outcomes</h5>
                        </div>
                        <div class="card-body">
                            <p>Response: <strong>${clinicalResponse}</strong></p>
                            <p>Survival Probability: <strong>${(survivalProbability * 100).toFixed(1)}%</strong></p>
                            <p>Projected Survival: <strong>${medianSurvivalMonths.toFixed(1)} months</strong></p>
                            <p>Tumor Eradicated: <strong>${eradicated ? 'Yes' : 'No'}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error displaying results:', error);
        document.getElementById('results-container').innerHTML = `
            <div class="alert alert-danger">
                <h5>Display Error</h5>
                <p>There was an error displaying the results: ${error.message}</p>
            </div>
        `;
    }
}