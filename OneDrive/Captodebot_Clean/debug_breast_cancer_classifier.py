import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve
)

# -----------------------------
# 1️⃣ Load Dataset (FIXED: Use sample data instead of hardcoded path)
# -----------------------------
# Try to load the specific file, fallback to sample data if not found
try:
    file_path = r"C:\Users\dhaar\Brest_Cancer_Classifier\data.csv"
    data = pd.read_csv(file_path)
    print(f"✅ Successfully loaded data from: {file_path}")
except FileNotFoundError:
    print(f"❌ File not found: {file_path}")
    print("🔄 Creating sample breast cancer dataset for demonstration...")
    from sklearn.datasets import load_breast_cancer
    cancer = load_breast_cancer()
    data = pd.DataFrame(cancer.data, columns=cancer.feature_names)
    data['diagnosis'] = cancer.target  # 0=benign, 1=malignant
    print("✅ Using built-in breast cancer dataset")

# -----------------------------
# 2️⃣ Target + Features (FIXED: Better error handling)
# -----------------------------
if "diagnosis" in data.columns:
    y = data["diagnosis"]
    X = data.drop("diagnosis", axis=1)
    print(f"✅ Found 'diagnosis' column - using as target")
elif "target" in data.columns:
    y = data["target"]
    X = data.drop("target", axis=1)
    print(f"✅ Found 'target' column - using as target")
else:
    # Use last column as target if neither exists
    target_col = data.columns[-1]
    y = data[target_col]
    X = data.drop(target_col, axis=1)
    print(f"⚠️ Target column not found, using last column: {target_col}")

print(f"📊 Dataset shape: {X.shape}")
print(f"🎯 Target distribution: {y.value_counts().to_dict()}")

# Keep only numeric columns (FIXED: Handle non-numeric properly)
numeric_cols = X.select_dtypes(include=["number"]).columns
X = X[numeric_cols]
print(f"🔢 Numeric features: {len(numeric_cols)}")

# -----------------------------
# 3️⃣ Handle Missing Values (IMPROVED: Better error handling)
# -----------------------------
print("\n🔧 Handling missing values...")
if X.isnull().sum().sum() > 0:
    print(f"⚠️ Found {X.isnull().sum().sum()} missing values")
    imputer = SimpleImputer(strategy="mean")
    X_imputed = imputer.fit_transform(X)
    X = pd.DataFrame(X_imputed, columns=X.columns)
    print("✅ Missing values imputed using mean strategy")
else:
    print("✅ No missing values found")

# -----------------------------
# 4️⃣ Train-Test Split (IMPROVED: Better stratification)
# -----------------------------
print("\n📦 Splitting data...")
try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"✅ Train set: {X_train.shape}, Test set: {X_test.shape}")
except ValueError as e:
    print(f"⚠️ Stratification failed: {e}")
    print("🔄 Using simple split without stratification...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

# -----------------------------
# 5️⃣ Feature Scaling (IMPROVED: Better error handling)
# -----------------------------
print("\n⚖️ Scaling features...")
try:
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    print("✅ Features scaled using StandardScaler")
except Exception as e:
    print(f"⚠️ Scaling failed: {e}")
    print("🔄 Using unscaled data...")

# -----------------------------
# 6️⃣ Model Training (IMPROVED: Better error handling)
# -----------------------------
print("\n🤖 Training Logistic Regression model...")
try:
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    print("✅ Model training completed successfully")
except Exception as e:
    print(f"❌ Model training failed: {e}")
    exit(1)

# -----------------------------
# 7️⃣ Predictions (IMPROVED: Better error handling)
# -----------------------------
print("\n🔮 Making predictions...")
try:
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    print("✅ Predictions completed successfully")
except Exception as e:
    print(f"❌ Prediction failed: {e}")
    exit(1)

# -----------------------------
# 8️⃣ Metrics (IMPROVED: Better formatting and error handling)
# -----------------------------
print("\n" + "="*50)
print("📊 Breast Cancer Classifier Metrics")
print("="*50)

try:
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='binary')
    recall = recall_score(y_test, y_pred, average='binary')
    f1 = f1_score(y_test, y_pred, average='binary')
    
    print(f"🎯 Accuracy : {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"🎯 Precision: {precision:.4f}")
    print(f"🎯 Recall   : {recall:.4f}")
    print(f"🎯 F1 Score : {f1:.4f}")
    
    # ROC-AUC (only if binary classification)
    if len(np.unique(y)) == 2:
        try:
            roc_auc = roc_auc_score(y_test, y_prob)
            print(f"🎯 ROC-AUC  : {roc_auc:.4f}")
        except Exception as e:
            print(f"⚠️ ROC-AUC calculation failed: {e}")
    
    print("\n📋 Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    
    print("\n📄 Classification Report:")
    target_names = ["Benign (0)", "Malignant (1)"]
    print(classification_report(y_test, y_pred, target_names=target_names))
    
except Exception as e:
    print(f"❌ Metrics calculation failed: {e}")

# -----------------------------
# 9️⃣ ROC Curve (FIXED: Better error handling and plotting)
# -----------------------------
print("\n📈 Creating ROC Curve...")

try:
    # Only create ROC curve for binary classification
    if len(np.unique(y)) == 2:
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        
        # Create the plot
        plt.figure(figsize=(10, 8))
        plt.plot(fpr, tpr, color='blue', lw=2, label=f'ROC Curve (AUC = {roc_auc:.3f})')
        plt.plot([0, 1], [0, 1], color='red', lw=2, linestyle='--', label='Random Classifier')
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title('ROC Curve - Breast Cancer Classifier', fontsize=14, fontweight='bold')
        plt.legend(loc='lower right', fontsize=10)
        plt.grid(True, alpha=0.3)
        
        # Add annotations
        plt.text(0.6, 0.2, f'AUC = {roc_auc:.3f}', fontsize=12, 
                 bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        
        print("✅ ROC Curve created successfully")
        plt.show()  # This will display inline in CaptodeBot
        
    else:
        print("⚠️ ROC Curve requires binary classification (2 classes)")
        
except Exception as e:
    print(f"❌ ROC Curve creation failed: {e}")
    print("🔄 Creating simple accuracy plot instead...")
    
    # Fallback: Create a simple metrics plot
    metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score']
    values = [accuracy, precision, recall, f1]
    
    plt.figure(figsize=(10, 6))
    bars = plt.bar(metrics, values, color=['#2E86AB', '#A23B72', '#F18F01', '#C73E1D'])
    plt.title('Model Performance Metrics', fontsize=14, fontweight='bold')
    plt.ylabel('Score', fontsize=12)
    plt.ylim(0, 1)
    
    # Add value labels on bars
    for i, v in enumerate(values):
        plt.text(i, v + 0.01, f'{v:.3f}', ha='center', va='bottom', fontweight='bold')
    
    plt.grid(True, alpha=0.3, axis='y')
    plt.tight_layout()
    plt.show()

print("\n🎉 Breast Cancer Classification Analysis Complete!")
print("="*50)
