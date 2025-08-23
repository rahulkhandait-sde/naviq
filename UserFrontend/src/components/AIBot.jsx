import { useState } from 'react';
import ChatBox from './ChatBox';

const AIBot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsChatOpen(true)}
        className="floating-btn"
        style={{ zIndex: 9999 }}
        aria-label="Open AI Assistant"
      >
        🤖
      </button>

      <ChatBox 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
};

export default AIBot;
