import CryptoJS from 'crypto-js';

export const calculateHash = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

export const createVoteHash = (userId: string, artistId: string, timestamp: number, previousHash: string): string => {
  const data = `${userId}-${artistId}-${timestamp}-${previousHash}`;
  return calculateHash(data);
};
