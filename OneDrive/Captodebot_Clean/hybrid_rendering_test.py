# Test hybrid rendering - user can choose between inline and GUI modes

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

print("🎯 Hybrid Rendering Test")
print("=" * 50)

# Create sample data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Create sample dataset
data = {
    'X': x[:10],
    'Sin(X)': y1[:10],
    'Cos(X)': y2[:10]
}
df = pd.DataFrame(data)

print("\n1️⃣ Testing INLINE mode (default):")
print("   Plots will render in the output panel")

# Create a plot in inline mode
plt.figure(figsize=(10, 6))
plt.plot(x, y1, 'b-', label='sin(x)')
plt.plot(x, y2, 'r--', label='cos(x)')
plt.title('Inline Mode - Trigonometric Functions')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()  # This will render inline

print("\n2️⃣ Testing DATASET display in inline mode:")
show_dataset_interactive(df, "Sample Dataset")

print("\n" + "=" * 50)
print("3️⃣ Enabling GUI mode:")
enable_gui_mode()

print("\n4️⃣ Testing GUI mode:")
print("   Plots will try to open in interactive windows")

# Create another plot in GUI mode
plt.figure(figsize=(10, 6))
plt.plot(x, y1 * 2, 'g-', linewidth=2, label='2*sin(x)')
plt.plot(x, y2 * 2, 'm:', linewidth=2, label='2*cos(x)')
plt.title('GUI Mode - Scaled Trigonometric Functions')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()  # This will try to open a GUI window

print("\n5️⃣ Testing DATASET display in GUI mode:")
show_dataset_interactive(df, "Interactive Dataset Display")

print("\n" + "=" * 50)
print("6️⃣ Disabling GUI mode:")
disable_gui_mode()

print("\n7️⃣ Final test - back to inline mode:")
plt.figure(figsize=(8, 5))
plt.scatter(x[:50], y1[:50], c='red', alpha=0.6, label='sin(x)')
plt.scatter(x[:50], y2[:50], c='blue', alpha=0.6, label='cos(x)')
plt.title('Back to Inline Mode - Scatter Plot')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()  # This will render inline again

print("\n✅ Hybrid rendering test completed!")
print("📊 You can switch between modes anytime using:")
print("   enable_gui_mode()  # For interactive windows")
print("   disable_gui_mode() # For inline rendering")
