import { Message } from '../models/types';
import {
    addDocument,
    deleteDocument,
    setDocument,
    updateDocument,
    queryDocuments,
    getDocument,
    listenDocument
} from './firestoreservices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'Message';
// Hàm lấy trường cho Message
export const getMessageField = async <K extends keyof Message>(
    messageId: string,
    field: K
  ): Promise<Message[K] | null> => {
    try {
      const COLLECTION_NAME = 'Message';
      const message = await getDocument<Message>(COLLECTION_NAME, messageId);
      if (!message) {
        return null;
      }
      return message[field];
    } catch (error) {
      console.error(`Lỗi khi lấy trường ${String(field)} từ tin nhắn ${messageId}:`, error);
      throw error;
    }
  };
//tạo tin nhắn, gửi tin nhắn
export const addMessage = async (messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>)
:Promise<string> =>
{
  return await addDocument(COLLECTION_NAME,messageData);
};  
//lấy tin nhắn bằng Id
export const getMessageById = async ( mesgaeID: string)
:Promise<Message | null> => {
  return await getDocument(COLLECTION_NAME,mesgaeID);
};
//lấy tin nhắn bàng Id người gửi
export const getMessageBySenderId = async (userID: string)
:Promise<Message[] | null> =>{
  return await queryDocuments<Message>(COLLECTION_NAME, [{
    field: 'senderId', operator: '==', value: userID
  }])
};
//lấy tin nhắn bàng tên người gửi
export const getMessageBySenderName = async (userName: string)
:Promise<Message[] | null> =>{
  return await queryDocuments<Message>(COLLECTION_NAME, [{
    field: 'senderName', operator: '==', value: userName
  }])
};
//lấy tin nhắn bàng Id chatroom
export const getMessageByChatRoom = async (ChatRoomID: string)
:Promise<Message[] | null> =>{
  return await queryDocuments<Message>(COLLECTION_NAME, [{
    field: 'chatroomId', operator: '==', value: ChatRoomID
  }])
};
//cập nhật thông tin message
export const updateMessage = async (messageId:string, messageData: Partial<Message>)
:Promise<void> =>{
  return await updateDocument(COLLECTION_NAME, messageId, messageData);
};
//xóa thông tin message
export const deleteMesage = async(messageId: string)
:Promise<void> =>{
  return await deleteDocument(COLLECTION_NAME, messageId);
};
//lắng nghe thay đổi
export const listenToFamily = async(userId: string,callback: (user: Message | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService()
  return realtimeService.listenToDocument<Message>(COLLECTION_NAME, userId, callback);
}