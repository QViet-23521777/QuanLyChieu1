import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mainStyles from '@/src/styles/mainStyle';
import { ChatRoom } from '@/models/types';
import ChatRoomItem from '../Components/Chatroomitem';
import {
  getChatRoomByMemberId,
  deleteChatRoom,
} from '@/QuanLyTaiChinh-backend/chatroomServices';

const ChatRoomScreen: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadChatRooms();
      }
    }, [userId])
  );

  const loadUserInfo = async () => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      if (currentUserId) {
        setUserId(currentUserId);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    }
  };

  const loadChatRooms = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const rooms = await getChatRoomByMemberId(userId);
      setChatRooms(rooms || []);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChatRooms();
    setRefreshing(false);
  };

  const handleChatRoomPress = (chatRoom: ChatRoom) => {
    setSelectedRoomId(chatRoom.id);
    router.push({
      pathname: '/(chat)/chatscreen',
      params: {
        chatRoomId: chatRoom.id,
        chatRoom: JSON.stringify(chatRoom.name),
      },
    });
    console.log(chatRoom.name);
  };

  const handleDeleteChatRoom = async (chatRoomId: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa chat room này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChatRoom(chatRoomId);
            setChatRooms((prev) => prev.filter((room) => room.id !== chatRoomId));
            Alert.alert('Thành công', 'Đã xóa chat room');
          } catch (error) {
            console.error('Error deleting chat room:', error);
            Alert.alert('Lỗi', 'Không thể xóa chat room');
          }
        },
      },
    ]);
  };

  const handleCreateNewChatRoom = () => {
    Alert.alert('Thông báo', 'Chức năng tạo chat room mới đang được phát triển');
  };

  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => (
    <View style={styles.card}>
      <ChatRoomItem
        chatRoom={item}
        onPress={() => handleChatRoomPress(item)}
        onDelete={() => handleDeleteChatRoom(item.id)}
        isSelected={selectedRoomId === item.id}
      />
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có nhóm nào</Text>
      <Text style={styles.emptySubtitle}>Tạo nhóm mới để bắt đầu trò chuyện</Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateNewChatRoom}>
        <Text style={styles.createButtonText}>Tạo Nhóm</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[mainStyles.container, styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Danh sách nhóm chat</Text> */}
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateNewChatRoom}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Chat Rooms List */}
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
  },
  addButton: {
    padding: 4,
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ChatRoomScreen;