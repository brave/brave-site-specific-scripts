export class Headers {[name: string] : string}

export function makeEvent<T>(eventName: string, args: T) {
  return new CustomEvent<T>(
    eventName,
    {detail: args}
  )
}

export function subscribe<T>(eventName: string, callback: (args: T) => void) {
  addEventListener(eventName, (e: CustomEvent<T>) => callback(e?.detail))
}


export class RequestHandlerMessageEvent {
  static eventName = 'request-handler-message'
  url?: string;
  headers: Headers;

  static makeEvent(args: RequestHandlerMessageEvent) {
    return new CustomEvent<RequestHandlerMessageEvent>(
      this.eventName,
      {detail: args}
    )
  }

  static subscribe(callback: (args: RequestHandlerMessageEvent) => void) {
    addEventListener(this.eventName,
    (e: CustomEvent<RequestHandlerMessageEvent>) => callback(e?.detail))
  }
}

export class RegisterRequestHandlerEvent{
  urlPattern?: string;
  static eventName = 'register-request-handler'

  static makeEvent(args: RegisterRequestHandlerEvent) {
    return new CustomEvent<RegisterRequestHandlerEvent>(
      this.eventName,
      {detail: args}
    )
  }

  static subscribe<T>(callback: (args: RegisterRequestHandlerEvent) => void) {
    addEventListener(this.eventName,
    (e: CustomEvent<RegisterRequestHandlerEvent>) => callback(e?.detail))
  }
}
