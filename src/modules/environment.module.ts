export function env(): 'production' | 'development' {
  // Unit tests are unhappy with this type
  // @ts-ignore
  return process.env.NODE_ENV;
}

export function isDevelopment(): boolean {
  return env() === 'development';
}

export function origin({ divertToNullOrigin = true }: { divertToNullOrigin?: boolean } = {}) {
  if (isDevelopment()) {
    if (divertToNullOrigin) {
      // return '//localhost:0';
      return '//httpbin.org/status/200,200,200,200,500?path=';
    }
  }

  return window.location.origin;
}

export function googleMapsApiKey(): string {
  return '';
}
