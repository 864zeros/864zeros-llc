#!/usr/bin/env python3
"""
gatekeeper_stub.py — 864zeros Office Gatekeeper

Monitors the HALLWAY/ folder for projects awaiting human signature.
Eventually integrates with Telegram Bot for real-time notifications.

Usage:
    python gatekeeper_stub.py [--watch] [--telegram]

Flags:
    --watch     Continuously monitor HALLWAY/ for changes
    --telegram  Enable Telegram notifications (requires config)
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict

# Configuration
OFFICE_ROOT = Path(__file__).parent
HALLWAY_PATH = OFFICE_ROOT / "HALLWAY"
LOG_FILE = OFFICE_ROOT / "gatekeeper.log"
STATE_FILE = OFFICE_ROOT / ".gatekeeper_state.json"

# Telegram stub config (to be configured later)
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("gatekeeper")


class Gatekeeper:
    """
    The Gatekeeper monitors the HALLWAY folder and logs when projects
    are awaiting human signature.
    """

    def __init__(self):
        self.hallway_path = HALLWAY_PATH
        self.state_file = STATE_FILE
        self.known_projects: Dict[str, dict] = {}
        self._load_state()

    def _load_state(self) -> None:
        """Load previous state from JSON file."""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    self.known_projects = json.load(f)
            except json.JSONDecodeError:
                self.known_projects = {}

    def _save_state(self) -> None:
        """Save current state to JSON file."""
        with open(self.state_file, 'w') as f:
            json.dump(self.known_projects, f, indent=2, default=str)

    def scan_hallway(self) -> List[Path]:
        """Scan HALLWAY folder for projects."""
        if not self.hallway_path.exists():
            self.hallway_path.mkdir(parents=True, exist_ok=True)
            return []

        projects = []
        for item in self.hallway_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                projects.append(item)
        return projects

    def check_for_new_arrivals(self) -> List[str]:
        """Check for new projects in HALLWAY."""
        current_projects = self.scan_hallway()
        new_arrivals = []

        for project_path in current_projects:
            project_name = project_path.name
            if project_name not in self.known_projects:
                # New project detected
                new_arrivals.append(project_name)
                self.known_projects[project_name] = {
                    "arrived_at": datetime.now().isoformat(),
                    "status": "WAITING_FOR_SIGNATURE",
                    "path": str(project_path)
                }
                self._log_arrival(project_name)

        self._save_state()
        return new_arrivals

    def _log_arrival(self, project_name: str) -> None:
        """Log that a project has arrived in HALLWAY."""
        message = f"WAITING FOR HUMAN SIGNATURE: {project_name}"
        logger.warning(message)

        # ASCII banner for visibility
        banner = f"""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚨  GATEKEEPER ALERT                                       ║
║                                                              ║
║   Project: {project_name:<47} ║
║   Status:  WAITING FOR HUMAN SIGNATURE                       ║
║   Time:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S'):<47} ║
║                                                              ║
║   Action Required: Review and approve in HALLWAY/            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"""
        print(banner)

    def send_telegram_notification(self, project_name: str) -> bool:
        """
        Send notification via Telegram Bot.

        STUB: Currently just logs the intent.
        Will be implemented when Telegram bot is configured.
        """
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            logger.info("Telegram not configured. Skipping notification.")
            return False

        # TODO: Implement actual Telegram API call
        # import requests
        # url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        # payload = {
        #     "chat_id": TELEGRAM_CHAT_ID,
        #     "text": f"🚨 GATEKEEPER: {project_name} is WAITING FOR HUMAN SIGNATURE",
        #     "parse_mode": "Markdown"
        # }
        # response = requests.post(url, json=payload)
        # return response.ok

        logger.info(f"[TELEGRAM STUB] Would send: '{project_name}' awaiting signature")
        return True

    def get_pending_signatures(self) -> List[dict]:
        """Get list of projects waiting for signature."""
        pending = []
        for name, data in self.known_projects.items():
            if data.get("status") == "WAITING_FOR_SIGNATURE":
                pending.append({
                    "name": name,
                    **data
                })
        return pending

    def approve_project(self, project_name: str) -> bool:
        """Mark a project as approved (signed)."""
        if project_name in self.known_projects:
            self.known_projects[project_name]["status"] = "SIGNED"
            self.known_projects[project_name]["signed_at"] = datetime.now().isoformat()
            self._save_state()
            logger.info(f"✅ SIGNED: {project_name}")
            return True
        return False

    def run_once(self) -> None:
        """Run a single check cycle."""
        logger.info("Gatekeeper scanning HALLWAY/...")
        new_arrivals = self.check_for_new_arrivals()

        if new_arrivals:
            for project in new_arrivals:
                self.send_telegram_notification(project)
        else:
            pending = self.get_pending_signatures()
            if pending:
                logger.info(f"Projects awaiting signature: {len(pending)}")
                for p in pending:
                    logger.info(f"  - {p['name']} (arrived: {p['arrived_at']})")
            else:
                logger.info("HALLWAY is clear. No projects awaiting signature.")

    def watch(self, interval: int = 30) -> None:
        """Continuously watch HALLWAY for changes."""
        import time
        logger.info(f"Gatekeeper watching HALLWAY/ (interval: {interval}s)")
        logger.info("Press Ctrl+C to stop.")

        try:
            while True:
                self.run_once()
                time.sleep(interval)
        except KeyboardInterrupt:
            logger.info("Gatekeeper stopped.")


def main():
    """Main entry point."""
    gatekeeper = Gatekeeper()

    if "--watch" in sys.argv:
        gatekeeper.watch()
    else:
        gatekeeper.run_once()

        # Show current status
        pending = gatekeeper.get_pending_signatures()
        if pending:
            print("\n📋 Projects Awaiting Signature:")
            for p in pending:
                print(f"   • {p['name']}")
        else:
            print("\n✅ No projects in HALLWAY awaiting signature.")


if __name__ == "__main__":
    main()
