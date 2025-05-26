from cancer_simulation_improved import CancerSimulationImproved

# Example initial cell counts
initial_cells = {
    'sensitive': 100,
    'resistant': 10,
    'stemcell': 5,
    'immunecell': 50
}

# Example parameters (mirroring those used in the app)
parameters = {
    'drug_strength': 0.8,
    'drug_decay': 0.1,
    'mutation_rate': 0.01,
    'chaos_level': 0.05,
    'immune_strength': 0.2,
    'time_steps': 50,
    'dose_frequency': 7,
    'dose_intensity': 1.0,
    'treatment_protocol': 'CONTINUOUS',
    'treatment_regimen': 'ALK',
    'patient_data': {
        'age': 55,
        'weight': 70,
        'gender': 'male',
        'performance_status': 1,
        'metabolism': 1.0,
        'immune_status': 1.0,
        'organ_function': 1.0,
        'tumor_type': 'NSCLC',
        'disease_stage': 3,
        'comorbidities': []
    }
}

# Instantiate and run the improved simulation
sim = CancerSimulationImproved(initial_cells, parameters)
history = sim.run_simulation()

# Print a summary of the results
print('Simulation completed successfully!')
print('Final total tumor cells:', history['total'][-1])
print('Clinical responses:', history['clinical_response'][-5:])  # Last 5 time points
print('PFS (last 5):', history['pfs'][-5:])
print('OS (last 5):', history['os'][-5:]) 