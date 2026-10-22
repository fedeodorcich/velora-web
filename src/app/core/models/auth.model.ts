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

/** Datos editables del perfil (el correo no se puede cambiar todavía). */
export interface UpdateProfilePayload {
  name: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
