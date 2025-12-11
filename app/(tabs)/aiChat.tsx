import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseProductData } from '@/utils/productParser';
import { generateSystemPrompt } from '@/utils/systemPrompt';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LLAMA3_2_1B, Message, useLLM } from 'react-native-executorch';
import { SafeAreaView } from 'react-native-safe-area-context';
import mockData from './mockData4.json';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const [inputText, setInputText] = useState('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const llm = useLLM({ model: LLAMA3_2_1B });

  const colors = Colors[colorScheme ?? 'light'];

  // Load and parse product data on mount
  useEffect(() => {
    try {
      const parsedData = parseProductData(mockData);
      if (parsedData) {
        const prompt = generateSystemPrompt(parsedData);
        setSystemPrompt(prompt);
        setProductName(parsedData.productName);
        setIsLoadingProduct(false);
      } else {
        console.error('Failed to parse product data');
        setIsLoadingProduct(false);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      setIsLoadingProduct(false);
    }
  }, []);

  // Initialize messages with product-specific greeting
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!isLoadingProduct && productName) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hello! I'm your Product Assistant for "${productName}". I'm here to help answer any questions you have about this product. What would you like to know?`,
        },
      ]);
    }
  }, [isLoadingProduct, productName]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, llm.response]);

  // Update assistant message when LLM generates response
  useEffect(() => {
    if (llm.response && llm.response.trim() && !llm.isGenerating) {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.id.startsWith('temp-')) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              id: `msg-${Date.now()}`,
              content: llm.response.trim(),
            },
          ];
        }
        return prev;
      });
    } else if (llm.response && llm.isGenerating) {
      // Update streaming response
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.id.startsWith('temp-')) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: llm.response,
            },
          ];
        } else if (lastMessage?.role !== 'assistant' || !lastMessage.id.startsWith('temp-')) {
          return [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              role: 'assistant' as const,
              content: llm.response,
            },
          ];
        }
        return prev;
      });
    }
  }, [llm.response, llm.isGenerating]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || llm.isGenerating || !systemPrompt) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
    };

    setInputText('');

    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];
      
      // Build chat history for LLM with product-specific system prompt
      const chatHistory: Message[] = [
        { role: 'system', content: systemPrompt },
        ...updatedMessages
          .filter((msg) => !msg.id.startsWith('temp-'))
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
      ];

      // Add temporary assistant message
      const messagesWithTemp = [
        ...updatedMessages,
        {
          id: `temp-${Date.now()}`,
          role: 'assistant' as const,
          content: '',
        },
      ];

      // Generate response asynchronously
      llm.generate(chatHistory).catch((error) => {
        console.error('Error generating response:', error);
        setMessages((prevMsgs) => {
          const lastMsg = prevMsgs[prevMsgs.length - 1];
          if (lastMsg?.id.startsWith('temp-')) {
            return [
              ...prevMsgs.slice(0, -1),
              {
                ...lastMsg,
                id: `msg-${Date.now()}`,
                content: 'Sorry, I encountered an error. Please try again.',
              },
            ];
          }
          return prevMsgs;
        });
      });

      return messagesWithTemp;
    });
  }, [inputText, llm, systemPrompt]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
          ]}>
          <ThemedView
            style={[
              styles.messageBubble,
              isUser
                ? { backgroundColor: colors.tint }
                : { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
            ]}>
            <ThemedText
              style={[
                styles.messageText,
                isUser && { color: '#fff' },
              ]}>
              {item.content || '...'}
            </ThemedText>
          </ThemedView>
        </View>
      );
    },
    [colors.tint, colorScheme]
  );

  if (isLoadingProduct) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading product information...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <View
            style={[
              styles.inputContainer,
              { borderTopColor: colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0' },
            ]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                  color: colors.text,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about this product..."
              placeholderTextColor={colors.icon}
              multiline
              maxLength={500}
              editable={!llm.isGenerating && !isLoadingProduct}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && !llm.isGenerating && !isLoadingProduct ? colors.tint : colors.icon,
                },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || llm.isGenerating || isLoadingProduct || !systemPrompt}>
              {llm.isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.sendButtonText}>Send</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    width: 60,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
