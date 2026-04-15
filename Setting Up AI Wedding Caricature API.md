Setting up a paid API for your wedding app is a great move for a Raspberry Pi 5 setup. It offloads the intense GPU math to the cloud while allowing your Pi to handle the orchestration and local storage. For 200 images at about **$0.03 each** (using **Stable Image Core** or **Stable Diffusion 3.5 Flash**), you’re looking at a total cost of roughly **$5.00 – $7.00**.

### **Step 1: Stability AI Account & Credits**

Stability AI uses a credit-based system where **100 credits \= $1.00**.

1. **Create an Account:** Go to [platform.stability.ai](https://platform.stability.ai/) and sign up. You’ll typically get **25 free credits** to start testing.

2. **Buy Credits:** In the **Billing** section, purchase a minimum of **$10.00 (1,000 credits)**. This is the smallest buy-in, but it will easily cover 200+ caricatures.  
3. **Generate API Key:** Go to the **API Keys** section, create a new key, and copy it immediately.

### ---

**Step 2: Secure the Secrets on your Pi 5**

Since you've been using GitHub Secrets, we'll follow that pattern by keeping the key out of your code.

1. Create a hidden environment file in your project folder:  
   Bash  
   nano .env.secrets

2. Add your key:  
   Plaintext  
   STABILITY\_API\_KEY=sk-xxxxYourActualKeyHerexxxx

3. Restricting permissions so only your user can read it:  
   Bash  
   chmod 600 .env.secrets

### ---

**Step 3: The "Caricature Worker" Script**

This script acts as the background consumer in your "Flight Recorder" model. It watches a folder for new guest photos and sends them to the **Stable Diffusion 3.5 Flash** endpoint (which is optimized for speed and cost).

Python

import os  
import requests  
import time  
from pathlib import Path  
from dotenv import load\_dotenv

\# Load key from your secrets file  
load\_dotenv(".env.secrets")  
STABILITY\_KEY \= os.getenv("STABILITY\_API\_KEY")

\# Configuration for your Pi 5 directories  
INBOX \= Path("./images/pending")  
OUTBOX \= Path("./images/completed")  
\# Caricature-specific prompt  
PROMPT \= "A whimsical hand-drawn wedding caricature, exaggerated features, whimsical, white background, ink sketch style"

def generate\_caricature(image\_path):  
    print(f"🎨 Generating caricature for {image\_path.name}...")  
      
    \# We use SD 3.5 Flash (2.5 credits / \~$0.025 per image)  
    response \= requests.post(  
        "https://api.stability.ai/v1/generation/stable-diffusion-v3-5-flash/image-to-image",  
        headers={  
            "Accept": "application/json",  
            "Authorization": f"Bearer {STABILITY\_KEY}"  
        },  
        files={"init\_image": open(image\_path, "rb")},  
        data={  
            "image\_strength": 0.45, \# Higher \= more caricature distortion  
            "init\_image\_mode": "IMAGE\_STRENGTH",  
            "text\_prompts\[0\]\[text\]": PROMPT,  
            "cfg\_scale": 7,  
            "samples": 1,  
            "steps": 25, \# High enough for detail, low enough to save credits  
        }  
    )

    if response.status\_code \== 200:  
        data \= response.json()  
        for i, image in enumerate(data\["artifacts"\]):  
            out\_file \= OUTBOX / f"caricature\_{image\_path.name}"  
            with open(out\_file, "wb") as f:  
                import base64  
                f.write(base64.b64decode(image\["base64"\]))  
          
        image\_path.unlink() \# Delete original from pending once done  
        print(f"✅ Saved: {out\_file.name}")  
    else:  
        print(f"❌ API Error: {response.status\_code} \- {response.text}")

def main():  
    INBOX.mkdir(parents=True, exist\_ok=True)  
    OUTBOX.mkdir(parents=True, exist\_ok=True)  
      
    while True:  
        photos \= list(INBOX.glob("\*.\*"))  
        if photos:  
            for photo in photos:  
                generate\_caricature(photo)  
        time.sleep(3)

if \_\_name\_\_ \== "\_\_main\_\_":  
    main()

### ---

**Step 4: systemd Service Configuration**

To make this "wedding-proof," we’ll ensure the worker starts automatically when the Pi 5 boots up.

1. **Create the service file:**  
   Bash  
   sudo nano /etc/systemd/system/wedding-caricature.service

2. **Paste the config:**  
   Ini, TOML  
   \[Unit\]  
   Description\=Wedding App Caricature Background Worker  
   After\=network.target

   \[Service\]  
   User\=scott  
   WorkingDirectory\=/home/scott/wedding-app  
   ExecStart\=/home/scott/wedding-app/venv/bin/python caricature\_worker.py  
   Restart\=always  
   RestartSec\=10  
   \# Point to your secrets file  
   EnvironmentFile\=/home/scott/wedding-app/.env.secrets

   \[Install\]  
   WantedBy\=multi-user.target

3. **Activate it:**  
   Bash  
   sudo systemctl daemon-reload  
   sudo systemctl enable wedding-caricature.service  
   sudo systemctl start wedding-caricature.service

### **Summary of Costs (for 200 images)**

| Model | Credit Cost | Total Credits | USD Total |
| :---- | :---- | :---- | :---- |
| **SD 3.5 Flash** | 2.5 per image | 500 | **$5.00** |
| **Stable Image Core** | 3.0 per image | 600 | **$6.00** |
| **SDXL 1.0 (Legacy)** | 0.9 per image | 180 | **$1.80** |

**Pro-Tip:** If you want the caricatures to look even more "artistic," you can decrease the image\_strength to **0.35**. This will keep the guest's face closer to the original photo while still applying the caricature style.

Would you like help tweaking the prompt to match a specific wedding theme (e.g., rustic, black-tie, or 1920s style)?