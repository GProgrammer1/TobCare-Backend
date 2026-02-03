export type ApiResponseError = {
  fields?: Record<string, string[]>;
  code: string;
  message: string;
};

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      error?: never;
      meta?: Record<string, unknown>;
    }
  | {
      success: false;
      data?: never;
      error: ApiResponseError;
      meta?: Record<string, unknown>;
    };

export type AuthResponse = {
  userId: string;
  role: string;
  accessToken: string;
};
