import { addDoc, getDoc } from 'firebase/firestore';
import { SocialPost, Transaction, Photo, User } from '../models/types';
import {
    addDocument,
    setDocument,
    updateDocument,
    deleteDocument,
    queryDocuments,
    getDocument,
    listenDocument,
    getCollection
} from './firestoreservices';
import { getPhotoById } from './photoServices';
import { getTransactionById } from './transactionServices';
import { getUserById } from './userServices';
import { getCommentById } from './commentServices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'SocialPost';
//lấy trường trong social post
export const getSocialField = async <K extends keyof SocialPost>(
    accountId: string,
    field: K
  ): Promise<SocialPost[K] | null> => {
    try {
      const COLLECTION_NAME = 'Account';
      const account = await getDocument<SocialPost>(COLLECTION_NAME, accountId);
      if (!account) {
        return null;
      }
      return account[field];
    } catch (error) {
      console.error(`Lỗi khi lấy trường ${String(field)} từ post ${accountId}:`, error);
      throw error;
    }
  };
//thêm post
export const addSocialPost = async ( postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>) =>
{
    return await addDocument(COLLECTION_NAME, postData);
}
//lấy post bằng Id
export const getPostBySocialPostId = async ( postID: string) =>
{
    return await getDocument(COLLECTION_NAME,postID) as SocialPost;
}
//lấy post bằng Id hình
export const getPostByPhotoId = async (photoId: string)  =>
{
    return await queryDocuments(COLLECTION_NAME,[{
        field: 'photoId', operator: 'array-contains', value:photoId
    }]);
}
//lấy post bằng ID giao dịch
export const getPostBytransactionId = async (transactionId: string)  =>
    {
        return await queryDocuments(COLLECTION_NAME,[{
            field: 'transactionId', operator: 'array-contains', value:transactionId
        }]);
    }
    //lấy post bằng ID giao dịch
export const getPostByFamilyId = async (familyId: string): Promise<SocialPost[]>  =>
    {
        return await queryDocuments(COLLECTION_NAME,[{
            field: 'familyId', operator: '==', value:familyId
        }]);
    }
//lấy post bằng id người comment
export const getPostByCommentId = async (commentId: string)  =>
    {
        return await queryDocuments(COLLECTION_NAME,[{
            field: 'commentsId', operator: 'array-contains', value:commentId
        }]);
    }
    export const getAllSocialPosts = async (): Promise<SocialPost[]> => {
  try {
    return await getCollection<SocialPost>(COLLECTION_NAME);
  } catch (error) {
    console.error('Lỗi khi lấy tất cả SocialPost:', error);
    throw error;
  }
};
//cập nhật bài đăng
export const updatePost = async (postId: string, postData: Partial<SocialPost>)
:Promise<void> =>{
    return await updateDocument(COLLECTION_NAME,postId, postData);
};
//xóa bài đăng
export const deletePost = async (postId: string)
:Promise<void> =>{
    return await deleteDocument(COLLECTION_NAME,postId);
};
//thêm một hình vào post
export const addPhotoToPost = async ( postId: string, photoId: string) =>
{
    const photo = await getPhotoById(photoId);
    const post = await getPostBySocialPostId(postId);
    if(photo && post)
    {
        await updateDocument(COLLECTION_NAME,postId,{
            photoId: [...post.photoId,photoId]
        })
    }
}
//xóa hình khỏi post
export const deletePhotoToPost = async ( postId: string, photoId: string) =>
    {
        const photo = await getPhotoById(photoId);
        const post = await getPostBySocialPostId(postId);
        if(photo && post)
        {
            await updateDocument(COLLECTION_NAME,postId,{
                photoId: post.photoId.filter(id => id != photoId)
            })
        }
    };
//thêm một giao dịch vào post
export const addTransactionToPost = async ( postId: string, transactionId: string) =>
    {
        const tran = await getTransactionById(transactionId);
        const post = await getPostBySocialPostId(postId);
        if(tran && post)
        {
            await updateDocument(COLLECTION_NAME,postId,{
                transactionId: [...post.transactionId,transactionId]
            })
        }
    }
//xóa giao dịch khỏi post
export const deleteTransactionToPost = async ( postId: string, transactionId: string) =>
    {
        const tran = await getTransactionById(transactionId);
        const post = await getPostBySocialPostId(postId);
        if(tran && post)
        {
            await updateDocument(COLLECTION_NAME,postId,{
                transactionId: post.transactionId.filter(id => id != transactionId)
            })
        }
    };
    //thêm một giao dịch vào post
export const likePost = async ( postId: string, userId: string): Promise<string> =>
    {
        const user = await getUserById(userId);
        const post = await getPostBySocialPostId(postId);
        if(user && post)
        {
            await updateDocument(COLLECTION_NAME,postId,{
                likes: [...post.likes,userId],
                numlike: post.numlike +1
            })
            const name = user?.name;
            return name + " đã thích hình ";
        }
        return "Có lỗi gì đó ";
    }
//bỏ lượt thích
export const unlikePost = async (postId: string, userId: string) =>
{
    const user = await getUserById(userId);
    const post = await getPostBySocialPostId(postId);
        if(user && post)
        {
            await updateDocument(COLLECTION_NAME,postId,{
                likes: post.likes.filter(id => id != userId),
                numlike: post.numlike -1
            })
        }
}
//thêm bình luận
export const commentPost = async ( postId: string, commentId: string) : Promise<string>=>
    {
        const com = await getCommentById(commentId);
        const post = await getPostBySocialPostId(postId);
        if(com && post)
        {
            await updateDocument(COLLECTION_NAME,postId,{
                commentId: [...post.commentsId,commentId],
                numcom: post.numcom +1
            });
            const user = await getUserById(com?.userId)
            const name = user?.name;
            return name + " đã thích hình ";
        }
        return "Có lỗi gì đó ";
    }
//xóa comment
export const deleteCommentPost = async (postId: string, commentId: string) =>
{
    const com= await getCommentById(commentId);
    const post = await getPostBySocialPostId(postId);
        if(com && post)
        {
            await updateDocument(COLLECTION_NAME,postId,{
                commentId: post.commentsId.filter(id => id != commentId),
                numcom: post.numcom -1
            })
        }
}
//lắng nghe thay đổi
export const listenToFamily = async(userId: string,callback: (user: SocialPost | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService();
  return realtimeService.listenToDocument<SocialPost>(COLLECTION_NAME, userId, callback);
}