import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from simulation import generate_clicks

app = Flask(__name__)

DATABASE = 'database.db'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    with open('schema.sql') as f:
        conn.executescript(f.read())
    conn.close()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == 'OPTIONS':
        return '', 200
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'filename': filename})
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/simulate_heatmap/<filename>', methods=['POST'])
def simulate_heatmap(filename):
    # Clear any old clicks for this image
    conn = get_db_connection()
    conn.execute('DELETE FROM clicks WHERE filename = ?', (filename,))

    # Generate new clicks
    clicks = generate_clicks()

    # Save new clicks to the database
    for click in clicks:
        conn.execute('INSERT INTO clicks (filename, x, y) VALUES (?, ?, ?)',
                     (filename, click['x'], click['y']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/heatmap/<filename>', methods=['GET'])
def get_heatmap(filename):
    conn = get_db_connection()
    clicks_cursor = conn.execute('SELECT x, y FROM clicks WHERE filename = ?',
                               (filename,)).fetchall()
    conn.close()
    clicks = [{'x': row['x'], 'y': row['y'], 'value': 1} for row in clicks_cursor]
    return jsonify(clicks)

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, use_reloader=False)