import os
import re

APP_DIR = "d:/NextJs/CRAFTATHON_GU/src/app"

def fix_imports(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # The layout file is at src/app/layout.jsx (depth 1), but pages are src/app/folder/page.jsx (depth 2)
    # We only want to increase depth for files inside subdirectories of app/
    if file_path.endswith("page.jsx"):
        # Replace occurrences of '../' with '../../'
        # BUT only if they don't already have '../../' to avoid double patching
        # A safer regex: find quotes followed by '../'
        content = re.sub(r"(['\"])\.\./(?!../)", r"\1../../", content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for root_dir, _, files in os.walk(APP_DIR):
    if root_dir == APP_DIR:
        continue # Skip layout.jsx at depth 1
    for fl in files:
        if fl.endswith(".jsx") or fl.endswith(".js"):
            fix_imports(os.path.join(root_dir, fl))

print("Import depth patched successfully for all App Router pages!")
