import numpy as np
import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

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
            'stemcell': initial_cells.get('stemcell', 5)
        }
        
        # Set simulation parameters
        self.drug_strength = parameters.get('drug_strength', 0.8)
        self.drug_decay = parameters.get('drug_decay', 0.1)
        self.mutation_rate = parameters.get('mutation_rate', 0.01)
        self.immune_strength = parameters.get('immune_strength', 0.2)
        self.chaos_level = parameters.get('chaos_level', 0.05)
        self.time_steps = parameters.get('time_steps', 100)
        
        # Set or create default evolutionary game matrix
        if parameters.get('game_matrix') is not None:
            self.game_matrix = np.array(parameters.get('game_matrix'))
        else:
            # Default game matrix based on common evolutionary dynamics in cancer
            # Rows/cols: [sensitive, resistant, stemcell]
            self.game_matrix = np.array([
                [1.0, 0.7, 0.8],  # sensitive vs others
                [0.9, 0.6, 0.7],  # resistant vs others
                [1.1, 0.8, 1.0]   # stemcell vs others
            ])
        
        # Initialize variables to track simulation history
        self.history = {
            'sensitive': [],
            'resistant': [],
            'stemcell': [],
            'total': [],
            'fitness': [],
            'drug_level': []
        }
        
        # Current drug level
        self.drug_level = self.drug_strength

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
        fitness = np.dot(self.game_matrix, freq_vector)
        
        # Apply drug effect: reduces fitness of sensitive cells, less impact on resistant
        drug_effect = np.array([
            self.drug_level,            # Full effect on sensitive cells
            self.drug_level * 0.2,      # Reduced effect on resistant cells 
            self.drug_level * 0.5       # Moderate effect on stem cells
        ])
        
        # Apply immune effect: depends on cell visibility to immune system
        immune_effect = np.array([
            self.immune_strength,       # Fully visible to immune system
            self.immune_strength * 0.7, # Less visible to immune system
            self.immune_strength * 0.3  # Stem cells can evade immune response
        ])
        
        # Apply combined effects
        adjusted_fitness = fitness - drug_effect - immune_effect
        
        # Add chaos/noise to model stochastic effects
        noise = np.random.normal(0, self.chaos_level, size=len(pop_vector))
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
        
        # Apply mutations (sensitive → resistant, others → stemcell)
        mutation_matrix = np.array([
            [1 - self.mutation_rate, self.mutation_rate, 0],  # Sensitive → Resistant
            [0, 1 - self.mutation_rate/2, self.mutation_rate/2],  # Resistant → Stemcell
            [0, 0, 1]  # Stemcell (no mutations)
        ])
        
        # Apply mutations
        new_pop = np.dot(mutation_matrix.T, new_pop)
        
        # Ensure no negative populations
        return np.maximum(new_pop, 0)

    def update_drug_level(self):
        """Update drug concentration based on pharmacokinetic decay"""
        self.drug_level *= (1 - self.drug_decay)
    
    def run_simulation(self) -> Dict[str, List]:
        """
        Run the full cancer evolution simulation.
        
        Returns:
            Dictionary with simulation history
        """
        # Initialize population vector: [sensitive, resistant, stemcell]
        pop_vector = np.array([
            self.populations['sensitive'],
            self.populations['resistant'],
            self.populations['stemcell']
        ])
        
        # Run simulation for specified time steps
        for t in range(self.time_steps):
            # Calculate fitness based on current state
            fitness = self.calculate_fitness(pop_vector)
            
            # Update population based on fitness and mutations
            pop_vector = self.update_populations(pop_vector, fitness)
            
            # Update drug level based on pharmacokinetics
            self.update_drug_level()
            
            # Record history
            self.history['sensitive'].append(pop_vector[0])
            self.history['resistant'].append(pop_vector[1])
            self.history['stemcell'].append(pop_vector[2])
            self.history['total'].append(np.sum(pop_vector))
            self.history['fitness'].append(fitness.tolist())
            self.history['drug_level'].append(self.drug_level)
        
        # Add time points for x-axis
        self.history['time_points'] = list(range(self.time_steps))
        
        return self.history

    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the simulation results.
        
        Returns:
            Dictionary containing summary statistics
        """
        if not self.history['total']:
            return {"error": "Simulation hasn't been run yet"}
            
        # Calculate various metrics
        final_total = self.history['total'][-1]
        max_population = max(self.history['total'])
        final_composition = {
            'sensitive': self.history['sensitive'][-1] / final_total if final_total > 0 else 0,
            'resistant': self.history['resistant'][-1] / final_total if final_total > 0 else 0,
            'stemcell': self.history['stemcell'][-1] / final_total if final_total > 0 else 0
        }
        
        # Detect if disease was eradicated
        eradicated = final_total < 1.0
        
        # Detect dominant cell type
        dominant_type = max(final_composition, key=final_composition.get) if not eradicated else "none"
        
        # Calculate growth rate
        if len(self.history['total']) > 5:
            recent_growth = (self.history['total'][-1] - self.history['total'][-6]) / 5
        else:
            recent_growth = 0
            
        return {
            "final_population": final_total,
            "max_population": max_population,
            "final_composition": final_composition,
            "eradicated": eradicated,
            "dominant_type": dominant_type,
            "recent_growth_rate": recent_growth
        }
