import { RuntimeValue, RuntimeType, JSValue } from './types.js';
import { TypeConverter } from './conversions.js';

export class ExecutionContext {
  private variables: Map<string, RuntimeValue> = new Map();
  private parent: ExecutionContext | null;
  
  constructor(parent: ExecutionContext | null = null) {
    this.parent = parent;
  }
  
  set(name: string, value: RuntimeValue): void {
    if (this.variables.has(name)) {
      this.variables.set(name, value);
    } else if (this.parent && this.parent.has(name)) {
      this.parent.set(name, value);
    } else {
      this.variables.set(name, value);
    }
  }
  
  get(name: string): RuntimeValue {
    if (this.variables.has(name)) {
      return this.variables.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return new JSValue(RuntimeType.Undefined, undefined);
  }
  
  has(name: string): boolean {
    return this.variables.has(name) || (this.parent?.has(name) ?? false);
  }
  
  declare(name: string, value: RuntimeValue): void {
    this.variables.set(name, value);
  }
  
  getParent(): ExecutionContext | null {
    return this.parent;
  }
}

export interface JSFunction {
  type: 'function' | 'arrow';
  name: string | null;
  params: string[];
  body: any;
  closure: ExecutionContext;
  isNative: boolean;
  nativeFn?: (...args: any[]) => any;
}

export class FunctionCall {
  static createFunction(
    name: string | null,
    params: string[],
    body: any,
    closure: ExecutionContext
  ): JSFunction {
    return {
      type: 'function',
      name,
      params,
      body,
      closure,
      isNative: false
    };
  }
  
  static createArrowFunction(
    params: string[],
    body: any,
    closure: ExecutionContext
  ): JSFunction {
    return {
      type: 'arrow',
      name: null,
      params,
      body,
      closure,
      isNative: false
    };
  }
  
  static createNativeFunction(fn: (...args: any[]) => any): JSFunction {
    return {
      type: 'function',
      name: null,
      params: [],
      body: null,
      closure: null as any,
      isNative: true,
      nativeFn: fn
    };
  }
  
  static call(
    fn: JSFunction,
    args: RuntimeValue[],
    thisContext: RuntimeValue,
    currentContext: ExecutionContext
  ): RuntimeValue {
    if (fn.isNative) {
      const nativeResult = fn.nativeFn!(
        ...args.map(arg => arg.value)
      );
      return TypeConverter.toValue(nativeResult);
    }
    
    const context = new ExecutionContext(fn.closure);
    
    // Bind parameters
    for (let i = 0; i < fn.params.length; i++) {
      const value = i < args.length ? args[i] : new JSValue(RuntimeType.Undefined, undefined);
      context.declare(fn.params[i], value);
    }
    
    // For arrow functions, `this` is lexically captured from closure
    if (fn.type === 'arrow') {
      context.declare('this', thisContext);
    } else {
      // For regular functions, `this` is bound at call time
      context.declare('this', thisContext);
    }
    
    // Execute function body
    // This would call your evaluate function
    // For now, return undefined
    return new JSValue(RuntimeType.Undefined, undefined);
  }
}