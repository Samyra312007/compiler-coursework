import { ASTNode, Program, Statement, Expression, BlockStatement } from '../ast/ast-types.js';
import { SymbolTable, SymbolKind, DataType } from './symbol-table.js';

export class TypeChecker {
  private symbolTable: SymbolTable;
  private errors: Array<{ message: string; line: number }> = [];
  private currentFunction: string | null = null;

  constructor() {
    this.symbolTable = new SymbolTable();
  }

  public check(ast: Program): boolean {
    this.errors = [];
    try {
      this.visitProgram(ast);
    } catch (error) {
      if (error instanceof Error) {
        this.errors.push({ message: error.message, line: 0 });
      }
    }
    
    return this.errors.length === 0;
  }

  private visitProgram(node: Program): void {
    for (const stmt of node.body) {
      this.visitStatement(stmt);
    }
  }

  private visitStatement(node: Statement): void {
    switch (node.type) {
      case 'VariableDeclaration':
        this.visitVariableDeclaration(node as any);
        break;
      case 'FunctionDeclaration':
        this.visitFunctionDeclaration(node as any);
        break;
      case 'IfStatement':
        this.visitIfStatement(node as any);
        break;
      case 'WhileStatement':
        this.visitWhileStatement(node as any);
        break;
      case 'BlockStatement':
        this.visitBlockStatement(node as any);
        break;
      case 'ReturnStatement':
        this.visitReturnStatement(node as any);
        break;
      case 'ExpressionStatement':
        this.visitExpression((node as any).expression);
        break;
      default:
        break;
    }
  }

  private visitVariableDeclaration(node: any): void {
    for (const decl of node.declarations) {
      const varName = decl.id.name;
      
      if (this.symbolTable.lookupCurrent(varName)) {
        this.addError(`Duplicate declaration: ${varName}`, 0);
        continue;
      }
      
      let type = DataType.Any;
      if (decl.init) {
        const initType = this.getExpressionType(decl.init);
        type = initType;
      }
      
      this.symbolTable.declare({
        name: varName,
        kind: SymbolKind.Variable,
        type,
        declaredAt: 0,
        isInitialized: !!decl.init,
        isUsed: false
      });
      
      if (decl.init) {
        this.visitExpression(decl.init);
      }
    }
  }

  private visitFunctionDeclaration(node: any): void {
    const funcName = node.name.name;
    
    this.symbolTable.declare({
      name: funcName,
      kind: SymbolKind.Function,
      type: DataType.Any,
      declaredAt: 0,
      isInitialized: true,
      isUsed: false
    });
    
    this.symbolTable.enterScope();
    this.currentFunction = funcName;
    
    for (const param of node.params) {
      this.symbolTable.declare({
        name: param.name,
        kind: SymbolKind.Parameter,
        type: DataType.Any,
        declaredAt: 0,
        isInitialized: true,
        isUsed: false
      });
    }
    
    this.visitBlockStatement(node.body);
    
    this.symbolTable.exitScope();
    this.currentFunction = null;
  }

  private visitIfStatement(node: any): void {
    const testType = this.getExpressionType(node.test);
    
    if (testType !== DataType.Boolean && testType !== DataType.Any) {
      this.addError('If condition must be a boolean expression', 0);
    }
    
    this.visitExpression(node.test);
    this.visitStatement(node.consequent);
    if (node.alternate) {
      this.visitStatement(node.alternate);
    }
  }

  private visitWhileStatement(node: any): void {
    const testType = this.getExpressionType(node.test);
    
    if (testType !== DataType.Boolean && testType !== DataType.Any) {
      this.addError('While condition must be a boolean expression', 0);
    }
    
    this.visitExpression(node.test);
    this.visitStatement(node.body);
  }

  private visitBlockStatement(node: any): void {
    this.symbolTable.enterScope();
    
    for (const stmt of node.body) {
      this.visitStatement(stmt);
    }
    
    this.symbolTable.exitScope();
  }

  private visitReturnStatement(node: any): void {
    if (node.argument) {
      this.visitExpression(node.argument);
    }
  }

  private visitExpression(node: Expression): DataType {
    return this.getExpressionType(node);
  }

