// src/(chat)/chatscreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar, // Thêm StatusBar import
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import mainStyles from '@/src/styles/mainStyle';
import { Message, ChatRoom } from '@/models/types';
import {
  addMessage,
  getMessageByChatRoom,
} from '@/QuanLyTaiChinh-backend/messageServices';
import {
  listenToMessages,
  addMessageToChatRoom,
  getChatRoomById,
} from '@/QuanLyTaiChinh-backend/chatroomServices';
import { Timestamp } from 'firebase/firestore';

// TYPE DEFINITIONS
type RootStackParamList = {
  ChatScreen: { chatRoomId: string; chatRoom?: ChatRoom };
  ChatRoomScreen: undefined;
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = NavigationProp<RootStackParamList>;

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isCurrentUser }) => {
  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      {!isCurrentUser && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      <Text style={[
        styles.messageText,
        isCurrentUser ? styles.currentUserText : styles.otherUserText
      ]}>
        {message.text}
      </Text>
      <Text style={styles.messageTime}>
        {formatMessageTime(message.createdAt)}
      </Text>
    </View>
  );
};

const formatMessageTime = (timestamp: Timestamp | Date): string => {
  try {
    let date: Date;

    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '';
    }

    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
};

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize chat với error handling tốt hơn
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        
        // Kiểm tra params
        if (!route.params || !route.params.chatRoomId) {
          console.error('Missing required chatRoomId parameter');
          Alert.alert('Lỗi', 'Thiếu thông tin chat room', [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]);
          return;
        }

        const { chatRoomId: routeChatRoomId, chatRoom: routeChatRoom } = route.params;
        
        // Lấy user info
        const currentUserId = await AsyncStorage.getItem('userId');
        const currentUserName = await AsyncStorage.getItem('userName') || 'Unknown User';

        if (!currentUserId) {
          console.error('User not logged in');
          Alert.alert('Lỗi', 'Vui lòng đăng nhập lại', [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]);
          return;
        }

        console.log('Chat initialization:', {
          routeChatRoomId,
          currentUserId,
          currentUserName
        });

        // Set states
        setChatRoomId(routeChatRoomId);
        setUserId(currentUserId);
        setUserName(currentUserName);

        // Lấy thông tin chatroom
        let chatRoomToUse = routeChatRoom;
        if (routeChatRoomId) {
          try {
            const latestChatRoom = await getChatRoomById(routeChatRoomId);
            if (latestChatRoom) {
              chatRoomToUse = latestChatRoom;
            }
          } catch (error) {
            console.error('Error fetching chat room:', error);
            // Tiếp tục với routeChatRoom nếu có
          }
        }

        setCurrentChatRoom(chatRoomToUse || null);

        // Lưu vào AsyncStorage
        try {
          await AsyncStorage.setItem('currentChatRoomId', routeChatRoomId);
          if (chatRoomToUse) {
            await AsyncStorage.setItem('currentChatRoom', JSON.stringify(chatRoomToUse));
          }
        } catch (storageError) {
          console.error('Error saving to AsyncStorage:', storageError);
          // Không cần dừng app vì lỗi storage
        }

      } catch (error) {
        console.error('Error initializing chat:', error);
        Alert.alert('Lỗi', 'Không thể khởi tạo chat', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [route.params, navigation]);

  // Load messages và setup listener
  useEffect(() => {
    if (chatRoomId && userId) {
      loadMessages();
      setupRealtimeListener();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [chatRoomId, userId]);

  const loadMessages = async () => {
    if (!chatRoomId) return;

    try {
      console.log('Loading messages for chatRoom:', chatRoomId);
      
      const messageList = await getMessageByChatRoom(chatRoomId);
      console.log('Loaded messages:', messageList?.length || 0);
      
      if (!messageList || messageList.length === 0) {
        setMessages([]);
        return;
      }

      const sortedMessages = messageList.sort((a, b) => {
        const timeA = a.createdAt instanceof Timestamp
          ? a.createdAt.toDate().getTime()
          : a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : 0;

        const timeB = b.createdAt instanceof Timestamp
          ? b.createdAt.toDate().getTime()
          : b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : 0;

        return timeA - timeB;
      });

      setMessages(sortedMessages);

      // Auto scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 500);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Chỉ hiển thị alert nếu chưa có messages
      if (messages.length === 0) {
        Alert.alert('Lỗi', 'Không thể tải tin nhắn');
      }
    }
  };

  const setupRealtimeListener = () => {
    if (!chatRoomId) return;

    try {
      console.log('Setting up realtime listener for chatRoom:', chatRoomId);
      
      // Cleanup previous listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Setup new listener
      const unsubscribe = listenToMessages(chatRoomId, (newMessages: Message[]) => {
        console.log('Received realtime messages:', newMessages?.length || 0);
        
        if (newMessages && newMessages.length > 0) {
          const sortedMessages = newMessages.sort((a, b) => {
            const timeA = a.createdAt instanceof Timestamp
              ? a.createdAt.toDate().getTime()
              : a.createdAt instanceof Date
              ? a.createdAt.getTime()
              : 0;

            const timeB = b.createdAt instanceof Timestamp
              ? b.createdAt.toDate().getTime()
              : b.createdAt instanceof Date
              ? b.createdAt.getTime()
              : 0;

            return timeA - timeB;
          });

          setMessages(sortedMessages);
          
          // Auto scroll to bottom
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else {
          setMessages([]);
        }
      });

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error setting up realtime listener:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !chatRoomId || !userId || sending) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UX

    try {
      setSending(true);

      const messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
        text: messageText,
        senderId: userId,
        senderName: userName,
        recipient: '',
        chatroomId: chatRoomId,
      };

      console.log('Sending message:', messageData);

      // Add message to collection
      const newMessageId = await addMessage(messageData);
      console.log('Message added with ID:', newMessageId);

      // Add messageId to ChatRoom
      await addMessageToChatRoom(chatRoomId, newMessageId);
      console.log('Message ID added to ChatRoom');

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
      // Restore input text on error
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      try {
        flatListRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        console.error('Error scrolling to bottom:', error);
      }
    }
  };

  const handleGoBack = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    navigation.goBack();
  };

  const refreshMessages = async () => {
    if (refreshing || !chatRoomId) return;
    
    try {
      setRefreshing(true);
      await loadMessages();
    } catch (error) {
      console.error('Error refreshing messages:', error);
      Alert.alert('Lỗi', 'Không thể làm mới tin nhắn');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    
    switch (action) {
      case 'refresh':
        refreshMessages();
        break;
      case 'addMember':
        Alert.alert('Thông báo', 'Tính năng thêm thành viên đang được phát triển');
        break;
      case 'addFile':
        Alert.alert('Thông báo', 'Tính năng thêm file đang được phát triển');
        break;
      case 'info':
        const info = `Tên: ${currentChatRoom?.name || 'Không xác định'}\nLoại: ${currentChatRoom?.isGroup ? 'Nhóm chat' : 'Chat riêng tư'}\nSố tin nhắn: ${messages.length}`;
        Alert.alert('Thông tin nhóm', info);
        break;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageItem
      message={item}
      isCurrentUser={item.senderId === userId}
    />
  );

  if (loading) {
    return (
      <>
        {/* Thêm StatusBar configuration */}
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#4A90E2" 
          translucent={false}
          hidden={false}
        />
        
        <SafeAreaView style={[mainStyles.container, styles.container]} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      {/* Force StatusBar configuration */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#4A90E2" 
        translucent={false}
        hidden={true}
      />
      
      <SafeAreaView style={[mainStyles.container, styles.container]} edges={['top', 'bottom']}>
        {/* Header - Đã bỏ paddingTop */}
        {/* <View style={styles.header}> */}
          {/* <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity> */}
          
          {/* <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentChatRoom?.name || 'Chat'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {messages.length} tin nhắn
            </Text>
          </View> */}
          
          {/* <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setShowMenu(!showMenu)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            </TouchableOpacity>
            
            {showMenu && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleMenuAction('refresh')}
                >
                  <Ionicons name="refresh" size={18} color="#333" />
                  <Text style={styles.menuItemText}>Làm mới</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleMenuAction('addMember')}
                >
                  <Ionicons name="person-add" size={18} color="#333" />
                  <Text style={styles.menuItemText}>Thêm thành viên</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleMenuAction('addFile')}
                >
                  <Ionicons name="attach" size={18} color="#333" />
                  <Text style={styles.menuItemText}>Thêm file</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.menuItem, styles.lastMenuItem]} 
                  onPress={() => handleMenuAction('info')}
                >
                  <Ionicons name="information-circle" size={18} color="#333" />
                  <Text style={styles.menuItemText}>Thông tin</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Overlay */}
        {/*showMenu && (
          <TouchableOpacity 
            style={styles.overlay} 
            onPress={() => setShowMenu(false)}
            activeOpacity={1}
          />
        )} */}

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
                <Text style={styles.emptySubtext}>Hãy bắt đầu cuộc trò chuyện!</Text>
              </View>
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? "#fff" : "#ccc"}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Đã bỏ paddingTop: 50 - SafeAreaView sẽ xử lý việc này
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E8F2FF',
    marginTop: 2,
  },
  menuContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#4A90E2',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatScreen;