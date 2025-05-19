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
    
    // Update protocol badge with vivid styling
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
    
    // Calculate adjusted effects with DRAMATIC differences
    // Apply stronger modifiers to make differences more obvious
    const intensityModifier = Math.pow(doseIntensity, 1.5); // Exaggerate intensity effect
    
    // Add dramatic randomization to make each change feel more significant (±10%)
    const dramaticFactor = (param) => param * (0.9 + (Math.random() * 0.2));
    
    // Calculate sensitive cell effect with dramatic differences
    const sensitiveEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.sensitiveEffect * protocolMods.sensitiveMultiplier * intensityModifier
    )));
    
    // Resistant cell effect - make protocol differences more dramatic
    const resistantEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.resistantEffect * protocolMods.resistantMultiplier * intensityModifier
    )));
    
    // Stem cell effect - exaggerate protocol impact
    const stemEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.stemEffect * protocolMods.stemMultiplier * intensityModifier
    )));
    
    // Make cycle length have more dramatic impact - greatly exaggerated effect
    // Will make short cycles MUCH more potent than long ones
    const cycleFactor = Math.pow(1.0 + ((14 - cycleLength) / 14), 2); 
    
    // Immune effect - make differences more dramatic
    const immuneEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.immuneEffect * protocolMods.immuneMultiplier * cycleFactor
    )));
    
    // Toxicity increases with dose intensity - exaggerated effect
    const toxicityEffect = Math.min(100, Math.round(dramaticFactor(
        baseEffects.toxicity * protocolMods.toxicityMultiplier * intensityModifier * 1.2
    )));
    
    // Resistance development is dramatically influenced by protocol type
    const resistanceDev = Math.min(100, Math.round(dramaticFactor(
        baseEffects.resistanceDev * protocolMods.resistanceDevMultiplier
    )));
    
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