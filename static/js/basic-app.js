// Basic app.js for lung cancer simulator
document.addEventListener('DOMContentLoaded', function() {
    console.log("Lung cancer simulator initialized");
    
    // Set up run simulation button
    const runButton = document.getElementById('run-simulation-btn');
    if (runButton) {
        runButton.addEventListener('click', function() {
            runBasicSimulation();
        });
    }
    
    // Set up form submission
    const form = document.getElementById('simulation-form');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            runBasicSimulation();
        });
    }
});

// Basic simulation function
function runBasicSimulation() {
    console.log("Running simulation...");
    
    // Show spinner
    const spinnerContainer = document.getElementById('spinner-container');
    if (spinnerContainer) {
        spinnerContainer.classList.remove('d-none');
    }
    
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
    
    // Send request to server
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
        
        // Hide spinner
        if (spinnerContainer) {
            spinnerContainer.classList.add('d-none');
        }
        
        // Show results
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.classList.remove('d-none');
            resultsContainer.innerHTML = '<div class="alert alert-success">Simulation completed successfully!</div>';
        }
    })
    .catch(function(error) {
        console.error('Error running simulation:', error);
        
        // Hide spinner
        if (spinnerContainer) {
            spinnerContainer.classList.add('d-none');
        }
        
        // Show error
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.classList.remove('d-none');
            resultsContainer.innerHTML = '<div class="alert alert-danger">Error running simulation</div>';
        }
    });
}