export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          email: string | null;  // nullを許容
          wallet: {
            address: string | null;
            type: "NORMAL" | "EVO" | null;
          } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username?: string;
          email?: string;
          wallet?: {
            address?: string;
            type?: "NORMAL" | "EVO";
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          wallet?: {
            address?: string;
            type?: "NORMAL" | "EVO";
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      // 他のテーブル定義...
    };
  };
}

// ユーザープロファイルの型
export interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;  // nullを許容
  wallet: {
    address: string | null;
    type: "NORMAL" | "EVO" | null;
  } | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  wallet: {
    address: string;
    type: "NORMAL" | "EVO";
  };
  referrer: string | null;
  rank: UserRank;
  nfts: UserNFT[];
  totalInvestment: number;
  maxLineAmount: number;
  otherLinesAmount: number;
  createdAt: Date;
  updatedAt: Date;
  status: "ACTIVE" | "INACTIVE";
}

interface UserNFT {
  id: string;
  type: NFTType;
  purchaseDate: Date;
  amount: number;
  currentReturn: number;
  isSpecial: boolean;
  maxReturn: number;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
}

enum NFTType {
  SHOGUN_NFT_100 = "SHOGUN_NFT_100",
  SHOGUN_NFT_200 = "SHOGUN_NFT_200",
  SHOGUN_NFT_300 = "SHOGUN_NFT_300",
}

interface Task {
  id: string;
  question: string;
  options: string[];
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

interface TaskResponse {
  id: string;
  userId: string;
  taskId: string;
  answer: string;
  submittedAt: Date;
}

interface DailyRateSetting {
  id: string;
  date: Date;
  nftType: NFTType;
  rate: number;
  isHoliday: boolean;
  createdBy: string;
  createdAt: Date;
}

interface AirdropHistory {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  transactionHash?: string;
  createdAt: Date;
} 