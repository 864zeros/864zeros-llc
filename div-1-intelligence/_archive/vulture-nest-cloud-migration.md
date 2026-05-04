# 🦅 Vulture Nest: Google Cloud Migration & Autonomy Guide

This guide provides step-by-step instructions to deploy the 864z Vulture Nest as a fully autonomous, cloud-native service on Google Cloud Platform (GCP).

**Goal:** To create a system that automatically runs the Vulture Nest cycle on a schedule and can be triggered remotely via a chat command.

**Prerequisites:**
1.  A Google Cloud account with billing enabled.
2.  The `gcloud` CLI installed and authenticated on your local machine.
    *   **Installation Guide:** [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
3.  Your Vulture Nest project files (`gemini.md`, `builds/`, etc.) in a local directory.

---
## Phase 1: Google Cloud Project Setup

This phase prepares your GCP environment and creates a central code repository.

### Step 1.1: Create a New GCP Project
First, we need a dedicated project. Replace `[PROJECT_ID]` with a unique name (e.g., `vulture-nest-864z`).

```bash
gcloud projects create [PROJECT_ID] --name="Vulture Nest Project"
```

### Step 1.2: Set the Project for Future Commands
Tell `gcloud` to use this new project for all subsequent commands.

```bash
gcloud config set project [PROJECT_ID]
```

### Step 1.3: Link Billing Account
A project needs a billing account to enable APIs. First, find your Billing Account ID.

```bash
gcloud beta billing accounts list
```
Now, link it to your project using the `ACCOUNT_ID` from the previous command.

```bash
gcloud beta billing projects link [PROJECT_ID] --billing-account [ACCOUNT_ID]
```

### Step 1.4: Enable Necessary APIs
We need to enable the APIs for the services we'll be using.

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  sourcerepo.googleapis.com
```

### Step 1.5: Create a Cloud Source Repository
This is a private Git repository where we will store our Vulture Nest files.

```bash
gcloud source repos create vulture-nest-repo
```

### Step 1.6: Push Your Local Files to the Cloud Repo
Follow the instructions provided in the GCP console for this new repository to push your existing local `vulture-nest` directory. You will typically run commands similar to these from your local project directory:

```bash
# This command provides you with the specific git remote commands
gcloud source repos clone vulture-nest-repo
# Now, copy your existing files into this new directory, then:
git add .
git commit -m "Initial commit of Vulture Nest protocol and files"
git push
```

---
## Phase 2: Create the "Vulture Service" on Cloud Run

This service will contain our agent logic and run the autonomous cycle.

### Step 2.1: Create the Application Files
In your local `vulture-nest` directory, you will need three new files: `main.py` (the server), `Dockerfile`, and `requirements.txt`.

**`requirements.txt`:**
```
Flask
gunicorn
google-cloud-storage
```

**`main.py`:**
```python
import os
from flask import Flask, request
# We will add the agent logic here in a later step.
# For now, it's a simple placeholder to confirm deployment.

app = Flask(__name__)

@app.route('/execute-cycle', methods=['POST'])
def execute_cycle():
    # In the real app, this is where the V-Trendspotter, V-Scout,
    # and V-Analyst logic would be executed.
    print("Vulture Nest cycle initiated by HTTP request.")
    # The agent would then update files in a Cloud Storage bucket.
    return "Vulture Nest cycle initiated.", 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
```

**`Dockerfile`:**
```Dockerfile
FROM python:3.9-slim
ENV PYTHONUNBUFFERED True
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "main:app"]
```

### Step 2.2: Build and Deploy the Service
This single command will package your application, upload it, and deploy it to Cloud Run. Replace `[REGION]` with your preferred GCP region (e.g., `us-central1`).

```bash
gcloud run deploy vulture-service --source . --region=[REGION] --allow-unauthenticated
```
*Note: `--allow-unauthenticated` is used for simplicity in this initial setup. We will secure this later.*

After this command finishes, you will be given a **Service URL**. Copy it.

---
## Phase 3: Automate with Cloud Scheduler

This will trigger our service to run automatically.

### Step 3.1: Create the Scheduler Job
This command creates a job that runs every day at 1 AM. It sends a request to the **Service URL** you copied in the previous step.

```bash
gcloud scheduler jobs create http trigger-vulture-cycle \
  --schedule="0 1 * * *" \
  --uri="[YOUR_SERVICE_URL]/execute-cycle" \
  --http-method=POST
```

---
## Phase 4: Remote Communication with Telegram (Optional)

This phase sets up a bot to trigger the cycle on command.

### Step 4.1: Create a Telegram Bot
1.  Open the Telegram app and search for the user `@BotFather`.
2.  Start a chat and send the `/newbot` command.
3.  Follow the prompts to name your bot (e.g., `VultureScoutBot`).
4.  BotFather will give you a unique **HTTP API token**. Copy this token.

### Step 4.2: Store the Token Securely
We will store this token in Google's Secret Manager.

```bash
echo -n "[YOUR_TELEGRAM_TOKEN]" | gcloud secrets create telegram-api-token --data-file=-
```

### Step 4.3: Create and Deploy the "Bot Listener" Service
This requires another small Flask app and deployment, similar to the main service. The Python code would be designed to listen for messages and then call the main `vulture-service`. This is a more advanced step to be tackled after the core autonomous system is confirmed to be working.

---
**Next Steps:**
Once Phase 3 is complete, your Vulture Nest is officially autonomous and running in the cloud. The next major step would be to flesh out the agent logic within the `main.py` of the `vulture-service`, replacing the placeholder with the actual scouting, analysis, and file-writing (to a Cloud Storage bucket) operations.
