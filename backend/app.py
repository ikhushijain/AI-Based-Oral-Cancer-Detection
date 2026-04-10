from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys

# Force clear all cached modules
modules_to_clear = [k for k in sys.modules.keys() if 'predict' in k or 'model' in k]
for module in modules_to_clear:
    if module in sys.modules:
        del sys.modules[module]

# Import the fixed predict function
from predict import predict

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='/')

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://127.0.0.1:5000", "http://localhost:5000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-ID"]
    }
})

@app.route('/test', methods=['GET'])
def test_route():
    """Simple test route to verify Flask app is working"""
    return jsonify({'message': 'Flask app is working with fresh imports!', 'status': 'ok'})

@app.route('/predict', methods=['POST'])
def predict_route():
    """Handle image prediction requests"""
    print("=" * 50)
    print("PREDICT ROUTE CALLED WITH FRESH IMPORTS!")
    print("=" * 50)
    try:
        print(f"Request received: {request.method}")
        print(f"Files in request: {list(request.files.keys())}")
        
        # Check if file is in request
        if 'image' not in request.files:
            print("Error: No 'image' file in request")
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        print(f"File received: {file.filename}, size: {file.content_length}")
        
        # Check if file is selected
        if file.filename == '':
            print("Error: Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        print("Calling predict function...")
        # Get prediction
        result = predict(file)
        print(f"Prediction result: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        import traceback
        print(f"Error in prediction: {e}")
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/')
def index():
    """Serve the main frontend"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('../frontend', filename)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@app.before_request
def log_request_info():
    print(f"=== Incoming Request ===")
    print(f"Method: {request.method}")
    print(f"Path: {request.path}")
    print(f"Headers: {dict(request.headers)}")
    print(f"========================")

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    print("Starting Flask app with fresh imports...")
    print("Using predict_fixed for 2-class predictions")
    app.run(debug=debug, host='0.0.0.0', port=5000, use_reloader=False)
