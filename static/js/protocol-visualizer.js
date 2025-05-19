/**
 * Protocol Visualizer - Real-time visualization of treatment protocol impacts
 * This module provides interactive feedback on protocol selection
 */

// Protocol effects reference data - based on simulation.py values
const protocolEffects = {
    regimens: {
        folfox: {
            name: "FOLFOX",
            description: "5-FU, Leucovorin, and Oxaliplatin. Strong effect on sensitive cells, less effective against resistant cells.",
            sensitiveEffect: 75,
            resistantEffect: 35, 
            stemEffect: 50,
            immuneEffect: 45,
            toxicity: 60,
            resistanceDev: 70
        },
        folfiri: {
            name: "FOLFIRI",
            description: "5-FU, Leucovorin, and Irinotecan. Better at targeting resistant cells, good overall potency.",
            sensitiveEffect: 60,
            resistantEffect: 65,
            stemEffect: 55,
            immuneEffect: 40,
            toxicity: 65,
            resistanceDev: 60
        },
        capox: {
            name: "CAPOX",
            description: "Capecitabine and Oxaliplatin. Extended release oral therapy with reduced toxicity profile.",
            sensitiveEffect: 65,
            resistantEffect: 40,
            stemEffect: 45,
            immuneEffect: 55,
            toxicity: 50,
            resistanceDev: 65
        },
        custom: {
            name: "Custom Protocol",
            description: "Experimental regimen with balanced effects and potential immunotherapeutic components.",
            sensitiveEffect: 65,
            resistantEffect: 60,
            stemEffect: 55,
            immuneEffect: 60,
            toxicity: 55,
            resistanceDev: 50
        }
    },
    protocols: {
        CONTINUOUS: {
            name: "Continuous",
            description: "Constant low-dose maintenance therapy. Prevents resistance emergence but has reduced cell-killing.",
            sensitiveMultiplier: 0.9,
            resistantMultiplier: 0.9,
            stemMultiplier: 1.0,
            immuneMultiplier: 1.1,
            toxicityMultiplier: 0.8,
            resistanceDevMultiplier: 0.7
        },
        PULSED: {
            name: "Pulsed",
            description: "Standard high-dose cycles with rest periods. Strong immediate effect but allows regrowth between cycles.",
            sensitiveMultiplier: 1.3,
            resistantMultiplier: 1.0,
            stemMultiplier: 1.0,
            immuneMultiplier: 0.8,
            toxicityMultiplier: 1.3,
            resistanceDevMultiplier: 1.2
        },
        METRONOMIC: {
            name: "Metronomic",
            description: "Frequent low-dose therapy. Anti-angiogenic effects and immune-friendly with reduced toxicity.",
            sensitiveMultiplier: 0.8,
            resistantMultiplier: 0.9,
            stemMultiplier: 1.2,
            immuneMultiplier: 1.4,
            toxicityMultiplier: 0.6,
            resistanceDevMultiplier: 0.8
        },
        ADAPTIVE: {
            name: "Adaptive",
            description: "Dose adjusted based on tumor burden. Maintains sensitive cells to suppress resistant clones.",
            sensitiveMultiplier: 0.9,
            resistantMultiplier: 1.1,
            stemMultiplier: 1.1,
            immuneMultiplier: 1.0,
            toxicityMultiplier: 0.8,
            resistanceDevMultiplier: 0.5
        }
    }
};

/**
 * Initialize the protocol visualizer
 */
function initProtocolVisualizer() {
    // Attach event listeners to protocol selectors
    document.querySelectorAll('.protocol-selector').forEach(selector => {
        selector.addEventListener('change', updateProtocolVisualization);
        selector.addEventListener('input', updateProtocolVisualization);
    });
    
    // Initial visualization update
    updateProtocolVisualization();
}

/**
 * Update the protocol visualization based on current selections
 */
function updateProtocolVisualization() {
    // Get current protocol selections
    const regimenSelect = document.getElementById('treatment-regimen');
    const protocolSelect = document.getElementById('treatment-protocol');
    const frequencySlider = document.getElementById('dose-frequency');
    const intensitySlider = document.getElementById('dose-intensity');
    const protocolBadge = document.getElementById('protocol-badge');
    
    // Get selected values
    const selectedRegimen = regimenSelect.value;
    const selectedProtocol = protocolSelect.value;
    const cycleLength = parseInt(frequencySlider.value);
    const doseIntensity = parseFloat(intensitySlider.value);
    
    // Update protocol badge
    if (protocolBadge) {
        // Remove all previous protocol classes
        protocolBadge.className = 'protocol-badge';
        // Add new protocol-specific class
        protocolBadge.classList.add(`protocol-badge-${selectedProtocol.toLowerCase()}`);
        // Update badge text
        protocolBadge.textContent = selectedProtocol;
    }
    
    // Get base effects from regimen
    const baseEffects = protocolEffects.regimens[selectedRegimen] || protocolEffects.regimens['folfox'];
    
    // Get protocol multipliers
    const protocolMods = protocolEffects.protocols[selectedProtocol] || protocolEffects.protocols['PULSED'];
    
    // Calculate adjusted effects
    const sensitiveEffect = Math.min(100, Math.round(baseEffects.sensitiveEffect * protocolMods.sensitiveMultiplier * doseIntensity));
    const resistantEffect = Math.min(100, Math.round(baseEffects.resistantEffect * protocolMods.resistantMultiplier * doseIntensity));
    const stemEffect = Math.min(100, Math.round(baseEffects.stemEffect * protocolMods.stemMultiplier * doseIntensity));
    
    // Calculate immune and toxicity effects (inverse relationship with cycle length)
    const cycleFactor = 1.0 + ((14 - cycleLength) / 28); // Shorter cycles = stronger effect
    const immuneEffect = Math.min(100, Math.round(baseEffects.immuneEffect * protocolMods.immuneMultiplier * cycleFactor));
    
    // Toxicity increases with dose intensity
    const toxicityEffect = Math.min(100, Math.round(baseEffects.toxicity * protocolMods.toxicityMultiplier * doseIntensity));
    
    // Resistance development is influenced by protocol type and cycle length
    const resistanceDev = Math.min(100, Math.round(baseEffects.resistanceDev * protocolMods.resistanceDevMultiplier));
    
    // Update progress bars
    updateProgressBar('sensitive-effect', sensitiveEffect);
    updateProgressBar('resistant-effect', resistantEffect);
    updateProgressBar('stem-effect', stemEffect);
    updateProgressBar('immune-effect', immuneEffect);
    updateProgressBar('toxicity-effect', toxicityEffect);
    updateProgressBar('resistance-dev-effect', resistanceDev);
    
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