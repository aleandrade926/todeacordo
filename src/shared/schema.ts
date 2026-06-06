export type User = {
  id: number;
  email: string;
  username: string;
};
export type InsertUser = Omit<User, "id">;
