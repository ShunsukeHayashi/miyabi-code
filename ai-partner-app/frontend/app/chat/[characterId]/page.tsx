'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Message {
  id: string;
  sender: 'user' | 'character';
  content: string;
  emotion?: string;
  expression?: string;
  voiceUrl?: string;
  createdAt: string;
}

interface Character {
  id: string;
  name: string;
  primaryImageUrl?: string;
  expressionUrls?: any;
}

interface Conversation {
  id: string;
  characterId: string;
  stage: string;
}

export default function ChatPage({ params }: { params: Promise<{ characterId: string }> }) {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadWithParams = async () => {
      const resolvedParams = await params;
      loadCharacterAndConversation(resolvedParams.characterId);
    };
    loadWithParams();
  }, [params]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCharacterAndConversation = async (characterId: string) => {
    setIsLoading(true);
    try {
      // Load character
      const charResponse = await apiClient.getCharacter(characterId);
      setCharacter(charResponse.character);

      // Get or create conversation
      const conversationsResponse = await apiClient.getConversations();
      let conv = conversationsResponse.conversations.find(
        (c: any) => c.characterId === characterId
      );

      if (!conv) {
        const newConvResponse = await apiClient.createConversation(characterId);
        conv = newConvResponse.conversation;
      }

      setConversation(conv);

      // Load messages
      const messagesResponse = await apiClient.getMessages(conv.id);
      setMessages(messagesResponse.messages);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation || isSending) return;

    const messageContent = inputMessage;
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await apiClient.sendMessage(conversation.id, messageContent);
      
      // Add user message
      setMessages((prev) => [...prev, response.userMessage]);
      
      // Add character message with slight delay for realism
      setTimeout(() => {
        setMessages((prev) => [...prev, response.characterMessage]);
        
        // Update expression
        if (response.characterMessage.expression) {
          setCurrentExpression(response.characterMessage.expression);
        }

        // Play voice if available
        if (response.characterMessage.voiceUrl && audioRef.current) {
          audioRef.current.src = response.characterMessage.voiceUrl;
          audioRef.current.play();
        }
      }, 500);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCharacterImage = () => {
    if (!character) return null;
    
    // Try to get expression image first
    if (character.expressionUrls && character.expressionUrls[currentExpression]) {
      return character.expressionUrls[currentExpression];
    }
    
    // Fall back to primary image
    return character.primaryImageUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!character || !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">キャラクターが見つかりません</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Hidden audio element for voice playback */}
      <audio ref={audioRef} className="hidden" />

      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
            <div className="flex items-center space-x-3">
              {getCharacterImage() ? (
                <img
                  src={getCharacterImage()!}
                  alt={character.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{character.name}</h1>
                <p className="text-sm text-gray-500">
                  ステージ: {conversation.stage === 'first_meet' && '初対面'}
                  {conversation.stage === 'dating' && 'デート'}
                  {conversation.stage === 'relationship' && '交際'}
                  {conversation.stage === 'proposal' && 'プロポーズ'}
                  {conversation.stage === 'marriage' && '結婚'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/character/${character.id}`)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            プロフィール
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                会話を始めましょう
              </h3>
              <p className="text-gray-600">
                {character.name}との最初のメッセージを送ってみてください
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl ${
                    message.sender === 'user'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  } rounded-2xl px-4 py-3`}
                >
                  {message.sender === 'character' && message.emotion && (
                    <div className="text-xs text-gray-500 mb-1">
                      {message.emotion === 'happy' && '😊'}
                      {message.emotion === 'sad' && '😢'}
                      {message.emotion === 'excited' && '🤩'}
                      {message.emotion === 'neutral' && '😌'}
                      {message.emotion === 'love' && '😍'}
                      {message.emotion === 'surprised' && '😲'}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-pink-200' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
                rows={3}
                disabled={isSending}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="px-6 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[84px]"
            >
              {isSending ? '送信中...' : '送信'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enterで送信、Shift+Enterで改行
          </p>
        </div>
      </div>
    </div>
  );
}