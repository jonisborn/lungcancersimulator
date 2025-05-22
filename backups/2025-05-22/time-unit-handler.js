/**
 * Handle time unit toggle functionality for charts
 */

document.addEventListener('DOMContentLoaded', function() {
    setupTimeUnitToggle();
});

/**
 * Set up the time unit toggle buttons to update charts
 */
function setupTimeUnitToggle() {
    // Use direct selector for the labels instead of the inputs
    const daysLabel = document.querySelector('label[for="time-days"]');
    const weeksLabel = document.querySelector('label[for="time-weeks"]');
    const monthsLabel = document.querySelector('label[for="time-months"]');
    
    if (daysLabel) {
        daysLabel.addEventListener('click', function() {
            console.log('Days clicked via label');
            setTimeout(() => convertTimeUnits('days'), 50);
        });
    }
    
    if (weeksLabel) {
        weeksLabel.addEventListener('click', function() {
            console.log('Weeks clicked via label');
            setTimeout(() => convertTimeUnits('weeks'), 50);
        });
    }
    
    if (monthsLabel) {
        monthsLabel.addEventListener('click', function() {
            console.log('Months clicked via label');
            setTimeout(() => convertTimeUnits('months'), 50);
        });
    }
    
    // Also add listeners to radio inputs for change events
    document.querySelectorAll('input[name="time-unit"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const unit = this.id.replace('time-', '');
            console.log(`${unit} selected via change event`);
            convertTimeUnits(unit);
        });
    });
}

/**
 * Convert chart time units
 */
function convertTimeUnits(unit) {
    if (!window.populationChart || !window.drugLevelChart) {
        console.warn('Charts not available yet');
        return;
    }
    
    console.log('Converting to', unit);
    
    // Update the active button styling
    document.querySelectorAll('.time-unit-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${unit}`).classList.add('active');
    
    // Get basic time points (0-100)
    const timePoints = Array.from({length: 100}, (_, i) => i);
    
    // Create new labels
    let newLabels = timePoints;
    let xAxisLabel = 'Time (days)';
    
    if (unit === 'weeks') {
        xAxisLabel = 'Time (weeks)';
        newLabels = timePoints.map(day => (day / 7).toFixed(1));
    } else if (unit === 'months') {
        xAxisLabel = 'Time (months)';
        newLabels = timePoints.map(day => (day / 30).toFixed(1));
    }
    
    // Update population chart
    window.populationChart.data.labels = newLabels;
    window.populationChart.options.scales.x.title.text = xAxisLabel;
    window.populationChart.update();
    
    // Update drug level chart
    window.drugLevelChart.data.labels = newLabels;
    window.drugLevelChart.options.scales.x.title.text = xAxisLabel;
    window.drugLevelChart.update();
    
    // Store the current unit for future reference
    window.currentTimeUnit = unit;
    
    console.log('Time unit conversion complete');
}