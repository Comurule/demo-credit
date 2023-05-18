export interface TUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  updated_at?: Date;
  created_at?: Date;
}

export type SignupDTO = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  updated_at?: Date;
  created_at?: Date;
};

export type LoginDTO = {
  email: string;
  password: string;
};
