from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def compute_similarity_matrix(documents_text_list):
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents_text_list)
    return cosine_similarity(tfidf_matrix)

def get_redundancy_report(filenames, similarity_matrix, threshold=0.6):
    report = []
    n = len(filenames)
    for i in range(n):
        for j in range(i + 1, n):
            score = round(similarity_matrix[i][j] * 100, 2)
            if score >= threshold * 100:
                status = "Exact/Near Duplicate" if score >= 85 else "Similar Content"
                report.append({
                    "doc_a": filenames[i],
                    "doc_b": filenames[j],
                    "similarity": score,
                    "status": status
                })
    report.sort(key=lambda x: x["similarity"], reverse=True)
    return report