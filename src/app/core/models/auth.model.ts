import { User } from './user.model';

/** Respuesta devuelta por `/auth/register` y `/auth/login`. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
