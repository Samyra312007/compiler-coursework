export enum TokenType {
  Let = 'Let',
  Const = 'Const',
  Function = 'Function',
  If = 'If',
  Else = 'Else',
  While = 'While',
  For = 'For',
  Break = 'Break',
  Continue = 'Continue',
  Return = 'Return',
  True = 'True',
  False = 'False',
  Null = 'Null',
  
  Identifier = 'Identifier',
  Number = 'Number',
  String = 'String',
  
  Plus = 'Plus',
  Minus = 'Minus',
  Star = 'Star',
  Slash = 'Slash',
  Percent = 'Percent',
  
  EqualsEquals = 'EqualsEquals',
  NotEquals = 'NotEquals',
  LessThan = 'LessThan',
  GreaterThan = 'GreaterThan',
  LessThanEquals = 'LessThanEquals',
  GreaterThanEquals = 'GreaterThanEquals',
  
  And = 'And',  
  Or = 'Or',      
  Not = 'Not',   
  
  Equals = 'Equals',
  
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  LeftBrace = 'LeftBrace',
  RightBrace = 'RightBrace',
  Semicolon = 'Semicolon',
  Comma = 'Comma',

  EOF = 'EOF',
  Error = 'Error'
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: number | string | boolean | null;
  line: number;
  column: number;
}