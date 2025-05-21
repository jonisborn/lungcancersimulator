/**
 * Direct fix for time unit toggle functionality
 */

// Make sure this runs after the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Time toggle fix loaded");
    setupDirectTimeToggle();
});

// Set up the time toggle buttons
function setupDirectTimeToggle() {
    // Add direct click event to time unit buttons after a small delay to ensure charts are initialized
    setTimeout(function() {
        // Get buttons from the time unit toggle
        const daysButton = document.getElementById('btn-days');
        const weeksButton = document.getElementById('btn-weeks');
        const monthsButton = document.getElementById('btn-months');
        
        if (daysButton) {
            daysButton.onclick = function() {
                directTimeUnitChange('days');
                return false;
            };
        }
        
        if (weeksButton) {
            weeksButton.onclick = function() {
                directTimeUnitChange('weeks');
                return false;
            };
        }
        
        if (monthsButton) {
            monthsButton.onclick = function() {
                directTimeUnitChange('months');
                return false;
            };
        }
        
        console.log("Direct time toggle buttons configured");
    }, 500);
}

// Function to directly change the time units on the charts
function directTimeUnitChange(unit) {
    console.log("Direct time unit change called with:", unit);
    
    // Make sure charts exist
    if (typeof window.populationChart === 'undefined' || typeof window.drugLevelChart === 'undefined') {
        console.error("Charts not available");
        return;
    }
    
    // Update button appearance
    document.querySelectorAll('#time-unit-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${unit}`).classList.add('active');
    
    // Define time points
    const timePoints = Array.from({length: 100}, (_, i) => i);
    
    // Define new labels based on selected unit
    let labels = timePoints;
    let xAxisTitle = 'Time (days)';
    
    if (unit === 'weeks') {
        labels = timePoints.map(day => (day / 7).toFixed(1));
        xAxisTitle = 'Time (weeks)';
    } else if (unit === 'months') {
        labels = timePoints.map(day => (day / 30).toFixed(1));
        xAxisTitle = 'Time (months)';
    }
    
    // Update charts with new labels
    window.populationChart.data.labels = labels;
    window.populationChart.options.scales.x.title.text = xAxisTitle;
    window.populationChart.update();
    
    window.drugLevelChart.data.labels = labels;
    window.drugLevelChart.options.scales.x.title.text = xAxisTitle;
    window.drugLevelChart.update();
    
    console.log("Time unit change complete:", unit);
}