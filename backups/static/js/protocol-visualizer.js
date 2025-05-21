/**
 * Protocol Visualizer - Real-time visualization of treatment protocol impacts
 * This module provides interactive feedback on protocol selection
 */

// Protocol effects reference data - DRAMATICALLY different values for stronger visual feedback
const protocolEffects = {
    regimens: {
        folfox: {
            name: "FOLFOX",
            description: "5-FU, Leucovorin, and Oxaliplatin. Very strong effect on sensitive cells, poor against resistant cells.",
            sensitiveEffect: 90,
            resistantEffect: 30, 
            stemEffect: 50,
            immuneEffect: 40,
            toxicity: 70,
            resistanceDev: 75
        },
        folfiri: {
            name: "FOLFIRI",
            description: "5-FU, Leucovorin, and Irinotecan. Excellent at targeting resistant cells, moderate on sensitive.",
            sensitiveEffect: 50,
            resistantEffect: 85,
            stemEffect: 60,
            immuneEffect: 35,
            toxicity: 80,
            resistanceDev: 50
        },
        capox: {
            name: "CAPOX",
            description: "Capecitabine and Oxaliplatin. Extended release oral therapy with much better toxicity profile.",
            sensitiveEffect: 65,
            resistantEffect: 45,
            stemEffect: 40,
            immuneEffect: 70,
            toxicity: 40,
            resistanceDev: 60
        },
        custom: {
            name: "Custom Protocol",
            description: "Experimental immunotherapy regimen with strong immune enhancement and balanced cell killing.",
            sensitiveEffect: 60,
            resistantEffect: 60,
            stemEffect: 65,
            immuneEffect: 85,
            toxicity: 50,
            resistanceDev: 40
        }
    },
    protocols: {
        CONTINUOUS: {
            name: "Continuous",
            description: "Constant low-dose maintenance therapy. Excellent at preventing resistance but weaker cell-killing.",
            sensitiveMultiplier: 0.7,
            resistantMultiplier: 0.8,
            stemMultiplier: 1.0,
            immuneMultiplier: 1.3,
            toxicityMultiplier: 0.6,
            resistanceDevMultiplier: 0.5  // Great at preventing resistance
        },
        PULSED: {
            name: "Pulsed",
            description: "High-dose cycles with rest periods. Powerful immediate effect but high toxicity and resistance risk.",
            sensitiveMultiplier: 1.6,  // Very strong sensitive cell effect
            resistantMultiplier: 0.9,
            stemMultiplier: 0.8,
            immuneMultiplier: 0.5,  // Suppresses immune system
            toxicityMultiplier: 1.7,  // Very toxic
            resistanceDevMultiplier: 1.8  // High resistance development
        },
        METRONOMIC: {
            name: "Metronomic",
            description: "Frequent low-dose therapy. Excellent immune enhancement and stem cell control with minimal toxicity.",
            sensitiveMultiplier: 0.7,
            resistantMultiplier: 0.9,
            stemMultiplier: 1.5,  // Great stem cell control
            immuneMultiplier: 1.9,  // Major immune boost
            toxicityMultiplier: 0.4,  // Very low toxicity
            resistanceDevMultiplier: 0.7
        },
        ADAPTIVE: {
            name: "Adaptive",
            description: "Evolutionary-informed dosing. Uniquely effective at preventing resistance emergence while maintaining efficacy.",
            sensitiveMultiplier: 1.1,
            resistantMultiplier: 1.4,  // Better at targeting resistant cells
            stemMultiplier: 1.3,
            immuneMultiplier: 1.2,
            toxicityMultiplier: 0.7,
            resistanceDevMultiplier: 0.3  // Dramatically reduces resistance development
        }
    }
};

/**
 * Initialize the protocol visualizer
 */
function initProtocolVisualizer() {
    // Set up protocol card selection
    setupProtocolCards();
    
    // Set up drug regimen radio buttons
    setupRegimenRadioButtons();
    
    // Attach event listeners to protocol selectors
    document.querySelectorAll('.protocol-selector').forEach(selector => {
        selector.addEventListener('change', updateProtocolVisualization);
        selector.addEventListener('input', updateProtocolVisualization);
    });
    
    // Initial visualization update
    updateProtocolVisualization();
}

/**
 * Set up protocol card selection with dramatic visual feedback
 */
