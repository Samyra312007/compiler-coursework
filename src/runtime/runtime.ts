import { RuntimeValue, RuntimeType, JSValue } from './types.js';
import { TypeConverter } from './conversions.js';
import { JSArray } from './arrays.js';
import { JSRegExp } from './regexp.js';
import { ExecutionContext, FunctionCall, JSFunction } from './functions.js';
import { JSMap, JSSet, JSWeakMap, JSWeakSet } from './collections.js';
import { GarbageCollector } from './gc.js';

export class JavaScriptRuntime {
  private globalContext: ExecutionContext;
  private gc: GarbageCollector;
  
  constructor() {
    this.gc = new GarbageCollector();
    this.globalContext = new ExecutionContext(null);
    this.initializeGlobalObjects();
  }
  
  private initializeGlobalObjects(): void {
    const wrapNativeFunction = (fn: Function): RuntimeValue => {
      const jsFunction = FunctionCall.createNativeFunction(fn);
      return new JSValue(RuntimeType.Function, jsFunction);
    };
    
    this.globalContext.declare('print', 
      wrapNativeFunction((...args: any[]) => {
        console.log(...args);
      })
    );
    
    this.globalContext.declare('read', 
      wrapNativeFunction(() => {
        return 0; 
      })
    );
    
    this.globalContext.declare('Array', 
      wrapNativeFunction((...args: any[]) => {
        if (args.length === 1 && typeof args[0] === 'number') {
          const arr = new JSArray();
          for (let i = 0; i < args[0]; i++) {
            arr.set(i, undefined);
          }
          return arr;
        }
        return new JSArray(...args);
      })
    );
    
    this.globalContext.declare('RegExp', 
      wrapNativeFunction((pattern: string, flags?: string) => {
        return new JSRegExp(pattern, flags);
      })
    );
    
    this.globalContext.declare('Map', 
      wrapNativeFunction(() => new JSMap())
    );
    
    this.globalContext.declare('Set', 
      wrapNativeFunction(() => new JSSet())
    );
    
    this.globalContext.declare('WeakMap', 
      wrapNativeFunction(() => new JSWeakMap())
    );
    
    this.globalContext.declare('WeakSet', 
      wrapNativeFunction(() => new JSWeakSet())
    );
    
    this.globalContext.declare('Math', 
      new JSValue(RuntimeType.Object, {
        PI: Math.PI,
        E: Math.E,
        abs: (n: number) => Math.abs(n),
        ceil: (n: number) => Math.ceil(n),
        floor: (n: number) => Math.floor(n),
        round: (n: number) => Math.round(n),
        max: (...args: number[]) => Math.max(...args),
        min: (...args: number[]) => Math.min(...args),
        random: () => Math.random(),
        sqrt: (n: number) => Math.sqrt(n),
        pow: (base: number, exp: number) => Math.pow(base, exp)
      })
    );
    
    this.globalContext.declare('JSON', 
      new JSValue(RuntimeType.Object, {
        stringify: (obj: any) => JSON.stringify(obj),
        parse: (str: string) => JSON.parse(str)
      })
    );
    
    this.globalContext.declare('console', 
      new JSValue(RuntimeType.Object, {
        log: (...args: any[]) => console.log(...args),
        error: (...args: any[]) => console.error(...args),
        warn: (...args: any[]) => console.warn(...args)
      })
    );
  }
  
  convertToRuntimeValue(jsValue: any): RuntimeValue {
    return TypeConverter.toValue(jsValue);
  }
  
  convertFromRuntimeValue(value: RuntimeValue): any {
    return value.value;
  }
  
  performBinaryOperation(
    op: string,
    left: RuntimeValue,
    right: RuntimeValue
  ): RuntimeValue {
    switch (op) {
      case '+':
        return TypeConverter.binaryPlus(left, right);
      case '-':
        return new JSValue(RuntimeType.Number, 
          TypeConverter.toNumeric(left) - TypeConverter.toNumeric(right));
      case '*':
        return new JSValue(RuntimeType.Number, 
          TypeConverter.toNumeric(left) * TypeConverter.toNumeric(right));
      case '/':
        return new JSValue(RuntimeType.Number, 
          TypeConverter.toNumeric(left) / TypeConverter.toNumeric(right));
      case '%':
        return new JSValue(RuntimeType.Number, 
          TypeConverter.toNumeric(left) % TypeConverter.toNumeric(right));
      case '==':
        return new JSValue(RuntimeType.Boolean, 
          TypeConverter.abstractEquals(left, right));
      case '===':
        return new JSValue(RuntimeType.Boolean, 
          TypeConverter.strictEquals(left, right));
      case '!=':
        return new JSValue(RuntimeType.Boolean, 
          !TypeConverter.abstractEquals(left, right));
      case '!==':
        return new JSValue(RuntimeType.Boolean, 
          !TypeConverter.strictEquals(left, right));
      case '<':
        return new JSValue(RuntimeType.Boolean, 
          TypeConverter.toNumeric(left) < TypeConverter.toNumeric(right));
      case '>':
        return new JSValue(RuntimeType.Boolean, 
          TypeConverter.toNumeric(left) > TypeConverter.toNumeric(right));
      case '<=':
        return new JSValue(RuntimeType.Boolean, 
          TypeConverter.toNumeric(left) <= TypeConverter.toNumeric(right));
      case '>=':
        return new JSValue(RuntimeType.Boolean, 
          TypeConverter.toNumeric(left) >= TypeConverter.toNumeric(right));
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }
  
  getGlobalContext(): ExecutionContext {
    return this.globalContext;
  }
  
  collectGarbage(): void {
    this.gc.collect();
  }
  
  getGCStats(): any {
    return this.gc.getStats();
  }
}