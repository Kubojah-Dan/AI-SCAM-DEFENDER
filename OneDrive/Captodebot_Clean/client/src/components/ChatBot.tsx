import React, { useState, useRef, useEffect } from 'react';
import { Send, Minimize2, Maximize2, Bot, X, MessageCircle, Sparkles, Code2, Brain, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  className?: string;
}

export default function ChatBot({ className = '' }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Hi! I'm CaptodeBot AI Assistant! I can help you with:\n\n💻 Python programming & debugging\n🤖 Machine Learning & Data Science\n📊 Visualizations & graphs\n🔧 CaptodeBot platform features\n📚 General questions & learning\n\nHow can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI response with contextual awareness
    const lowerMessage = userMessage.toLowerCase();
    
    // Platform-specific responses
    if (lowerMessage.includes('workspace') || lowerMessage.includes('ml workspace')) {
      return `🔧 **CaptodeBot ML Workspace Help:**

The ML workspace is your Python coding environment with Colab-style features:

**📊 Visualization:**
- \`plt.show()\` displays graphs inline
- \`enable_gui_mode()\` opens interactive windows
- \`disable_gui_mode()\` returns to inline

**📦 Package Installation:**
- \`!pip install package_name\` works immediately
- \`pip install package_name\` also works

**🎯 Features:**
- Automatic figure rendering
- Hybrid inline/GUI modes
- Real-time code execution
- Error debugging

Try running: \`plt.plot([1,2,3,4]); plt.show()\`

Need more specific help with your code?`;
    }

    if (lowerMessage.includes('error') || lowerMessage.includes('debug') || lowerMessage.includes('fix')) {
      return `🐛 **Debugging Help:**

I can help you debug Python code! Please share:

1. **Your code** (or the error-producing part)
2. **Error message** (copy-paste the full error)
3. **What you expected** vs. **what happened**

**Common issues in CaptodeBot:**
- **Indentation errors** - Check your spacing
- **Import errors** - Use \`!pip install package_name\`
- **Figure not showing** - Try \`plt.show()\` or \`enable_gui_mode()\`

**Example debugging:**
\`\`\`python
# Your code here
import matplotlib.pyplot as plt
plt.plot([1, 2, 3])
plt.show()  # This should display inline
\`\`\`

Share your specific issue and I'll help you fix it!`;
    }

    if (lowerMessage.includes('matplotlib') || lowerMessage.includes('plot') || lowerMessage.includes('graph')) {
      return `📊 **Matplotlib & Plotting Help:**

**🎨 Basic Plotting:**
\`\`\`python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('My Plot')
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.grid(True, alpha=0.3)
plt.show()  # Displays inline in CaptodeBot
\`\`\`

**🖥️ GUI Mode (Interactive):**
\`\`\`python
enable_gui_mode()  # Opens plots in separate windows
plt.plot([1, 2, 3, 4])
plt.show()  # Now opens interactive window
\`\`\`

**📈 Multiple Plots:**
\`\`\`python
plt.subplot(1, 2, 1)
plt.plot([1, 2, 3], [1, 4, 2])

plt.subplot(1, 2, 2)
plt.scatter([1, 2, 3], [2, 3, 1])

plt.tight_layout()
plt.show()
\`\`\`

Need help with a specific type of plot?`;
    }

    if (lowerMessage.includes('machine learning') || lowerMessage.includes('ml') || lowerMessage.includes('model')) {
      return `🤖 **Machine Learning Help:**

**📚 Popular ML Libraries in CaptodeBot:**

**Scikit-learn:**
\`\`\`python
!pip install scikit-learn
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Your ML code here
model = RandomForestClassifier()
model.fit(X_train, y_train)
\`\`\`

**TensorFlow/Keras:**
\`\`\`python
!pip install tensorflow
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])
\`\`\`

**Pandas for Data:**
\`\`\`python
import pandas as pd
import numpy as np

# Load and explore data
df = pd.read_csv('your_data.csv')
print(df.head())
print(df.describe())
\`\`\`

**🎯 What I can help with:**
- Model selection and implementation
- Data preprocessing
- Hyperparameter tuning
- Model evaluation metrics
- Feature engineering

What specific ML task are you working on?`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('how to')) {
      return `🚀 **CaptodeBot AI Assistant - Quick Guide:**

**💻 Coding Help:**
- "Debug this error: [paste error]"
- "Explain this code: [paste code]"
- "Write a function to [describe task]"

**📊 Data Science:**
- "How do I plot [type of chart]?"
- "Explain [ML concept]"
- "Help with [algorithm]"

**🔧 Platform Features:**
- "How do I install packages?"
- "Why isn't my plot showing?"
- "How to use GUI mode?"

**📚 General Learning:**
- "Explain [concept] step by step"
- "Teach me about [topic]"
- "Examples of [concept]"

**🎯 Tips:**
- Be specific with your questions
- Share error messages for debugging
- Describe what you're trying to achieve
- I remember our conversation context

What would you like to learn or work on?`;
    }

    // Default response with personality
    const responses = [
      `🤔 **Thinking about your question...**

That's an interesting question! Let me help you with that.

**💡 Here's what I can suggest:**
- If you're working on code, feel free to share it
- If you're learning a concept, I'll break it down step-by-step
- If you're stuck, describe what you've tried

**🎯 What specific aspect would you like me to focus on?**

I'm here to make your CaptodeBot experience smoother and help you learn effectively!`,
      
      `✨ **Great question!** 

I'd be happy to help you with that. To give you the best assistance:

**🔍 Tell me more about:**
- Your current goal or project
- What you've tried so far
- Any specific challenges you're facing

**💡 I can help with:**
- Step-by-step explanations
- Code examples and debugging
- ML concepts and implementations
- CaptodeBot platform features

**🚀 Let's solve this together!**

What's the specific context or challenge you're working with?`,
      
      `🧠 **Let me help you with that!**

I'm your CaptodeBot AI Assistant, and I'm here to make your learning and coding journey smoother.

**🎯 How I can assist:**
- **Coding:** Debug errors, write functions, explain code
- **Learning:** Break down complex topics simply
- **ML/Data Science:** Models, visualizations, data analysis
- **Platform:** Navigate CaptodeBot features effectively

**💭 For best results:**
- Share your code or error messages
- Describe your goal clearly
- Ask follow-up questions if needed

**🚀 What specific challenge can I help you overcome today?**`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(async () => {
      const botResponse = await generateBotResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text: string) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded text-sm overflow-x-auto"><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 group"
          title="CaptodeBot AI Assistant"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 bg-green-400 w-3 h-3 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 ${isMinimized ? 'w-80' : 'w-96'} transition-all duration-300`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="w-8 h-8" />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">CaptodeBot AI</h3>
                <p className="text-xs opacity-90 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Online & Ready
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.sender === 'bot' ? (
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                        />
                      ) : (
                        <p className="text-sm">{message.text}</p>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about coding, ML, or CaptodeBot..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center justify-center space-x-4 mt-3 text-xs text-gray-500">
                  <button
                    onClick={() => setInput("How do I debug my Python code?")}
                    className="hover:text-blue-500 transition-colors flex items-center space-x-1"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Debug Code</span>
                  </button>
                  <button
                    onClick={() => setInput("Explain machine learning concepts")}
                    className="hover:text-blue-500 transition-colors flex items-center space-x-1"
                  >
                    <Brain className="w-3 h-3" />
                    <span>ML Help</span>
                  </button>
                  <button
                    onClick={() => setInput("How do I create plots in CaptodeBot?")}
                    className="hover:text-blue-500 transition-colors flex items-center space-x-1"
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Plotting</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
