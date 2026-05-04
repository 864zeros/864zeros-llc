# Google Cloud Development Environment Setup Guide

This guide provides step-by-step instructions to create a clean, isolated, and powerful cloud-based development environment for the PlannerPress project using Google Cloud Platform (GCP). This will bypass local machine issues and ensure a consistent setup.

### Prerequisites
1.  A Google Cloud account with billing enabled.
2.  The [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated on your local machine.

---

### Step 1: Create and Configure a New GCP Project

First, we'll create a new project to hold all our resources.

1.  **Create the project:**
    ```bash
    gcloud projects create plannerpress-dev --name="PlannerPress Development"
    ```

2.  **Set the new project as your default:**
    ```bash
    gcloud config set project plannerpress-dev
    ```

3.  **Link billing to the project (replace `YOUR_BILLING_ACCOUNT_ID`):**
    You can find your billing account ID with `gcloud beta billing accounts list`.
    ```bash
    gcloud beta billing projects link plannerpress-dev --billing-account YOUR_BILLING_ACCOUNT_ID
    ```

### Step 2: Enable Required APIs

We need to enable the Compute Engine API to create a virtual machine.

```bash
gcloud services enable compute.googleapis.com
```

### Step 3: Create a Compute Engine VM Instance

This command will create a small but capable Debian 11-based virtual machine in the `us-central1` region.

```bash
gcloud compute instances create plannerpress-vm 
    --project=plannerpress-dev 
    --zone=us-central1-a 
    --machine-type=e2-medium 
    --image-family=debian-11 
    --image-project=debian-cloud 
    --boot-disk-size=20GB 
    --tags=http-server,https-server
```

### Step 4: Allow Web Traffic

Create a firewall rule to allow you to access the Next.js development server (running on port 3000) from any IP address.

```bash
gcloud compute firewall-rules create dev-allow-port-3000 
    --project=plannerpress-dev 
    --direction=INGRESS 
    --priority=1000 
    --network=default 
    --action=ALLOW 
    --rules=tcp:3000 
    --source-ranges=0.0.0.0/0
```
**Note:** For better security in a real production scenario, you would restrict `--source-ranges` to your own IP address.

### Step 5: SSH into the VM and Install Tools

1.  **Connect to your new VM:**
    ```bash
    gcloud compute ssh plannerpress-vm --zone=us-central1-a
    ```

2.  **Once inside the VM, run the following commands to install dependencies:**

    ```bash
    # Update package lists
    sudo apt-get update

    # Install git and other essentials
    sudo apt-get install -y git build-essential

    # Install Node Version Manager (nvm)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

    # Load nvm into the current shell session
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

    # Install Node.js v20 (LTS)
    nvm install 20
    nvm use 20
    nvm alias default 20
    ```
    You may need to close and reopen your SSH session for the `nvm` command to be fully available everywhere.

### Step 6: Clone the Repository and Run the App

1.  **Clone the project repository (replace with your repo URL):**
    ```bash
    git clone https://your-git-repository-url/vulture-nest.git
    ```

2.  **Navigate to the web application directory:**
    ```bash
    cd vulture-nest/plannerpress-webapp
    ```

3.  **Install dependencies:**
    This will now run entirely within the clean Linux environment, avoiding the previous `esbuild` errors.
    ```bash
    npm install
    ```

4.  **Run the development server:**
    We use `0.0.0.0` as the host to ensure it's accessible from outside the VM.
    ```bash
    npm run dev -- --host 0.0.0.0 &
    ```
    The `&` runs the process in the background, so you can continue using the terminal.

### Step 7: Access Your Application

1.  **Find your VM's external IP address:**
    Run this command in a **new local terminal** (not in the SSH session):
    ```bash
    gcloud compute instances describe plannerpress-vm 
        --zone=us-central1-a 
        --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
    ```

2.  **Open your web browser and navigate to:**
    `http://YOUR_VM_EXTERNAL_IP:3000`

You now have a fully functional development environment running in the cloud.
