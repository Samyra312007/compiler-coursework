import { Token, TokenType } from '../lexer/token.js';
import { 
  Program, Statement, Expression, 
  VariableDeclaration, FunctionDeclaration,
  IfStatement, WhileStatement, BlockStatement,
  BinaryExpression, Identifier, Literal, ReturnStatement, ExpressionStatement, 
} from '../ast/ast-types.js';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): Program {
    const statements: Statement[] = [];
    
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    
    return {
      type: 'Program',
      body: statements,
      sourceFile: ''
    };
  }

  private parseStatement(): Statement | null {
    if (this.match(TokenType.Let) || this.match(TokenType.Const)) {
      return this.parseVariableDeclaration();
    }
    
    if (this.match(TokenType.Function)) {
      return this.parseFunctionDeclaration();
    }
    
    if (this.match(TokenType.If)) {
      return this.parseIfStatement();
    }
    
    if (this.match(TokenType.While)) {
      return this.parseWhileStatement();
    }
    
    if (this.match(TokenType.Return)) {
      return this.parseReturnStatement();
    }
    
    if (this.match(TokenType.LeftBrace)) {
      return this.parseBlockStatement();
    }
    
    return this.parseExpressionStatement();
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const kind = this.previous().type === TokenType.Let ? 'let' : 'const';
    const declarations: VariableDeclaration['declarations'] = [];
    
    do {
      const id = this.parseIdentifier();
      let init: Expression | null = null;
      
      if (this.match(TokenType.Equals)) {
        init = this.parseExpression();
      }
      
      declarations.push({
        type: 'VariableDeclarator',
        id,
        init
      });
      
    } while (this.match(TokenType.Comma));
    
    if (this.match(TokenType.Semicolon)) {
    }
    
    return {
      type: 'VariableDeclaration',
      kind,
      declarations
    };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const name = this.parseIdentifier();
    
    this.consume(TokenType.LeftParen, "Expected '(' after function name");
    
    const params: Identifier[] = [];
    if (!this.check(TokenType.RightParen)) {
      do {
        params.push(this.parseIdentifier());
      } while (this.match(TokenType.Comma));
    }
    
    this.consume(TokenType.RightParen, "Expected ')' after parameters");
    
    const body = this.parseBlockStatement();
    
    return {
      type: 'FunctionDeclaration',
      name,
      params,
      body
    };
  }

  private parseIfStatement(): IfStatement {
    this.consume(TokenType.LeftParen, "Expected '(' after 'if'");
    const test = this.parseExpression();
    this.consume(TokenType.RightParen, "Expected ')' after condition");
    
    const consequent = this.parseStatement()!;
    let alternate: Statement | null = null;
    
    if (this.match(TokenType.Else)) {
      alternate = this.parseStatement();
    }
    
    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate
    };
  }

  private parseWhileStatement(): WhileStatement {
    this.consume(TokenType.LeftParen, "Expected '(' after 'while'");
    const test = this.parseExpression();
    this.consume(TokenType.RightParen, "Expected ')' after condition");
    
    const body = this.parseStatement()!;
    
    return {
      type: 'WhileStatement',
      test,
      body
    };
  }

  private parseBlockStatement(): BlockStatement {
    const statements: Statement[] = [];
    
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    
    this.consume(TokenType.RightBrace, "Expected '}' after block");
    
    return {
      type: 'BlockStatement',
      body: statements
    };
  }

  private parseReturnStatement(): ReturnStatement {
    let argument: Expression | null = null;
    
    if (!this.check(TokenType.Semicolon) && !this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      argument = this.parseExpression();
    }
    
    if (this.match(TokenType.Semicolon)) {
    }
    
    return {
      type: 'ReturnStatement',
      argument
    };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression();
    
    if (this.match(TokenType.Semicolon)) {
    }
    
    return {
      type: 'ExpressionStatement',
      expression
    };
  }

  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const expr = this.parseEquality();
    
    if (this.match(TokenType.Equals)) {
      const value = this.parseAssignment();
      
      if (expr.type === 'Identifier') {
        return {
          type: 'BinaryExpression',
          operator: '=',
          left: expr,
          right: value
        };
      }
      
      throw this.error("Invalid assignment target");
    }
    
    return expr;
  }

  private parseEquality(): Expression {
    let expr = this.parseComparison();
    
    while (this.match(TokenType.EqualsEquals) || this.match(TokenType.NotEquals)) {
      const operator = this.previous().lexeme;
      const right = this.parseComparison();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private parseComparison(): Expression {
    let expr = this.parseTerm();
    
    while (this.match(TokenType.LessThan) || 
           this.match(TokenType.GreaterThan) ||
           this.match(TokenType.LessThanEquals) ||
           this.match(TokenType.GreaterThanEquals)) {
      const operator = this.previous().lexeme;
      const right = this.parseTerm();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private parseTerm(): Expression {
    let expr = this.parseFactor();
    
    while (this.match(TokenType.Plus) || this.match(TokenType.Minus)) {
      const operator = this.previous().lexeme;
      const right = this.parseFactor();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private parseFactor(): Expression {
    let expr = this.parseUnary();
    
    while (this.match(TokenType.Star) || this.match(TokenType.Slash) || this.match(TokenType.Percent)) {
      const operator = this.previous().lexeme;
      const right = this.parseUnary();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right
      };
    }
    
    return expr;
  }

  private parseUnary(): Expression {
    if (this.match(TokenType.Minus) || this.match(TokenType.Plus) || this.match(TokenType.Not)) {
      const operator = this.previous().lexeme;
      const argument = this.parseUnary();
      
      return {
        type: 'UnaryExpression',
        operator,
        argument
      };
    }
    
    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    if (this.match(TokenType.Number)) {
      return {
        type: 'Literal',
        value: Number(this.previous().literal)
      };
    }
    
    if (this.match(TokenType.String)) {
      return {
        type: 'Literal',
        value: this.previous().literal as string
      };
    }
    
    if (this.match(TokenType.True)) {
      return { type: 'Literal', value: true };
    }
    
    if (this.match(TokenType.False)) {
      return { type: 'Literal', value: false };
    }
    
    if (this.match(TokenType.Null)) {
      return { type: 'Literal', value: null };
    }
    
    if (this.match(TokenType.Identifier)) {
      return this.parseIdentifier();
    }
    
    if (this.match(TokenType.LeftParen)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RightParen, "Expected ')' after expression");
      return expr;
    }
    
    throw this.error(`Unexpected token: ${this.peek().type}`);
  }

  private parseIdentifier(): Identifier {
    return {
      type: 'Identifier',
      name: this.previous().lexeme
    };
  }

  // Parser utilities
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(message);
  }

  private error(message: string): Error {
    const token = this.peek();
    return new Error(`Parser error at ${token.line}:${token.column}: ${message}`);
  }
}