function setupProtocolCards() {
    // Get all protocol cards
    const cards = document.querySelectorAll('.protocol-card');
    const protocolInput = document.getElementById('treatment-protocol');
    
    cards.forEach(card => {
        // Add click event to each card
        card.addEventListener('click', function() {
            // Remove active class from all cards
            cards.forEach(c => {
                c.classList.remove('active');
                c.style.border = '2px solid transparent';
            });
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Get protocol type from data attribute
            const protocol = this.getAttribute('data-protocol');
            
            // Add dramatic border color based on protocol type
            if (protocol === 'CONTINUOUS') {
                this.style.border = '2px solid var(--bs-success)';
            } else if (protocol === 'PULSED') {
                this.style.border = '2px solid var(--bs-danger)';
            } else if (protocol === 'METRONOMIC') {
                this.style.border = '2px solid var(--bs-info)';
            } else if (protocol === 'ADAPTIVE') {
                this.style.border = '2px solid var(--bs-primary)';
            }
            
            // Set the hidden input value
            protocolInput.value = protocol;
            
            // Trigger update to show dramatic changes
            updateProtocolVisualization();
            
            // Add visual animation for feedback
            this.classList.add('pulse-animation');
            setTimeout(() => {
                this.classList.remove('pulse-animation');
            }, 700);
        });
    });
}

/**
 * Set up regimen radio buttons with info panels
 */
function setupRegimenRadioButtons() {
    // Get all regimen radio buttons
    const radios = document.querySelectorAll('.regimen-radio');
    const regimenInput = document.getElementById('treatment-regimen');
    
    // Get all info panels
    const infoPanels = document.querySelectorAll('[id$="-info"]');
    
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Set the hidden input value
            regimenInput.value = this.value;
            
            // Hide all info panels
            infoPanels.forEach(panel => panel.classList.add('d-none'));
            
            // Show selected info panel
            const infoPanel = document.getElementById(`${this.value}-info`);
            if (infoPanel) {
                infoPanel.classList.remove('d-none');
            }
            
            // Update visualization
            updateProtocolVisualization();
        });
    });
}

/**
 * Update the protocol visualization based on current selections
 */
function updateProtocolVisualization() {
    // Get current protocol selections - uses the hidden input values now
    const regimenInput = document.getElementById('treatment-regimen');
    const protocolInput = document.getElementById('treatment-protocol');
    const frequencySlider = document.getElementById('dose-frequency');
    const intensitySlider = document.getElementById('dose-intensity');
    const protocolBadge = document.getElementById('protocol-badge');
    
    // Get values
    const selectedRegimen = regimenInput.value;
    const selectedProtocol = protocolInput.value;
    const cycleLength = parseInt(frequencySlider.value);
    const doseIntensity = parseFloat(intensitySlider.value);
    
    // Update slider display values
    const frequencyValueDisplay = document.getElementById('dose-frequency-value');
    const intensityValueDisplay = document.getElementById('dose-intensity-value');
    
    if (frequencyValueDisplay) {
        frequencyValueDisplay.textContent = `${cycleLength} DAYS`;
    }
    
    if (intensityValueDisplay) {
        intensityValueDisplay.textContent = `${Math.round(doseIntensity * 100)}%`;
    }
    
    // Update protocol badge with dramatic styling
    if (protocolBadge) {
        // Set badge text
        protocolBadge.textContent = `${selectedProtocol} + ${selectedRegimen.toUpperCase()}`;
        
        // Change badge color based on protocol
        protocolBadge.className = 'badge px-3 py-2';
        
        if (selectedProtocol === 'CONTINUOUS') {
            protocolBadge.classList.add('bg-success');
        } else if (selectedProtocol === 'PULSED') {
            protocolBadge.classList.add('bg-danger');
        } else if (selectedProtocol === 'METRONOMIC') {
            protocolBadge.classList.add('bg-info');
        } else if (selectedProtocol === 'ADAPTIVE') {
            protocolBadge.classList.add('bg-primary');
        }
    }
    
    // Get base effects from regimen
    const baseEffects = protocolEffects.regimens[selectedRegimen] || protocolEffects.regimens['folfox'];
    
    // Get protocol multipliers
    const protocolMods = protocolEffects.protocols[selectedProtocol] || protocolEffects.protocols['PULSED'];
    
    // SUPER DRAMATIC differences - apply stronger modifiers to make differences obvious on screen
    const intensityModifier = Math.pow(doseIntensity, 2.0); // Greatly exaggerate intensity effect
    
    // Add dramatic randomization (±15%) to make each change feel significant
    const dramaticFactor = (param) => param * (0.85 + (Math.random() * 0.3));
    
    // Protocol-specific boosters to create MAJOR visual differentiation
    let protocolBoost = {
        sensitive: 1.0,
        resistant: 1.0,
        stem: 1.0,
        immune: 1.0,
        toxicity: 1.0,
        resistance: 1.0
    };
    
    // Set dramatically different boosts for each protocol type
    if (selectedProtocol === 'CONTINUOUS') {
        protocolBoost.sensitive = 0.6;  // Much lower sensitive cell effect
        protocolBoost.immune = 1.3;     // Better immune effect
        protocolBoost.toxicity = 0.5;   // Much lower toxicity
        protocolBoost.resistance = 0.4; // Much lower resistance development
    } else if (selectedProtocol === 'PULSED') {
        protocolBoost.sensitive = 1.8;  // Much higher sensitive cell effect
        protocolBoost.immune = 0.5;     // Much worse immune effect
        protocolBoost.toxicity = 1.7;   // Much higher toxicity
        protocolBoost.resistance = 1.8; // Much higher resistance development
    } else if (selectedProtocol === 'METRONOMIC') {
        protocolBoost.stem = 1.4;       // Much better stem cell effect
        protocolBoost.immune = 1.8;     // Dramatically better immune effect
        protocolBoost.toxicity = 0.4;   // Much lower toxicity
    } else if (selectedProtocol === 'ADAPTIVE') {
        protocolBoost.resistant = 1.6;  // Much better resistant cell effect
        protocolBoost.stem = 1.3;       // Better stem cell effect
        protocolBoost.resistance = 0.3; // Dramatically lower resistance development
    }
    
    // Calculate effects with extreme protocol differentiation
    const sensitiveEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.sensitiveEffect * protocolMods.sensitiveMultiplier * intensityModifier * protocolBoost.sensitive
    )));
    
    const resistantEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.resistantEffect * protocolMods.resistantMultiplier * intensityModifier * protocolBoost.resistant
    )));
    
    const stemEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.stemEffect * protocolMods.stemMultiplier * intensityModifier * protocolBoost.stem
    )));
    
    // Make cycle length have extreme impact - massively exaggerated effect
    const cycleFactor = Math.pow(1.0 + ((14 - cycleLength) / 10), 2); 
    
    const immuneEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.immuneEffect * protocolMods.immuneMultiplier * cycleFactor * protocolBoost.immune
    )));
    
    const toxicityEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.toxicity * protocolMods.toxicityMultiplier * intensityModifier * 1.5 * protocolBoost.toxicity
    )));
    
    const resistanceDev = Math.min(100, Math.round(dramaticFactor(
        baseEffects.resistanceDev * protocolMods.resistanceDevMultiplier * protocolBoost.resistance
    )));
    
    // Update progress bars with animation
    updateProgressBar('sensitive-effect', sensitiveEffect);
    updateProgressBar('resistant-effect', resistantEffect);
    updateProgressBar('stem-effect', stemEffect);
    updateProgressBar('immune-effect', immuneEffect);
    updateProgressBar('toxicity-effect', toxicityEffect);
    updateProgressBar('resistance-dev-effect', resistanceDev);
    
    // Update progress bar text values
    document.getElementById('sensitive-effect-value').textContent = `${sensitiveEffect}%`;
    document.getElementById('resistant-effect-value').textContent = `${resistantEffect}%`;
    document.getElementById('stem-effect-value').textContent = `${stemEffect}%`;
    document.getElementById('immune-effect-value').textContent = `${immuneEffect}%`;
    document.getElementById('toxicity-effect-value').textContent = `${toxicityEffect}%`;
    document.getElementById('resistance-dev-effect-value').textContent = `${resistanceDev}%`;
    
    // Update protocol description
    updateProtocolDescription(selectedProtocol, selectedRegimen, cycleLength, doseIntensity);
}

