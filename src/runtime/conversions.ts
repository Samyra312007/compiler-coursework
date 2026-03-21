import { RuntimeType, JSValue, RuntimeValue } from './types.js';

export class TypeConverter {
  static toPrimitive(input: RuntimeValue, preferredType?: string): RuntimeValue {
    if (input.type === RuntimeType.Object) {
      const obj = input.value;
      
      if (obj[Symbol.toPrimitive]) {
        const result = obj[Symbol.toPrimitive](preferredType || 'default');
        return this.toValue(result);
      }
      
      if (preferredType === 'string') {
        const toString = obj.toString();
        if (toString !== '[object Object]') {
          return new JSValue(RuntimeType.String, toString);
        }
        const valueOf = obj.valueOf();
        if (valueOf !== obj) {
          return this.toValue(valueOf);
        }
        return new JSValue(RuntimeType.String, toString);
      } else {
        const valueOf = obj.valueOf();
        if (valueOf !== obj) {
          return this.toValue(valueOf);
        }
        const toString = obj.toString();
        if (toString !== '[object Object]') {
          return new JSValue(RuntimeType.String, toString);
        }
        return new JSValue(RuntimeType.String, toString);
      }
    }
    return input;
  }
  
  static toValue(jsValue: any): RuntimeValue {
    if (jsValue === undefined) return new JSValue(RuntimeType.Undefined, undefined);
    if (jsValue === null) return new JSValue(RuntimeType.Null, null);
    if (typeof jsValue === 'boolean') return new JSValue(RuntimeType.Boolean, jsValue);
    if (typeof jsValue === 'number') return new JSValue(RuntimeType.Number, jsValue);
    if (typeof jsValue === 'string') return new JSValue(RuntimeType.String, jsValue);
    if (Array.isArray(jsValue)) return new JSValue(RuntimeType.Array, jsValue);
    if (jsValue instanceof RegExp) return new JSValue(RuntimeType.RegExp, jsValue);
    if (jsValue instanceof Map) return new JSValue(RuntimeType.Map, jsValue);
    if (jsValue instanceof Set) return new JSValue(RuntimeType.Set, jsValue);
    if (typeof jsValue === 'function') return new JSValue(RuntimeType.Function, jsValue);
    return new JSValue(RuntimeType.Object, jsValue);
  }
  
  static abstractEquals(a: RuntimeValue, b: RuntimeValue): boolean {
    if (a.type === b.type) {
      if (a.type === RuntimeType.Null || a.type === RuntimeType.Undefined) return true;
      if (a.type === RuntimeType.Number) {
        if (isNaN(a.value) || isNaN(b.value)) return false;
        return a.value === b.value;
      }
      if (a.type === RuntimeType.String) return a.value === b.value;
      if (a.type === RuntimeType.Boolean) return a.value === b.value;
      return a.value === b.value;
    }
    
    if (a.type === RuntimeType.Null && b.type === RuntimeType.Undefined) return true;
    if (a.type === RuntimeType.Undefined && b.type === RuntimeType.Null) return true;
    
    if (a.type === RuntimeType.Number && b.type === RuntimeType.String) {
      return a.value === Number(b.value);
    }
    if (a.type === RuntimeType.String && b.type === RuntimeType.Number) {
      return Number(a.value) === b.value;
    }
    
    if (a.type === RuntimeType.Boolean) {
      return this.abstractEquals(this.toNumber(a), b);
    }
    if (b.type === RuntimeType.Boolean) {
      return this.abstractEquals(a, this.toNumber(b));
    }
    
    if ((a.type === RuntimeType.String || a.type === RuntimeType.Number) && 
        b.type === RuntimeType.Object) {
      return this.abstractEquals(a, this.toPrimitive(b));
    }
    if (a.type === RuntimeType.Object && 
        (b.type === RuntimeType.String || b.type === RuntimeType.Number)) {
      return this.abstractEquals(this.toPrimitive(a), b);
    }
    
    return false;
  }
  
  static strictEquals(a: RuntimeValue, b: RuntimeValue): boolean {
    if (a.type !== b.type) return false;
    
    if (a.type === RuntimeType.Number) {
      if (isNaN(a.value) || isNaN(b.value)) return false;
      return a.value === b.value;
    }
    
    return a.value === b.value;
  }
  
  static toNumber(value: RuntimeValue): RuntimeValue {
    switch (value.type) {
      case RuntimeType.Undefined:
        return new JSValue(RuntimeType.Number, NaN);
      case RuntimeType.Null:
        return new JSValue(RuntimeType.Number, 0);
      case RuntimeType.Boolean:
        return new JSValue(RuntimeType.Number, value.value ? 1 : 0);
      case RuntimeType.Number:
        return value;
      case RuntimeType.String:
        const num = Number(value.value);
        return new JSValue(RuntimeType.Number, isNaN(num) ? NaN : num);
      case RuntimeType.Object:
        return this.toNumber(this.toPrimitive(value, 'number'));
      default:
        return new JSValue(RuntimeType.Number, NaN);
    }
  }
  
  static toString(value: RuntimeValue): RuntimeValue {
    switch (value.type) {
      case RuntimeType.Undefined:
        return new JSValue(RuntimeType.String, 'undefined');
      case RuntimeType.Null:
        return new JSValue(RuntimeType.String, 'null');
      case RuntimeType.Boolean:
        return new JSValue(RuntimeType.String, value.value ? 'true' : 'false');
      case RuntimeType.Number:
        return new JSValue(RuntimeType.String, String(value.value));
      case RuntimeType.String:
        return value;
      case RuntimeType.Object:
        return this.toString(this.toPrimitive(value, 'string'));
      default:
        return new JSValue(RuntimeType.String, String(value.value));
    }
  }
  
  static toBoolean(value: RuntimeValue): boolean {
    switch (value.type) {
      case RuntimeType.Undefined:
      case RuntimeType.Null:
        return false;
      case RuntimeType.Boolean:
        return value.value;
      case RuntimeType.Number:
        return value.value !== 0 && !isNaN(value.value);
      case RuntimeType.String:
        return (value.value as string).length > 0;
      case RuntimeType.Object:
        return true;
      default:
        return true;
    }
  }
  
  static toNumeric(value: RuntimeValue): number {
    const num = this.toNumber(value);
    return num.value;
  }
  
  static toStringForConcat(value: RuntimeValue): string {
    const str = this.toString(value);
    return str.value;
  }
  
  static binaryPlus(a: RuntimeValue, b: RuntimeValue): RuntimeValue {
    if (a.type === RuntimeType.String || b.type === RuntimeType.String) {
      return new JSValue(RuntimeType.String, 
        this.toStringForConcat(a) + this.toStringForConcat(b));
    }
    
    return new JSValue(RuntimeType.Number, 
      this.toNumeric(a) + this.toNumeric(b));
  }
}