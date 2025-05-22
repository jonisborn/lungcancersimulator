/**
 * Enhanced treatment interface interactions
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupTreatmentCardInteractions();
});

/**
 * Set up interactive behavior for treatment cards and selectors
 */
function setupTreatmentCardInteractions() {
    // Treatment type changes the available treatment options and shows the relevant info card
    const treatmentTypeSelect = document.getElementById('treatment-type');
    if (treatmentTypeSelect) {
        treatmentTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            const treatmentOptions = document.getElementById('treatment-option');
            
            // Hide all options first
            for (let i = 0; i < treatmentOptions.options.length; i++) {
                const option = treatmentOptions.options[i];
                const optionType = option.getAttribute('data-type');
                
                if (optionType === selectedType) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            }
            
            // Select first visible option
            for (let i = 0; i < treatmentOptions.options.length; i++) {
                const option = treatmentOptions.options[i];
                if (option.style.display !== 'none') {
                    treatmentOptions.selectedIndex = i;
                    break;
                }
            }
            
            // Show the relevant treatment info card
            document.querySelectorAll('.treatment-info').forEach(card => {
                card.classList.add('d-none');
            });
            
            // Show the selected treatment info card
            const selectedInfoCard = document.getElementById(`${selectedType}-info`);
            if (selectedInfoCard) {
                selectedInfoCard.classList.remove('d-none');
            }
        });
        
        // Trigger the change event to initialize
        treatmentTypeSelect.dispatchEvent(new Event('change'));
    }
    
    // Protocol selection change highlighting
    const protocolSelect = document.getElementById('treatment-protocol');
    if (protocolSelect) {
        protocolSelect.addEventListener('change', function() {
            // Update any protocol-related visuals if needed
        });
    }
}