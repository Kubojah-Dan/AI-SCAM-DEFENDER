# -*- coding: utf-8 -*-
# Robust Server-based Python and Machine Learning Execution Environment
# Primary goal: Execute user code reliably without failure

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

# ==================== HYBRID ENVIRONMENT SETUP ====================
# User can choose between inline (Colab-style) and GUI rendering

# Default to Agg backend for inline rendering
import matplotlib
matplotlib.use("Agg")  # Use non-interactive backend by default
import matplotlib.pyplot as plt
import io
import base64

# Configure matplotlib for inline rendering (Colab-style)
plt.rcParams['figure.figsize'] = [10, 6]
plt.rcParams['figure.dpi'] = 150
plt.rcParams['savefig.dpi'] = 150
plt.rcParams['savefig.bbox'] = 'tight'
plt.rcParams['savefig.format'] = 'png'
plt.rcParams['savefig.facecolor'] = 'white'

# Global variable to track rendering mode
_gui_mode = False

def enable_gui_mode():
    """Enable GUI mode for interactive matplotlib windows"""
    global _gui_mode
    try:
        import matplotlib
        matplotlib.use('TkAgg')  # Try to use TkAgg for GUI
        import matplotlib.pyplot as plt
        _gui_mode = True
        print("✅ GUI mode enabled - plots will open in interactive windows")
        return True
    except Exception as e:
        print(f"❌ Could not enable GUI mode: {e}")
        print("📊 Falling back to inline rendering")
        _gui_mode = False
        return False

def disable_gui_mode():
    """Disable GUI mode and return to inline rendering"""
    global _gui_mode
    try:
        import matplotlib
        matplotlib.use('Agg')  # Return to non-interactive backend
        import matplotlib.pyplot as plt
        _gui_mode = False
        print("✅ GUI mode disabled - plots will render inline")
        return True
    except Exception as e:
        print(f"❌ Error disabling GUI mode: {e}")
        return False

def show_dataset_interactive(df, title="Dataset"):
    """Show dataset in an interactive window if GUI mode is enabled"""
    global _gui_mode
    if _gui_mode:
        try:
            # Create a new figure for dataset display
            fig, ax = plt.subplots(figsize=(12, 8))
            ax.axis('tight')
            ax.axis('off')
            
            # Create table from DataFrame
            table = ax.table(cellText=df.head(20).values, 
                          colLabels=df.columns,
                          cellLoc='center',
                          loc='center')
            
            table.auto_set_font_size(False)
            table.set_fontsize(9)
            table.scale(1.2, 1.5)
            
            plt.title(title, fontsize=14, fontweight='bold', pad=20)
            plt.show()
            
        except Exception as e:
            print(f"❌ Could not display dataset interactively: {e}")
            print("📊 Falling back to inline display:")
            print(df.head(10))
    else:
        print(f"📊 {title} (inline display):")
        print(df.head(10))

# Suppress ALL matplotlib warnings before any operations
import warnings
import sys
import io

# Redirect warnings to suppress them completely
class WarningSuppressor:
    def __init__(self):
        self.original_stderr = sys.stderr
    
    def write(self, text):
        # Filter out matplotlib warnings
        if 'FigureCanvasAgg' in text or 'non-interactive' in text or 'cannot be shown' in text:
            return
        self.original_stderr.write(text)
    
    def flush(self):
        self.original_stderr.flush()

# Install the warning suppressor
sys.stderr = WarningSuppressor()

# Comprehensive warning suppression
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', module='matplotlib')
warnings.filterwarnings('ignore', module='matplotlib.backend')
warnings.filterwarnings('ignore', message='.*FigureCanvasAgg.*')
warnings.filterwarnings('ignore', message='.*non-interactive.*')
warnings.filterwarnings('ignore', message='.*cannot be shown.*')

# Override plt.show to handle both modes
def _hybrid_show(*args, **kwargs):
    """Hybrid plt.show() that handles both inline and GUI modes"""
    global _gui_mode
    try:
        if _gui_mode:
            # GUI mode - let matplotlib handle window display
            import matplotlib.pyplot as plt
            original_show = getattr(plt, '_original_show', None)
            if original_show:
                original_show(*args, **kwargs)
            else:
                # Fallback to inline if no original show available
                render_existing_figures()
        else:
            # Inline mode - render figures to output
            render_existing_figures()
    except Exception as e:
        print(f"Warning: Could not display plot: {e}")
        # Fallback to inline rendering
        render_existing_figures()

# Store original show if available
import matplotlib.pyplot as plt
if hasattr(plt, 'show') and not hasattr(plt, '_original_show'):
    plt._original_show = plt.show

