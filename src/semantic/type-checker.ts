import { ASTNode, Program, Statement, Expression } from '../ast/ast-types.js';
import { SymbolTable, SymbolKind, DataType } from './symbol-table.js';

export class TypeChecker {
  private symbolTable: SymbolTable;
  private errors: Array<{ message: string; line: number }> = [];

  constructor() {
    this.symbolTable = new SymbolTable();
  }

  public check(ast: Program): boolean {
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
        this.visitVariableDeclaration(node);
        break;
      case 'FunctionDeclaration':
        this.visitFunctionDeclaration(node);
        break;
      case 'IfStatement':
        this.visitIfStatement(node);
        break;
      case 'WhileStatement':
        this.visitWhileStatement(node);
        break;
      case 'BlockStatement':
        this.visitBlockStatement(node);
        break;
      case 'ReturnStatement':
        this.visitReturnStatement(node);
        break;
      case 'ExpressionStatement':
        this.visitExpression(node.expression);
        break;
    }
  }

  private visitVariableDeclaration(node: any): void {
    for (const decl of node.declarations) {
      if (this.symbolTable.lookupCurrent(decl.id.name)) {
        throw new Error(`Duplicate declaration: ${decl.id.name}`);
      }
      
      let type = DataType.Any;
      if (decl.init) {
        const initType = this.getExpressionType(decl.init);
        type = initType;
      }
      
      this.symbolTable.declare({
        name: decl.id.name,
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
    this.symbolTable.declare({
      name: node.name.name,
      kind: SymbolKind.Function,
      type: DataType.Any, 
      declaredAt: 0,
      isInitialized: true,
      isUsed: false
    });
    
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
    
    this.visitBlockStatement(node.body);
    
    this.symbolTable.exitScope();
  }

  private visitIfStatement(node: any): void {
    const testType = this.getExpressionType(node.test);
    
    if (testType !== DataType.Boolean && testType !== DataType.Any) {
      throw new Error('If condition must be a boolean expression');
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
      throw new Error('While condition must be a boolean expression');
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
    const type = this.getExpressionType(node);
    
    if (node.type === 'Identifier') {
      this.symbolTable.markUsed(node.name);
    }
    
    return type;
  }

  private getExpressionType(node: Expression): DataType {
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
          throw new Error(`Undefined variable: ${node.name}`);
        }
        return symbol.type;
      }
      
      case 'BinaryExpression': {
        const leftType = this.getExpressionType(node.left);
        const rightType = this.getExpressionType(node.right);
        
        if (node.operator === '=') {
          if (node.left.type !== 'Identifier') {
            throw new Error('Invalid assignment target');
          }
          
          if (leftType !== rightType && leftType !== DataType.Any && rightType !== DataType.Any) {
            throw new Error(`Type mismatch: cannot assign ${rightType} to ${leftType}`);
          }
          
          this.symbolTable.markInitialized((node.left as any).name);
          return leftType;
        }
        
        if (['+', '-', '*', '/'].includes(node.operator)) {
          if (leftType !== DataType.Number || rightType !== DataType.Number) {
            throw new Error(`Arithmetic operator '${node.operator}' requires numbers`);
          }
          return DataType.Number;
        }
        
        if (['==', '!=', '<', '>', '<=', '>='].includes(node.operator)) {
          if (leftType !== rightType && leftType !== DataType.Any && rightType !== DataType.Any) {
            throw new Error(`Cannot compare ${leftType} and ${rightType}`);
          }
          return DataType.Boolean;
        }
        
        return DataType.Any;
      }
      
      case 'UnaryExpression': {
        const argType = this.getExpressionType(node.argument);
        
        if (node.operator === '-') {
          if (argType !== DataType.Number) {
            throw new Error('Unary minus requires a number');
          }
          return DataType.Number;
        }
        
        return DataType.Any;
      }
      
      default:
        return DataType.Any;
    }
  }

  public getErrors(): Array<{ message: string; line: number }> {
    return this.errors;
  }

  public getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }
}