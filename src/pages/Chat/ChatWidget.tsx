import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Array<{
    id: number;
    name: string;
    slug: string;
    price: number;
    category: string;
    brand: string;
  }>;
  timestamp: Date;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Hi! I\'m your Dentalkart assistant. How can I help you today?',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat/message', {
        message: userMessage.content,
        history: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        products: response.data.products,
        timestamp: new Date(response.data.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Dentalkart Assistant</span>
              </div>
            </div>

            <div className="h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`px-3 py-2 rounded-xl text-sm ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.products && message.products.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.products.slice(0, 2).map(product => (
                            <a
                              key={product.id}
                              href={`/product/${product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs text-blue-600 font-semibold">₹{product.price.toLocaleString()}</p>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="px-3 py-2 bg-gray-100 rounded-xl rounded-bl-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-3 border-t bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;