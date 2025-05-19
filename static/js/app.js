/**
 * Main application logic for cancer simulator frontend
 */

// Global variable to store the last simulation result
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
    updateDisplayValue(
        document.getElementById('sensitive-cells'),
        document.getElementById('sensitive-value')
    );
    updateDisplayValue(
        document.getElementById('resistant-cells'),
        document.getElementById('resistant-value')
    );
    updateDisplayValue(
        document.getElementById('stem-cells'),
        document.getElementById('stem-value')
    );
    
    // Treatment parameters
    updateDisplayValue(
        document.getElementById('drug-strength'),
        document.getElementById('drug-strength-value'),
        2
    );
    updateDisplayValue(
        document.getElementById('drug-decay'),
        document.getElementById('drug-decay-value'),
        2
    );
    updateDisplayValue(
        document.getElementById('immune-strength'),
        document.getElementById('immune-strength-value'),
        2
    );
    
    // Evolutionary parameters
    updateDisplayValue(
        document.getElementById('mutation-rate'),
        document.getElementById('mutation-rate-value'),
        3
    );
    updateDisplayValue(
        document.getElementById('chaos-level'),
        document.getElementById('chaos-level-value'),
        2
    );
    updateDisplayValue(
        document.getElementById('time-steps'),
        document.getElementById('time-steps-value')
    );
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
    document.getElementById('treatment-protocol').value = 'CONTINUOUS';
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
    
    // Reset game matrix to defaults
    const defaultMatrix = [
        [1.0, 0.7, 0.8, 0.3],
        [0.9, 0.6, 0.7, 0.4],
        [1.1, 0.8, 1.0, 0.2],
        [0.0, 0.0, 0.0, 0.0]
    ];
    
    const matrixInputs = document.querySelectorAll('.matrix-input');
    matrixInputs.forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        if (row < defaultMatrix.length && col < defaultMatrix[0].length) {
            input.value = defaultMatrix[row][col];
        }
    });
    
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
    
    // Get game matrix values
    const gameMatrix = [[], [], [], []];
    const matrixInputs = document.querySelectorAll('.matrix-input');
    matrixInputs.forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        if (!gameMatrix[row]) {
            gameMatrix[row] = [];
        }
        gameMatrix[row][col] = parseFloat(input.value);
    });
    
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
        immune_strength: immuneStrength,
        
        // Evolutionary parameters
        mutation_rate: mutationRate,
        chaos_level: chaosLevel,
        time_steps: timeSteps,
        game_matrix: gameMatrix
    };
}

/**
 * Run the simulation with current parameters
 */
