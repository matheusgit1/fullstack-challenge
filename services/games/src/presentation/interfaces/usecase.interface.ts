export const USECASE_ABSTRACT = Symbol("RecargaGateway");

export interface HandlerUsecase {
  handler(...args: any[]): Promise<any>;
}
