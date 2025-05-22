"""
Mathematical verification module for cancer simulation calculations.

This module provides redundant calculation methods to verify the accuracy
of key mathematical operations in the simulation. Each verification function
implements an alternative calculation approach to cross-check the primary method.
"""

import numpy as np
import logging
from typing import Dict, List, Any, Tuple
from simulation import CancerSimulation, PatientProfile, TreatmentProtocol

logger = logging.getLogger(__name__)

class MathematicalVerification:
    """
    Provides redundant calculation methods to verify the mathematical 
    accuracy of the cancer simulation.
    """
    
    @staticmethod
    def verify_fitness_calculation(simulation: CancerSimulation, pop_vector: np.ndarray) -> Tuple[bool, float, np.ndarray, np.ndarray]:
        """
        Verify the fitness calculation using an alternative method.
        
        Args:
            simulation: The CancerSimulation instance
            pop_vector: Population vector to calculate fitness for
            
        Returns:
            Tuple of (is_valid, max_difference, original_result, verification_result)
        """
        # Get the original calculation result
        original_result = simulation.calculate_fitness(pop_vector)
        
        # Perform alternative calculation using simplified approach
        # This implements core evolutionary game theory calculations with a different method
        
        # Normalize population differently to avoid division by zero
        total_pop = np.sum(pop_vector) + 1e-10  # Avoid division by zero
        freq_vector = pop_vector / total_pop
        
        # Calculate base fitness differently - use element-wise multiplication then sum
        base_fitness = np.zeros(len(pop_vector))
        for i in range(len(pop_vector) - 1):  # Skip immune cells which are handled separately
            for j in range(len(pop_vector)):
                if i < len(simulation.game_matrix) and j < len(simulation.game_matrix[0]):
                    base_fitness[i] += simulation.game_matrix[i, j] * freq_vector[j]
        
        # Get patient factors
        drug_clearance = simulation.patient.get_drug_clearance_modifier()
        patient_immune_modifier = simulation.patient.get_immune_modifier()
        
        # Calculate drug effect differently
        effective_drug_level = simulation.drug_level * simulation.drug_strength * (1.0/drug_clearance)
        
        # Apply protocol-specific effects
        protocol_effects = getattr(simulation, 'protocol_effects', {
            'sensitive_multiplier': 1.0,
            'resistant_multiplier': 1.0,
            'stemcell_multiplier': 1.0,
            'immune_boost': 1.0,
            'immune_penalty': 1.0
        })
        
        # Apply drug effect with simplified formula
        drug_effect = np.array([
            effective_drug_level * protocol_effects.get('sensitive_multiplier', 1.0),
            effective_drug_level * 0.2 * protocol_effects.get('resistant_multiplier', 1.0),
            effective_drug_level * 0.5 * protocol_effects.get('stemcell_multiplier', 1.0),
            0.0
        ])
        
        # Calculate immune effect differently
        base_immune_strength = simulation.immune_strength * patient_immune_modifier
        immune_boost = protocol_effects.get('immune_boost', 1.0)
        immune_penalty = protocol_effects.get('immune_penalty', 1.0)
        effective_immune_strength = base_immune_strength * immune_boost * immune_penalty
        
        # Apply alternative immune effect calculation
        immune_effect = np.array([
            effective_immune_strength,
            effective_immune_strength * 0.7,
            effective_immune_strength * 0.3,
            0.0
        ])
        
        # Simplified calculation for immune cell fitness
        tumor_cells = np.sum(pop_vector[:3])
        immune_stimulation = min(1.0, tumor_cells / 500.0)
        
        # Calculate verification result
        verification_result = base_fitness - drug_effect - immune_effect
        if len(verification_result) > 3:
            verification_result[3] = 0.05 * immune_stimulation - 0.03
        
        # Calculate the maximum difference between methods
        differences = np.abs(original_result - verification_result)
        max_difference = np.max(differences) if len(differences) > 0 else 0
        
        # Determine if the results are within tolerance (1% or 0.01 absolute)
        tolerance = max(0.01, np.max(np.abs(original_result)) * 0.01)
        is_valid = max_difference <= tolerance
        
        return is_valid, max_difference, original_result, verification_result

    @staticmethod
    def verify_tumor_volume_calculation(simulation: CancerSimulation, pop_vector: np.ndarray) -> Tuple[bool, float, float, float]:
        """
        Verify the tumor volume calculation using an alternative method.
        
        Args:
            simulation: The CancerSimulation instance
            pop_vector: Population vector to calculate tumor volume for
            
        Returns:
            Tuple of (is_valid, difference, original_result, verification_result)
        """
        # Get the original calculation result
        original_result = simulation.calculate_tumor_volume(pop_vector)
        
        # Alternative calculation using a different approach
        # Clinical tumor volume calculation based on cell count and average cell volume
        # Average cancer cell volume ~2000 cubic microns, convert to cubic mm
        tumor_cells = np.sum(pop_vector[:3])  # Sum all cancer cell types
        
        # Different volume calculation method based on cell packing density
        # and accounting for stromal component
        cell_volume_cubic_microns = 2000  # Average cancer cell volume
        packing_density = 0.7  # Cells occupy 70% of tumor volume
        stromal_fraction = 0.3  # Stromal components add 30% to volume
        
        # Convert to cubic mm: 1 cubic mm = 10^9 cubic microns
        volume_cubic_mm = (tumor_cells * cell_volume_cubic_microns / 1e9) / packing_density * (1 + stromal_fraction)
        
        # Add calculation for spherical tumor dimensions
        # V = (4/3) * pi * r^3, solve for radius
        # Convert to approximate diameter in cm for clinical relevance
        if volume_cubic_mm > 0:
            radius_mm = ((3 * volume_cubic_mm) / (4 * np.pi)) ** (1/3)
            diameter_cm = 2 * radius_mm / 10  # Convert to cm
            verification_result = volume_cubic_mm
        else:
            verification_result = 0
            
        # Calculate the difference
        difference = abs(original_result - verification_result)
        
        # Determine if the results are within tolerance (1% or 0.1 cubic mm absolute)
        tolerance = max(0.1, original_result * 0.01)
        is_valid = difference <= tolerance
        
        return is_valid, difference, original_result, verification_result
        
    @staticmethod
    def verify_survival_probability(simulation: CancerSimulation, pop_vector: np.ndarray) -> Tuple[bool, float, float, float]:
        """
        Verify the survival probability calculation using an alternative method.
        
        Args:
            simulation: The CancerSimulation instance
            pop_vector: Population vector to calculate survival probability for
            
        Returns:
            Tuple of (is_valid, difference, original_result, verification_result)
        """
        # Get the original calculation result
        original_result = simulation.calculate_survival_probability(pop_vector)
        
        # Alternative calculation using a simplified approach
        # Based on clinically derived survival curves and tumor burden
        
        # Calculate tumor burden differently
        tumor_cells = np.sum(pop_vector[:3])
        relative_burden = tumor_cells / simulation.initial_tumor_burden if simulation.initial_tumor_burden > 0 else 1.0
        
        # Incorporate patient factors differently
        patient_data = getattr(simulation, 'patient_data', {})
        
        # Age is a significant prognostic factor
        age = patient_data.get('age', 65)
        age_factor = 1.0
        if age < 50:
            age_factor = 1.2  # Better prognosis
        elif age > 70:
            age_factor = 0.8  # Worse prognosis
            
        # Performance status is critical for survival
        perf_status = patient_data.get('performance_status', 1)
        perf_factor = 1.0
        if perf_status == 0:
            perf_factor = 1.3  # Excellent performance status
        elif perf_status == 1:
            perf_factor = 1.0  # Normal
        elif perf_status == 2:
            perf_factor = 0.7  # Reduced
        else:
            perf_factor = 0.4  # Poor
            
        # Disease stage is a major determinant of survival
        disease_stage = patient_data.get('disease_stage', 3)
        stage_factor = 1.0
        if disease_stage == 1:
            stage_factor = 3.0  # Much better prognosis
        elif disease_stage == 2:
            stage_factor = 2.0
        elif disease_stage == 3:
            stage_factor = 1.0  # Reference stage III
        else:
            stage_factor = 0.4  # Stage IV: much worse prognosis
            
        # Tumor composition affects survival (stem cells correlate with worse outcomes)
        stemcell_fraction = pop_vector[2] / tumor_cells if tumor_cells > 0 else 0
        stemcell_factor = 1.0 - (stemcell_fraction * 0.5)  # Higher stem cell fraction reduces survival
            
        # Calculate base survival probability
        # Logistic function that approximates survival curves
        k = 0.01  # Steepness of the curve
        x0 = 2.0  # Midpoint of the curve (relative burden = 2.0)
        base_probability = 1.0 / (1.0 + np.exp(k * (relative_burden - x0)))
        
        # Apply all factors
        verification_result = base_probability * age_factor * perf_factor * stage_factor * stemcell_factor
        
        # Ensure result is between 0 and 1
        verification_result = max(0.0, min(1.0, verification_result))
        
        # Calculate the difference
        difference = abs(original_result - verification_result)
        
        # Determine if the results are within tolerance (5% absolute for survival probability)
        tolerance = 0.05
        is_valid = difference <= tolerance
        
        return is_valid, difference, original_result, verification_result
    
    @staticmethod
    def verify_all_calculations(simulation: CancerSimulation) -> Dict[str, Any]:
        """
        Verify all key mathematical calculations and return a comprehensive report.
        
        Args:
            simulation: The CancerSimulation instance
            
        Returns:
            Dictionary with verification results
        """
        # Get the current population vector
        pop_vector = np.array([
            simulation.populations['sensitive'],
            simulation.populations['resistant'],
            simulation.populations['stemcell'],
            simulation.populations['immunecell']
        ])
        
        # Verify each calculation
        fitness_verification = MathematicalVerification.verify_fitness_calculation(simulation, pop_vector)
        volume_verification = MathematicalVerification.verify_tumor_volume_calculation(simulation, pop_vector)
        survival_verification = MathematicalVerification.verify_survival_probability(simulation, pop_vector)
        
        # Compile results
        verification_results = {
            'fitness': {
                'valid': fitness_verification[0],
                'max_difference': fitness_verification[1],
                'original': fitness_verification[2].tolist(),
                'verification': fitness_verification[3].tolist()
            },
            'tumor_volume': {
                'valid': volume_verification[0],
                'difference': volume_verification[1],
                'original': volume_verification[2],
                'verification': volume_verification[3]
            },
            'survival_probability': {
                'valid': survival_verification[0],
                'difference': survival_verification[1],
                'original': survival_verification[2],
                'verification': survival_verification[3]
            },
            'overall_valid': all([
                fitness_verification[0],
                volume_verification[0],
                survival_verification[0]
            ])
        }
        
        return verification_results