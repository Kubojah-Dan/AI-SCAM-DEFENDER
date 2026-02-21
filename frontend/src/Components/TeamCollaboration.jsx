import React, { useState, useEffect, useRef } from 'react';
import { FiUsers, FiMessageSquare, FiShare2, FiEye, FiClock, FiAlertTriangle, FiSend, FiUser } from 'react-icons/fi';
import { apiRequest } from '../api/client';
import { useToast } from './Toast';

const TeamCollaboration = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [teamMessages, setTeamMessages] = useState([]);
  const [sharedThreats, setSharedThreats] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const { showSuccess, showError } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    // Simulate active team members
    setActiveUsers([
      { id: 1, name: 'Sarah Chen', role: 'Security Analyst', status: 'online', avatar: 'SC' },
      { id: 2, name: 'Mike Johnson', role: 'Threat Hunter', status: 'online', avatar: 'MJ' },
      { id: 3, name: 'Alex Rivera', role: 'Malware Researcher', status: 'away', avatar: 'AR' },
      { id: 4, name: 'You', role: 'Security Analyst', status: 'online', avatar: 'YU', isCurrentUser: true }
    ]);

    // Simulate team messages
    setTeamMessages([
      {
        id: 1,
        user: 'Sarah Chen',
        message: 'Just found a sophisticated phishing campaign targeting banking customers',
        timestamp: new Date(Date.now() - 300000),
        type: 'threat'
      },
      {
        id: 2,
        user: 'Mike Johnson',
        message: 'I\'m analyzing the malware samples. Looks like a new variant of Zeus',
        timestamp: new Date(Date.now() - 180000),
        type: 'analysis'
      },
      {
        id: 3,
        user: 'Alex Rivera',
        message: 'Shared IOCs in the threat intelligence board',
        timestamp: new Date(Date.now() - 60000),
        type: 'intel'
      }
    ]);

    // Simulate shared threats
    setSharedThreats([
      {
        id: 1,
        title: 'Banking Phishing Campaign',
        type: 'phishing',
        severity: 'high',
        sharedBy: 'Sarah Chen',
        sharedAt: new Date(Date.now() - 300000),
        description: 'Multiple phishing sites targeting major banks',
        iocs: ['malicious-bank.com', 'secure-login.xyz'],
        status: 'investigating'
      },
      {
        id: 2,
        title: 'New Zeus Variant',
        type: 'malware',
        severity: 'critical',
        sharedBy: 'Mike Johnson',
        sharedAt: new Date(Date.now() - 180000),
        description: 'Banking trojan with new evasion techniques',
        iocs: ['trojan.exe', 'malicious.dll'],
        status: 'analyzing'
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [teamMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: teamMessages.length + 1,
      user: 'You',
      message: newMessage,
      timestamp: new Date(),
      type: 'general'
    };

    setTeamMessages(prev => [...prev, message]);
    setNewMessage('');
    showSuccess('Message sent to team');

    // Simulate typing indicator for other users
    setTimeout(() => {
      setTypingUsers(['Sarah Chen']);
      setTimeout(() => {
        setTypingUsers([]);
        // Simulate response
        const response = {
          id: teamMessages.length + 2,
          user: 'Sarah Chen',
          message: 'Thanks for the update! I\'ll look into that.',
          timestamp: new Date(),
          type: 'response'
        };
        setTeamMessages(prev => [...prev, response]);
      }, 2000);
    }, 500);
  };

  const shareThreat = (threat) => {
    showSuccess(`Threat "${threat.title}" shared with team`);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getMessageIcon = (type) => {
    switch(type) {
      case 'threat': return <FiAlertTriangle className="w-4 h-4 text-red-400" />;
      case 'analysis': return <FiEye className="w-4 h-4 text-blue-400" />;
      case 'intel': return <FiShare2 className="w-4 h-4 text-green-400" />;
      default: return <FiMessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="team-collaboration">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Team Members */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FiUsers className="w-5 h-5" />
                <span>Team Members</span>
              </h3>
              <span className="text-sm text-gray-400">{activeUsers.length} online</span>
            </div>
            
            <div className="space-y-3">
              {activeUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.avatar}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-gray-800`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-sm text-gray-400">{user.role}</div>
                  </div>
                  {user.isCurrentUser && (
                    <span className="text-xs text-blue-400">You</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Shared Threats */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <FiShare2 className="w-5 h-5" />
              <span>Shared Threats</span>
            </h3>
            
            <div className="space-y-3">
              {sharedThreats.map(threat => (
                <div key={threat.id} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">{threat.title}</h4>
                      <p className="text-sm text-gray-400">{threat.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(threat.severity)}`}>
                      {threat.severity}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Shared by {threat.sharedBy}</span>
                    <button
                      onClick={() => shareThreat(threat)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Chat */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 border border-gray-700 rounded-lg h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FiMessageSquare className="w-5 h-5" />
                <span>Team Chat</span>
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {teamMessages.map(message => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {message.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium">{message.user}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {getMessageIcon(message.type)}
                    </div>
                    <div className="text-gray-300 bg-gray-700/30 rounded-lg p-3">
                      {message.message}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span>{typingUsers.join(', ')} is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <FiSend className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCollaboration;
