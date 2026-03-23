import { Token } from '../lexer/token.js';

export type ASTNode = 
  | Program
  | Statement
  | Expression;

export interface Program {
  type: 'Program';
  body: Statement[];
  sourceFile: string;
}

export type Statement = 
  | VariableDeclaration
  | FunctionDeclaration
  | IfStatement
  | WhileStatement
  | ReturnStatement
  | BlockStatement
  | ExpressionStatement;

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  kind: 'let' | 'const';
  declarations: VariableDeclarator[];
}

export interface VariableDeclarator {
  type: 'VariableDeclarator';
  id: Identifier;
  init: Expression | null;
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: Identifier;
  params: Identifier[];
  body: BlockStatement;
  returnType?: string;
}

export interface IfStatement {
  type: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface WhileStatement {
  type: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  argument: Expression | null;
}

export interface BlockStatement {
  type: 'BlockStatement';
  body: Statement[];
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface MemberExpression {
  type: 'MemberExpression';
  object: Expression;
  property: Expression | Identifier;
  computed: boolean; 
}

export interface ArrayLiteral {
  type: 'ArrayLiteral';
  elements: Expression[];
}

export interface ArrowFunctionExpression {
  type: 'ArrowFunctionExpression';
  params: Identifier[];
  body: Expression | BlockStatement;
  expression: boolean;
}

export interface ObjectProperty {
  type: 'ObjectProperty';
  key: Identifier | Literal;
  value: Expression;
  computed: boolean;
}

export interface ObjectLiteral {
  type: 'ObjectLiteral';
  properties: ObjectProperty[];
}

export interface RegexLiteral {
  type: 'RegexLiteral';
  pattern: string;
  flags: string;
}

export interface NewExpression {
  type: 'NewExpression';
  callee: Expression;
  arguments: Expression[];
}

export type Expression = 
  | BinaryExpression
  | UnaryExpression
  | MemberExpression
  | CallExpression
  | NewExpression
  | ArrayLiteral
  | ObjectLiteral
  | ArrowFunctionExpression
  | Identifier
  | RegexLiteral
  | Literal;

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface Literal {
  type: 'Literal';
  value: string | number | boolean | null;
}