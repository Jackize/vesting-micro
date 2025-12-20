export interface ResponseSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ResponseError {
  success: false;
  error: string;
  message?: string;
}
