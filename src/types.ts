export type Role = "artist" | "buyer" | "admin";
export type Screen = "intro" | "login" | "register" | "setup" | "artist" | "buyer" | "admin";

export type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  emailVerified?: boolean;
  identityVerified?: boolean;
  age?: number | null;
  ethnicity?: string;
  city?: string;
  title?: string;
  bio?: string;
  talentId?: string | null;
};

export type Portrait = {
  id: string;
  name: string;
  type: string;
  image: string;
  followers: string;
  collaborations: number;
  tags: string[];
  age: number;
  price: string;
  proposedPrice?: number;
  agreedPrice?: number;
  processingFee?: number;
  verified?: boolean;
};

export type Upload = {
  id: number;
  title: string;
  image: string;
};
