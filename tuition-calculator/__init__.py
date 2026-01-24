from flask import Flask, render_template, request, redirect, url_for, send_file, abort, jsonify
from weasyprint import HTML, CSS
from datetime import datetime
import pandas as pd
import os
import json
import io

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY="dev",
    )

    if os.environ.get("RAILWAY_VOLUME_MOUNT_PATH"):
        DATA_DIR = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH") 
    else: 
        DATA_DIR = os.path.join(app.root_path, "data")

    course_csv_path = os.path.join(DATA_DIR, "tuition_fees.csv")
    degree_csv_path = os.path.join(DATA_DIR, "degree_fees.csv")
   
    # ============ HELPER FUNCTIONS ============
    
    def clean_course_dataframe(df):
        """Clean and filter course dataframe."""
        required_columns = [
            'Int Fees - 2026', 
            'Dom Fees - 2026', 
            'Faculty', 
            'UC Code', 
            'Points', 
            'Course Title'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}. Available columns: {list(df.columns)}")
        
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
        
        return df
    
    def clean_degree_dataframe(df):
        """Clean and filter degree dataframe."""
        required_columns = [
            'Int -  Full Prog_2026', 
            'Dom - Full Prog_2026', 
            'Owning Faculty', 
            'Code', 
            'Points', 
            'Full Title'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}. Available columns: {list(df.columns)}")
        
        fee_columns = ['Int -  Full Prog_2026', 'Dom - Full Prog_2026'] 
        for col in fee_columns:
            df[col] = (
                df[col].astype(str)
                .str.replace(r'[\$,]', '', regex=True)
                .str.strip()
                .replace('nan', pd.NA)
                .pipe(pd.to_numeric, errors='coerce')
                .fillna(0).astype(int)
            )
        
        df['Owning Faculty'] = df['Owning Faculty'].fillna('Other').replace('None', 'Other')
        df['Code'] = df['Code'].fillna('TBC').replace('nan', 'TBC')
        df['Points'] = df['Points'].fillna('TBC').replace('nan', 'TBC')
        
        df = df[df['Code'] != 'TBC']
        df = df[df['Points'] != 'TBC']
        df = df[df['Full Title'] != 'TBC']
        df = df[df['Int -  Full Prog_2026'] != 0]
        df = df[df['Dom - Full Prog_2026'] != 0]
        
        return df
    
    def get_cleaned_course_data():
        """Load and clean course data from CSV."""
        course_df = pd.read_csv(course_csv_path)
        return clean_course_dataframe(course_df)
    
    def get_cleaned_degree_data():
        """Load and clean degree data from CSV."""
        degree_df = pd.read_csv(degree_csv_path)
        return clean_degree_dataframe(degree_df)
    
    # ============ ROUTES ============
   
    @app.route("/", methods=['GET', 'POST']) 
    def index():
        course_df = get_cleaned_course_data()
        degree_df = get_cleaned_degree_data()
        
        COURSES = course_df.to_dict('records')
        DEGREES = degree_df.to_dict('records')
        UNIQUE_COURSE_FACULTIES = list(course_df['Faculty'].drop_duplicates())
        UNIQUE_DEGREE_FACULTIES = list(degree_df['Owning Faculty'].drop_duplicates())
        COURSES_JSON = json.dumps(COURSES)
        
        if request.headers.get('Accept') == 'application/json' or request.args.get('format') == 'json':
            return jsonify({
                "courses": COURSES,
                "degrees": DEGREES,
                "unique_course_faculties": UNIQUE_COURSE_FACULTIES,
                "unique_degree_faculties": UNIQUE_DEGREE_FACULTIES
            })
        
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
    
    @app.post("/api/ping")
    def api_ping():
        """Webhook endpoint to receive and save updated COURSE data only."""
        try:
            token = request.headers.get("X-Sync-Token")
            if token != os.environ.get("SYNC_TOKEN"):
                abort(401)
            
            body = request.get_data(as_text=True)
            
            if not body:
                return jsonify({"error": "Empty request body"}), 400
            
            data_df = pd.read_csv(io.StringIO(body))
            
            app.logger.info(f"Received columns: {list(data_df.columns)}")
            app.logger.info(f"Received {len(data_df)} rows")
            
            data_df = clean_course_dataframe(data_df)
            
            data_df.to_csv(course_csv_path, index=False)
            
            app.logger.info(f"Successfully saved {len(data_df)} courses to {course_csv_path}")
            
            return jsonify({
                "ok": True, 
                "rows_updated": len(data_df),
                "message": "Course data updated successfully"
            }), 200
            
        except ValueError as e:
            app.logger.error(f"Validation error: {str(e)}")
            return jsonify({"error": str(e)}), 400
            
        except Exception as e:
            app.logger.error(f"Unexpected error in /api/ping: {str(e)}")
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500
    
    @app.get("/api/courses")
    def api_get_courses():
        """API endpoint to get current course AND degree data as JSON."""
        try:
            course_df = get_cleaned_course_data()
            degree_df = get_cleaned_degree_data()
            
            COURSES = course_df.to_dict('records')
            DEGREES = degree_df.to_dict('records')
            UNIQUE_COURSE_FACULTIES = list(course_df['Faculty'].drop_duplicates())
            UNIQUE_DEGREE_FACULTIES = list(degree_df['Owning Faculty'].drop_duplicates())
            
            return jsonify({
                "courses": COURSES,
                "degrees": DEGREES,
                "unique_course_faculties": UNIQUE_COURSE_FACULTIES,
                "unique_degree_faculties": UNIQUE_DEGREE_FACULTIES
            })
        except Exception as e:
            app.logger.error(f"Error in /api/courses: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @app.route("/export-pdf", methods=["POST"])
    def export_pdf():
        """Export course selection to PDF."""
        try:
            data = request.get_json()
            html_string = render_template("pdf_template.html", **data)
            css_path = os.path.join(app.root_path, "static", "css", "pdf.css")
            
            pdf_bytes = HTML(string=html_string, base_url=app.root_path).write_pdf(
                stylesheets=[CSS(filename=css_path)] 
            ) 
            
            return send_file(
                io.BytesIO(pdf_bytes),
                mimetype="application/pdf",
            )
        except Exception as e:
            app.logger.error(f"Error generating PDF: {str(e)}")
            return jsonify({"error": "Failed to generate PDF"}), 500

    return app
