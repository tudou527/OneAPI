export interface BaseResult<D> {
  success: boolean;
  errorCode: string;
  errorMsg: string;
  errorCtx: Map<string, string>;
  errorLevel: string;
  content: D;
}
