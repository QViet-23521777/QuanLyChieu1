import { addDoc, updateDoc } from 'firebase/firestore';
import { ChatRoom, Message, User } from '../models/types';
import { getMessageById } from './messageServices';
import { getUserById } from './userServices';
import {
    addDocument,
    deleteDocument,
    updateDocument,
    queryDocuments,
    getDocument,
    setDocument,
    listenQuery,
    listenDocument
} from './firestoreservices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'ChatRoom';
const COLLECTION_NAME1 = 'Message';
// Hàm lấy trường cho ChatRoom
export const getChatRoomField = async <K extends keyof ChatRoom>(
    chatRoomId: string,
    field: K
  ): Promise<ChatRoom[K] | null> => {
    try {
      const COLLECTION_NAME = 'ChatRoom';
      const chatRoom = await getDocument<ChatRoom>(COLLECTION_NAME, chatRoomId);
      if (!chatRoom) {
        return null;
      }
      return chatRoom[field];
    } catch (error) {
      console.error(`Lỗi khi lấy trường ${String(field)} từ phòng chat ${chatRoomId}:`, error);
      throw error;
    }
};
//hàm thêm chatRoom
export const addChatRoom = async (chatroomData: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt'>)
:Promise<string> =>{
    return await addDocument(COLLECTION_NAME, chatroomData);
};
//lấy thông tin chatroom bằng Id
export const getChatRoomById = async (chatroomId: string)
:Promise<ChatRoom | null> =>{
    return await getDocument<ChatRoom>(COLLECTION_NAME,chatroomId);
};
//lấy thông tin chatroom bằng thành viên
export const getChatRoomByMemberId = async ( memberId: string)
:Promise<ChatRoom[] | null> =>{
    return await queryDocuments<ChatRoom>(COLLECTION_NAME, [{
        field: "members",
        operator: "array-contains",
        value: memberId
    }])
};
//lấy các Message
export const getMessage = async (chatroomId: string ): 
Promise<Message[]| null> =>{
  return await queryDocuments<Message>(COLLECTION_NAME1,[{
    field: 'chatroomId', operator: '==', value: chatroomId
  }],'createdAt', 'desc');
};
//cập nhật liên tục
export const listenToMessages = (chatRoomId: string, callback: (messages: Message[]) => void) => {
  return listenQuery<Message>(
    COLLECTION_NAME1,
    [{ field: 'chatroomId', operator: '==', value: chatRoomId }],
    callback,
  );
};
export const addMemberToChatRoom = async (chatroomId: string, userId: string): Promise<void> => {
  try {
    const chat = await getChatRoomById(chatroomId);
    if (!chat) {
      console.error(`ChatRoom với ID ${chatroomId} không tồn tại`);
      return;
    }
    
    if (!chat.members.includes(userId)) {
      const updateMembers = [...chat.members, userId];
      // SỬA: Dùng đúng field name "members" thay vì "messageId"
      await updateDocument(COLLECTION_NAME, chatroomId, { members: updateMembers });
      console.log(`Đã thêm user ${userId} vào chatroom ${chatroomId}`);
    } else {
      console.log(`User ${userId} đã là thành viên của chatroom ${chatroomId}`);
    }
  } catch (error) {
    console.error('Lỗi khi thêm thành viên vào chatroom:', error);
    throw error;
  }
};

export const removeMemberFromChatRoom = async (chatroomId: string, userId: string): Promise<void> => {
  try {
    const chat = await getChatRoomById(chatroomId);
    if (!chat) {
      console.error(`ChatRoom với ID ${chatroomId} không tồn tại`);
      return;
    }
    
    if (chat.members.includes(userId)) {
      const updateMembers = chat.members.filter(id => id !== userId);
      // SỬA: Dùng đúng field name "members" thay vì "membersId"
      await updateDocument(COLLECTION_NAME, chatroomId, { members: updateMembers });
      console.log(`Đã xóa user ${userId} khỏi chatroom ${chatroomId}`);
    } else {
      console.log(`User ${userId} không phải là thành viên của chatroom ${chatroomId}`);
    }
  } catch (error) {
    console.error('Lỗi khi xóa thành viên khỏi chatroom:', error);
    throw error;
  }
};
//thêm tin nhắn vào
export const addMessageToChatRoom = async ( chatroomId:string, mesageId: string): Promise<void> =>{
  const chat = await getChatRoomById(chatroomId);
  if(chat)
  { 
    if(!chat.messageId.includes(mesageId))
    {
      const updateMembers = [...chat.messageId, mesageId];
      await updateDocument(COLLECTION_NAME, chatroomId, {messageId:updateMembers});
    }
    else
    {
      return;
    }
  }
}
//lấy message
export const getAllMessage = async (chatroomId: string)
:Promise<string> => {
  const chatroom = await getChatRoomById(chatroomId);
  const messages: Message[] = [];
  if (!chatroom) {
    return "Không tìm thấy phòng chat";
  }
  for(const messId of chatroom?.messageId)
  {
    const message = await getMessageById(messId);
    if (message) {
      messages.push(message);
    }
  }
  messages.sort((a,b) =>{
    const timeA = a.createdAt instanceof Date ? a.createdAt.getTime(): a.createdAt.toDate().getTime();
    const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toDate().getTime();
    return timeA - timeB;
  });
  let resultString = "";
  messages.forEach((message, index) => {
    const time = message.createdAt instanceof Date ? message.createdAt.toLocaleString() 
    : message.createdAt.toDate().toLocaleString();
    resultString +=time + message.senderId + ':' + message.text;
    if (message.imageUrl) {
      resultString += ` (Có hình ảnh: ${message.imageUrl})`;
    }
    if (index < messages.length - 1) {
      resultString += "\n";
    }
  });
  return resultString;
};
// cập nhật thông tin chatroom
export const updateChatRoom = async ( chatroomId : string, chatroomData: Partial<ChatRoom>)
:Promise<void> =>{
    return await updateDocument(COLLECTION_NAME,chatroomId, chatroomData);
};
// xóa chatroom
export const deleteChatRoom = async ( chatroomId: string): 
Promise<void> => {
    return await deleteDocument(COLLECTION_NAME, chatroomId);
}
//lắng nghe chatroom
export const listenToFamily = async(userId: string,callback: (user: ChatRoom | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService();
  return realtimeService.listenToDocument<ChatRoom>(COLLECTION_NAME, userId, callback);
}
