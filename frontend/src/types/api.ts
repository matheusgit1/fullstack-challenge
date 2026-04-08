export type ApiSuccess<T> = {
  success: true;
  data: T;
  tracingId: string;
  timestamp: string;
};

export type ApiError = {
  success: false;
  error: {
    type: string;
    message: string;
    path: string;
    timestamp: string;
  };
  tracingId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
