export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
