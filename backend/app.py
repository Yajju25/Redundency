import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from core.extractor import extract_text
from core.preprocessor import clean_text
from core.similarity import compute_similarity_matrix, get_redundancy_report

app = Flask(__name__)
CORS(app)  # allows React (port 3000) to call this API (port 5000)

UPLOAD_FOLDER = "uploads"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/api/upload", methods=["POST"])
def upload():
    files = request.files.getlist("documents")

    if len(files) < 2:
        return jsonify({"error": "Please upload at least 2 documents to compare."}), 400

    filenames = []
    cleaned_texts = []
    skipped = []

    for file in files:
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(save_path)

        try:
            raw_text = extract_text(save_path)
        except ValueError:
            skipped.append(file.filename)
            continue

        cleaned = clean_text(raw_text)

        if not cleaned.strip():
            skipped.append(file.filename)
            continue

        filenames.append(file.filename)
        cleaned_texts.append(cleaned)

    if len(cleaned_texts) < 2:
        return jsonify({
            "error": "Not enough valid documents to compare.",
            "skipped": skipped
        }), 400

    similarity_matrix = compute_similarity_matrix(cleaned_texts)
    report = get_redundancy_report(filenames, similarity_matrix, threshold=0.6)

    return jsonify({
        "total": len(filenames),
        "report": report,
        "skipped": skipped
    })


@app.route("/api/clear", methods=["POST"])
def clear_uploads():
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
    return jsonify({"message": "Uploads cleared successfully"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)