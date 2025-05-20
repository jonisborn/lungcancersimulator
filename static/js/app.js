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
    // Connect direct patient age input to the slider
    const ageDirectInput = document.getElementById('patient-age-direct');
    if (ageDirectInput) {
        ageDirectInput.addEventListener('change', function() {
            const patientAgeSlider = document.getElementById('patient-age');
            if (patientAgeSlider) {
                patientAgeSlider.value = this.value;
                const ageValue = document.getElementById('patient-age-value');
                if (ageValue) {
                    ageValue.textContent = this.value;
                }
            }
        });
    }
    
    // Link immune status select to hidden input
    const immuneStatusSelect = document.getElementById('immune-status-select');
    if (immuneStatusSelect) {
        immuneStatusSelect.addEventListener('change', function() {
            const immuneStatusInput = document.getElementById('patient-immune-status');
            if (immuneStatusInput) {
                immuneStatusInput.value = this.value;
            }
        });
    }
    
    // Treatment regimen presets
    const treatmentRegimen = document.getElementById('treatment-regimen');
    if (treatmentRegimen) {
        treatmentRegimen.addEventListener('change', function() {
            const regimen = this.value;
            
            switch(regimen) {
                case 'folfox':
                    // FOLFOX protocol: 5-FU, leucovorin, oxaliplatin
                    setTreatmentParameters(0.85, 0.12, 14, 'PULSED');
                    break;
                    
                case 'folfiri':
                    // FOLFIRI protocol: 5-FU, leucovorin, irinotecan
                    setTreatmentParameters(0.8, 0.15, 14, 'PULSED');
                    break;
                    
                case 'capox':
                    // CAPOX protocol: capecitabine, oxaliplatin
                    setTreatmentParameters(0.75, 0.08, 21, 'CONTINUOUS');
                    break;
            }
            
            // Update all displays
            updateAllDisplayValues();
        });
    }
    
    // Comorbidities affect patient metabolism and immune status
    const diabetesCheckbox = document.getElementById('comorbidity-diabetes');
    if (diabetesCheckbox) {
        diabetesCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Diabetes affects metabolism
                const metabolismInput = document.getElementById('patient-metabolism');
                if (metabolismInput) {
                    metabolismInput.value = 0.7;
                    updateDisplayValue(
                        metabolismInput,
                        document.getElementById('patient-metabolism-value'),
                        1
                    );
                }
            }
        });
    }
    
    const cardiacCheckbox = document.getElementById('comorbidity-cardiac');
    if (cardiacCheckbox) {
        cardiacCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Cardiac disease affects immune status
                const immuneStatusInput = document.getElementById('patient-immune-status');
                if (immuneStatusInput) {
                    immuneStatusInput.value = 0.8;
                    updateDisplayValue(
                        immuneStatusInput,
                        document.getElementById('patient-immune-status-value'),
                        1
                    );
                }
            }
        });
    }
    
    // Disease stage affects initial cell populations
    const diseaseStage = document.getElementById('disease-stage');
    if (diseaseStage) {
        diseaseStage.addEventListener('change', function() {
            const stage = parseInt(this.value);
            
            switch(stage) {
                case 1:
                    setInitialPopulations(50, 2, 1);
                    break;
                case 2:
                    setInitialPopulations(100, 5, 2);
                    break;
                case 3:
                    setInitialPopulations(200, 20, 10);
                    break;
                case 4:
                    setInitialPopulations(500, 100, 30);
                    break;
            }
            
            // Update displays
            updateAllDisplayValues();
        });
    }
}

/**
 * Helper function to set treatment parameters based on regimen
 */
function setTreatmentParameters(drugStrength, drugDecay, doseFrequency, protocol) {
    const elements = {
        'drug-strength': drugStrength,
        'drug-decay': drugDecay,
        'dose-frequency': doseFrequency,
        'treatment-protocol': protocol
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }
}

/**
 * Helper function to set initial cell populations based on disease stage
 */
