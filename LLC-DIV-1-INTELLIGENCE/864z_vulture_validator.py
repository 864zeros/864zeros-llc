import json

class VultureValidator:
    def __init__(self, criteria_path='864z_criteria.json'):
        with open(criteria_path, 'r') as f:
            self.c = json.load(f)

    def calculate_score(self, convergence, velocity, scarcity, growth_proj, margin_proj):
        # Base 864z Weighted Score
        base_score = (convergence * self.c['z_convergence']) + \
                     (velocity * self.c['z_velocity']) + \
                     (scarcity * self.c['z_scarcity'])
        
        # The Exit Multiplier (Chi) based on Rule of 40
        rule_of_40 = growth_proj + margin_proj
        chi = 1.5 if rule_of_40 > 0.40 else 1.0
        
        final_score = base_score * chi
        return round(final_score, 2), rule_of_40

# Example Execution for TabVault
validator = VultureValidator()
score, r40 = validator.calculate_score(
    convergence=0.9,  # High match with IndexedDB brick
    velocity=0.8,     # M-Size build
    scarcity=0.7,     # Competitors are stagnant
    growth_proj=0.25, # 25% YoY
    margin_proj=0.85  # 85% Profit Margin (Solo-Vulture)
)

print(f"864z Score: {score} | Rule of 40: {r40*100}%")
# Threshold Check: score >= 8.64 ? "STRIKE" : "ARCHIVE"