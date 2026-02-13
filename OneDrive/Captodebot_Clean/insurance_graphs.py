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

print("📊 Insurance Data Analysis & Visualization")
print("=" * 50)

# -----------------------------
# 1️⃣ Load Dataset
# -----------------------------
try:
    file_path = r"C:\Users\LINA\Downloads\insurance.csv"
    df = pd.read_csv(file_path)
    print(f"✅ Successfully loaded insurance dataset from: {file_path}")
    print(f"📈 Dataset shape: {df.shape}")
except FileNotFoundError:
    print(f"❌ File not found: {file_path}")
    print("🔄 Creating sample insurance dataset for demonstration...")
    # Create sample insurance data if file not found
    np.random.seed(42)
    n_samples = 1000
    df = pd.DataFrame({
        'age': np.random.randint(18, 80, n_samples),
        'sex': np.random.choice(['male', 'female'], n_samples),
        'bmi': np.random.normal(30, 6, n_samples),
        'children': np.random.randint(0, 5, n_samples),
        'smoker': np.random.choice(['yes', 'no'], n_samples),
        'region': np.random.choice(['northeast', 'northwest', 'southeast', 'southwest'], n_samples),
        'charges': np.random.normal(13270, 12110, n_samples)
    })
    print("✅ Using sample insurance dataset")

print(f"\n📋 Dataset Info:")
print(df.info())
print(f"\n📊 Summary Statistics:")
print(df.describe())

# -----------------------------
# 2️⃣ Data Preprocessing
# -----------------------------
print("\n🔧 Preprocessing data...")

# Convert categorical variables to numeric
le = LabelEncoder()
categorical_columns = ['sex', 'smoker', 'region']

for col in categorical_columns:
    if col in df.columns:
        df[col] = le.fit_transform(df[col])
        print(f"✅ Encoded {col}: {df[col].unique()}")

# Prepare features and target
X = df.drop('charges', axis=1)
y = df['charges']

print(f"🎯 Features: {list(X.columns)}")
print(f"🎯 Target: charges")

# -----------------------------
# 3️⃣ Train-Test Split
# -----------------------------
print("\n📦 Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"✅ Train set: {X_train.shape}, Test set: {X_test.shape}")

# -----------------------------
# 4️⃣ Model Training
# -----------------------------
print("\n🤖 Training models...")

# Linear Regression
lr_model = LinearRegression()
lr_model.fit(X_train, y_train)
lr_pred = lr_model.predict(X_test)
lr_mse = mean_squared_error(y_test, lr_pred)
lr_r2 = r2_score(y_test, lr_pred)

# Random Forest
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)
rf_mse = mean_squared_error(y_test, rf_pred)
rf_r2 = r2_score(y_test, rf_pred)

print(f"✅ Linear Regression - MSE: {lr_mse:.2f}, R²: {lr_r2:.3f}")
print(f"✅ Random Forest - MSE: {rf_mse:.2f}, R²: {rf_r2:.3f}")

# -----------------------------
# 5️⃣ Visualization Functions
# -----------------------------
def create_distribution_plots():
    """Create distribution plots for key variables"""
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle('Insurance Data - Variable Distributions', fontsize=16, fontweight='bold')
    
    # Age distribution
    axes[0, 0].hist(df['age'], bins=20, alpha=0.7, color='skyblue')
    axes[0, 0].set_title('Age Distribution')
    axes[0, 0].set_xlabel('Age')
    axes[0, 0].set_ylabel('Frequency')
    
    # BMI distribution
    axes[0, 1].hist(df['bmi'], bins=20, alpha=0.7, color='lightgreen')
    axes[0, 1].set_title('BMI Distribution')
    axes[0, 1].set_xlabel('BMI')
    axes[0, 1].set_ylabel('Frequency')
    
    # Charges distribution
    axes[0, 2].hist(df['charges'], bins=20, alpha=0.7, color='salmon')
    axes[0, 2].set_title('Charges Distribution')
    axes[0, 2].set_xlabel('Charges ($)')
    axes[0, 2].set_ylabel('Frequency')
    
    # Children count
    axes[1, 0].hist(df['children'], bins=5, alpha=0.7, color='orange')
    axes[1, 0].set_title('Children Distribution')
    axes[1, 0].set_xlabel('Number of Children')
    axes[1, 0].set_ylabel('Frequency')
    
    # Sex distribution
    if 'sex' in df.columns:
        sex_counts = df['sex'].value_counts()
        axes[1, 1].pie(sex_counts.values, labels=sex_counts.index, autopct='%1.1f%%')
        axes[1, 1].set_title('Sex Distribution')
    
    # Smoker distribution
    if 'smoker' in df.columns:
        smoker_counts = df['smoker'].value_counts()
        axes[1, 2].pie(smoker_counts.values, labels=smoker_counts.index, autopct='%1.1f%%')
        axes[1, 2].set_title('Smoker Distribution')
    
    plt.tight_layout()
    return fig

def create_correlation_heatmap():
    """Create correlation heatmap"""
    plt.figure(figsize=(12, 8))
    
    # Select only numeric columns for correlation
    numeric_df = df.select_dtypes(include=[np.number])
    correlation_matrix = numeric_df.corr()
    
    mask = np.triu(np.ones_like(correlation_matrix, dtype=bool))
    sns.heatmap(correlation_matrix, mask=mask, annot=True, cmap='coolwarm', 
                center=0, square=True, fmt='.2f')
    plt.title('Feature Correlation Heatmap', fontsize=16, fontweight='bold', pad=20)
    plt.tight_layout()
    return plt.gcf()

