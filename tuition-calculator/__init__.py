from flask import Flask, render_template, request, redirect, url_for, send_file
from weasyprint import HTML, CSS
from datetime import datetime
import pandas as pd
import os
import json
import io

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY="dev",
    )

    DATA_DIR = os.getenv('RAILWAY_VOLUME_MOUNT_PATH', 'data')
    csv_path = os.path.join('tuition-calculator', DATA_DIR, 'tuition_fees.csv') 
   
    @app.route("/", methods=['GET', 'POST']) 
    def index():
        # Read in CSV
        df = pd.read_csv(csv_path)

        # Clean and filter data
        fee_columns = ['Int Fees - 2026', 'Dom Fees - 2026'] 
        for col in fee_columns:
            df[col] = (
                df[col].astype(str)
                .str.replace(r'[\$,]', '', regex=True)
                .str.strip()
                .replace('nan', pd.NA)
                .pipe(pd.to_numeric, errors='coerce')
                .fillna(0).astype(int)
            )
        df['Faculty'] = df['Faculty'].fillna('Other').replace('None', 'Other')
        df['UC Code'] = df['UC Code'].fillna('TBC').replace('nan', 'TBC')
        df['Points'] = df['Points'].fillna('TBC').replace('nan', 'TBC')
    
        df = df[df['UC Code'] != 'TBC']
        df = df[df['Points'] != 'TBC']
        df = df[df['Course Title'] != 'TBC']
        df = df[df['Int Fees - 2026'] != 0]
        df = df[df['Dom Fees - 2026'] != 0]

        # Create course data for templates and JavaScript 
        COURSES = df.to_dict('records')
        UNIQUE_FACULTIES = list(df['Faculty'].drop_duplicates())
        COURSES_JSON = json.dumps(COURSES)
      
        # Prevent redirect form alert
        if request.method == "POST":
            return redirect(url_for("index"))

        # Pass data into template 
        return render_template(
            "index.html", 
            courses=COURSES, 
            courses_json=COURSES_JSON, 
            unique_faculties=UNIQUE_FACULTIES
        )
    
    # ========== PDF EXPORT ========== #

    @app.route("/export-pdf", methods=["POST"])
    def export_pdf():
        # Gets JSON sent from the browser
        data = request.get_json()
        
        # Renders the HTML that will be converted into a PDF
        html_string = render_template("pdf_template.html", **data)
        
        # The absolute path to the PDF stylesheet
        css_path = os.path.join(app.root_path, "static", "pdf", "pdf.css")
        
        # Converts the HTML + CSS into a PDF
        pdf_bytes = HTML(string=html_string, base_url=app.root_path).write_pdf(
            stylesheets=[CSS(filename=css_path)] 
        ) 
        
        # Sends the in-memory PDF back as a file download
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
        ) 
    
    # =================================#   

    return app