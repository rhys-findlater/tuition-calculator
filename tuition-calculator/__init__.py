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
    course_csv_path = os.path.join('tuition-calculator', DATA_DIR, 'tuition_fees.csv') 
    degree_csv_path = os.path.join('tuition-calculator', DATA_DIR, 'degree_fees.csv')
   
    @app.route("/", methods=['GET', 'POST']) 
    def index():
        # Read in CSV
        course_df = pd.read_csv(course_csv_path)
        degree_df = pd.read_csv(degree_csv_path)


        # Clean and filter data
        fee_columns = ['Int Fees - 2026', 'Dom Fees - 2026'] 
        for col in fee_columns:
            course_df[col] = (
                course_df[col].astype(str)
                .str.replace(r'[\$,]', '', regex=True)
                .str.strip()
                .replace('nan', pd.NA)
                .pipe(pd.to_numeric, errors='coerce')
                .fillna(0).astype(int)
            )

        fee_columns = ['Int -  Full Prog_2026', 'Dom - Full Prog_2026'] 
        for col in fee_columns:
            degree_df[col] = (
                degree_df[col].astype(str)
                .str.replace(r'[\$,]', '', regex=True)
                .str.strip()
                .replace('nan', pd.NA)
                .pipe(pd.to_numeric, errors='coerce')
                .fillna(0).astype(int)
            )

        course_df['Faculty'] = course_df['Faculty'].fillna('Other').replace('None', 'Other')
        course_df['UC Code'] = course_df['UC Code'].fillna('TBC').replace('nan', 'TBC')
        course_df['Points'] = course_df['Points'].fillna('TBC').replace('nan', 'TBC')
        
        degree_df['Owning Faculty'] = degree_df['Owning Faculty'].fillna('Other').replace('None', 'Other')
        degree_df['Code'] = degree_df['Code'].fillna('TBC').replace('nan', 'TBC')
        degree_df['Points'] = degree_df['Points'].fillna('TBC').replace('nan', 'TBC')
    
        course_df = course_df[course_df['UC Code'] != 'TBC']
        course_df = course_df[course_df['Points'] != 'TBC']
        course_df = course_df[course_df['Course Title'] != 'TBC']
        course_df = course_df[course_df['Int Fees - 2026'] != 0]
        course_df = course_df[course_df['Dom Fees - 2026'] != 0]

        degree_df = degree_df[degree_df['Code'] != 'TBC']
        degree_df = degree_df[degree_df['Points'] != 'TBC']
        degree_df = degree_df[degree_df['Full Title'] != 'TBC']
        degree_df = degree_df[degree_df['Int -  Full Prog_2026'] != 0]
        degree_df = degree_df[degree_df['Dom - Full Prog_2026'] != 0]

        # Create course data for templates and JavaScript 
        COURSES = course_df.to_dict('records')
        DEGREES = degree_df.to_dict('records')
        UNIQUE_COURSE_FACULTIES = list(course_df['Faculty'].drop_duplicates())
        UNIQUE_DEGREE_FACULTIES = list(degree_df['Owning Faculty'].drop_duplicates())
        COURSES_JSON = json.dumps(COURSES)
      
        # Prevent redirect form alert
        if request.method == "POST":
            return redirect(url_for("index"))

        return render_template(
            "index.html", 
            courses=COURSES, 
            courses_json=COURSES_JSON, 
            unique_course_faculties=UNIQUE_COURSE_FACULTIES,
            unique_degree_faculties=UNIQUE_DEGREE_FACULTIES,
            degrees=DEGREES
        )
    
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