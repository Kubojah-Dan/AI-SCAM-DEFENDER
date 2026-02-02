# -*- coding: utf-8 -*-
# ML Workspace Template
# This template provides a ready-to-use environment for Machine Learning tasks

import sys
import os
import io
import base64
import pandas as pd

# Set UTF-8 encoding for stdout
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)

# ==================== CRITICAL VISUALIZATION RENDERING ====================
# Backend configuration for headless execution
import matplotlib
matplotlib.use("Agg")  # Headless backend suitable for servers
import matplotlib.pyplot as plt

# Configure matplotlib for clean output
plt.rcParams['figure.figsize'] = [10, 6]
plt.rcParams['figure.dpi'] = 150
plt.rcParams['savefig.dpi'] = 150
plt.rcParams['savefig.bbox'] = 'tight'
plt.rcParams['savefig.format'] = 'png'
plt.rcParams['savefig.facecolor'] = 'white'

# Global figure tracking
_figure_counter = 0

def render_figure():
    """Render matplotlib figure as actual image - no text descriptions"""
    global _figure_counter
    
    # Check if there are active figures
    if not plt.get_fignums():
        return False
    
    _figure_counter += 1
    filename = f"figure_{_figure_counter}.png"
    
    try:
        # Save the figure
        plt.savefig(filename, dpi=150, bbox_inches='tight', facecolor='white')
        
        # Convert to base64 for image rendering
        with open(filename, 'rb') as f:
            img_data = f.read()
            base64_data = base64.b64encode(img_data).decode('utf-8')
        
        # Render the actual image - no text descriptions
        img_html = f'<img src="data:image/png;base64,{base64_data}" alt="Figure {_figure_counter}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0;">'
        print(img_html)
        
        # Close the figure after rendering
        plt.close('all')
        
        return True
    except Exception:
        # Silently handle rendering errors
        plt.close('all')
        return False

# Auto-render after plotting operations
def auto_render():
    """Automatically render figures after plotting commands"""
    import time
    time.sleep(0.05)  # Small delay to ensure plot is ready
    render_figure()

# Patch matplotlib plotting functions to auto-render
def patch_matplotlib_functions():
    """Patch matplotlib functions for automatic rendering"""
    plot_functions = [
        'plot', 'scatter', 'bar', 'barh', 'hist', 'boxplot', 'violinplot',
        'errorbar', 'fill_between', 'stackplot', 'stem', 'step', 'hexbin',
        'pie', 'imshow', 'matshow', 'pcolormesh', 'contour', 'contourf',
        'barbs', 'quiver', 'streamplot', 'polar', 'spy', 'csd', 'cohere',
        'psd', 'specgram', 'angle_spectrum', 'phase_spectrum', 'magnitude_spectrum'
    ]
    
    for func_name in plot_functions:
        if hasattr(plt, func_name):
            original_func = getattr(plt, func_name)
            
            def make_wrapper(orig_func):
                def wrapper(*args, **kwargs):
                    result = orig_func(*args, **kwargs)
                    auto_render()
                    return result
                return wrapper
            
            setattr(plt, func_name, make_wrapper(original_func))

# Import and patch seaborn if available
try:
    import seaborn as sns
    SEABORN_AVAILABLE = True
    
    # Patch seaborn functions for automatic rendering
    seaborn_functions = [
        'scatterplot', 'lineplot', 'histplot', 'kdeplot', 'ecdfplot',
        'rugplot', 'distplot', 'boxplot', 'violinplot', 'boxenplot',
        'stripplot', 'swarmplot', 'catplot', 'pointplot', 'barplot',
        'countplot', 'heatmap', 'clustermap', 'pairplot', 'jointplot',
        'regplot', 'residplot', 'lmplot', 'relplot', 'displot'
    ]
    
    for func_name in seaborn_functions:
        if hasattr(sns, func_name):
            original_func = getattr(sns, func_name)
            
            def make_wrapper(orig_func):
                def wrapper(*args, **kwargs):
                    result = orig_func(*args, **kwargs)
                    auto_render()
                    return result
                return wrapper
            
            setattr(sns, func_name, make_wrapper(original_func))
            
except ImportError:
    SEABORN_AVAILABLE = False

# Apply matplotlib patches
patch_matplotlib_functions()

# ==================== END CRITICAL VISUALIZATION SETUP ====================

# Get the latest uploaded file path
uploaded_file_path = None
try:
    # Try to get the latest uploaded file info from the API
    import urllib.request
    import json
    
    response = urllib.request.urlopen('http://localhost:5000/api/workspace/latest-upload')
    data = json.loads(response.read().decode('utf-8'))
    
    if data['success']:
        uploaded_file_path = data['file']['tempPath']
        print(f"📁 Latest uploaded file: {os.path.basename(uploaded_file_path)}")
    else:
        print("📁 No files uploaded yet")
