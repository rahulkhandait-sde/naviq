import { useState, useRef, useEffect, useCallback } from 'react';
import { HiPaperAirplane, HiMicrophone, HiSpeakerWave } from 'react-icons/hi2';

const ChatBox = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your NaviQ assistant. How can I help you navigate today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnected] = useState(true); // Remove setIsConnected since it's not used
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice enabled by default
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Configure female voice settings
  const getFemalVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    
    // Prefer female voices in order of preference
    const preferredVoices = [
      'Microsoft Zira - English (United States)',
      'Google UK English Female',
      'Microsoft Hazel - English (Great Britain)',
      'Samsung Serena',
      'Samantha',
      'Victoria',
      'Karen',
      'Moira',
      'Alex'
    ];
    
    // First try to find a specifically named female voice
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferredName.split(' ')[1]) || v.name === preferredName);
      if (voice) return voice;
    }
    
    // Fallback: find any voice with "female" in the name
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('hazel') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('moira')
    );
    
    if (femaleVoice) return femaleVoice;
    
    // Final fallback: use the first available voice
    return voices.find(voice => voice.lang.startsWith('en')) || voices[0];
  }, []);

  const speakMessage = useCallback((text, autoSpeak = false) => {
    if (!voiceEnabled && !autoSpeak) return;
    
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure for attractive female voice
      const femaleVoice = getFemalVoice();
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Voice settings for attractive female speech
      utterance.rate = 0.85; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher pitch for femininity
      utterance.volume = 0.9; // Clear but not too loud
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      // Small delay to ensure voice is loaded
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  }, [voiceEnabled, getFemalVoice, setIsSpeaking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-speak welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      // Delay to ensure voices are loaded and chat is fully opened
      setTimeout(() => {
        speakMessage(messages[0].text, true);
      }, 1000);
    }
  }, [isOpen, messages, speakMessage]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(inputText);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Automatically speak the bot response with female voice
      setTimeout(() => {
        speakMessage(botResponse, true);
      }, 300); // Small delay to ensure message is rendered
    }, 1500);
  };

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('bathroom') || input.includes('restroom')) {
      return "The nearest restroom is on your left, about 50 meters down the hallway. I can guide you there!";
    } else if (input.includes('conference') || input.includes('meeting')) {
      return "I found 3 conference rooms nearby. Conference Room A is closest to you. Would you like directions?";
    } else if (input.includes('exit') || input.includes('way out')) {
      return "The main exit is straight ahead, then turn right at the end of the corridor. It's about 2 minutes walk.";
    } else if (input.includes('help') || input.includes('navigate')) {
      return "I can help you find any location in this building! Just tell me where you want to go or scan a QR code for instant directions.";
    } else if (input.includes('floor') || input.includes('level')) {
      return "You're currently on the 2nd floor. The elevator is nearby if you need to go to a different floor. Which floor are you looking for?";
    } else {
      return "I understand you're looking for something. Could you be more specific? I can help you find rooms, facilities, exits, or provide general navigation assistance.";
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-slate-950/95 backdrop-blur-lg border-t border-white/10 sm:border sm:rounded-2xl w-full h-4/5 sm:w-96 sm:h-3/4 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-button rounded-full flex items-center justify-center">
              🤖
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-white">NaviQ Assistant</h3>
                {isSpeaking && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Speaking...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {isConnected ? 'Online • Female Voice AI' : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                voiceEnabled 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/10 text-gray-400'
              }`}
              title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
            >
              <HiSpeakerWave className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble ${message.sender}`}>
                <p className="text-sm">{message.text}</p>
                {message.sender === 'bot' && (
                  <button
                    onClick={() => speakMessage(message.text)}
                    className="mt-1 text-xs text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    <HiSpeakerWave className="w-3 h-3 mr-1" />
                    Listen
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="chat-bubble bot">
                <div className="flex space-x-1">
                  <div className="pulse-dot"></div>
                  <div className="pulse-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="pulse-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about navigation..."
                className="input pr-12"
                disabled={isTyping}
              />
              <button
                onClick={startListening}
                disabled={isListening || isTyping}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isListening 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <HiMicrophone className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
              className="btn btn-primary px-4"
            >
              <HiPaperAirplane className="w-4 h-4" />
            </button>
          </div>
          
          {isListening && (
            <p className="text-xs text-blue-400 mt-2 animate-pulse">
              🎤 Listening... Speak now
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
