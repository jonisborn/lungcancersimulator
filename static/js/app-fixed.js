/**
 * Main application logic for lung cancer simulator frontend - fixed version
 */

// Global variables for the cancer simulator
window.lastSimulationData = null;

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts if function exists
    if (typeof initializeCharts === 'function') {
        initializeCharts();
    }
    
    // Set up event handlers
    setupEventListeners();
    
    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

/**
 * Set up all user interface event listeners
 */
function setupEventListeners() {
    // Form submission handler 
    const form = document.getElementById('simulation-form');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            runSimulation();
        });
    }
    
    // Run simulation button
    const runButton = document.getElementById('run-simulation-btn');
    if (runButton) {
        runButton.addEventListener('click', runSimulation);
    }
    
    // Reset parameters button
    const resetButton = document.getElementById('reset-params');
    if (resetButton) {
        resetButton.addEventListener('click', resetParameters);
    }
    
    // Toggle log scale button
    const toggleButton = document.getElementById('toggle-log-scale');
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            if (typeof toggleLogScale === 'function') {
                toggleLogScale();
            }
        });
    }
    
    // Set up scenario cards
    setupScenarioCards();
    
    // Set up biomarker button
    const biomarkerBtn = document.getElementById('biomarker-btn');
    if (biomarkerBtn) {
        biomarkerBtn.addEventListener('click', function() {
            const biomarkerModal = new bootstrap.Modal(document.getElementById('biomarkerModal'));
            biomarkerModal.show();
        });
    }
}

/**
 * Run the simulation with current parameters
 */
function runSimulation() {
    console.log("Starting simulation...");
    
    // Show spinner, hide results
    const spinnerContainer = document.getElementById('spinner-container');
    const resultsContainer = document.getElementById('results-container');
    
    if (spinnerContainer) spinnerContainer.classList.remove('d-none');
    if (resultsContainer) resultsContainer.classList.add('d-none');
    
    // Collect parameters
    const parameters = {
        // Cell populations
        sensitive_cells: parseInt(document.getElementById('sensitive-cells').value) || 100,
        resistant_cells: parseInt(document.getElementById('resistant-cells').value) || 10,
        stem_cells: parseInt(document.getElementById('stem-cells').value) || 5,
        immune_cells: parseInt(document.getElementById('immune-cells').value) || 50,
        
        // Treatment protocol
        treatment_protocol: document.getElementById('treatment-protocol').value,
        drug_strength: parseFloat(document.getElementById('drug-strength').value) || 0.8,
        drug_decay: parseFloat(document.getElementById('drug-decay').value) || 0.1,
        dose_frequency: parseInt(document.getElementById('dose-frequency').value) || 7,
        
        // Patient parameters
        patient_age: parseInt(document.getElementById('patient-age-direct')?.value || 
                             document.getElementById('patient-age')?.value || 55),
        patient_metabolism: parseFloat(document.getElementById('patient-metabolism')?.value || 1.0),
        patient_immune_status: parseFloat(document.getElementById('patient-immune-status')?.value || 1.0),
        
        // Disease characteristics
        tumor_type: document.getElementById('tumor-type')?.value || 'lung',
        disease_stage: parseInt(document.getElementById('disease-stage')?.value || 3),
        
        // Additional parameters
        treatment_regimen: document.getElementById('treatment-regimen')?.value || 'carboplatin',
        mutation_rate: parseFloat(document.getElementById('mutation-rate')?.value || 0.01),
        
        // Time steps
        time_steps: 100
    };
    
    console.log("Parameters collected:", parameters);
    
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
        console.log("Simulation data received:", data);
        
        // Update charts and display results
        if (data.simulation_data && typeof updateCharts === 'function') {
            window.lastSimulationData = data.simulation_data;
            updateCharts(data.simulation_data);
        }
        
        // Hide spinner, show results
        if (spinnerContainer) spinnerContainer.classList.add('d-none');
        if (resultsContainer) {
            resultsContainer.classList.remove('d-none');
            
            // Display basic results
            resultsContainer.innerHTML = `
                <h3 class="mb-4">Simulation Results</h3>
                <div class="alert alert-success">
                    <h5>Simulation Completed</h5>
                    <p>The simulation ran successfully. View the charts for population dynamics.</p>
                </div>
            `;
            
            // If we have clinical summary data, display it
            if (data.clinical_summary) {
                const clinicalData = data.clinical_summary;
                
                resultsContainer.innerHTML += `
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0">Clinical Outcomes</h5>
                                </div>
                                <div class="card-body">
                                    <p>Response Rate: <strong>${clinicalData.treatment_response_rate || 0}%</strong></p>
                                    <p>Disease Control: <strong>${clinicalData.disease_control_rate || 0}%</strong></p>
                                    <p>Quality of Life: <strong>${clinicalData.quality_of_life || "Good"}</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    })
    .catch(error => {
        console.error('Simulation error:', error);
        
        // Show error message
        if (spinnerContainer) spinnerContainer.classList.add('d-none');
        if (resultsContainer) {
            resultsContainer.classList.remove('d-none');
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Simulation Error</h5>
                    <p>${error.message}</p>
                </div>
            `;
        }
    });
}

