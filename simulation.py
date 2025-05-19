import numpy as np
import logging
import math
from typing import Dict, List, Any, Tuple
from enum import Enum, auto

logger = logging.getLogger(__name__)

class TreatmentProtocol(Enum):
    """Enumeration of clinical treatment protocols"""
    CONTINUOUS = auto()  # Continuous administration (maintenance)
    PULSED = auto()      # Pulsed high/low dosing (standard)
    METRONOMIC = auto()  # Low-dose, high-frequency
    ADAPTIVE = auto()    # Adaptive therapy based on tumor burden
    
class PatientProfile:
    """Represents patient-specific factors affecting treatment response"""
    
    def __init__(self, 
                 age: int = 55,
                 metabolism: float = 1.0, 
                 immune_status: float = 1.0,
                 organ_function: float = 1.0):
        """
        Initialize a patient profile.
        
        Args:
            age: Patient age (years)
            metabolism: Rate of drug metabolism (0.5-1.5, with 1.0 being average)
            immune_status: Strength of immune system (0.5-1.5, with 1.0 being average)
            organ_function: Liver/kidney function affecting drug clearance (0.5-1.5)
        """
        self.age = max(18, min(100, age))
        self.metabolism = max(0.5, min(1.5, metabolism))
        self.immune_status = max(0.5, min(1.5, immune_status))
        self.organ_function = max(0.5, min(1.5, organ_function))
        
    def get_drug_clearance_modifier(self) -> float:
        """Calculate modifier for drug clearance based on patient factors"""
        # Age affects clearance (older patients clear drugs slower)
        age_factor = 1.0 - max(0, (self.age - 50)) / 100
        
        # Combine factors (metabolism and organ function both affect clearance)
        return (self.metabolism * 0.6 + self.organ_function * 0.4) * age_factor
    
    def get_immune_modifier(self) -> float:
        """Calculate modifier for immune response based on patient factors"""
        # Age affects immune response (declines with age)
        age_factor = 1.0 - max(0, (self.age - 40)) / 120
        
        # Combine with immune status
        return self.immune_status * age_factor

