import numpy as np
import logging
import matplotlib.pyplot as plt
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class CancerSimulation:
    """
    Cancer evolution simulator with improved biological realism.
    Models evolutionary dynamics, drug decay, immune response, mutation, and basic carrying capacity.
    """

    def __init__(self, initial_cells: Dict[str, int], parameters: Dict[str, Any]):
        self.populations = {
            'sensitive': initial_cells.get('sensitive', 100),
            'resistant': initial_cells.get('resistant', 10),
            'stemcell': initial_cells.get('stemcell', 5)
        }

        # Core parameters
        self.drug_strength = parameters.get('drug_strength', 0.8)
        self.drug_decay = parameters.get('drug_decay', 0.1)
        self.mutation_rate = parameters.get('mutation_rate', 0.01)
        self.immune_strength = parameters.get('immune_strength', 0.2)
        self.chaos_level = parameters.get('chaos_level', 0.05)
        self.time_steps = parameters.get('time_steps', 100)
        self.carrying_capacity = parameters.get('carrying_capacity', 1e5)
        self.enable_immune_memory = parameters.get('immune_memory', True)
        self.intervention_schedule = parameters.get('intervention_schedule', {})  # Optional {step: drug_strength}

        self.drug_level = self.drug_strength

        # Game matrix
        self.game_matrix = np.array(parameters.get('game_matrix', [
            [1.0, 0.7, 0.8],
            [0.9, 0.6, 0.7],
            [1.1, 0.8, 1.0]
        ]))

        self.history = {
            'sensitive': [], 'resistant': [], 'stemcell': [],
            'total': [], 'fitness': [], 'drug_level': []
        }

    def calculate_fitness(self, pop_vector: np.ndarray) -> np.ndarray:
        total_pop = np.sum(pop_vector)
        if total_pop == 0:
            return np.zeros(len(pop_vector))

        freq_vector = pop_vector / total_pop
        base_fitness = np.dot(self.game_matrix, freq_vector)

        # Drug effect (vary by type)
        drug_effect = np.array([
            self.drug_level, self.drug_level * 0.2, self.drug_level * 0.5
        ])

        # Immune response (adapt over time)
        immune_effect = np.array([
            self.immune_strength,
            self.immune_strength * 0.7,
            self.immune_strength * 0.3
        ])

        # Immune memory: if one type dominates, increase immune strength over time
        if self.enable_immune_memory:
            dominant = np.argmax(pop_vector)
            immune_effect[dominant] *= 1.1  # memory adaptation

        noise = np.random.normal(0, self.chaos_level, size=len(pop_vector))
        adjusted_fitness = base_fitness - drug_effect - immune_effect + noise
        return adjusted_fitness

    def update_populations(self, pop_vector: np.ndarray, fitness: np.ndarray) -> np.ndarray:
        # Logistic growth factor
        total_pop = np.sum(pop_vector)
        capacity_scaling = 1 - total_pop / self.carrying_capacity
        growth_factor = (1 + 0.1 * fitness) * max(capacity_scaling, 0)

        new_pop = pop_vector * np.maximum(growth_factor, 0)

        # Mutation matrix (more plausible)
        mutation_matrix = np.array([
            [1 - self.mutation_rate, self.mutation_rate, 0],
            [0, 1 - self.mutation_rate / 2, self.mutation_rate / 2],
            [0.01, 0.01, 0.98]
        ])

        new_pop = np.dot(mutation_matrix.T, new_pop)
        return np.maximum(new_pop, 0)

    def update_drug_level(self, t: int):
        if t in self.intervention_schedule:
            self.drug_level = self.intervention_schedule[t]
        else:
            self.drug_level *= (1 - self.drug_decay)

    def run_simulation(self) -> Dict[str, List]:
        pop_vector = np.array([
            self.populations['sensitive'],
            self.populations['resistant'],
            self.populations['stemcell']
        ])

        for t in range(self.time_steps):
            fitness = self.calculate_fitness(pop_vector)
            pop_vector = self.update_populations(pop_vector, fitness)
            self.update_drug_level(t)

            self.history['sensitive'].append(pop_vector[0])
            self.history['resistant'].append(pop_vector[1])
            self.history['stemcell'].append(pop_vector[2])
            self.history['total'].append(np.sum(pop_vector))
            self.history['fitness'].append(fitness.tolist())
            self.history['drug_level'].append(self.drug_level)

        self.history['time_points'] = list(range(self.time_steps))
        return self.history

    def get_summary(self) -> Dict[str, Any]:
        if not self.history['total']:
            return {"error": "Simulation not yet run."}

        final_total = self.history['total'][-1]
        max_population = max(self.history['total'])
        final_composition = {
            'sensitive': self.history['sensitive'][-1] / final_total if final_total > 0 else 0,
            'resistant': self.history['resistant'][-1] / final_total if final_total > 0 else 0,
            'stemcell': self.history['stemcell'][-1] / final_total if final_total > 0 else 0
        }

        eradicated = final_total < 1.0
        dominant_type = max(final_composition, key=final_composition.get) if not eradicated else "none"
        recent_growth = (self.history['total'][-1] - self.history['total'][-6]) / 5 if len(self.history['total']) > 5 else 0

        return {
            "final_population": final_total,
            "max_population": max_population,
            "final_composition": final_composition,
            "eradicated": eradicated,
            "dominant_type": dominant_type,
            "recent_growth_rate": recent_growth
        }

    def plot(self):
        try:
            import matplotlib.pyplot as plt
        except ImportError:
            raise RuntimeError("matplotlib is required for plotting.")

        time = self.history['time_points']
        plt.figure(figsize=(10, 6))
        plt.plot(time, self.history['sensitive'], label='Sensitive')
        plt.plot(time, self.history['resistant'], label='Resistant')
        plt.plot(time, self.history['stemcell'], label='Stemcell')
        plt.plot(time, self.history['drug_level'], label='Drug Level', linestyle='--', alpha=0.5)
        plt.title("Cancer Cell Dynamics Over Time")
        plt.xlabel("Time Step")
        plt.ylabel("Population / Drug Level")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.show()
