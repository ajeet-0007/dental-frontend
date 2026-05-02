import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ShoppingCart, X } from 'lucide-react';
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
    sellingPrice: number;
    category: string;
    brand: string;
  }>;
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">Dentalkart Assistant</h1>
                  <p className="text-sm text-blue-100">AI-powered product help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="h-[500px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Bot className="w-16 h-16 mb-4 text-blue-200" />
                        <p className="text-lg font-medium mb-2">Welcome to Dentalkart Assistant!</p>
                        <p className="text-sm text-center max-w-md">
                          Ask me about dental products, recommendations, specifications, or any questions about our catalog.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                          {['Recommend dental instruments', 'Compare prices of braces', 'What instruments do I need for RCT?'].map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => setInput(suggestion)}
                              className="text-sm px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map(message => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <div className={`max-w-[70%] ${message.role === 'user' ? 'order-1' : ''}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 px-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>

                          {message.products && message.products.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-gray-500 font-medium">Related Products:</p>
                              <div className="grid gap-2">
                                {message.products.map(product => (
                                  <a
                                    key={product.id}
                                    href={`/products/${product.slug}`}
                                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                                  >
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <ShoppingCart className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                                      <p className="text-xs text-gray-500">{product.category} • {product.brand}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-blue-600">₹{product.sellingPrice.toLocaleString()}</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about dental products..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;