function setInitialPopulations(sensitive, resistant, stem) {
    const elements = {
        'sensitive-cells': sensitive,
        'resistant-cells': resistant,
        'stem-cells': stem
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }
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
    
    // Get cell population values - handle the case where Stage selection changed these
    const sensitiveCells = parseInt(document.getElementById('sensitive-cells').value);
    const resistantCells = parseInt(document.getElementById('resistant-cells').value);
    const stemCells = parseInt(document.getElementById('stem-cells').value);
    const immuneCells = parseInt(document.getElementById('immune-cells').value);
    
    // Get treatment regimen and protocol
    const treatmentRegimen = document.getElementById('treatment-regimen') ? 
                            document.getElementById('treatment-regimen').value : 'custom';
    
    const treatmentProtocol = document.getElementById('treatment-protocol').value;
    const drugStrength = parseFloat(document.getElementById('drug-strength').value);
    const drugDecay = parseFloat(document.getElementById('drug-decay').value);
    const doseFrequency = parseInt(document.getElementById('dose-frequency').value);
    const doseIntensity = parseFloat(document.getElementById('dose-intensity').value);
    
    // Get patient clinical parameters
    const patientMetabolism = document.getElementById('patient-metabolism') ? 
                             parseFloat(document.getElementById('patient-metabolism').value) : 1.0;
    
    const patientImmuneStatus = document.getElementById('patient-immune-status') ? 
                               parseFloat(document.getElementById('patient-immune-status').value) : 1.0;
                               
    // Calculate organ function based on comorbidities
    let organFunction = 1.0;
    if (comorbidities.includes('cardiac') || comorbidities.includes('diabetes')) {
        organFunction = 0.8;
    }
    
    // Performance status affects immune response
    let immuneStrength = parseFloat(document.getElementById('immune-strength').value);
    if (performanceStatus >= 2) {
        immuneStrength *= 0.8; // Reduced immune function with poor performance status
    }
    
    // Get evolutionary parameters
    const mutationRate = parseFloat(document.getElementById('mutation-rate').value);
    const chaosLevel = parseFloat(document.getElementById('chaos-level').value);
    const timeSteps = parseInt(document.getElementById('time-steps').value);
    
    // Return complete parameter set with clinical context
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
        
        // Get clinical outcomes with new more optimistic metrics
        const eradicated = clinical.eradicated || false;
        const clinicalResponse = clinical.clinical_response || "Not Available";
        const clinicalBenefit = clinical.clinical_benefit || "Treatment Effect";
        const responseRate = clinical.treatment_response_rate || 0;
        const diseaseControlRate = clinical.disease_control_rate || 0;
        const qualityOfLife = clinical.quality_of_life || "Good";
        const sideEffectProfile = clinical.side_effect_profile || "Manageable";
        const efficacyScore = clinical.treatment_efficacy_score || 0;
        const tumorVolume = clinical.tumor_volume_mm3 || 0;
        
        // Get results container
        const resultsContainer = document.getElementById('results-container');
        
        // Updated results HTML with optimistic clinical metrics
        resultsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Treatment Results</h5>
                        </div>
                        <div class="card-body">
                            <p>Tumor Response: <strong>${responseRate.toFixed(1)}%</strong></p>
                            <p>Clinical Benefit: <strong>${clinicalBenefit}</strong></p>
                            <p>Disease Control Rate: <strong>${diseaseControlRate.toFixed(0)}%</strong></p>
                            <p>Tumor Volume: <strong>${tumorVolume.toFixed(2)} mm³</strong></p>
                            <p>Complete Response: <strong>${eradicated ? 'Yes' : 'Ongoing Treatment'}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">Patient Wellness</h5>
                        </div>
                        <div class="card-body">
                            <p>Treatment Efficacy: <strong>${efficacyScore.toFixed(1)}%</strong></p>
                            <p>Quality of Life: <strong>${qualityOfLife}</strong></p>
                            <p>Side Effect Profile: <strong>${sideEffectProfile}</strong></p>
                            <p>RECIST Classification: <strong>${clinicalResponse}</strong></p>
                            <div class="progress mt-3">
                                <div class="progress-bar bg-success" role="progressbar" 
                                     style="width: ${efficacyScore}%" 
                                     aria-valuenow="${efficacyScore}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                    ${efficacyScore.toFixed(0)}%
                                </div>
                            </div>
                            <small class="text-muted">Treatment Efficacy Score</small>
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