  private getExpressionType(node: Expression): DataType {
    if (!node) return DataType.Any;
    
    switch (node.type) {
      case 'Literal': {
        if (node.value === null) return DataType.Null;
        if (typeof node.value === 'number') return DataType.Number;
        if (typeof node.value === 'string') return DataType.String;
        if (typeof node.value === 'boolean') return DataType.Boolean;
        return DataType.Any;
      }
      
      case 'Identifier': {
        const symbol = this.symbolTable.lookup(node.name);
        if (!symbol) {
          this.addError(`Undefined variable: ${node.name}`, 0);
          return DataType.Any;
        }
        symbol.isUsed = true;
        return symbol.type;
      }

      case 'NewExpression': {
        if (node.callee.type === 'Identifier') {
          const symbol = this.symbolTable.lookup(node.callee.name);
          if (!symbol) {
            this.addError(`Undefined constructor: ${node.callee.name}`, 0);
            return DataType.Any;
          }
          if (symbol.kind !== SymbolKind.Builtin && symbol.kind !== SymbolKind.Function) {
            this.addError(`${node.callee.name} is not a constructor`, 0);
            return DataType.Any;
          }
        } else {
          this.getExpressionType(node.callee);
        }
        
        for (const arg of node.arguments) {
          this.getExpressionType(arg);
        }
        
        return DataType.Object;
      }

      case 'RegexLiteral':
        return DataType.RegExp;
      
      case 'BinaryExpression': {
        const leftType = this.getExpressionType(node.left);
        const rightType = this.getExpressionType(node.right);
        
        if (node.operator === '=') {
          if (node.left.type !== 'Identifier' && node.left.type !== 'MemberExpression') {
            this.addError('Invalid assignment target', 0);
          } else {
            if (node.left.type === 'MemberExpression') {
              this.getExpressionType(node.left.object);
            } else if (node.left.type === 'Identifier') {
              const symbol = this.symbolTable.lookup((node.left as any).name);
              if (symbol) {
                symbol.isInitialized = true;
              }
            }
          }
          return rightType;
        }
        
        if (['+', '-', '*', '/', '%'].includes(node.operator)) {
          if (leftType !== DataType.Number && leftType !== DataType.Any) {
            this.addError(`Arithmetic operator '${node.operator}' requires numbers`, 0);
          }
          if (rightType !== DataType.Number && rightType !== DataType.Any) {
            this.addError(`Arithmetic operator '${node.operator}' requires numbers`, 0);
          }
          return DataType.Number;
        }
        
        if (['==', '!=', '<', '>', '<=', '>='].includes(node.operator)) {
          return DataType.Boolean;
        }
        
        if (['&&', '||'].includes(node.operator)) {
          return DataType.Boolean;
        }
        
        return DataType.Any;
      }
      
      case 'UnaryExpression': {
        const argType = this.getExpressionType(node.argument);
        
        if (node.operator === '!') {
          return DataType.Boolean;
        }
        
        if (node.operator === '-') {
          if (argType !== DataType.Number && argType !== DataType.Any) {
            this.addError('Unary minus requires a number', 0);
          }
          return DataType.Number;
        }
        
        return DataType.Any;
      }
      
      case 'CallExpression': {
        const calleeType = this.getExpressionType(node.callee);
        for (const arg of node.arguments) {
          this.getExpressionType(arg);
        }
        return DataType.Any;
      }
      
      case 'MemberExpression': {
        const objectType = this.getExpressionType(node.object);
        if (node.object.type === 'Identifier' && node.object.name === 'console') {
          if (node.property.type === 'Identifier' && node.property.name === 'log') {
            return DataType.Void;
          }
        }
        return DataType.Any;
      }

      case 'ArrayLiteral': {
        for (const element of node.elements) {
          this.getExpressionType(element);
        }
        return DataType.Array;
      }

      case 'ArrowFunctionExpression': {
        this.symbolTable.enterScope();
        
        for (const param of node.params) {
          this.symbolTable.declare({
            name: param.name,
            kind: SymbolKind.Parameter,
            type: DataType.Any,
            declaredAt: 0,
            isInitialized: true,
            isUsed: false
          });
        }
        
        if (node.expression) {
          const bodyExpr = node.body as Expression;
          this.getExpressionType(bodyExpr);
        } else {
          const bodyBlock = node.body as BlockStatement;
          this.visitBlockStatement(bodyBlock);
        }
        
        this.symbolTable.exitScope();
        
        return DataType.Function;
      }

      case 'ObjectLiteral': {
        for (const prop of node.properties) {
          this.getExpressionType(prop.value);
        }
        return DataType.Object;
      }
    
      default:
        return DataType.Any;
    }
  }

  private addError(message: string, line: number): void {
    this.errors.push({ message, line });
  }

  public getErrors(): Array<{ message: string; line: number }> {
    return this.errors;
  }

  public getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }
}