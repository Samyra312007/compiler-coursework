export enum SymbolKind {
  Variable = 'Variable',
  Function = 'Function',
  Parameter = 'Parameter',
  Builtin = 'Builtin'
}

export enum DataType {
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Null = 'Null',
  Any = 'Any',
  Void = 'Void'
}

export interface Symbol {
  name: string;
  kind: SymbolKind;
  type: DataType;
  scope: Scope;
  declaredAt: number;
  isInitialized: boolean;
  isUsed: boolean;
}

export class Scope {
  private symbols: Map<string, Symbol> = new Map();
  
  constructor(
    public readonly parent: Scope | null,
    public readonly level: number
  ) {}

  public declare(symbol: Omit<Symbol, 'scope'>): Symbol {
    if (this.symbols.has(symbol.name)) {
      throw new Error(`Duplicate declaration: ${symbol.name}`);
    }
    
    const fullSymbol: Symbol = {
      ...symbol,
      scope: this
    };
    
    this.symbols.set(symbol.name, fullSymbol);
    return fullSymbol;
  }

  public lookup(name: string): Symbol | undefined {
    const local = this.symbols.get(name);
    if (local) return local;
    if (this.parent) return this.parent.lookup(name);
    return undefined;
  }

  public lookupCurrent(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }
}

export class SymbolTable {
  private scopes: Scope[] = [];
  private currentScope: Scope;
  
  constructor() {
    const global = new Scope(null, 0);
    this.scopes.push(global);
    this.currentScope = global;
    
    this.declareBuiltins();
  }

  private declareBuiltins(): void {
    this.currentScope.declare({
      name: 'print',
      kind: SymbolKind.Builtin,
      type: DataType.Void,
      declaredAt: 0,
      isInitialized: true,
      isUsed: false
    });
    
    this.currentScope.declare({
      name: 'read',
      kind: SymbolKind.Builtin,
      type: DataType.Number,
      declaredAt: 0,
      isInitialized: true,
      isUsed: false
    });
  }

  public enterScope(): void {
    const newScope = new Scope(this.currentScope, this.currentScope.level + 1);
    this.scopes.push(newScope);
    this.currentScope = newScope;
  }

  public exitScope(): void {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    } else {
      throw new Error('Cannot exit global scope');
    }
  }

  public declare(symbol: Omit<Symbol, 'scope'>): Symbol {
    return this.currentScope.declare(symbol);
  }

  public lookup(name: string): Symbol | undefined {
    return this.currentScope.lookup(name);
  }

  public lookupCurrent(name: string): Symbol | undefined {
    return this.currentScope.lookupCurrent(name);
  }

  public markUsed(name: string): void {
    const symbol = this.lookup(name);
    if (symbol) {
      symbol.isUsed = true;
    }
  }

  public markInitialized(name: string): void {
    const symbol = this.lookup(name);
    if (symbol) {
      symbol.isInitialized = true;
    }
  }
}