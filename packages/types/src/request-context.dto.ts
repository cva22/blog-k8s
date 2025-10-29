export class RequestContext {
  public requestID!: string;
  public url!: string;
  public ip!: string;
  public user?: {
    id: string;
  };
}