class CancerSimulation:
    """
    Cancer evolution simulator that models evolutionary game dynamics, 
    drug interactions, and immune response.
    """
    
    def __init__(self, initial_cells: Dict[str, int], parameters: Dict[str, Any]):
        """
        Initialize the cancer simulation with initial cell counts and parameters.
        
        Args:
            initial_cells: Dictionary with counts for 'sensitive', 'resistant', and 'stemcell'
            parameters: Dictionary containing simulation parameters
        """
        # Initialize cell populations
        self.populations = {
            'sensitive': initial_cells.get('sensitive', 100),
            'resistant': initial_cells.get('resistant', 10),
            'stemcell': initial_cells.get('stemcell', 5),
            'immunecell': initial_cells.get('immunecell', 50)  # Added immune cells
        }
        
        # Set simulation parameters
        self.drug_strength = parameters.get('drug_strength', 0.8)
        self.drug_decay = parameters.get('drug_decay', 0.1)
        self.mutation_rate = parameters.get('mutation_rate', 0.01)
        self.immune_strength = parameters.get('immune_strength', 0.2)
        self.chaos_level = parameters.get('chaos_level', 0.05)
        self.time_steps = parameters.get('time_steps', 100)
        
        # Clinical parameters
        self.treatment_protocol = parameters.get('treatment_protocol', TreatmentProtocol.CONTINUOUS)
        self.dose_frequency = parameters.get('dose_frequency', 7)  # Days between doses
        self.dose_intensity = parameters.get('dose_intensity', 1.0)  # Relative dose intensity
        
        # Store complete patient_data for reference in other methods
        self.patient_data = parameters.get('patient', {})
        
        # Create the patient profile object
        self.patient = PatientProfile(
            age=self.patient_data.get('age', 55),
            metabolism=self.patient_data.get('metabolism', 1.0),
            immune_status=self.patient_data.get('immune_status', 1.0),
            organ_function=self.patient_data.get('organ_function', 1.0)
        )
        
        # Clinical cancer type parameters
        self.doubling_time = parameters.get('doubling_time', 150)  # Tumor doubling time in days
        self.treatment_threshold = parameters.get('treatment_threshold', 500)  # When to start treatment
        
        # Set or create default evolutionary game matrix
        if parameters.get('game_matrix') is not None:
            self.game_matrix = np.array(parameters.get('game_matrix'))
        else:
            # Default game matrix based on common evolutionary dynamics in cancer
            # Rows/cols: [sensitive, resistant, stemcell, immunecell]
            self.game_matrix = np.array([
                [1.0, 0.7, 0.8, 0.3],  # sensitive vs others
                [0.9, 0.6, 0.7, 0.4],  # resistant vs others
                [1.1, 0.8, 1.0, 0.2],  # stemcell vs others
                [0.0, 0.0, 0.0, 0.0]   # immunecell (handled separately)
            ])
        
        # Initialize variables to track simulation history
        self.history = {
            'sensitive': [],
            'resistant': [],
            'stemcell': [],
            'immunecell': [],
            'total': [],
            'fitness': [],
            'drug_level': [],
            'survival_probability': [],
            'tumor_volume': []
        }
        
        # Initial values
        self.drug_level = 0  # Start with no drug
        self.next_dose_day = 0  # Day of next drug administration
        self.initial_tumor_burden = sum(self.populations.values()) - self.populations['immunecell']

    def calculate_fitness(self, pop_vector: np.ndarray) -> np.ndarray:
        """
        Calculate fitness of each cell type based on replicator dynamics.
        
        Args:
            pop_vector: Vector of population sizes for each cell type
            
        Returns:
            Fitness values for each cell type
        """
        # Normalize population to get frequency of each type
        total_pop = np.sum(pop_vector)
        if total_pop == 0:
            return np.zeros(len(pop_vector))
        
        freq_vector = pop_vector / total_pop
        
        # Calculate fitness based on evolutionary game theory
        base_fitness = np.dot(self.game_matrix, freq_vector)
        
        # Get patient-specific factors for drug effects
        drug_clearance = self.patient.get_drug_clearance_modifier()
        
        # Get patient-specific data from parameters if available
        patient_data = getattr(self, 'patient_data', {}) 
        
        # Disease stage dramatically affects drug response (stronger effect)
        disease_stage_factor = 1.0
        if patient_data.get('disease_stage') == 1:
            disease_stage_factor = 0.6  # Early stage responds better
        elif patient_data.get('disease_stage') == 2:
            disease_stage_factor = 0.8
        elif patient_data.get('disease_stage') == 3:
            disease_stage_factor = 1.0  # Baseline
        elif patient_data.get('disease_stage') == 4:
            disease_stage_factor = 1.4  # Metastatic - less responsive
            
        # Tumor type affects drug response
        tumor_type_factor = 1.0
        if patient_data.get('tumor_type') == 'colorectal':
            tumor_type_factor = 1.0  # Baseline
        elif patient_data.get('tumor_type') == 'breast':
            tumor_type_factor = 0.8  # More responsive to therapy
        elif patient_data.get('tumor_type') == 'lung':
            tumor_type_factor = 1.3  # Less responsive
        elif patient_data.get('tumor_type') == 'prostate':
            tumor_type_factor = 0.9  # Moderately responsive
        elif patient_data.get('tumor_type') == 'melanoma':
            tumor_type_factor = 1.2  # Less responsive
            
        # Comorbidities affect drug efficacy
        comorbidity_factor = 1.0
        comorbidities = patient_data.get('comorbidities', [])
        if 'diabetes' in comorbidities:
            comorbidity_factor *= 1.2  # Reduced efficacy
        if 'cardiac' in comorbidities:
            comorbidity_factor *= 1.15
        if 'hypertension' in comorbidities:
            comorbidity_factor *= 1.1
            
        # Calculate effective drug strength based on all factors
        effective_drug_level = self.drug_level * self.drug_strength * (1.0/drug_clearance) 
        effective_drug_level *= (1.0/disease_stage_factor) * (1.0/tumor_type_factor) * (1.0/comorbidity_factor)
        
        # Apply drug effect with dramatically increased patient-specific effects
        drug_effect = np.array([
            effective_drug_level,             # Full effect on sensitive cells
            effective_drug_level * 0.2,       # Reduced effect on resistant cells 
            effective_drug_level * 0.5,       # Moderate effect on stem cells
            0.0                               # No drug effect on immune cells
        ])
        
        # Adjust immune response based on patient profile
        patient_immune_modifier = self.patient.get_immune_modifier()
        base_immune_strength = self.immune_strength * patient_immune_modifier
        
        # Scale immune effect based on immune cell population
        immune_population_factor = min(1.0, pop_vector[3] / 100.0)
        effective_immune_strength = base_immune_strength * immune_population_factor
        
        # Apply immune effect: depends on cell visibility to immune system
        immune_effect = np.array([
            effective_immune_strength,            # Fully visible to immune system
            effective_immune_strength * 0.7,      # Less visible to immune system
            effective_immune_strength * 0.3,      # Stem cells can evade immune response
            0.0                                   # No immune effect on immune cells
        ])
        
        # Apply combined effects
        adjusted_fitness = base_fitness - drug_effect - immune_effect
        
        # Add chaos/noise to model stochastic effects
        noise = np.random.normal(0, self.chaos_level, size=len(pop_vector))
        
        # Calculate immune cell fitness separately (dependent on tumor burden)
        # Immune cells grow in response to tumor and decline when tumor is gone
        tumor_cells = pop_vector[0] + pop_vector[1] + pop_vector[2]
        if len(adjusted_fitness) > 3:  # Make sure we have immune cells in the model
            immune_stimulation = min(1.0, tumor_cells / 500.0)  # Stimulation saturates
            adjusted_fitness[3] = 0.05 * immune_stimulation - 0.03  # Base growth/decline rate
        
        return adjusted_fitness + noise

    def update_populations(self, pop_vector: np.ndarray, fitness: np.ndarray) -> np.ndarray:
        """
        Update cell populations based on fitness and incorporating mutations.
        
        Args:
            pop_vector: Current population sizes for each cell type
            fitness: Fitness values for each cell type
            
        Returns:
            Updated population vector
        """
        # Basic growth model: cells grow proportionally to fitness
        growth_factor = 1 + 0.1 * fitness  # 10% growth rate scaling
        
        # Ensure no negative growth factors (cells die off rather than becoming negative)
        growth_factor = np.maximum(growth_factor, 0)
        
        # Calculate new population without mutations
        new_pop = pop_vector * growth_factor
        
        # Apply mutations with expanded matrix for immune cells
        mutation_matrix = np.array([
            [1 - self.mutation_rate, self.mutation_rate, 0, 0],             # Sensitive → Resistant
            [0, 1 - self.mutation_rate/2, self.mutation_rate/2, 0],         # Resistant → Stemcell
            [0, 0, 1, 0],                                                   # Stemcell (no mutations)
            [0, 0, 0, 1]                                                    # Immune cells (no mutations)
        ])
        
        # Apply mutations
        new_pop = np.dot(mutation_matrix.T, new_pop)
        
        # Apply carrying capacity constraints (resource limitations)
        total_tumor_cells = new_pop[0] + new_pop[1] + new_pop[2]
        if total_tumor_cells > 10000:  # Arbitrary carrying capacity
            # Scale back proportionally
            scaling_factor = 10000 / total_tumor_cells
            new_pop[0:3] *= scaling_factor
        
        # Ensure no negative populations
        return np.maximum(new_pop, 0)
        
    def calculate_tumor_volume(self, pop_vector: np.ndarray) -> float:
        """
        Calculate tumor volume based on cell populations (clinical relevance).
        
        Args:
            pop_vector: Current population sizes for each cell type
            
        Returns:
            Tumor volume in cubic millimeters
        """
        # Assumed cell size: ~20 microns diameter = ~4.2 * 10^-6 mm³ per cell
        CELL_VOLUME_MM3 = 4.2e-6
        
        # Sum all cancer cell populations (excluding immune cells)
        total_cancer_cells = pop_vector[0] + pop_vector[1] + pop_vector[2]
        
        # Calculate volume
        volume_mm3 = total_cancer_cells * CELL_VOLUME_MM3
        
        return volume_mm3
        
    def calculate_survival_probability(self, pop_vector: np.ndarray) -> float:
        """
        Estimate survival probability based on tumor burden, composition, and extensive patient factors.
        
        Args:
            pop_vector: Current population sizes for each cell type
            
        Returns:
            Probability of survival (0.0-1.0)
        """
        # Calculate total tumor burden
        total_tumor = pop_vector[0] + pop_vector[1] + pop_vector[2]
        
        # Baseline survival based on tumor size
        if total_tumor < 1:  # Complete response
            base_survival = 0.98  # Near complete survival for total elimination
        else:
            # Sharper logistic decay for more dramatic effect
            base_survival = 0.95 / (1 + math.exp(0.002 * (total_tumor - 3000)))
        
        # Adjust based on composition (stem cells are worse prognosis)
        stem_fraction = pop_vector[2] / total_tumor if total_tumor > 0 else 0
        composition_factor = 1.0 - (stem_fraction * 0.7)  # Up to 70% reduction for stem cell-dominant tumors
        
        # Get patient-specific data from parameters if available
        patient_data = getattr(self, 'patient_data', {})
        
        # Patient age has strong effect on survival
        age = self.patient.age
        age_factor = 1.0
        if age < 40:
            age_factor = 1.2  # Better prognosis for young patients
        elif age < 60:
            age_factor = 1.0  # Baseline
        elif age < 75:
            age_factor = 0.8  # Reduced survival
        else:
            age_factor = 0.6  # Significantly reduced survival
            
        # Disease stage has major impact on survival
        stage_factor = 1.0
        disease_stage = patient_data.get('disease_stage', 3)  # Default to stage 3
        if disease_stage == 1:
            stage_factor = 1.8  # Much better prognosis
        elif disease_stage == 2:
            stage_factor = 1.4
        elif disease_stage == 3:
            stage_factor = 1.0  # Reference
        elif disease_stage == 4:
            stage_factor = 0.5  # Metastatic disease - dramatically worse prognosis
            
        # Tumor type affects survival (with much higher differences)
        tumor_type_factor = 1.0
        tumor_type = patient_data.get('tumor_type', 'colorectal')
        if tumor_type == 'breast':
            tumor_type_factor = 1.3  # Better prognosis
        elif tumor_type == 'lung':
            tumor_type_factor = 0.7  # Worse prognosis
        elif tumor_type == 'prostate':
            tumor_type_factor = 1.4  # Better prognosis
        elif tumor_type == 'melanoma':
            tumor_type_factor = 0.8  # Worse prognosis
            
        # Performance status dramatically affects survival
        perf_status_factor = 1.0
        perf_status = patient_data.get('performance_status', 1)
        if perf_status == 0:
            perf_status_factor = 1.3  # Excellent condition
        elif perf_status == 1:
            perf_status_factor = 1.0  # Baseline
        elif perf_status == 2:
            perf_status_factor = 0.7  # Reduced survival
        elif perf_status >= 3:
            perf_status_factor = 0.4  # Severely reduced survival
            
        # Comorbidities significantly reduce survival
        comorbidity_factor = 1.0
        comorbidities = patient_data.get('comorbidities', [])
        if comorbidities:
            # Each comorbidity has a substantial impact
            comorbidity_factor = max(0.5, 1.0 - (len(comorbidities) * 0.15))
            
        # Calculate final survival with all factors having stronger effects
        survival = base_survival * composition_factor * age_factor * stage_factor * tumor_type_factor * perf_status_factor * comorbidity_factor
        
        # Ensure result is in valid range
        return min(0.99, max(0.01, survival))

    def update_drug_level(self, current_day: int):
        """
        Update drug concentration based on pharmacokinetic decay and dosing schedule.
        
        Args:
            current_day: Current simulation day
        """
        # Apply patient-specific drug clearance
        clearance_modifier = self.patient.get_drug_clearance_modifier()
        effective_decay = self.drug_decay * clearance_modifier
        
        # Standard decay
        self.drug_level *= (1 - effective_decay)
        
        # Check if it's time for a new dose based on treatment protocol
        if self.treatment_protocol == TreatmentProtocol.CONTINUOUS:
            # Continuous dosing (maintains a constant level)
            if self.drug_level < (self.drug_strength * 0.5):
                self.drug_level = self.drug_strength
                
        elif self.treatment_protocol == TreatmentProtocol.PULSED:
            # Pulsed dosing (high doses at fixed intervals)
            if current_day >= self.next_dose_day:
                self.drug_level = self.drug_strength * self.dose_intensity
                self.next_dose_day = current_day + self.dose_frequency
                
        elif self.treatment_protocol == TreatmentProtocol.METRONOMIC:
            # Metronomic dosing (frequent, low doses)
            if current_day >= self.next_dose_day:
                self.drug_level = self.drug_strength * 0.6 * self.dose_intensity
                frequency_divisor = self.dose_frequency/3
                adjusted_frequency = 1 if frequency_divisor < 1 else int(frequency_divisor)
                self.next_dose_day = current_day + adjusted_frequency
                
        elif self.treatment_protocol == TreatmentProtocol.ADAPTIVE:
            # Adaptive therapy (treat only when tumor exceeds threshold)
            tumor_cells = sum(self.populations.values()) - self.populations['immunecell']
            if tumor_cells > self.treatment_threshold and current_day >= self.next_dose_day:
                self.drug_level = self.drug_strength * self.dose_intensity
                self.next_dose_day = current_day + self.dose_frequency
    
    def run_simulation(self) -> Dict[str, List]:
        """
        Run the full cancer evolution simulation.
        
        Returns:
            Dictionary with simulation history
        """
        # Initialize population vector: [sensitive, resistant, stemcell, immunecell]
        pop_vector = np.array([
            self.populations['sensitive'],
            self.populations['resistant'],
            self.populations['stemcell'],
            self.populations['immunecell']
        ])
        
        # Run simulation for specified time steps
        for t in range(self.time_steps):
            # Calculate fitness based on current state
            fitness = self.calculate_fitness(pop_vector)
            
            # Update population based on fitness and mutations
            pop_vector = self.update_populations(pop_vector, fitness)
            
            # Update drug level based on pharmacokinetics and treatment protocol
            self.update_drug_level(current_day=t)
            
            # Calculate tumor volume
            volume = self.calculate_tumor_volume(pop_vector)
            
            # Calculate survival probability
            survival_prob = self.calculate_survival_probability(pop_vector)
            
            # Record history
            self.history['sensitive'].append(pop_vector[0])
            self.history['resistant'].append(pop_vector[1])
            self.history['stemcell'].append(pop_vector[2])
            self.history['immunecell'].append(pop_vector[3])
            self.history['total'].append(np.sum(pop_vector[0:3]))  # Total tumor cells (excluding immune)
            self.history['fitness'].append(fitness.tolist())
            self.history['drug_level'].append(self.drug_level)
            self.history['tumor_volume'].append(volume)
            self.history['survival_probability'].append(survival_prob)
        
        # Add time points for x-axis
        self.history['time_points'] = list(range(self.time_steps))
        
        # Add clinical metadata as a separate field not in history
        self.clinical_info = {
            'treatment_protocol': self.treatment_protocol.name if hasattr(self.treatment_protocol, 'name') else str(self.treatment_protocol),
            'dose_frequency': self.dose_frequency,
            'dose_intensity': self.dose_intensity,
            'patient_age': self.patient.age,
            'immune_status': self.patient.immune_status,
            'doubling_time': self.doubling_time,
            'final_survival_probability': self.history['survival_probability'][-1] if self.history['survival_probability'] else 0
        }
        
        return self.history

    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the simulation results.
        
        Returns:
            Dictionary containing summary statistics and clinical outcomes
        """
        if not self.history['total']:
            return {"error": "Simulation hasn't been run yet"}
            
        # Calculate various metrics
        final_total = self.history['total'][-1]
        max_population = max(self.history['total']) if self.history['total'] else 0
        
        # Calculate composition
        final_composition = {}
        if final_total > 0:
            final_composition = {
                'sensitive': self.history['sensitive'][-1] / final_total,
                'resistant': self.history['resistant'][-1] / final_total,
                'stemcell': self.history['stemcell'][-1] / final_total
            }
        else:
            final_composition = {
                'sensitive': 0,
                'resistant': 0,
                'stemcell': 0
            }
        
        # Detect if disease was eradicated
        eradicated = final_total < 1.0
        
        # Clinical response categories
        if eradicated:
            clinical_response = "Complete Response (CR)"
        elif final_total <= 0.1 * self.initial_tumor_burden:
            clinical_response = "Partial Response (PR)"
        elif final_total <= 1.2 * self.initial_tumor_burden:
            clinical_response = "Stable Disease (SD)"
        else:
            clinical_response = "Progressive Disease (PD)"
            
        # Detect dominant cell type
        dominant_type = "none"
        if not eradicated and final_composition:
            # Find the cell type with highest composition
            dominant_value = 0
            for cell_type, value in final_composition.items():
                if value > dominant_value:
                    dominant_value = value
                    dominant_type = cell_type
        
        # Calculate growth rate
        recent_growth = 0
        if len(self.history['total']) > 5:
            recent_growth = (self.history['total'][-1] - self.history['total'][-6]) / 5
            
        # Get final survival probability
        survival_probability = self.history['survival_probability'][-1] if self.history['survival_probability'] else 0
        
        # Calculate median survival time estimate (in months)
        # This is a simple estimate based on final tumor burden and composition
        median_survival_months = 0
        if eradicated:
            median_survival_months = 60  # 5-year survival for complete response
        else:
            # Base survival inversely proportional to tumor burden
            base_months = 36 * (1 - min(1, final_total / 5000))
            
            # Adjust based on composition (stem cells reduce survival)
            stem_penalty = final_composition.get('stemcell', 0) * 12
            resistant_penalty = final_composition.get('resistant', 0) * 6
            
            # Patient factors
            age_factor = max(0.5, 1 - ((self.patient.age - 50) / 100 if self.patient.age > 50 else 0))
            
            median_survival_months = max(1, base_months - stem_penalty - resistant_penalty) * age_factor
        
        # Format results for clinical and research use
        return {
            # Traditional simulation metrics
            "final_population": final_total,
            "max_population": max_population,
            "final_composition": final_composition,
            "eradicated": eradicated,
            "dominant_type": dominant_type,
            "recent_growth_rate": recent_growth,
            
            # Clinical outcome metrics
            "clinical_response": clinical_response,
            "survival_probability": survival_probability,
            "median_survival_months": median_survival_months,
            "tumor_volume_mm3": self.history['tumor_volume'][-1] if self.history['tumor_volume'] else 0,
            
            # Treatment information
            "treatment_protocol": self.treatment_protocol.name if hasattr(self.treatment_protocol, 'name') else str(self.treatment_protocol),
            "patient_profile": {
                "age": self.patient.age,
                "immune_status": self.patient.immune_status,
                "metabolism": self.patient.metabolism
            }
        }