/**
 * Update a progress bar with a new value
 * @param {string} elementId - ID of the progress bar element
 * @param {number} value - New value for the progress bar (0-100)
 */
function updateProgressBar(elementId, value) {
    const progressBar = document.getElementById(elementId);
    if (progressBar) {
        progressBar.style.width = `${value}%`;
        progressBar.setAttribute('aria-valuenow', value);
        progressBar.textContent = `${value}%`;
        
        // Update color based on value for some metrics
        if (elementId === 'toxicity-effect' || elementId === 'resistance-dev-effect') {
            if (value < 30) {
                progressBar.className = 'progress-bar bg-success';
            } else if (value < 60) {
                progressBar.className = 'progress-bar bg-warning';
            } else {
                progressBar.className = 'progress-bar bg-danger';
            }
        }
    }
}

/**
 * Update the protocol description with specific details
 */
function updateProtocolDescription(protocol, regimen, cycleLength, doseIntensity) {
    const descElement = document.getElementById('protocol-description');
    const protocolInfo = protocolEffects.protocols[protocol];
    const regimenInfo = protocolEffects.regimens[regimen];
    
    if (descElement && protocolInfo && regimenInfo) {
        let intensityDesc = "standard";
        if (doseIntensity > 1.1) intensityDesc = "high";
        else if (doseIntensity < 0.9) intensityDesc = "low";
        
        let cycleDesc = "standard";
        if (cycleLength < 10) cycleDesc = "short";
        else if (cycleLength > 20) cycleDesc = "extended";
        
        const description = `
            ${protocolInfo.name} Protocol (${regimenInfo.name}): ${protocolInfo.description} 
            Using ${intensityDesc}-dose intensity with ${cycleDesc} ${cycleLength}-day cycles.
            ${regimenInfo.description}
        `;
        
        descElement.textContent = description.replace(/\s+/g, ' ').trim();
    }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initProtocolVisualizer);