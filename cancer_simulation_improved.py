import numpy as np
from typing import Tuple
from simulation import CancerSimulation

class CancerSimulationImproved(CancerSimulation):
    """
    Improved cancer simulation addressing clinical realism issues.
    Extends original CancerSimulation with calibrated response modeling,
    refined PFS/OS estimation, and enhanced cell dynamics.
    """

    def calculate_clinical_response(self, pop_vector: np.ndarray) -> str:
        """
        Calculate clinical response (CR, PR, SD, PD) based on tumor volume reduction and ALK status.
        """
        initial_burden = self.initial_tumor_burden
        current_burden = np.sum(pop_vector[:3])  # Exclude immune cells
        reduction = (initial_burden - current_burden) / initial_burden if initial_burden else 0
        # Adjust for more sensitive thresholds (RECIST-based)
        if reduction >= 0.3:
            return "Partial Response (PR)"
        elif reduction >= 0.1:
            return "Stable Disease (SD)"
        elif reduction < 0.05:
            return "Progressive Disease (PD)"
        else:
            return "Stable Disease (SD)"

    def calculate_pfs_os(self, pop_vector: np.ndarray) -> Tuple[float, float]:
        """
        Estimate PFS (Progression-Free Survival) and OS (Overall Survival) based on clinical data, stage, patient, and treatment factors.
        """
        # Robust extraction of disease stage
        disease_stage = self.patient_data.get('disease_stage', None)
        if disease_stage is None:
            disease_stage = self.patient_data.get('stage', None)
        if disease_stage is None:
            disease_stage = self.patient_data.get('stage_group', None)
        if disease_stage is None:
            disease_stage = 3
        try:
            disease_stage = int(disease_stage)
        except Exception:
            disease_stage = 3

        tumor_type = self.patient_data.get('tumor_type', 'NSCLC')
        treatment = str(self.patient_data.get('treatment_regimen', 'custom')).lower()

        # Modern clinical benchmarks (months)
        benchmarks = {
            'ALK': {'PFS': 16.0, 'OS': 48.0},
            'EGFR': {'PFS': 12.0, 'OS': 36.0},
            'NSCLC': {'PFS': 8.0, 'OS': 18.0},
            'SCLC': {'PFS': 5.0, 'OS': 10.0},
        }
        stage_multipliers = {1: 2.0, 2: 1.5, 3: 1.0, 4: 0.6}
        stage_mult = stage_multipliers.get(disease_stage, 1.0)

        # Assign based on known types
        if 'alk' in treatment:
            data = benchmarks['ALK']
        elif 'egfr' in treatment:
            data = benchmarks['EGFR']
        elif 'sclc' in tumor_type or 'lung-small' in tumor_type:
            data = benchmarks['SCLC']
        else:
            data = benchmarks['NSCLC']

        # Response multipliers
        response = self.calculate_clinical_response(pop_vector)
        if response == "Partial Response (PR)":
            resp_mult = 1.5
        elif response == "Stable Disease (SD)":
            resp_mult = 1.1
        elif response == "Progressive Disease (PD)":
            resp_mult = 0.7
        else:
            resp_mult = 1.0

        # Patient factors
        perf = int(self.patient_data.get('performance_status', 1))
        age = int(self.patient_data.get('age', 65))
        comorbidities = self.patient_data.get('comorbidities', [])
        patient_mult = 1.0
        if perf >= 2:
            patient_mult *= 0.8
        if age >= 75:
            patient_mult *= 0.9
        if 'cardiac' in comorbidities or 'diabetes' in comorbidities:
            patient_mult *= 0.9

        # Treatment regimen boost
        regimen_mult = 1.0
        if 'immunotherapy' in treatment or 'targeted' in treatment:
            regimen_mult = 1.2

        resilience_boost = self.patient.get_immune_modifier()
        pfs = data['PFS'] * resp_mult * resilience_boost * stage_mult * patient_mult * regimen_mult
        os = data['OS'] * resp_mult * resilience_boost * stage_mult * patient_mult * regimen_mult

        # Cap minimum OS for stage IV
        if disease_stage == 4:
            if 'sclc' in tumor_type or 'lung-small' in tumor_type:
                os = max(os, 8.0)
            else:
                os = max(os, 12.0)

        return pfs, os

    def run_simulation(self):
        """
        Run simulation with enhanced logic and output calibrated metrics.
        """
        pop_vector = np.array([
            self.populations['sensitive'],
            self.populations['resistant'],
            self.populations['stemcell'],
            self.populations['immunecell']
        ])

        # Initialize new history fields
        self.history['clinical_response'] = []
        self.history['pfs'] = []
        self.history['os'] = []
        self.history['time_points'] = []
        self.history['sensitive'] = []
        self.history['resistant'] = []
        self.history['stemcell'] = []
        self.history['immunecell'] = []
        self.history['survival_probability'] = []
        self.history['drug_level'] = []
        self.history['tumor_burden'] = []

        for t in range(self.time_steps):
            fitness = self.calculate_fitness(pop_vector)
            pop_vector = self.update_populations(pop_vector, fitness)
            self.update_drug_level(t)

            # Append population counts
            self.history['sensitive'].append(pop_vector[0])
            self.history['resistant'].append(pop_vector[1])
            self.history['stemcell'].append(pop_vector[2])
            self.history['immunecell'].append(pop_vector[3])

            # Append tumor burden (sum of all tumor cells, not immune)
            tumor_burden = pop_vector[0] + pop_vector[1] + pop_vector[2]
            self.history['tumor_burden'].append(tumor_burden)

            # Append drug level
            self.history['drug_level'].append(self.drug_level)

            # Append clinical metrics
            response = self.calculate_clinical_response(pop_vector)
            self.history['clinical_response'].append(response)
            pfs, os = self.calculate_pfs_os(pop_vector)
            self.history['pfs'].append(pfs)
            self.history['os'].append(os)
            self.history['time_points'].append(t)
            self.history['survival_probability'].append(self.calculate_survival_probability(pop_vector))

        return self.history 