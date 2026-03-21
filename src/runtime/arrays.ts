import { RuntimeValue, RuntimeType, JSValue } from './types.js';
import { TypeConverter } from './conversions.js';

export class JSArray {
  private elements: any[];
  private length: number;
  private gcId?: number;
  
  constructor(...elements: any[]) {
    this.elements = [...elements];
    this.length = this.elements.length;
  }
  
  // Core array methods
  push(...items: any[]): number {
    for (const item of items) {
      this.elements[this.length++] = item;
    }
    return this.length;
  }
  
  pop(): any {
    if (this.length === 0) return undefined;
    this.length--;
    const value = this.elements[this.length];
    delete this.elements[this.length];
    return value;
  }
  
  shift(): any {
    if (this.length === 0) return undefined;
    const first = this.elements[0];
    for (let i = 0; i < this.length - 1; i++) {
      this.elements[i] = this.elements[i + 1];
    }
    this.length--;
    delete this.elements[this.length];
    return first;
  }
  
  unshift(...items: any[]): number {
    const newLength = this.length + items.length;
    for (let i = this.length - 1; i >= 0; i--) {
      this.elements[i + items.length] = this.elements[i];
    }
    for (let i = 0; i < items.length; i++) {
      this.elements[i] = items[i];
    }
    this.length = newLength;
    return this.length;
  }
  
  concat(...arrays: any[]): JSArray {
    const result = new JSArray(...this.elements);
    for (const arr of arrays) {
      if (arr instanceof JSArray) {
        for (let i = 0; i < arr.length; i++) {
          result.push(arr.get(i));
        }
      } else {
        result.push(arr);
      }
    }
    return result;
  }
  
  slice(start?: number, end?: number): JSArray {
    const startIdx = start ?? 0;
    const endIdx = end ?? this.length;
    const result = new JSArray();
    
    for (let i = startIdx; i < endIdx && i < this.length; i++) {
      result.push(this.elements[i]);
    }
    return result;
  }
  
  splice(start: number, deleteCount?: number, ...items: any[]): JSArray {
    const removed = new JSArray();
    const actualStart = start < 0 ? Math.max(0, this.length + start) : start;
    const actualDeleteCount = deleteCount ?? this.length - actualStart;
    
    for (let i = 0; i < actualDeleteCount; i++) {
      if (actualStart + i < this.length) {
        removed.push(this.elements[actualStart + i]);
      }
    }
    
    const newElements = [
      ...this.elements.slice(0, actualStart),
      ...items,
      ...this.elements.slice(actualStart + actualDeleteCount)
    ];
    
    this.elements = newElements;
    this.length = this.elements.length;
    
    return removed;
  }
  
  // Iteration methods
  forEach(callback: (value: any, index: number, array: JSArray) => void): void {
    for (let i = 0; i < this.length; i++) {
      callback(this.elements[i], i, this);
    }
  }
  
  map(callback: (value: any, index: number, array: JSArray) => any): JSArray {
    const result = new JSArray();
    for (let i = 0; i < this.length; i++) {
      result.push(callback(this.elements[i], i, this));
    }
    return result;
  }
  
  filter(callback: (value: any, index: number, array: JSArray) => boolean): JSArray {
    const result = new JSArray();
    for (let i = 0; i < this.length; i++) {
      if (callback(this.elements[i], i, this)) {
        result.push(this.elements[i]);
      }
    }
    return result;
  }
  
  reduce(callback: (accumulator: any, value: any, index: number, array: JSArray) => any, initialValue?: any): any {
    let accumulator = initialValue !== undefined ? initialValue : this.elements[0];
    let startIndex = initialValue !== undefined ? 0 : 1;
    
    for (let i = startIndex; i < this.length; i++) {
      accumulator = callback(accumulator, this.elements[i], i, this);
    }
    return accumulator;
  }
  
  reduceRight(callback: (accumulator: any, value: any, index: number, array: JSArray) => any, initialValue?: any): any {
    let accumulator = initialValue !== undefined ? initialValue : this.elements[this.length - 1];
    let startIndex = initialValue !== undefined ? this.length - 1 : this.length - 2;
    
    for (let i = startIndex; i >= 0; i--) {
      accumulator = callback(accumulator, this.elements[i], i, this);
    }
    return accumulator;
  }
  
