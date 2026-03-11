export enum TokenType {
  // Keywords
  Let = 'Let',
  Const = 'Const',
  Function = 'Function',
  If = 'If',
  Else = 'Else',
  While = 'While',
  For = 'For',
  Return = 'Return',
  True = 'True',
  False = 'False',
  Null = 'Null',
  
  // Literals
  Identifier = 'Identifier',
  Number = 'Number',
  String = 'String',
  
  // Operators
  Plus = 'Plus',
  Minus = 'Minus',
  Star = 'Star',
  Slash = 'Slash',
  Equals = 'Equals',
  EqualsEquals = 'EqualsEquals',
  NotEquals = 'NotEquals',
  LessThan = 'LessThan',
  GreaterThan = 'GreaterThan',
  LessThanEquals = 'LessThanEquals',
  GreaterThanEquals = 'GreaterThanEquals',
  
  // Delimiters
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  LeftBrace = 'LeftBrace',
  RightBrace = 'RightBrace',
  LeftBracket = 'LeftBracket',
  RightBracket = 'RightBracket',
  Semicolon = 'Semicolon',
  Comma = 'Comma',
  Dot = 'Dot',
  
  // Special
  EOF = 'EOF',
  Error = 'Error'
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: number | string | boolean;
  line: number;
  column: number;
}