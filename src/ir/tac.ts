export enum TACOp {
  ADD = 'ADD',
  SUB = 'SUB',
  MUL = 'MUL',
  DIV = 'DIV',
  MOD = 'MOD',
  EQ = 'EQ',
  NE = 'NE',
  LT = 'LT',
  GT = 'GT',
  LE = 'LE',
  GE = 'GE',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  ASSIGN = 'ASSIGN',
  LOAD = 'LOAD',
  STORE = 'STORE',
  LABEL = 'LABEL',
  JUMP = 'JUMP',
  COND_JUMP = 'COND_JUMP',
  CALL = 'CALL',
  PARAM = 'PARAM',
  RETURN = 'RETURN'
}

export interface TACInstruction {
  op: TACOp;
  result?: string;
  arg1?: string;
  arg2?: string;
  label?: number;
}

export class TACGenerator {
  private instructions: TACInstruction[] = [];
  private tempCounter: number = 0;
  private labelCounter: number = 0;
  
  public generate(ast: any): TACInstruction[] {
    this.instructions = [];
    this.tempCounter = 0;
    this.labelCounter = 0;
    
    if (ast && ast.body) {
      for (const stmt of ast.body) {
        this.generateNode(stmt);
      }
    }
    
    return this.instructions;
  }

  private generateNode(node: any): string | null {
    if (!node) return null;
    
    switch (node.type) {
      case 'Program':
        return this.generateProgram(node);
      case 'VariableDeclaration':
        return this.generateVariableDeclaration(node);
      case 'FunctionDeclaration':
        return this.generateFunctionDeclaration(node);
      case 'IfStatement':
        return this.generateIfStatement(node);
      case 'WhileStatement':
        return this.generateWhileStatement(node);
      case 'ReturnStatement':
        return this.generateReturnStatement(node);
      case 'ExpressionStatement':
        return this.generateExpression(node.expression);
      case 'BlockStatement':
        return this.generateBlockStatement(node);
      case 'BinaryExpression':
        return this.generateBinaryExpression(node);
      case 'Identifier':
        return this.generateIdentifier(node);
      case 'Literal':
        return this.generateLiteral(node);
      case 'CallExpression':
        return this.generateCallExpression(node);
      case 'MemberExpression':
        return this.generateMemberExpression(node);
      default:
        return null;
    }
  }

  private generateMemberExpression(node: any): string {
    const object = this.generateNode(node.object);
    const property = node.property.name;
    if (object === 'console' && property === 'log') {
      return 'print';
    }
    return property;
  }

  private generateProgram(node: any): string | null {
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    return null;
  }

  private generateCallExpression(node: any): string {
    const callee = this.generateNode(node.callee);
    const temp = this.newTemp();
    for (const arg of node.arguments) {
      const argVal = this.generateNode(arg);
      if (argVal) {
        this.addInstruction({
          op: TACOp.PARAM,
          arg1: argVal
        });
      }
    }
    this.addInstruction({
      op: TACOp.CALL,
      result: temp,
      arg1: callee || ''
    });
    
    return temp;
  }

  private generateVariableDeclaration(node: any): string | null {
    for (const decl of node.declarations) {
      if (decl.init) {
        const value = this.generateNode(decl.init);
        if (value) {
          this.addInstruction({
            op: TACOp.ASSIGN,
            result: decl.id.name,
            arg1: value
          });
        }
      }
    }
    return null;
  }

  private generateFunctionDeclaration(node: any): string | null {
    const label = this.newLabel();
    this.addInstruction({
      op: TACOp.LABEL,
      label,
      result: node.name.name
    });
    
    this.generateNode(node.body);
    this.addInstruction({ op: TACOp.RETURN });
    
    return null;
  }

  private generateIfStatement(node: any): string | null {
    const elseLabel = this.newLabel();
    const endLabel = this.newLabel();
    
    const cond = this.generateNode(node.test);
    
    this.addInstruction({
      op: TACOp.COND_JUMP,
      arg1: cond || 'false',
      arg2: 'false',
      label: elseLabel
    });
    
    this.generateNode(node.consequent);
    this.addInstruction({ op: TACOp.JUMP, label: endLabel });
    this.addInstruction({ op: TACOp.LABEL, label: elseLabel });
    
    if (node.alternate) {
      this.generateNode(node.alternate);
    }
    
    this.addInstruction({ op: TACOp.LABEL, label: endLabel });
    
    return null;
  }

  private generateWhileStatement(node: any): string | null {
    const startLabel = this.newLabel();
    const endLabel = this.newLabel();
    
    this.addInstruction({ op: TACOp.LABEL, label: startLabel });
    
    const cond = this.generateNode(node.test);
    
    this.addInstruction({
      op: TACOp.COND_JUMP,
      arg1: cond || 'false',
      arg2: 'false',
      label: endLabel
    });
    
    this.generateNode(node.body);
    this.addInstruction({ op: TACOp.JUMP, label: startLabel });
    this.addInstruction({ op: TACOp.LABEL, label: endLabel });
    
    return null;
  }

  private generateReturnStatement(node: any): string | null {
    if (node.argument) {
      const value = this.generateNode(node.argument);
      this.addInstruction({
        op: TACOp.RETURN,
        arg1: value || undefined
      });
    } else {
      this.addInstruction({ op: TACOp.RETURN });
    }
    return null;
  }

  private generateBlockStatement(node: any): string | null {
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    return null;
  }

  private generateExpression(node: any): string | null {
    return this.generateNode(node);
  }

  private generateBinaryExpression(node: any): string {
    const left = this.generateNode(node.left);
    const right = this.generateNode(node.right);
    const result = this.newTemp();
    
    let op: TACOp;
    switch (node.operator) {
      case '+': op = TACOp.ADD; break;
      case '-': op = TACOp.SUB; break;
      case '*': op = TACOp.MUL; break;
      case '/': op = TACOp.DIV; break;
      case '%': op = TACOp.MOD; break;
      case '==': op = TACOp.EQ; break;
      case '!=': op = TACOp.NE; break;
      case '<': op = TACOp.LT; break;
      case '>': op = TACOp.GT; break;
      case '<=': op = TACOp.LE; break;
      case '>=': op = TACOp.GE; break;
      case '&&': op = TACOp.AND; break;
      case '||': op = TACOp.OR; break;
      default: throw new Error(`Unknown operator: ${node.operator}`);
    }
    
    this.addInstruction({
      op,
      result,
      arg1: left || '0',
      arg2: right || '0'
    });
    
    return result;
  }

  private generateIdentifier(node: any): string {
    return node.name;
  }

  private generateLiteral(node: any): string {
    const temp = this.newTemp();
    this.addInstruction({
      op: TACOp.ASSIGN,
      result: temp,
      arg1: String(node.value)
    });
    return temp;
  }

  private addInstruction(inst: TACInstruction): void {
    this.instructions.push(inst);
  }

  private newTemp(): string {
    return `t${this.tempCounter++}`;
  }

  private newLabel(): number {
    return this.labelCounter++;
  }
}