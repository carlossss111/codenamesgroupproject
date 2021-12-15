from flask import Flask, render_template, request

app = Flask(__name__)


@app.route('/', methods=["POST", "GET"])
def index():
    """
    Homepage for the website.
    Create a random board.
    """
    return render_template("html/page.html")


@app.route("/update", methods=["POST"])
def update():
    """
    Update the page with the details from the current board
    """
    return render_template()


@app.route("/computer_turn", methods=["POST"])
def sequence():
    """
    Get a series of computer moves
    """
    return sequence


@app.route("/clue", methods=["POST"])
def clue():
    """
    Generate a clue
    """
    return clue


@app.route("/instructions", methods=["GET"])
def instructions():
    """
    Render the dialog box containing the instructions
    """
    return render_template()


if __name__ == '__main__':
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(host='127.0.0.1', port=8080, debug=True)
