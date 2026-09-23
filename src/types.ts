export type Role = "artist" | "buyer";
export type Screen = "intro" | "register" | "setup" | "artist" | "buyer";

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
};

export type Upload = {
  id: number;
  title: string;
  image: string;
};
