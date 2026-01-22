# Tuition Calculator

## Overview

Tuition Calculator replaces manual spreadsheet calculations by helping university staff calculate a student’s total cost of study for any combination of courses, including smaller fees such as GST that are easy to overlook, and generates a clear, itemised cost breakdown to share with future students.

## Live Demo

The application is hosted at:

![Demo GIF](https://your-demo-link.com/demo.gif)  
[Live Site](https://your-live-site.com)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rhys-findlater/tuition-calculator.git
cd tuition-calculator
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the virtual environment

**macOS / Linux (bash/zsh):**

```bash
source .venv/bin/activate
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**

```cmd
.venv\Scripts\activate.bat
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

## Usage

Run the app:

### 1. Start the development server from the project root:

```bash
flask --app tuition-calculator run
```

### 2. Once running, open your browser and go to:

```text
http://127.0.0.1:5000/
```

## Features

- Clean, staff-friendly user interface
- Mobile-responsive layout for use on different screen sizes
- PDF export of full tuition cost breakdowns
- Uses an existing SharePoint-hosted spreadsheet as the single source of truth, so staff can manage tuition data in familiar tools

## Tech Stack

- Frontend: HTML, CSS
- Backend: Python, Flask
- Interactivity: JavaScript
- Data source: Excel (SharePoint)
- Templates: Jinja2 templates

## License

Copyright (c) 2025 University of Canterbury.  
All rights reserved. This software is provided for demonstration and evaluation only and may not be redistributed or used commercially without prior permission. See the LICENSE file for full details.

## Credits

- Developed by Rhys Findlater and Regan Williams