function runSimulation() {
    // Show loading spinner
    document.getElementById('results-container').classList.add('d-none');
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
        window.clinicalSummary = data.clinical_summary;
        
        // Update charts with simulation results
        updateCharts(data.simulation_data);
        
        // Calculate and display summary statistics
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
    // Calculate final values
    const finalDay = data.time_points.length - 1;
    const finalTotal = data.total[finalDay];
    const finalSensitive = data.sensitive[finalDay];
    const finalResistant = data.resistant[finalDay];
    const finalStemcell = data.stemcell[finalDay];
    const finalImmune = data.immunecell ? data.immunecell[finalDay] : 0;
    
    // Get clinical outcomes
    const eradicated = clinical.eradicated;
    const clinicalResponse = clinical.clinical_response;
    const survivalProbability = clinical.survival_probability;
    const medianSurvivalMonths = clinical.median_survival_months;
    const tumorVolume = clinical.tumor_volume_mm3;
    
    // Calculate composition percentages
    let sensitivePercent = 0;
    let resistantPercent = 0;
    let stemcellPercent = 0;
    
    if (finalTotal > 0) {
        sensitivePercent = (finalSensitive / finalTotal * 100).toFixed(1);
        resistantPercent = (finalResistant / finalTotal * 100).toFixed(1);
        stemcellPercent = (finalStemcell / finalTotal * 100).toFixed(1);
    }
    
    // Calculate growth rate over last 10 days
    let growthRate = 0;
    if (finalDay >= 10) {
        const tenDaysAgo = data.total[finalDay - 10];
        if (tenDaysAgo > 0) {
            // Daily growth rate as percentage
            growthRate = (Math.pow(finalTotal / tenDaysAgo, 1/10) - 1) * 100;
        }
    }
    
    // Get dominant cell type from clinical data
    const dominantType = clinical.dominant_type;
    
    // Create response CSS class based on clinical outcome
    const responseClass = clinicalResponse === "Complete Response (CR)" ? "success" : 
                        clinicalResponse === "Partial Response (PR)" ? "info" :
                        clinicalResponse === "Stable Disease (SD)" ? "warning" : "danger";
    
    // Construct results HTML with clinical information
    let resultsHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="alert alert-${responseClass}">
                    <h5>Clinical Response:</h5>
                    <p class="fs-5 fw-bold mb-0">
                        ${clinicalResponse}
                    </p>
                </div>
                
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Final Cell Count</h5>
                        <p class="fs-4 fw-bold">${finalTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
                        <div class="progress mb-3" style="height: 25px;">
                            <div class="progress-bar bg-primary" role="progressbar" 
                                style="width: ${sensitivePercent}%" 
                                aria-valuenow="${sensitivePercent}" aria-valuemin="0" aria-valuemax="100">
                                ${sensitivePercent}%
                            </div>
                            <div class="progress-bar bg-danger" role="progressbar" 
                                style="width: ${resistantPercent}%" 
                                aria-valuenow="${resistantPercent}" aria-valuemin="0" aria-valuemax="100">
                                ${resistantPercent}%
                            </div>
                            <div class="progress-bar bg-warning" role="progressbar" 
                                style="width: ${stemcellPercent}%" 
                                aria-valuenow="${stemcellPercent}" aria-valuemin="0" aria-valuemax="100">
                                ${stemcellPercent}%
                            </div>
                        </div>
                        <div class="row text-center small">
                            <div class="col-4">Sensitive</div>
                            <div class="col-4">Resistant</div>
                            <div class="col-4">Stem Cells</div>
                        </div>
                        <p class="small text-muted mt-2">
                            Tumor volume: ${tumorVolume.toFixed(2)} mm³
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Survival Statistics</h5>
                        <div class="row">
                            <div class="col-6">
                                <p class="mb-1">Survival Probability:</p>
                                <p class="fs-5 fw-bold">${(survivalProbability * 100).toFixed(1)}%</p>
                            </div>
                            <div class="col-6">
                                <p class="mb-1">Median Survival:</p>
                                <p class="fs-5 fw-bold">${medianSurvivalMonths.toFixed(1)} months</p>
                            </div>
                        </div>
                        <div class="progress mt-2" style="height: 10px;">
                            <div class="progress-bar bg-success" role="progressbar" 
                                style="width: ${survivalProbability * 100}%" 
                                aria-valuenow="${survivalProbability * 100}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Growth Rate</h5>
                        <p class="fs-5 fw-bold">${growthRate.toFixed(1)}% per day</p>
                        <p class="mb-0 small text-muted">
                            ${growthRate > 0 ? 'Expanding' : growthRate < 0 ? 'Shrinking' : 'Stable'} 
                            tumor population over the past 10 days
                        </p>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Dominant Cell Type</h5>
                        <p class="fs-5 fw-bold">${dominantType.charAt(0).toUpperCase() + dominantType.slice(1)}</p>
                        <p class="mb-0 small text-muted">
                            ${
                                dominantType === "sensitive" ? "Responds well to treatment but proliferates quickly" :
                                dominantType === "resistant" ? "Resistant to treatment but slower growing" :
                                dominantType === "stemcell" ? "Highly resilient with self-renewal capacity" :
                                "No dominant cell type detected"
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Treatment Protocol Information</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <p class="mb-1">Protocol:</p>
                                <p class="fw-bold">${clinical.treatment_protocol}</p>
                            </div>
                            <div class="col-md-4">
                                <p class="mb-1">Patient Age:</p>
                                <p class="fw-bold">${clinical.patient_profile.age} years</p>
                            </div>
                            <div class="col-md-4">
                                <p class="mb-1">Immune Status:</p>
                                <p class="fw-bold">${clinical.patient_profile.immune_status.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update results container
    document.getElementById('results-container').innerHTML = resultsHTML;
}
