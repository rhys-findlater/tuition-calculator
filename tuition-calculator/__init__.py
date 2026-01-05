from flask import Flask, render_template
import pandas 
import os
import json

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY="dev",
    )

    
    

    @app.route("/", methods=['GET', 'POST']) 
    def index():
        # pass courses into the template
        return render_template("index.html", courses=COURSES)

    return app
