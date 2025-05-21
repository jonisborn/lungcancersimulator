/**
 * Simplified chart configuration for lung cancer simulator
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing charts...");
    initializeSimpleCharts();
    
    // Set up run simulation button
    document.getElementById('run-simulation-btn').addEventListener('click', function() {
        runSimpleSimulation();
    });
});

// Global chart objects
window.cellChart = null;
window.drugChart = null;

/**
 * Initialize simple charts
 */
function initializeSimpleCharts() {
    // Get chart elements
    const cellChartEl = document.getElementById('population-chart');
    const drugChartEl = document.getElementById('drug-level-chart');
    
    if (cellChartEl) {
        const ctx = cellChartEl.getContext('2d');
        window.cellChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 100}, (_, i) => i),
                datasets: [
                    {
                        label: 'Sensitive Tumor Cells',
                        data: [],
                        borderColor: 'rgba(52, 152, 219, 0.8)',
                        backgroundColor: 'rgba(52, 152, 219, 0.2)'
                    },
                    {
                        label: 'Resistant Clone Cells',
                        data: [],
                        borderColor: 'rgba(231, 76, 60, 0.8)',
                        backgroundColor: 'rgba(231, 76, 60, 0.2)'
                    },
                    {
                        label: 'Cancer Stem-like Cells',
                        data: [],
                        borderColor: 'rgba(243, 156, 18, 0.8)',
                        backgroundColor: 'rgba(243, 156, 18, 0.2)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (days)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Cell Count'
                        },
                        type: 'linear'
                    }
                }
            }
        });
    }
    
    if (drugChartEl) {
        const ctx = drugChartEl.getContext('2d');
        window.drugChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 100}, (_, i) => i),
                datasets: [
                    {
                        label: 'Drug Concentration',
                        data: [],
                        borderColor: 'rgba(46, 204, 113, 0.8)',
                        backgroundColor: 'rgba(46, 204, 113, 0.2)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (days)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Concentration'
                        },
                        min: 0,
                        max: 1
                    }
                }
            }
        });
    }
}

/**
 * Run a simulation and update charts
 */
function runSimpleSimulation() {
    console.log("Running simulation...");
    
    // Show spinner, hide results
    document.getElementById('spinner-container').classList.remove('d-none');
    document.getElementById('results-container').classList.add('d-none');
    
    // Get basic parameters
    const parameters = {
        sensitive_cells: parseInt(document.getElementById('sensitive-cells').value) || 100,
        resistant_cells: parseInt(document.getElementById('resistant-cells').value) || 10,
        stem_cells: parseInt(document.getElementById('stem-cells').value) || 5,
        immune_cells: parseInt(document.getElementById('immune-cells').value) || 50,
        treatment_protocol: document.getElementById('treatment-protocol').value,
        drug_strength: parseFloat(document.getElementById('drug-strength').value) || 0.8,
        drug_decay: parseFloat(document.getElementById('drug-decay').value) || 0.1,
        dose_frequency: parseInt(document.getElementById('dose-frequency').value) || 7,
        time_steps: 100
    };
    
    // Send to server
    fetch('/simulate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(function(data) {
        console.log("Simulation complete", data);
        
        // Update charts
        updateSimpleCharts(data.simulation_data);
        
        // Display results
        displaySimpleResults(data.clinical_summary);
        
        // Hide spinner, show results
        document.getElementById('spinner-container').classList.add('d-none');
        document.getElementById('results-container').classList.remove('d-none');
    })
    .catch(function(error) {
        console.error('Error:', error);
        
        // Hide spinner, show error
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
 * Update chart with simulation data
 */
function updateSimpleCharts(simData) {
    if (!simData) return;
    
    // Extract data arrays
    const timePoints = Array.from({length: 100}, (_, i) => i);
    const sensitiveData = simData.sensitive || [];
    const resistantData = simData.resistant || [];
    const stemcellData = simData.stemcell || [];
    const drugLevelData = simData.drug_level || [];
    
    // Update cell population chart
    if (window.cellChart) {
        window.cellChart.data.labels = timePoints;
        window.cellChart.data.datasets[0].data = sensitiveData;
        window.cellChart.data.datasets[1].data = resistantData;
        window.cellChart.data.datasets[2].data = stemcellData;
        window.cellChart.update();
    }
    
    // Update drug level chart
    if (window.drugChart) {
        window.drugChart.data.labels = timePoints;
        window.drugChart.data.datasets[0].data = drugLevelData;
        window.drugChart.update();
    }
}

/**
 * Display clinical results
 */
function displaySimpleResults(clinical) {
    if (!clinical) return;
    
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // Create HTML for results
    resultsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Treatment Results</h5>
                    </div>
                    <div class="card-body">
                        <p>Response Rate: <strong>${clinical.treatment_response_rate || 0}%</strong></p>
                        <p>Disease Control: <strong>${clinical.disease_control_rate || 0}%</strong></p>
                        <p>Clinical Benefit: <strong>${clinical.clinical_benefit || 'Unknown'}</strong></p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Quality Metrics</h5>
                    </div>
                    <div class="card-body">
                        <p>Treatment Efficacy: <strong>${(clinical.treatment_efficacy_score || 0).toFixed(1)}/10</strong></p>
                        <p>Quality of Life: <strong>${clinical.quality_of_life || 'Unknown'}</strong></p>
                        <p>Side Effects: <strong>${clinical.side_effect_profile || 'Unknown'}</strong></p>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <h5>Simulation Summary</h5>
            <div class="alert alert-info">
                <p><strong>Clinical Response: ${clinical.clinical_response || 'Unknown'}</strong></p>
                <p>This simulation suggests ${clinical.disease_control_rate > 75 ? "good" : "moderate"} disease control with the selected treatment protocol.</p>
            </div>
        </div>
    `;
}