import numpy as np
from sklearn.metrics import cohen_kappa_score

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray, num_classes: int = 5) -> dict:
    """
    Calculates comprehensive medical classification metrics:
    Accuracy, Precision, Recall/Sensitivity, Specificity, F1-Score, Balanced Accuracy, Quadratic Weighted Kappa (QWK), and Confusion Matrix.
    """
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1

    total_samples = len(y_true)
    correct = np.sum(np.diag(cm))
    accuracy = correct / total_samples if total_samples > 0 else 0.0

    try:
        qwk = float(cohen_kappa_score(y_true, y_pred, weights="quadratic"))
    except Exception:
        qwk = 0.0

    per_class_sensitivities = []
    per_class_specificities = []
    per_class_precisions = []
    per_class_f1s = []

    for i in range(num_classes):
        tp = cm[i, i]
        fn = np.sum(cm[i, :]) - tp
        fp = np.sum(cm[:, i]) - tp
        tn = total_samples - (tp + fn + fp)

        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        f1 = (2 * precision * sensitivity) / (precision + sensitivity) if (precision + sensitivity) > 0 else 0.0

        per_class_sensitivities.append(sensitivity)
        per_class_specificities.append(specificity)
        per_class_precisions.append(precision)
        per_class_f1s.append(f1)

    balanced_accuracy = float(np.mean(per_class_sensitivities))
    macro_precision = float(np.mean(per_class_precisions))
    macro_sensitivity = float(np.mean(per_class_sensitivities))
    macro_specificity = float(np.mean(per_class_specificities))
    macro_f1 = float(np.mean(per_class_f1s))

    return {
        "accuracy": round(accuracy, 4),
        "balanced_accuracy": round(balanced_accuracy, 4),
        "qwk": round(qwk, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_sensitivity": round(macro_sensitivity, 4),
        "macro_specificity": round(macro_specificity, 4),
        "macro_f1": round(macro_f1, 4),
        "confusion_matrix": cm.tolist(),
        "per_class": {
            i: {
                "sensitivity": round(per_class_sensitivities[i], 4),
                "specificity": round(per_class_specificities[i], 4),
                "precision": round(per_class_precisions[i], 4),
                "f1": round(per_class_f1s[i], 4),
            } for i in range(num_classes)
        }
    }

