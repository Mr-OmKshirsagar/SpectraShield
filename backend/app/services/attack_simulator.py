from app.schemas import SimulationStep

def generate_attack_simulation(final_score: float):

    if final_score < 50:
        return []

    return [
        SimulationStep(
            step=1,
            title="Fake Login Page",
            description="User is redirected to a fake login page."
        ),
        SimulationStep(
            step=2,
            title="Credential Harvesting",
            description="Victim enters credentials captured by attacker."
        ),
        SimulationStep(
            step=3,
            title="Account Takeover",
            description="Attacker accesses victim's real account."
        ),
        SimulationStep(
            step=4,
            title="Financial/Data Loss",
            description="Sensitive data or funds are stolen."
        )
    ]
