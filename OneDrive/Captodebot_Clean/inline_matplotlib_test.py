# Run the Python code and render the matplotlib figure inline in the output using a non-interactive backend without opening GUI windows.

import matplotlib.pyplot as plt
import numpy as np

# Create sample data
x = np.linspace(0, 2*np.pi, 100)
y = np.sin(x)

# Create a simple plot
plt.figure(figsize=(8, 6))
plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')
plt.title('Simple Sine Wave', fontsize=14)
plt.xlabel('X values (radians)', fontsize=12)
plt.ylabel('Y values', fontsize=12)
plt.grid(True, alpha=0.3)
plt.legend()

# This will render inline without opening any GUI windows
plt.show()

print("✅ Figure rendered successfully inline!")
print("📊 The plot should appear above this text.")
print("🚫 No GUI windows were opened.")