  // Search methods
  find(callback: (value: any, index: number, array: JSArray) => boolean): any {
    for (let i = 0; i < this.length; i++) {
      if (callback(this.elements[i], i, this)) {
        return this.elements[i];
      }
    }
    return undefined;
  }
  
  findIndex(callback: (value: any, index: number, array: JSArray) => boolean): number {
    for (let i = 0; i < this.length; i++) {
      if (callback(this.elements[i], i, this)) {
        return i;
      }
    }
    return -1;
  }
  
  includes(value: any): boolean {
    for (let i = 0; i < this.length; i++) {
      if (TypeConverter.abstractEquals(
        TypeConverter.toValue(this.elements[i]),
        TypeConverter.toValue(value)
      )) {
        return true;
      }
    }
    return false;
  }
  
  indexOf(value: any): number {
    for (let i = 0; i < this.length; i++) {
      if (TypeConverter.abstractEquals(
        TypeConverter.toValue(this.elements[i]),
        TypeConverter.toValue(value)
      )) {
        return i;
      }
    }
    return -1;
  }
  
  lastIndexOf(value: any): number {
    for (let i = this.length - 1; i >= 0; i--) {
      if (TypeConverter.abstractEquals(
        TypeConverter.toValue(this.elements[i]),
        TypeConverter.toValue(value)
      )) {
        return i;
      }
    }
    return -1;
  }
  
  every(callback: (value: any, index: number, array: JSArray) => boolean): boolean {
    for (let i = 0; i < this.length; i++) {
      if (!callback(this.elements[i], i, this)) {
        return false;
      }
    }
    return true;
  }
  
  some(callback: (value: any, index: number, array: JSArray) => boolean): boolean {
    for (let i = 0; i < this.length; i++) {
      if (callback(this.elements[i], i, this)) {
        return true;
      }
    }
    return false;
  }
  
  // Transformation methods
  join(separator: string = ','): string {
    let result = '';
    for (let i = 0; i < this.length; i++) {
      if (i > 0) result += separator;
      result += String(this.elements[i]);
    }
    return result;
  }
  
  reverse(): JSArray {
    const reversed = new JSArray();
    for (let i = this.length - 1; i >= 0; i--) {
      reversed.push(this.elements[i]);
    }
    this.elements = reversed.elements;
    return this;
  }
  
  sort(compareFn?: (a: any, b: any) => number): JSArray {
    if (compareFn) {
      this.elements.sort(compareFn);
    } else {
      this.elements.sort((a, b) => {
        const strA = String(a);
        const strB = String(b);
        if (strA < strB) return -1;
        if (strA > strB) return 1;
        return 0;
      });
    }
    return this;
  }
  
  fill(value: any, start?: number, end?: number): JSArray {
    const startIdx = start ?? 0;
    const endIdx = end ?? this.length;
    for (let i = startIdx; i < endIdx && i < this.length; i++) {
      this.elements[i] = value;
    }
    return this;
  }
  
  flat(depth: number = 1): JSArray {
    const result = new JSArray();
    
    const flatten = (arr: any[], currentDepth: number) => {
      for (const item of arr) {
        if (Array.isArray(item) && currentDepth < depth) {
          flatten(item, currentDepth + 1);
        } else {
          result.push(item);
        }
      }
    };
    
    flatten(this.elements, 0);
    return result;
  }
  
  flatMap(callback: (value: any, index: number, array: JSArray) => any[]): JSArray {
    const mapped = this.map(callback);
    return mapped.flat();
  }
  
  // Utility methods
  get(index: number): any {
    return this.elements[index];
  }
  
  set(index: number, value: any): void {
    this.elements[index] = value;
    if (index >= this.length) {
      this.length = index + 1;
    }
  }
  
  getLength(): number {
    return this.length;
  }
  
  toArray(): any[] {
    return [...this.elements];
  }
  
  // Iterator support
  [Symbol.iterator](): Iterator<any> {
    let index = 0;
    return {
      next: (): IteratorResult<any> => {
        if (index < this.length) {
          return { value: this.elements[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}