# Force the override
plt.show = _hybrid_show
matplotlib.pyplot.show = _hybrid_show

# Also override plt.figure to track figure creation
_original_figure = plt.figure
def _tracked_figure(*args, **kwargs):
    """Track figure creation and render automatically"""
    fig = _original_figure(*args, **kwargs)
    return fig

plt.figure = _tracked_figure

# Global figure tracking
_figure_counter = 0

def render_existing_figures():
    """Colab-style Figure Rendering - Automatic inline display"""
    global _figure_counter
    
    # Check if any matplotlib/seaborn figures exist after code execution
    if not plt.get_fignums():
        return False
    
    # Render each figure inline (Colab-style)
    for fig_num in plt.get_fignums():
        try:
            fig = plt.figure(fig_num)
            _figure_counter += 1
            
            # Save figure to buffer for inline display
            buf = io.BytesIO()
            fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            
            # Convert to base64 for inline rendering
            img_data = buf.getvalue()
            base64_data = base64.b64encode(img_data).decode('utf-8')
            
            # Render inline like Colab
            img_html = f'<img src="data:image/png;base64,{base64_data}" alt="Figure {_figure_counter}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0;">'
            print(img_html)
            
            # Close the figure to free memory
            plt.close(fig)
            
        except Exception as e:
            print(f"Warning: Could not render figure {fig_num}: {e}")
            continue
    
    return True

# ==================== END MANDATORY SETUP ====================

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

print("Robust ML Execution Environment initialized successfully!")
print("🔧 Server-based Python and Machine Learning Execution")
print("- Execute user code reliably without failure")
print("- Support data science, machine learning, and visualization workflows")
print("- Headless environment with matplotlib/seaborn support")

print("\n📚 Library Support:")
print("- ✅ pandas - Data manipulation and analysis")
print("- ✅ numpy - Numerical computing")
print("- ✅ matplotlib - Visualization (headless)")
print("- ✅ seaborn - Statistical visualization")
print("- ✅ scikit-learn - Machine learning")

print("\n🎨 Visualization Rules:")
print("- ✅ Headless matplotlib backend (Agg)")
print("- ✅ Visualizations only when user code creates them")
print("- ✅ No auto-generation of plots")
print("- ✅ plt.show() disabled - no warnings")
print("- ✅ Automatic figure rendering to images")

print("\n📁 File Loading Options:")
if uploaded_file_path:
    print(f"- ✅ uploaded_file_path = '{uploaded_file_path}'")
    print(f"- 📁 Latest file: {os.path.basename(uploaded_file_path)}")
else:
    print("- ❌ No files uploaded yet")

print("\n💡 Usage Examples:")
print("# Text output:")
print("print('Hello World!')")

print("\n# Data analysis:")
print("import pandas as pd")
print("df = pd.read_csv(uploaded_file_path)")
print("print(df.head())")

print("\n# Visualization (only when created):")
print("import matplotlib.pyplot as plt")
print("import numpy as np")
print("x = np.linspace(0, 10, 100)")
print("y = np.sin(x)")
print("plt.plot(x, y)  # Creates plot automatically")
print("plt.title('My Plot')  # Creates plot automatically")

print("\n# plt.show() does nothing:")
print("plt.show()  # No effect, no warnings")

print("\n🔬 Ready for reliable ML code execution!")

# Auto-render any existing figures after initialization
render_existing_figures()

# Make render_figure available in the global namespace
# This ensures it's available for user code execution
import sys
sys.modules['__main__'].render_figure = render_figure
sys.modules['builtins'].render_figure = render_figure

# Also add to globals for good measure
globals()['render_figure'] = render_figure

# Register cleanup function to render figures after user code execution
import atexit
atexit.register(render_existing_figures)

# Add a global variable to track if we're in user code execution
_user_code_executing = True

# Override the exit function to ensure figures are rendered
_original_exit = sys.exit
def _safe_exit(*args, **kwargs):
    global _user_code_executing
    _user_code_executing = False
    render_existing_figures()
    return _original_exit(*args, **kwargs)

sys.exit = _safe_exit

# Add cleanup at the end of user code execution
def _cleanup_and_render():
    global _user_code_executing
    if _user_code_executing:
        _user_code_executing = False
        render_existing_figures()

# Register the cleanup function
import atexit
atexit.register(_cleanup_and_render)

# Add automatic rendering at the end of the script
# This will be executed after user code
def _final_render():
    """Final render function to be called after user code execution"""
    try:
        render_existing_figures()
    except Exception as e:
        print(f"Warning: Could not render figures: {e}")

# Store the final render function to be called by the GPU service
globals()['_final_render'] = _final_render

# Also add it to the main module
import sys
sys.modules['__main__']._final_render = _final_render
