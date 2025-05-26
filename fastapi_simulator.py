from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulation import CancerSimulation, TreatmentProtocol
from typing import Any, Dict
import uvicorn
import traceback
import numpy as np

app = FastAPI()

# Allow CORS for local development and Alento frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    sensitive_cells: int = 100
    resistant_cells: int = 10
    stem_cells: int = 5
    immune_cells: int = 50
    treatment_protocol: str = "CONTINUOUS"
    patient_age: int = 55
    patient_weight: int = 70
    patient_gender: str = "male"
    performance_status: int = 1
    patient_metabolism: float = 1.0
    patient_immune_status: float = 1.0
    patient_organ_function: float = 1.0
    tumor_type: str = "colorectal"
    disease_stage: int = 3
    comorbidities: list = []
    drug_strength: float = 0.8
    drug_decay: float = 0.1
    mutation_rate: float = 0.01
    chaos_level: float = 0.05
    immune_strength: float = 0.2
    time_steps: int = 100
    dose_frequency: int = 7
    dose_intensity: float = 1.0
    treatment_regimen: str = "custom"

def to_python_type(obj):
    if isinstance(obj, dict):
        return {k: to_python_type(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_python_type(i) for i in obj]
    elif isinstance(obj, np.generic):
        return obj.item()
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

@app.post("/simulate")
async def simulate(request: SimulationRequest):
    try:
        print("Received simulation request:", request)
        initial_cells = {
            'sensitive': request.sensitive_cells,
            'resistant': request.resistant_cells,
            'stemcell': request.stem_cells,
            'immunecell': request.immune_cells
        }
        print("Initial cells:", initial_cells)
        try:
            treatment_protocol = TreatmentProtocol[request.treatment_protocol]
        except (KeyError, ValueError):
            treatment_protocol = TreatmentProtocol.CONTINUOUS
        print("Treatment protocol:", treatment_protocol)
        patient_data = {
            'age': request.patient_age,
            'weight': request.patient_weight,
            'gender': request.patient_gender,
            'performance_status': request.performance_status,
            'metabolism': request.patient_metabolism,
            'immune_status': request.patient_immune_status,
            'organ_function': request.patient_organ_function,
            'tumor_type': request.tumor_type,
            'disease_stage': request.disease_stage,
            'comorbidities': request.comorbidities
        }
        print("Patient data:", patient_data)
        parameters = {
            'drug_strength': request.drug_strength,
            'drug_decay': request.drug_decay,
            'mutation_rate': request.mutation_rate,
            'chaos_level': request.chaos_level,
            'immune_strength': request.immune_strength,
            'time_steps': request.time_steps,
            'dose_frequency': request.dose_frequency,
            'dose_intensity': request.dose_intensity,
            'treatment_protocol': treatment_protocol,
            'treatment_regimen': request.treatment_regimen,
            'patient_data': patient_data
        }
        print("Parameters:", parameters)
        sim = CancerSimulation(initial_cells, parameters)
        print("CancerSimulation instance created.")
        results = sim.run_simulation()
        print("Simulation results:", results)
        summary = sim.get_summary()
        print("Simulation summary:", summary)
        # Convert all numpy types to native Python types
        results_py = to_python_type(results)
        summary_py = to_python_type(summary)
        return {"simulation_data": results_py, "clinical_summary": summary_py}
    except Exception as e:
        tb = traceback.format_exc()
        print("Exception occurred:\n", tb)
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{tb}")

if __name__ == "__main__":
    uvicorn.run("fastapi_simulator:app", host="0.0.0.0", port=8000, reload=True) 