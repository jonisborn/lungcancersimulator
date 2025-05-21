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
    const days = document.getElementById('time-days');
    const weeks = document.getElementById('time-weeks');
    const months = document.getElementById('time-months');
    
    if (days && weeks && months) {
        days.addEventListener('click', function() {
            console.log('Days clicked');
            convertTimeUnits('days');
        });
        
        weeks.addEventListener('click', function() {
            console.log('Weeks clicked');
            convertTimeUnits('weeks');
        });
        
        months.addEventListener('click', function() {
            console.log('Months clicked');
            convertTimeUnits('months');
        });
    }
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
    
    console.log('Time unit conversion complete');
}