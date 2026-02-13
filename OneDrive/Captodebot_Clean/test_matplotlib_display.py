# Execute the following Python code and display the matplotlib graph output directly in the workspace output cell (do not open external windows, do not suppress plots).

import matplotlib.pyplot as plt
import numpy as np

# Create sample data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(x + np.pi/4)

# Create a comprehensive plot
plt.figure(figsize=(12, 8))

# Plot multiple lines
plt.plot(x, y1, 'b-', linewidth=2, label='sin(x)')
plt.plot(x, y2, 'r--', linewidth=2, label='cos(x)')
plt.plot(x, y3, 'g:', linewidth=2, label='sin(x + π/4)')

# Add titles and labels
plt.title('Trigonometric Functions Comparison', fontsize=16, fontweight='bold')
plt.xlabel('X Values', fontsize=12)
plt.ylabel('Y Values', fontsize=12)
plt.legend(fontsize=12)
plt.grid(True, alpha=0.3)

# Add annotations
plt.annotate('Peak', xy=(np.pi/2, 1), xytext=(2, 1.5),
             arrowprops=dict(facecolor='black', shrink=0.05),
             fontsize=10)

# Set axis limits
plt.xlim(0, 10)
plt.ylim(-1.5, 1.5)

# Display the plot - this should render inline like Colab
plt.show()

print("✅ Plot displayed successfully!")
print("📊 The graph should appear above this text in the output panel.")
print("🎯 This demonstrates Colab-style inline matplotlib rendering.")
