export interface UserName {
  firstname: string;
  lastname: string;
}

export interface User {
  _id?: string;
  username: string;
  name: UserName;
  email: string;
  password?: string;
}
