/**
 * Direct time scale buttons functionality for the charts
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Direct time scale buttons script loaded");
    
    // After the page is fully loaded, set up the time scale buttons
    setTimeout(setupTimeScaleButtons, 500);
});

function setupTimeScaleButtons() {
    // Get the time scale buttons
    const daysBtn = document.getElementById('chart-days-btn');
    const weeksBtn = document.getElementById('chart-weeks-btn');
    const monthsBtn = document.getElementById('chart-months-btn');
    
    if (!daysBtn || !weeksBtn || !monthsBtn) {
        console.warn("Time scale buttons not found");
        return;
    }
    
    // Add click event listeners
    daysBtn.addEventListener('click', function() {
        setTimeScale('days');
        updateButtonStyles(this, [weeksBtn, monthsBtn]);
    });
    
    weeksBtn.addEventListener('click', function() {
        setTimeScale('weeks');
        updateButtonStyles(this, [daysBtn, monthsBtn]);
    });
    
    monthsBtn.addEventListener('click', function() {
        setTimeScale('months');
        updateButtonStyles(this, [daysBtn, weeksBtn]);
    });
    
    console.log("Time scale buttons initialized");
}

function updateButtonStyles(activeBtn, inactiveBtns) {
    // Set the active button style
    activeBtn.classList.add('btn-primary');
    activeBtn.classList.remove('btn-outline-primary');
    
    // Set the inactive buttons style
    inactiveBtns.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });
}

function setTimeScale(scale) {
    console.log("Setting time scale to:", scale);
    
    // Make sure charts are defined
    if (!window.populationChart || !window.drugLevelChart) {
        console.warn("Charts not initialized yet");
        return;
    }
    
    // Define the base time points (0-100 days)
    const timePoints = Array.from({length: 100}, (_, i) => i);
    
    // Create the new labels based on the selected scale
    let newLabels = timePoints;
    let xAxisTitle = 'Time (days)';
    
    if (scale === 'weeks') {
        xAxisTitle = 'Time (weeks)';
        newLabels = timePoints.map(day => (day / 7).toFixed(1));
    } else if (scale === 'months') {
        xAxisTitle = 'Time (months)';
        newLabels = timePoints.map(day => (day / 30).toFixed(1));
    }
    
    // Update the population chart
    populationChart.data.labels = newLabels;
    populationChart.options.scales.x.title.text = xAxisTitle;
    populationChart.update();
    
    // Update the drug level chart
    drugLevelChart.data.labels = newLabels;
    drugLevelChart.options.scales.x.title.text = xAxisTitle;
    drugLevelChart.update();
    
    console.log("Time scale updated to:", scale);
}