export class JSMap {
  private map: Map<any, any> = new Map();
  private _size: number = 0;
  
  get size(): number {
    return this.map.size;
  }
  
  set(key: any, value: any): this {
    this.map.set(key, value);
    return this;
  }
  
  get(key: any): any {
    return this.map.get(key);
  }
  
  has(key: any): boolean {
    return this.map.has(key);
  }
  
  delete(key: any): boolean {
    return this.map.delete(key);
  }
  
  clear(): void {
    this.map.clear();
  }
  
  forEach(callback: (value: any, key: any, map: JSMap) => void): void {
    this.map.forEach((value, key) => {
      callback(value, key, this);
    });
  }
  
  keys(): Iterator<any> {
    return this.map.keys();
  }
  
  values(): Iterator<any> {
    return this.map.values();
  }
  
  entries(): Iterator<[any, any]> {
    return this.map.entries();
  }
  
  [Symbol.iterator](): Iterator<[any, any]> {
    return this.map.entries();
  }
}

export class JSSet {
  private set: Set<any> = new Set();
  
  get size(): number {
    return this.set.size;
  }
  
  add(value: any): this {
    this.set.add(value);
    return this;
  }
  
  has(value: any): boolean {
    return this.set.has(value);
  }
  
  delete(value: any): boolean {
    return this.set.delete(value);
  }
  
  clear(): void {
    this.set.clear();
  }
  
  forEach(callback: (value: any, key: any, set: JSSet) => void): void {
    this.set.forEach((value) => {
      callback(value, value, this);
    });
  }
  
  keys(): Iterator<any> {
    return this.set.keys();
  }
  
  values(): Iterator<any> {
    return this.set.values();
  }
  
  entries(): Iterator<[any, any]> {
    return this.set.entries();
  }
  
  [Symbol.iterator](): Iterator<any> {
    return this.set.values();
  }
}

export class JSWeakMap {
  private map: WeakMap<object, any> = new WeakMap();
  
  set(key: object, value: any): this {
    this.map.set(key, value);
    return this;
  }
  
  get(key: object): any {
    return this.map.get(key);
  }
  
  has(key: object): boolean {
    return this.map.has(key);
  }
  
  delete(key: object): boolean {
    return this.map.delete(key);
  }
}

export class JSWeakSet {
  private set: WeakSet<object> = new WeakSet();
  
  add(value: object): this {
    this.set.add(value);
    return this;
  }
  
  has(value: object): boolean {
    return this.set.has(value);
  }
  
  delete(value: object): boolean {
    return this.set.delete(value);
  }
}