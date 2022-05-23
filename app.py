from flask import Flask, request, render_template
import pickle


loaded_model = pickle.load(open('finalized_model.sav', 'rb'))
alpha_map = {
    0: 'a',
    1: 'b',
    2: 'c',
    3: 'd',
    4: 'e',
    5: 'f',
    6: 'g',
    7: 'h',
    8: 'i',
    9: 'k',
    10: 'l',
    11: 'm',
    12: 'n',
    13: 'o',
    14: 'p',
    15: 'q',
    16: 'r',
    17: 's',
    18: 't',
    19: 'u',
    20: 'v',
    21: 'w',
    22: 'x',
    23: 'y'
}


app = Flask(__name__)


@app.route("/predict", methods=['GET', 'POST'])
def alpha_predictor():
    if request.method == 'POST':
        body = request.get_json()
        prediction = loaded_model.predict([body])
        print(alpha_map[prediction[0]])
        return "Success", 200
    else:
        return render_template('predict.html')


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"
