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


export class HeadersHandlerMessageEvent {
  static eventName = 'header-handler-message'
  url?: string;
  headers: Headers;

  static makeEvent(args: HeadersHandlerMessageEvent) {
    return new CustomEvent<HeadersHandlerMessageEvent>(
      this.eventName,
      {detail: args}
    )
  }

  static subscribe(callback: (args: HeadersHandlerMessageEvent) => void) {
    addEventListener(this.eventName,
    (e: CustomEvent<HeadersHandlerMessageEvent>) => callback(e?.detail))
  }
}

export class RegisterHeadersHandlerEvent{
  urlPattern?: string;
  static eventName = 'register-header-handler'

  static makeEvent(args: RegisterHeadersHandlerEvent) {
    return new CustomEvent<RegisterHeadersHandlerEvent>(
      this.eventName,
      {detail: args}
    )
  }

  static subscribe<T>(callback: (args: RegisterHeadersHandlerEvent) => void) {
    addEventListener(this.eventName,
    (e: CustomEvent<RegisterHeadersHandlerEvent>) => callback(e?.detail))
  }
}
