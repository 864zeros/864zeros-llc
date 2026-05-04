# config.py
"""
Central configuration for the Vulture Nest application.
"""

# The 864z Scoring Algorithm weights and thresholds
SCORING_CRITERIA = {
    "weights": {
        "z_convergence": 0.45,  # Mentions across different platforms/sources
        "z_velocity": 0.35,     # Speed/recency of discussion
        "z_scarcity": 0.20      # Lack of existing "parasitic" solutions
    },
    "thresholds": {
        "vault_trigger": 8.64
    }
}

# File paths
VULTURE_NEST_MD_PATH = 'Vulture_Nest.md'
STATE_PATH = 'nest_state.json'