except Exception as e:
    print("📁 Could not retrieve latest upload info")

# Enhanced file loading with better error handling
def safe_load_csv(filename=None):
    """Safely load a CSV file with helpful error messages"""
    if filename is None:
        if uploaded_file_path:
            filename = uploaded_file_path
            print(f"📁 Using latest uploaded file: {os.path.basename(filename)}")
        else:
            print("❌ No file specified and no uploaded files available")
            print("💡 Please upload a CSV file first, or specify a filename")
            return None
    
    try:
        df = pd.read_csv(filename)
        print(f"✅ Successfully loaded: {os.path.basename(filename)}")
        return df
    except FileNotFoundError:
        print(f"❌ File not found: {filename}")
        print("\n🔍 Debugging Information:")
        print(f"Working Directory: {os.getcwd()}")
        print(f"Available Files: {os.listdir('.')}")
        
        # Check if file exists in current directory
        if os.path.exists(os.path.basename(filename)):
            print(f"� Try using: pd.read_csv('{os.path.basename(filename)}')")
        
        print("\n💡 To upload a file:")
        print("1. Click '📁 Upload CSV' in the ML Workspace")
        print("2. Select your CSV file")
        print("3. Use the uploaded_file_path variable or filename")
        
        return None
    except Exception as e:
        print(f"❌ Error loading file: {str(e)}")
        return None

# Monkey patch pd.read_csv to provide better error messages
original_read_csv = pd.read_csv
def smart_read_csv(filepath_or_buffer, **kwargs):
    """Smart CSV reader with enhanced error handling"""
    try:
        return original_read_csv(filepath_or_buffer, **kwargs)
    except FileNotFoundError:
        print(f"❌ File not found: {filepath_or_buffer}")
        print("\n🔍 Debugging Information:")
        print(f"Working Directory: {os.getcwd()}")
        print(f"Available Files: {os.listdir('.')}")
        
        if uploaded_file_path:
            print(f"\n💡 Latest uploaded file: {uploaded_file_path}")
            print(f"💡 Try using: pd.read_csv('{uploaded_file_path}')")
        
        print("\n💡 To upload a new file:")
        print("1. Click '📁 Upload CSV' in the ML Workspace")
        print("2. Select your CSV file")
        print("3. Use the uploaded_file_path variable")
        
        raise FileNotFoundError(f"File '{filepath_or_buffer}' not found")

# Replace the original read_csv with our smart version
pd.read_csv = smart_read_csv

# Try to import ML libraries with error handling
try:
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: matplotlib not available. Install with: pip install matplotlib")
    MATPLOTLIB_AVAILABLE = False

try:
    import seaborn as sns
    SEABORN_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: seaborn not available. Install with: pip install seaborn")
    SEABORN_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: numpy not available. Install with: pip install numpy")
    NUMPY_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: pandas not available. Install with: pip install pandas")
    PANDAS_AVAILABLE = False

try:
    from sklearn.datasets import load_iris, make_classification, make_regression
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.linear_model import LinearRegression, LogisticRegression
    from sklearn.metrics import accuracy_score, mean_squared_error, classification_report
    SKLEARN_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: scikit-learn not available. Install with: pip install scikit-learn")
    SKLEARN_AVAILABLE = False

import warnings
warnings.filterwarnings('ignore')

# Set up matplotlib for saving plots
def save_plot(filename=None, dpi=150, figsize=(10, 6)):
    """Save the current matplotlib plot and return base64 encoded image"""
    if not MATPLOTLIB_AVAILABLE:
        print("❌ Error: matplotlib is not available. Cannot save plot.")
        return
    
    if filename is None:
        filename = f'plot_{len(os.listdir(".")) + 1}.png'
    
    plt.savefig(filename, dpi=dpi, bbox_inches='tight')
    plt.close()  # Close the figure to free memory
    
    # Convert to base64 for embedding
    with open(filename, 'rb') as f:
        img_data = f.read()
        base64_data = base64.b64encode(img_data).decode('utf-8')
    
    print(f"<img src='data:image/png;base64,{base64_data}' alt='Plot' style='max-width: 100%; height: auto;'>")

