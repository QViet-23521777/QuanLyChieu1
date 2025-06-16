import { Timestamp } from 'firebase/firestore';

export interface User{
    id: string;
    name: string;
    email: string;
    familyId: string | null;
    password: string;
    role: 'admin' | 'member';
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    phone: string;
}

export interface Family{
    Id: string;
    name: string;
    adminId: string;
    membersId: string[];
    address: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface Account{
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'credit' | 'saving' | 'others';
    balance: number;
    initialBalance: number;
    currency: string;
    userId: string;
    familyId: string;
    isActive: boolean;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface Category{
    id: string;
    name: string | null;
    type: 'income' | 'expense' | null;
    familyId: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface Transaction{
    id: string;
    type: 'income' | 'expense';
    amount: number;
    decription: string | '';
    categoryId: string;
    accountId: string;
    date: Timestamp;
    userId: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
} 

export interface Album{
    Id: string;
    name: string;
    description: string;
    familyId: string;
    picturesId: string[];
    createdBy: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface Photo {
    Id: string;
    albumId: string;
    url: string;
    caption: string;
    createdBy: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    likes: string[];
    comments: string[];
    numlike: number;
    numcom: number;
}

export interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    socialPostId: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface ChatRoom{
    id: string;
    name? : string;
    isGroup: boolean;
    members: string[];
    messageId: string[];
    createdBy: string; 
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface Message {
    id: string;
    text: string;
    imageUrl?: string | null;
    senderId: string;
    senderName: string;
    recipient: string;
    chatroomId: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

export interface SocialPost {
    id: string;
    type: 'photo' | 'expense' | 'achievement'| '';
    content: string;
    photoId: string[];
    transactionId: string[];
    createdBy: string;
    createdByName: string;
    familyId: string;
    isPublic: boolean;
    createdAt: Timestamp | Date;
    likes: string[];
    commentsId: string[];
    numlike: number;
    numcom: number;
    updatedAt: Timestamp | Date;
}

export interface Review {
    Id: string;
    rating: number;
    comment: string;
    userId: string;
    userName: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    ispublic: boolean;
}