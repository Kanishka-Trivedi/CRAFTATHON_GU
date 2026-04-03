import os
import re
import shutil

ROOT_DIR = "d:/NextJs/CRAFTATHON_GU"
SRC_DIR = os.path.join(ROOT_DIR, "src")
PAGES_DIR = os.path.join(SRC_DIR, "pages")
APP_DIR = os.path.join(SRC_DIR, "app")

# 1. Update package.json
pkg_path = os.path.join(ROOT_DIR, "package.json")
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg = f.read()
pkg = pkg.replace('"dev": "vite",', '"dev": "next dev",\n    "vite-dev": "vite",')
pkg = pkg.replace('"build": "vite build",', '"build": "next build",')
with open(pkg_path, "w", encoding="utf-8") as f:
    f.write(pkg)

# 2. Refactor all JSX components
def refactor_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Next.js imports
    content = content.replace("from 'react-router-dom'", "from 'next/navigation'")
    content = content.replace('from "react-router-dom"', 'from "next/navigation"')
    
    # Hooks
    content = content.replace('useNavigate', 'useRouter')
    content = content.replace('navigate(', 'router.push(')
    content = content.replace('const navigate = useRouter()', 'const router = useRouter()')
    
    # Links
    content = re.sub(r'<Link(.*?)to=', r'<Link\1href=', content)

    # Next.js App Router needs 'use client' for state
    if ('useState' in content or 'useEffect' in content or 'useRouter' in content or 'useContext' in content or 'useRef' in content) and 'use client' not in content:
        content = '"use client";\n' + content

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

for root_dir, _, files in os.walk(SRC_DIR):
    for fl in files:
        if fl.endswith(".jsx") or fl.endswith(".js"):
            refactor_file(os.path.join(root_dir, fl))

# 3. Create Next.js App Router Structure
if not os.path.exists(APP_DIR):
    os.makedirs(APP_DIR)

ROUTES = {
    "LoginPage.jsx": "",
    "SignupPage.jsx": "signup",
    "DashboardPage.jsx": "dashboard",
    "TransactionsPage.jsx": "transactions",
    "TransferPage.jsx": "transfer",
    "ProfilePage.jsx": "profile",
    "ReauthPage.jsx": "reauth",
    "SettingsPage.jsx": "settings",
    "AdminOverviewPage.jsx": "admin",
    "AlertsLogPage.jsx": "admin/alerts",
    "UserManagementPage.jsx": "admin/users"
}

for page_file, route_path in ROUTES.items():
    source = os.path.join(PAGES_DIR, page_file)
    if not os.path.exists(source): continue
    
    target_dir = os.path.join(APP_DIR, route_path) if route_path else APP_DIR
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    
    shutil.move(source, os.path.join(target_dir, "page.jsx"))

# 4. Create Next.js Layout
LAYOUT_CODE = '''"use client";
import '../index.css';
import { AuthProvider } from '../context/AuthContext';
import { AdminProvider } from '../context/AdminContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}'''

with open(os.path.join(APP_DIR, "layout.jsx"), "w", encoding="utf-8") as f:
    f.write(LAYOUT_CODE)

print("Migration script executed successfully.")
