/**
 * Chart.js configuration and setup for cancer simulator
 */

// Color scheme for different cell types
const chartColors = {
    sensitive: 'rgba(52, 152, 219, 0.8)',
    resistant: 'rgba(231, 76, 60, 0.8)',
    stemcell: 'rgba(243, 156, 18, 0.8)',
    total: 'rgba(255, 255, 255, 0.9)',
    drug: 'rgba(46, 204, 113, 0.8)',
    fitness: {
        sensitive: 'rgba(52, 152, 219, 0.8)',
        resistant: 'rgba(231, 76, 60, 0.8)',
        stemcell: 'rgba(243, 156, 18, 0.8)'
    }
};

// Initialize charts with empty data
window.populationChart = null;
window.drugLevelChart = null;
window.fitnessChart = null;

// Boolean to track log scale state
let isLogScale = false;

/**
 * Initialize all charts with empty data
 */
function initializeCharts() {
    // Population Chart
    const popCtx = document.getElementById('population-chart')?.getContext('2d');
    if (popCtx) {
        window.populationChart = new Chart(popCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Sensitive Cells',
                    data: [],
                    borderColor: chartColors.sensitive,
                    backgroundColor: chartColors.sensitive.replace('0.8', '0.2'),
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Resistant Cells',
                    data: [],
                    borderColor: chartColors.resistant,
                    backgroundColor: chartColors.resistant.replace('0.8', '0.2'),
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Stem Cells',
                    data: [],
                    borderColor: chartColors.stemcell,
                    backgroundColor: chartColors.stemcell.replace('0.8', '0.2'),
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Total Population',
                    data: [],
                    borderColor: chartColors.total,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (isLogScale) {
                                label += Math.round(Math.pow(10, context.raw) * 100) / 100;
                            } else {
                                label += Math.round(context.raw * 100) / 100;
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (days)'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cell Count'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            if (isLogScale) {
                                return '10^' + value;
                            } else {
                                return value;
                            }
                        }
                    }
                }
            }
        }
    });

    // Drug Level Chart
    const drugCtx = document.getElementById('drug-chart').getContext('2d');
    drugChart = new Chart(drugCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Drug Concentration',
                    data: [],
                    borderColor: chartColors.drug,
                    backgroundColor: chartColors.drug.replace('0.8', '0.2'),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (days)'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Concentration'
                    },
                    min: 0,
                    max: 1,
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    // Fitness Chart
    const fitnessCtx = document.getElementById('fitness-chart').getContext('2d');
    fitnessChart = new Chart(fitnessCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Sensitive Fitness',
                    data: [],
                    borderColor: chartColors.fitness.sensitive,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Resistant Fitness',
                    data: [],
                    borderColor: chartColors.fitness.resistant,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Stem Cell Fitness',
                    data: [],
                    borderColor: chartColors.fitness.stemcell,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (days)'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Fitness Value'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Update charts with new simulation data
 * @param {Object} data - Simulation results data
 */
function updateCharts(data) {
    // Update time labels
    const timeLabels = data.time_points;
    
    // Extract datasets
    const sensitiveData = data.sensitive;
    const resistantData = data.resistant;
    const stemcellData = data.stemcell;
    const totalData = data.total;
    const drugData = data.drug_level;
    
    // Fitness values for each cell type over time
    const sensitivefitnessData = data.fitness.map(f => f[0]);
    const resistantfitnessData = data.fitness.map(f => f[1]);
    const stemcellfitnessData = data.fitness.map(f => f[2]);
    
    // Apply log transformation if enabled
    let transformedSensitive = sensitiveData;
    let transformedResistant = resistantData;
    let transformedStemcell = stemcellData;
    let transformedTotal = totalData;
    
    if (isLogScale) {
        // Apply log10 transform, but handle zero values (set to very small number)
        transformedSensitive = sensitiveData.map(v => v <= 0 ? -6 : Math.log10(v));
        transformedResistant = resistantData.map(v => v <= 0 ? -6 : Math.log10(v));
        transformedStemcell = stemcellData.map(v => v <= 0 ? -6 : Math.log10(v));
        transformedTotal = totalData.map(v => v <= 0 ? -6 : Math.log10(v));
    }
    
    // Update population chart
    populationChart.data.labels = timeLabels;
    populationChart.data.datasets[0].data = transformedSensitive;
    populationChart.data.datasets[1].data = transformedResistant;
    populationChart.data.datasets[2].data = transformedStemcell;
    populationChart.data.datasets[3].data = transformedTotal;
    populationChart.update();
    
    // Update drug level chart
    drugChart.data.labels = timeLabels;
    drugChart.data.datasets[0].data = drugData;
    drugChart.update();
    
    // Update fitness chart
    fitnessChart.data.labels = timeLabels;
    fitnessChart.data.datasets[0].data = sensitivefitnessData;
    fitnessChart.data.datasets[1].data = resistantfitnessData;
    fitnessChart.data.datasets[2].data = stemcellfitnessData;
    fitnessChart.update();
}

/**
 * Toggle between linear and logarithmic scale for population chart
 */
function toggleLogScale() {
    isLogScale = !isLogScale;
    
    // Update y-axis configuration
    populationChart.options.scales.y.type = isLogScale ? 'linear' : 'linear';
    
    // If we have data, update the chart
    if (populationChart.data.datasets[0].data.length > 0) {
        const simulationData = window.lastSimulationData;
        if (simulationData) {
            updateCharts(simulationData);
        }
    }
    
    // Update button text
    document.getElementById('toggle-log-scale').innerText = 
        isLogScale ? 'Use Linear Scale' : 'Use Log Scale';
}

// Make these functions globally available
window.initializeCharts = initializeCharts;
window.updateCharts = updateCharts;
window.toggleLogScale = toggleLogScale;
