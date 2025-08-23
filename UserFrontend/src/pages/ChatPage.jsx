import { useState } from 'react';
import ChatBox from '../components/ChatBox';
import AIBot from '../components/AIBot';

const ChatPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="container-app">
      {isChatOpen ? (
        <ChatBox 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <button
            onClick={() => setIsChatOpen(true)}
            className="btn btn-primary"
          >
            Open Chat
          </button>
        </div>
      )}
      <AIBot />
    </div>
  );
};

export default ChatPage;