def create_scatter_plots():
    """Create scatter plots showing relationships"""
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Insurance Charges - Key Relationships', fontsize=16, fontweight='bold')
    
    # Age vs Charges
    axes[0, 0].scatter(df['age'], df['charges'], alpha=0.6, color='blue')
    axes[0, 0].set_title('Age vs Insurance Charges')
    axes[0, 0].set_xlabel('Age')
    axes[0, 0].set_ylabel('Charges ($)')
    axes[0, 0].grid(True, alpha=0.3)
    
    # BMI vs Charges
    axes[0, 1].scatter(df['bmi'], df['charges'], alpha=0.6, color='red')
    axes[0, 1].set_title('BMI vs Insurance Charges')
    axes[0, 1].set_xlabel('BMI')
    axes[0, 1].set_ylabel('Charges ($)')
    axes[0, 1].grid(True, alpha=0.3)
    
    # Children vs Charges
    axes[1, 0].scatter(df['children'], df['charges'], alpha=0.6, color='green')
    axes[1, 0].set_title('Children vs Insurance Charges')
    axes[1, 0].set_xlabel('Number of Children')
    axes[1, 0].set_ylabel('Charges ($)')
    axes[1, 0].grid(True, alpha=0.3)
    
    # Box plot by smoker status
    if 'smoker' in df.columns:
        smoker_labels = {0: 'Non-smoker', 1: 'Smoker'}
        df['smoker_label'] = df['smoker'].map(smoker_labels)
        df.boxplot(column='charges', by='smoker_label', ax=axes[1, 1])
        axes[1, 1].set_title('Charges by Smoker Status')
        axes[1, 1].set_xlabel('Smoker Status')
        axes[1, 1].set_ylabel('Charges ($)')
    
    plt.tight_layout()
    return fig

def create_model_comparison():
    """Compare model performance"""
    models = ['Linear Regression', 'Random Forest']
    mse_values = [lr_mse, rf_mse]
    r2_values = [lr_r2, rf_r2]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # MSE Comparison
    bars1 = ax1.bar(models, mse_values, color=['#3498db', '#e74c3c'])
    ax1.set_title('Model Comparison - Mean Squared Error', fontsize=14, fontweight='bold')
    ax1.set_ylabel('MSE')
    ax1.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for i, v in enumerate(mse_values):
        ax1.text(i, v + max(mse_values) * 0.01, f'{v:.0f}', 
                ha='center', va='bottom', fontweight='bold')
    
    # R² Comparison
    bars2 = ax2.bar(models, r2_values, color=['#2ecc71', '#f39c12'])
    ax2.set_title('Model Comparison - R² Score', fontsize=14, fontweight='bold')
    ax2.set_ylabel('R²')
    ax2.set_ylim(0, 1)
    ax2.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for i, v in enumerate(r2_values):
        ax2.text(i, v + 0.02, f'{v:.3f}', 
                ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    return fig

def create_prediction_vs_actual():
    """Compare predictions vs actual values"""
    fig, axes = plt.subplots(1, 2, figsize=(15, 6))
    fig.suptitle('Model Predictions vs Actual Values', fontsize=16, fontweight='bold')
    
    # Linear Regression
    axes[0].scatter(y_test, lr_pred, alpha=0.6, color='blue')
    axes[0].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 
                  'r--', lw=2, label='Perfect Prediction')
    axes[0].set_title(f'Linear Regression (R² = {lr_r2:.3f})')
    axes[0].set_xlabel('Actual Charges')
    axes[0].set_ylabel('Predicted Charges')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # Random Forest
    axes[1].scatter(y_test, rf_pred, alpha=0.6, color='green')
    axes[1].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 
                  'r--', lw=2, label='Perfect Prediction')
    axes[1].set_title(f'Random Forest (R² = {rf_r2:.3f})')
    axes[1].set_xlabel('Actual Charges')
    axes[1].set_ylabel('Predicted Charges')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig

# -----------------------------
# 6️⃣ Generate All Graphs
# -----------------------------
print("\n📈 Generating visualizations...")

# Graph 1: Distributions
print("📊 Creating distribution plots...")
fig1 = create_distribution_plots()
plt.show()

# Graph 2: Correlation Heatmap
print("🔥 Creating correlation heatmap...")
fig2 = create_correlation_heatmap()
plt.show()

# Graph 3: Scatter Plots
print("📈 Creating scatter plots...")
fig3 = create_scatter_plots()
plt.show()

# Graph 4: Model Comparison
print("🤖 Creating model comparison...")
fig4 = create_model_comparison()
plt.show()

# Graph 5: Predictions vs Actual
print("🎯 Creating prediction comparison...")
fig5 = create_prediction_vs_actual()
plt.show()

# -----------------------------
# 7️⃣ Summary Results
# -----------------------------
print("\n" + "="*50)
print("📊 MODEL PERFORMANCE SUMMARY")
print("="*50)
print(f"🏆 Best Model: {'Random Forest' if rf_r2 > lr_r2 else 'Linear Regression'}")
print(f"📈 Best R² Score: {max(lr_r2, rf_r2):.3f}")
print(f"📉 Lowest MSE: {min(lr_mse, rf_mse):.0f}")
print(f"💰 Average Predicted Charge: ${np.mean(rf_pred):.2f}")
print(f"💰 Actual Average Charge: ${np.mean(y_test):.2f}")

print("\n🎉 Insurance Data Analysis Complete!")
print("📈 All graphs have been displayed inline in CaptodeBot!")
print("="*50)
