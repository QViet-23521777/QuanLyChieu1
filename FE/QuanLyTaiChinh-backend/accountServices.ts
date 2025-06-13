import { Account } from '../models/types';
import {
    addDocument,
    getCollection,
    updateDocument,
    deleteDocument,
    queryDocuments,
    listenDocument,
    getDocument, listenQuery
} from './firestoreservices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'Account';

// Hàm lấy trường cho Account
export const getAccountField = async <K extends keyof Account>(
    accountId: string,
    field: K
  ): Promise<Account[K] | null> => {
    try {
      const COLLECTION_NAME = 'Account';
      const account = await getDocument<Account>(COLLECTION_NAME, accountId);
      if (!account) {
        return null;
      }
      return account[field];
    } catch (error) {
      console.error(`Lỗi khi lấy trường ${String(field)} từ tài khoản ${accountId}:`, error);
      throw error;
    }
  };
//thêm tài khoản
export const addAccount = async(accountData: Omit<Account, 'id' | 'createdAt' |'updatedAt'>)
:Promise<string> =>{
    return await addDocument(COLLECTION_NAME,accountData);
}
//lấy tải khoản bằng id
export const getAccountById = async (accountId: string )
:Promise<Account | null> =>{
    return await getDocument<Account>(COLLECTION_NAME, accountId);
}
//lấy tài khoản bằng id người dùng
export const getAccountByUserId = async (userId: string):
Promise<Account[] | null> =>{
    return await queryDocuments<Account>(COLLECTION_NAME,[
        { field: 'userId', operator: '==', value: userId}
    ]);
};
//lấy tài khoản bằng id gia đình
export const getAccountByFamilyId = async (familyId: string):
Promise<Account[] | null> =>{
    return await queryDocuments<Account>(COLLECTION_NAME,[{
        field: 'familyId', operator: '==', value: familyId
    }])
};  

//cập nhật tài khoản
export const updateAccount = async(accountId: string, accountData: Partial<Account>)
:Promise<void> =>{
    return await updateDocument(COLLECTION_NAME,accountId,accountData);
};
//cập nhật số mới
export const updateAccountBalance = async( accountId: string, newBalance: number)
:Promise<void> =>{
    return await updateDocument(COLLECTION_NAME,accountId,{balance: newBalance});
}
//xóa tài khoản
export const deleteAccount = async ( accountId: string)
:Promise<void> =>{
    return await deleteDocument(COLLECTION_NAME,accountId);
};
//lắng nghe thay đổi
export const listenToAccount = async(userId: string,callback: (user: Account | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService();
  return realtimeService.listenToDocument<Account>(COLLECTION_NAME, userId, callback);
}
//lắng nghe thay đổi danh sách tài khoản cảu người dùng
export const listenToUserAccounts = (userId: string, callback: (accounts: Account[]) => void) => {
  const realtimeService = new RealtimeListenerService();
  
  const wrapperCallback = (data: any[]) => {
    callback(data as Account[]);
  };
  
  return realtimeService.listenToCollection<Account>(
    COLLECTION_NAME,
    [{
      field: 'userId', 
      operator: '==', 
      value: userId
    }], 
    wrapperCallback
  );
};