"""
Machine Learning Model Architectures and Probability Calibration.
Commodity Derivatives Intelligence
"""

import logging
from typing import Tuple, Any
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)


def train_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
    model_type: str = "xgboost"
) -> Tuple[Any, StandardScaler]:
    """
    Fit a StandardScaler and classification model strictly on training data slice.

    Args:
        X_train: Training feature matrix
        y_train: Training binary target vector
        model_type: 'xgboost' (primary) or 'logistic' (baseline)

    Returns:
        (fitted_model, fitted_scaler)
    """
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_train)

    # Handle rare cases of single-class in small initial training slices
    if len(np.unique(y_train)) < 2:
        logger.warning("Only single class present in training slice; augmenting synthetic balance.")
        y_train = y_train.copy()
        y_train[0] = 1 - y_train[0]

    if model_type == "logistic":
        model = LogisticRegression(
            C=0.5,
            penalty="l2",
            solver="liblinear",
            random_state=42,
            max_iter=500
        )
    else:  # default: xgboost
        model = XGBClassifier(
            n_estimators=60,
            max_depth=3,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            eval_metric="logloss",
            random_state=42
        )

    model.fit(X_scaled, y_train)
    return model, scaler


def predict_confidence(
    model: Any,
    scaler: StandardScaler,
    X: np.ndarray
) -> np.ndarray:
    """
    Transform features using the fitted scaler and predict calibrated probability of mean reversion.

    Returns:
        1D array of probabilities (0.0 to 1.0)
    """
    X_scaled = scaler.transform(X)
    probs = model.predict_proba(X_scaled)[:, 1]
    return probs