# Enhanced DataFrame display
def display_df(df, max_rows=10, max_cols=None):
    """Display DataFrame with better formatting"""
    if not PANDAS_AVAILABLE:
        print("❌ Error: pandas is not available. Cannot display DataFrame.")
        return
    
    print(f"DataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print("\nFirst few rows:")
    print(df.head(max_rows))
    
    if max_cols:
        print(f"\nShowing {max_cols} columns out of {len(df.columns)}")

# Quick EDA function
def quick_eda(df, target_col=None):
    """Perform quick exploratory data analysis"""
    if not PANDAS_AVAILABLE:
        print("❌ Error: pandas is not available. Cannot perform EDA.")
        return
    
    if not NUMPY_AVAILABLE:
        print("❌ Error: numpy is not available. Cannot perform EDA.")
        return
    
    print("=== EXPLORATORY DATA ANALYSIS ===")
    print(f"Dataset Shape: {df.shape}")
    print(f"Memory Usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
    
    print("\n=== DATA TYPES ===")
    print(df.dtypes)
    
    print("\n=== MISSING VALUES ===")
    missing = df.isnull().sum()
    missing_pct = (missing / len(df) * 100).round(2)
    missing_df = pd.DataFrame({
        'Missing Count': missing,
        'Missing %': missing_pct
    })
    print(missing_df[missing_df['Missing Count'] > 0])
    
    print("\n=== NUMERICAL COLUMNS SUMMARY ===")
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 0:
        print(df[numeric_cols].describe())
    
    print("\n=== CATEGORICAL COLUMNS SUMMARY ===")
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        print(f"\n{col}:")
        print(f"  Unique values: {df[col].nunique()}")
        print(f"  Most common: {df[col].value_counts().head(3).to_dict()}")
    
    # Create correlation heatmap for numerical columns
    if len(numeric_cols) > 1 and MATPLOTLIB_AVAILABLE and SEABORN_AVAILABLE:
        plt.figure(figsize=(12, 8))
        correlation_matrix = df[numeric_cols].corr()
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, 
                   square=True, fmt='.2f')
        plt.title('Correlation Heatmap')
        plt.tight_layout()
        save_plot('correlation_heatmap.png')
    elif len(numeric_cols) > 1:
        print("⚠️  Warning: matplotlib or seaborn not available. Skipping correlation heatmap.")

# Model training helper
def train_model(X, y, model_type='classification', test_size=0.2, random_state=42):
    """Train a simple ML model and return metrics"""
    if not SKLEARN_AVAILABLE:
        print("❌ Error: scikit-learn is not available. Cannot train model.")
        return None, None, None, None, None
    
    if not PANDAS_AVAILABLE or not NUMPY_AVAILABLE:
        print("❌ Error: pandas or numpy not available. Cannot train model.")
        return None, None, None, None, None
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    
    if model_type == 'classification':
        model = RandomForestClassifier(n_estimators=100, random_state=random_state)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Feature importance plot
        if hasattr(model, 'feature_importances_') and MATPLOTLIB_AVAILABLE:
            plt.figure(figsize=(10, 6))
            feature_importance = pd.Series(model.feature_importances_, index=X.columns)
            feature_importance.sort_values(ascending=True).plot(kind='barh')
            plt.title('Feature Importance')
            plt.xlabel('Importance')
            plt.tight_layout()
            save_plot('feature_importance.png')
        elif hasattr(model, 'feature_importances_'):
            print("⚠️  Warning: matplotlib not available. Skipping feature importance plot.")
        
    else:  # regression
        model = RandomForestRegressor(n_estimators=100, random_state=random_state)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        print(f"Model RMSE: {rmse:.4f}")
        
        # Actual vs Predicted plot
        if MATPLOTLIB_AVAILABLE:
            plt.figure(figsize=(10, 6))
            plt.scatter(y_test, y_pred, alpha=0.6)
            plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
            plt.xlabel('Actual')
            plt.ylabel('Predicted')
            plt.title('Actual vs Predicted')
            plt.tight_layout()
            save_plot('actual_vs_predicted.png')
        else:
            print("⚠️  Warning: matplotlib not available. Skipping actual vs predicted plot.")
    
    return model, X_train, X_test, y_train, y_test

# Sample dataset generators
def generate_sample_data(data_type='classification', n_samples=1000, n_features=10):
    """Generate sample ML datasets"""
    if not SKLEARN_AVAILABLE:
        print("❌ Error: scikit-learn is not available. Cannot generate sample data.")
        return None
    
    if not NUMPY_AVAILABLE or not PANDAS_AVAILABLE:
        print("❌ Error: numpy or pandas not available. Cannot generate sample data.")
        return None
    
    if data_type == 'classification':
        X, y = make_classification(
            n_samples=n_samples, 
            n_features=n_features, 
            n_informative=max(2, n_features//2),
            n_redundant=0, 
            n_clusters_per_class=1, 
            random_state=42
        )
        feature_names = [f'feature_{i+1}' for i in range(n_features)]
        df = pd.DataFrame(X, columns=feature_names)
        df['target'] = y
        
    elif data_type == 'regression':
        X, y = make_regression(
            n_samples=n_samples, 
            n_features=n_features, 
            n_informative=max(2, n_features//2),
            noise=0.1, 
            random_state=42
        )
        feature_names = [f'feature_{i+1}' for i in range(n_features)]
        df = pd.DataFrame(X, columns=feature_names)
        df['target'] = y
        
    else:  # time series
        dates = pd.date_range(start='2020-01-01', periods=n_samples, freq='D')
        trend = np.linspace(100, 200, n_samples)
        seasonal = 10 * np.sin(2 * np.pi * np.arange(n_samples) / 365.25)
        noise = np.random.normal(0, 5, n_samples)
        values = trend + seasonal + noise
        
        df = pd.DataFrame({
            'date': dates,
            'value': values,
            'trend': trend,
            'seasonal': seasonal
        })
    
    return df

# Helper function to load uploaded datasets
def load_dataset(filename):
    """Load a dataset from the uploads directory"""
    if not PANDAS_AVAILABLE:
        print("❌ Error: pandas is not available. Cannot load dataset.")
        return None
    
    file_path = os.path.join('..', 'uploads', filename)
    try:
        df = pd.read_csv(file_path)
        print(f"✅ Successfully loaded {filename}")
        return df
    except FileNotFoundError:
        print(f"❌ Error: File '{filename}' not found in uploads directory")
        print(f"   Expected path: {file_path}")
        return None
    except Exception as e:
        print(f"❌ Error loading {filename}: {str(e)}")
        return None

# Helper function to list available datasets
def list_datasets():
    """List all available CSV files in the uploads directory"""
    uploads_dir = os.path.join('..', 'uploads')
    try:
        if os.path.exists(uploads_dir):
            files = [f for f in os.listdir(uploads_dir) if f.endswith('.csv')]
            if files:
                print("📁 Available datasets:")
                for file in files:
                    file_path = os.path.join(uploads_dir, file)
                    if os.path.exists(file_path):
                        # Try to get basic info about the dataset
                        try:
                            df = pd.read_csv(file_path, nrows=1)
                            print(f"   - {file} ({len(df.columns)} columns)")
                        except:
                            print(f"   - {file} (unable to read)")
            else:
                print("📁 No CSV files found in uploads directory")
        else:
            print("📁 Uploads directory not found")
    except Exception as e:
        print(f"❌ Error listing datasets: {str(e)}")

print("ML Workspace initialized successfully!")
print("📁 Files automatically copied to execution directory")

print("\n📁 File Loading Options:")
if uploaded_file_path:
    print(f"- ✅ uploaded_file_path = '{uploaded_file_path}'")
    print(f"- 📁 Latest file: {os.path.basename(uploaded_file_path)}")
else:
    print("- ❌ No files uploaded yet")

print("\n💡 Usage Examples:")
print("# Load latest uploaded file:")
print("df = safe_load_csv()  # Uses uploaded_file_path")
print("")
print("# Create visualizations:")
print("import matplotlib.pyplot as plt")
print("plt.plot([1, 2, 3, 4], [1, 4, 2, 3])")
print("# Image will appear automatically")

print("\nAvailable functions:")
print("- safe_load_csv(filename): Safely load CSV with error handling")
print("- display_df(df): Display DataFrame with formatting")
print("- quick_eda(df): Perform exploratory data analysis")
print("- train_model(X, y): Train ML models")
print("- generate_sample_data(): Generate sample datasets")

print("\nLibrary Status:")
print(f"✅ NumPy: {'Available' if NUMPY_AVAILABLE else 'Not Available'}")
print(f"✅ Pandas: {'Available' if PANDAS_AVAILABLE else 'Not Available'}")
print(f"✅ Matplotlib: {'Available' if MATPLOTLIB_AVAILABLE else 'Not Available'}")
print(f"✅ Seaborn: {'Available' if SEABORN_AVAILABLE else 'Not Available'}")
print(f"✅ Scikit-learn: {'Available' if SKLEARN_AVAILABLE else 'Not Available'}")

if not all([NUMPY_AVAILABLE, PANDAS_AVAILABLE, MATPLOTLIB_AVAILABLE, SEABORN_AVAILABLE, SKLEARN_AVAILABLE]):
    print("\n⚠️  Some libraries are not available. Install them with:")
    print("pip install numpy pandas matplotlib seaborn scikit-learn")
else:
    print("\n🎉 All ML libraries are ready to use!")

print("\n" + "="*50)
print("Working Directory:", os.getcwd())
print("Available Files:", os.listdir('.'))
print("="*50)
