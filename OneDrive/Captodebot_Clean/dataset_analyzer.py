import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# Set style for better looking plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

print("📊 Dataset Analyzer - Works with Any Uploaded Dataset")
print("=" * 60)

# -----------------------------
# 1️⃣ Load Dataset (Workspace Upload)
# -----------------------------
def load_dataset():
    """Load dataset from workspace uploads"""
    print("📁 Looking for uploaded datasets...")
    
    # Try to find CSV files in common upload locations
    possible_paths = [
        "data.csv",
        "dataset.csv", 
        "insurance.csv",
        "train.csv",
        "test.csv"
    ]
    
    for filename in possible_paths:
        try:
            df = pd.read_csv(filename)
            print(f"✅ Successfully loaded: {filename}")
            print(f"📈 Dataset shape: {df.shape}")
            return df, filename
        except FileNotFoundError:
            continue
        except Exception as e:
            print(f"⚠️ Error loading {filename}: {e}")
            continue
    
    # If no file found, create sample data
    print("🔄 No dataset found, creating sample data...")
    np.random.seed(42)
    n_samples = 500
    df = pd.DataFrame({
        'feature1': np.random.normal(50, 15, n_samples),
        'feature2': np.random.normal(100, 25, n_samples),
        'feature3': np.random.choice(['A', 'B', 'C'], n_samples),
        'feature4': np.random.uniform(0, 100, n_samples),
        'target': np.random.normal(200, 50, n_samples)
    })
    print("✅ Using sample dataset")
    return df, "sample_data.csv"

# Load the dataset
df, filename = load_dataset()

print(f"\n📋 Dataset Preview:")
print(df.head())
print(f"\n📊 Dataset Info:")
df.info()

# -----------------------------
# 2️⃣ Basic Statistics
# -----------------------------
print(f"\n📈 Summary Statistics:")
print(df.describe())

# -----------------------------
# 3️⃣ Data Preprocessing
# -----------------------------
print("\n🔧 Preprocessing data...")

# Identify numeric and categorical columns
numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
categorical_columns = df.select_dtypes(include=['object']).columns.tolist()

print(f"🔢 Numeric columns: {numeric_columns}")
print(f"📝 Categorical columns: {categorical_columns}")

# Handle categorical variables
df_processed = df.copy()
le = LabelEncoder()

for col in categorical_columns:
    if col in df_processed.columns:
        try:
            df_processed[col] = le.fit_transform(df_processed[col].astype(str))
            print(f"✅ Encoded {col}")
        except Exception as e:
            print(f"⚠️ Could not encode {col}: {e}")

# Prepare features and target
# Use last column as target, or create one
if len(df_processed.columns) > 1:
    target_column = df_processed.columns[-1]
    X = df_processed.drop(target_column, axis=1)
    y = df_processed[target_column]
    print(f"🎯 Using '{target_column}' as target variable")
else:
    print("❌ Dataset needs at least 2 columns")
    exit(1)

# -----------------------------
# 4️⃣ Train-Test Split
# -----------------------------
print("\n📦 Splitting data...")
try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"✅ Train set: {X_train.shape}, Test set: {X_test.shape}")
except Exception as e:
    print(f"❌ Split failed: {e}")
    exit(1)

# -----------------------------
# 5️⃣ Model Training
# -----------------------------
print("\n🤖 Training models...")

# Linear Regression
try:
    lr_model = LinearRegression()
    lr_model.fit(X_train, y_train)
    lr_pred = lr_model.predict(X_test)
    lr_mse = mean_squared_error(y_test, lr_pred)
    lr_r2 = r2_score(y_test, lr_pred)
    print(f"✅ Linear Regression - MSE: {lr_mse:.2f}, R²: {lr_r2:.3f}")
except Exception as e:
    print(f"⚠️ Linear Regression failed: {e}")
    lr_mse, lr_r2 = float('inf'), 0

# Random Forest
try:
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_mse = mean_squared_error(y_test, rf_pred)
    rf_r2 = r2_score(y_test, rf_pred)
    print(f"✅ Random Forest - MSE: {rf_mse:.2f}, R²: {rf_r2:.3f}")
except Exception as e:
    print(f"⚠️ Random Forest failed: {e}")
    rf_mse, rf_r2 = float('inf'), 0

# -----------------------------
# 6️⃣ Visualization Functions
# -----------------------------
def create_data_overview():
    """Create overview plots of the dataset"""
    n_cols = len(df_processed.columns)
    n_rows = (n_cols + 1) // 2
    
    fig, axes = plt.subplots(n_rows, 2, figsize=(15, 5*n_rows))
    fig.suptitle(f'Dataset Overview - {filename}', fontsize=16, fontweight='bold')
    
    for i, col in enumerate(df_processed.columns):
        row = i // 2
        col_idx = i % 2
        
        if row >= n_rows:
            break
            
        if df_processed[col].dtype in ['int64', 'float64']:
            axes[row, col_idx].hist(df_processed[col], bins=20, alpha=0.7, color='skyblue')
            axes[row, col_idx].set_title(f'{col} Distribution')
            axes[row, col_idx].set_xlabel(col)
            axes[row, col_idx].set_ylabel('Frequency')
        else:
            value_counts = df_processed[col].value_counts()
            axes[row, col_idx].bar(range(len(value_counts)), value_counts.values)
            axes[row, col_idx].set_title(f'{col} Distribution')
            axes[row, col_idx].set_xlabel(col)
            axes[row, col_idx].set_ylabel('Count')
            axes[row, col_idx].set_xticks(range(len(value_counts)))
            axes[row, col_idx].set_xticklabels(value_counts.index, rotation=45)
    
    # Hide empty subplots
    for i in range(n_cols, n_rows * 2):
        row = i // 2
        col_idx = i % 2
        if row < n_rows and col_idx < 2:
            axes[row, col_idx].set_visible(False)
    
    plt.tight_layout()
    return fig

