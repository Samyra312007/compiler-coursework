import { RuntimeValue, RuntimeType, JSValue } from './types.js';

export class JSRegExp {
  private pattern: RegExp;
  private regexFlags: string;
  private lastIndex: number = 0;
  
  constructor(pattern: string, flags?: string) {
    this.regexFlags = flags || '';
    this.pattern = new RegExp(pattern, this.regexFlags);
  }
  
  test(str: string): boolean {
    if (this.global) {
      this.pattern.lastIndex = this.lastIndex;
    }
    const result = this.pattern.test(str);
    if (this.global) {
      this.lastIndex = this.pattern.lastIndex;
    }
    return result;
  }
  
  exec(str: string): RegExpExecArray | null {
    if (this.global) {
      this.pattern.lastIndex = this.lastIndex;
    }
    const result = this.pattern.exec(str);
    if (this.global && result) {
      this.lastIndex = this.pattern.lastIndex;
    }
    return result;
  }
  
  get source(): string {
    return this.pattern.source;
  }
  
  get flags(): string {
    return this.regexFlags;
  }
  
  get global(): boolean {
    return this.regexFlags.includes('g');
  }
  
  get ignoreCase(): boolean {
    return this.regexFlags.includes('i');
  }
  
  get multiline(): boolean {
    return this.regexFlags.includes('m');
  }
  
  get dotAll(): boolean {
    return this.regexFlags.includes('s');
  }
  
  get unicode(): boolean {
    return this.regexFlags.includes('u');
  }
  
  get sticky(): boolean {
    return this.regexFlags.includes('y');
  }
  
  reset(): void {
    this.lastIndex = 0;
    this.pattern.lastIndex = 0;
  }
}

export class RegexStringMethods {
  static match(str: string, regex: JSRegExp): RegExpMatchArray | null {
    if (regex.global) {
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(str)) !== null) {
        matches.push(match[0]);
      }
      return matches.length > 0 ? matches as any : null;
    }
    return str.match(regex['pattern']);
  }
  
  static replace(str: string, regex: JSRegExp, replacement: string): string {
    return str.replace(regex['pattern'], replacement);
  }
  
  static replaceAll(str: string, regex: JSRegExp, replacement: string): string {
    if (!regex.global) {
      throw new TypeError('replaceAll must be called with a global RegExp');
    }
    return str.replace(regex['pattern'], replacement);
  }
  
  static search(str: string, regex: JSRegExp): number {
    return str.search(regex['pattern']);
  }
  
  static split(str: string, regex: JSRegExp, limit?: number): string[] {
    return str.split(regex['pattern'], limit);
  }
}