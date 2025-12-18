from flask import Flask, render_template

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY="dev",
    )

    # Temporary course data
    COURSES = [
        {
            "code": "ARTS101",
            "title": "Introduction to Art History",
            "faculty": "Arts",
            "points": 15,
            "price": 892.50,
        },
        {
            "code": "ENGL201",
            "title": "English Literature and Culture",
            "faculty": "Arts",
            "points": 15,
            "price": 892.50,
        },
        {
            "code": "HIST102",
            "title": "Modern World History",
            "faculty": "Arts",
            "points": 15,
            "price": 892.50,
        },
        {
            "code": "BSNS101",
            "title": "Foundations of Business",
            "faculty": "Business",
            "points": 15,
            "price": 1050.00,
        },
        {
            "code": "ECON104",
            "title": "Introduction to Economics",
            "faculty": "Business",
            "points": 15,
            "price": 1050.00,
        },
    ]

    @app.route("/")
    def index():
        # pass courses into the template
        return render_template("index.html", courses=COURSES)

    return app