def create_correlation_analysis():
    """Create correlation heatmap"""
    plt.figure(figsize=(12, 8))
    
    # Use only numeric columns for correlation
    numeric_df = df_processed.select_dtypes(include=[np.number])
    if len(numeric_df.columns) > 1:
        correlation_matrix = numeric_df.corr()
        
        mask = np.triu(np.ones_like(correlation_matrix, dtype=bool))
        sns.heatmap(correlation_matrix, mask=mask, annot=True, cmap='coolwarm', 
                    center=0, square=True, fmt='.2f')
        plt.title('Feature Correlation Heatmap', fontsize=16, fontweight='bold')
    else:
        plt.text(0.5, 0.5, 'Need at least 2 numeric columns\nfor correlation analysis', 
                ha='center', va='center', fontsize=14, transform=plt.gca().transAxes)
        plt.title('Correlation Analysis', fontsize=16, fontweight='bold')
    
    plt.tight_layout()
    return plt.gcf()

def create_model_comparison():
    """Compare model performance"""
    models = ['Linear Regression', 'Random Forest']
    mse_values = [lr_mse, rf_mse]
    r2_values = [lr_r2, rf_r2]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # MSE Comparison
    colors = ['#3498db', '#e74c3c']
    bars1 = ax1.bar(models, mse_values, color=colors)
    ax1.set_title('Model Comparison - Mean Squared Error', fontsize=14, fontweight='bold')
    ax1.set_ylabel('MSE')
    ax1.grid(True, alpha=0.3)
    
    # Add value labels
    for i, v in enumerate(mse_values):
        if v != float('inf'):
            ax1.text(i, v + max(mse_values) * 0.01, f'{v:.0f}', 
                    ha='center', va='bottom', fontweight='bold')
    
    # R² Comparison
    bars2 = ax2.bar(models, r2_values, color=['#2ecc71', '#f39c12'])
    ax2.set_title('Model Comparison - R² Score', fontsize=14, fontweight='bold')
    ax2.set_ylabel('R²')
    ax2.set_ylim(0, 1)
    ax2.grid(True, alpha=0.3)
    
    # Add value labels
    for i, v in enumerate(r2_values):
        if v > 0:
            ax2.text(i, v + 0.02, f'{v:.3f}', 
                    ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    return fig

def create_prediction_analysis():
    """Analyze predictions vs actual"""
    if lr_r2 == 0 and rf_r2 == 0:
        return None
        
    fig, axes = plt.subplots(1, 2, figsize=(15, 6))
    fig.suptitle('Prediction Analysis', fontsize=16, fontweight='bold')
    
    # Use the better model
    if rf_r2 > lr_r2:
        pred = rf_pred
        r2 = rf_r2
        model_name = "Random Forest"
    else:
        pred = lr_pred
        r2 = lr_r2
        model_name = "Linear Regression"
    
    # Scatter plot
    axes[0].scatter(y_test, pred, alpha=0.6, color='blue')
    min_val = min(y_test.min(), pred.min())
    max_val = max(y_test.max(), pred.max())
    axes[0].plot([min_val, max_val], [min_val, max_val], 
                  'r--', lw=2, label='Perfect Prediction')
    axes[0].set_title(f'{model_name} - Predictions vs Actual (R² = {r2:.3f})')
    axes[0].set_xlabel('Actual Values')
    axes[0].set_ylabel('Predicted Values')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # Residual plot
    residuals = y_test - pred
    axes[1].scatter(pred, residuals, alpha=0.6, color='red')
    axes[1].axhline(y=0, color='black', linestyle='--')
    axes[1].set_title(f'{model_name} - Residual Plot')
    axes[1].set_xlabel('Predicted Values')
    axes[1].set_ylabel('Residuals')
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig

# -----------------------------
# 7️⃣ Generate All Graphs
# -----------------------------
print("\n📈 Generating visualizations...")

# Graph 1: Data Overview
print("📊 Creating data overview...")
fig1 = create_data_overview()
plt.show()

# Graph 2: Correlation Analysis
print("🔥 Creating correlation analysis...")
fig2 = create_correlation_analysis()
plt.show()

# Graph 3: Model Comparison
print("🤖 Creating model comparison...")
fig3 = create_model_comparison()
plt.show()

# Graph 4: Prediction Analysis
print("🎯 Creating prediction analysis...")
fig4 = create_prediction_analysis()
if fig4:
    plt.show()

# -----------------------------
# 8️⃣ Summary
# -----------------------------
print("\n" + "="*60)
print("📊 ANALYSIS SUMMARY")
print("="*60)
print(f"📁 Dataset: {filename}")
print(f"📈 Shape: {df.shape}")
print(f"🎯 Target: {target_column}")

if lr_r2 > 0 or rf_r2 > 0:
    best_model = "Random Forest" if rf_r2 > lr_r2 else "Linear Regression"
    best_r2 = max(lr_r2, rf_r2)
    best_mse = min(lr_mse, rf_mse)
    
    print(f"🏆 Best Model: {best_model}")
    print(f"📈 Best R² Score: {best_r2:.3f}")
    print(f"📉 Lowest MSE: {best_mse:.2f}")
else:
    print("⚠️ Model training failed")

print(f"\n💡 Tips for Better Results:")
print("  • Check for missing values and handle them properly")
print("  • Try feature engineering (create new features)")
print("  • Experiment with different models")
print("  • Use cross-validation for better evaluation")

print("\n🎉 Dataset Analysis Complete!")
print("📈 All graphs displayed inline in CaptodeBot!")
print("="*60)
