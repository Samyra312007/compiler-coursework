import { JSFunction } from './functions.js';

export enum RuntimeType {
  Undefined = 'Undefined',
  Null = 'Null',
  Boolean = 'Boolean',
  Number = 'Number',
  String = 'String',
  Object = 'Object',
  Array = 'Array',
  Function = 'Function',
  RegExp = 'RegExp',
  Map = 'Map',
  Set = 'Set',
  WeakMap = 'WeakMap',
  WeakSet = 'WeakSet'
}

export interface RuntimeValue {
  type: RuntimeType;
  value: any;
}

export class JSValue implements RuntimeValue {
  type: RuntimeType;
  value: any;
  
  constructor(type: RuntimeType, value: any) {
    this.type = type;
    this.value = value;
  }
  
  toString(): string {
    return String(this.value);
  }
  
  toNumber(): number {
    return Number(this.value);
  }
  
  toBoolean(): boolean {
    return Boolean(this.value);
  }
}