/**
 * Reset all parameters to their default values
 */
function resetParameters() {
    // Reset cell population sliders
    setSliderValue('sensitive-cells', 100);
    setSliderValue('resistant-cells', 10);
    setSliderValue('stem-cells', 5);
    setSliderValue('immune-cells', 50);
    setSliderValue('myeloid-cells', 30);
    
    // Reset treatment parameters
    setSliderValue('drug-strength', 0.8);
    setSliderValue('drug-decay', 0.1);
    setSliderValue('dose-frequency', 7);
    
    // Reset patient parameters
    setSliderValue('patient-age', 55);
    if (document.getElementById('patient-age-direct')) {
        document.getElementById('patient-age-direct').value = 55;
    }
    setSliderValue('patient-metabolism', 1.0);
    setSliderValue('patient-immune-status', 1.0);
    
    // Reset evolutionary parameters
    setSliderValue('mutation-rate', 0.01);
    
    // Reset select elements
    if (document.getElementById('treatment-protocol')) {
        document.getElementById('treatment-protocol').value = 'PULSED';
    }
    if (document.getElementById('treatment-regimen')) {
        document.getElementById('treatment-regimen').value = 'carboplatin';
    }
    if (document.getElementById('disease-stage')) {
        document.getElementById('disease-stage').value = 3;
    }
    
    // Reset lung cancer specific parameters
    setSliderValue('pack-years', 30);
    
    // Update protocol cards if present
    const protocolCards = document.querySelectorAll('.protocol-card');
    protocolCards.forEach(card => {
        if (card.dataset.protocol === 'PULSED') {
            card.classList.add('active');
            card.style.borderColor = 'var(--bs-primary)';
        } else {
            card.classList.remove('active');
            card.style.borderColor = 'transparent';
        }
    });
}

/**
 * Helper function to set a slider value and update its display
 */
function setSliderValue(sliderId, value) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(`${sliderId}-value`);
    
    if (slider) {
        slider.value = value;
        if (display) {
            display.textContent = value;
        }
    }
}

/**
 * Set up clinical scenario card selection
 */
function setupScenarioCards() {
    // Set up scenario card selection
    const scenarioCards = document.querySelectorAll('.scenario-card');
    
    scenarioCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            scenarioCards.forEach(c => c.classList.remove('active', 'border-primary'));
            
            // Add active class to selected card
            this.classList.add('active', 'border-primary');
        });
    });
    
    // Set up load scenario button
    const loadScenarioButton = document.getElementById('load-scenario');
    if (loadScenarioButton) {
        loadScenarioButton.addEventListener('click', function() {
            const selectedCard = document.querySelector('.scenario-card.active');
            if (selectedCard) {
                const scenario = selectedCard.dataset.scenario;
                loadClinicalScenario(scenario);
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('scenarioModal'));
                modal.hide();
            }
        });
    }
}

/**
 * Load a predefined clinical scenario
 * @param {string} scenarioId - ID of the scenario to load
 */
function loadClinicalScenario(scenarioId) {
    alert("Loading scenario: " + scenarioId);
    // More scenario loading logic would go here
}