import { Token, TokenType } from './token.js';

export class Lexer {
  private source: string;
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  
  private static keywords: Map<string, TokenType> = new Map([
    ['let', TokenType.Let],
    ['const', TokenType.Const],
    ['function', TokenType.Function],
    ['if', TokenType.If],
    ['else', TokenType.Else],
    ['while', TokenType.While],
    ['for', TokenType.For],
    ['return', TokenType.Return],
    ['true', TokenType.True],
    ['false', TokenType.False],
    ['null', TokenType.Null],
    ['new', TokenType.New]
  ]);

  constructor(source: string) {
    this.source = source;
  }

  public scanTokens(): Token[] {
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;
    
    while (!this.isAtEnd()) {
      this.start = this.current;
      const token = this.scanToken();
      if (token) this.tokens.push(token);
    }
    
    this.tokens.push(this.createToken(TokenType.EOF, ''));
    return this.tokens;
  }

  private scanToken(): Token | null {
    const c = this.advance();
    
    switch (c) {
      case '(': return this.createToken(TokenType.LeftParen, '(');
      case ')': return this.createToken(TokenType.RightParen, ')');
      case '{': return this.createToken(TokenType.LeftBrace, '{');
      case '}': return this.createToken(TokenType.RightBrace, '}');
      case '[': return this.createToken(TokenType.LeftBracket, '[');
      case ']': return this.createToken(TokenType.RightBracket, ']');
      case ';': return this.createToken(TokenType.Semicolon, ';');
      case ',': return this.createToken(TokenType.Comma, ',');
      case '.': return this.createToken(TokenType.Dot, '.');
      case ':': return this.createToken(TokenType.Colon, ':');
      case '+': return this.createToken(TokenType.Plus, '+');
      case '-': return this.createToken(TokenType.Minus, '-');
      case '*': return this.createToken(TokenType.Star, '*');
      case '%': 
        return this.createToken(TokenType.Percent, '%');
      
      case '=':
        if (this.match('=')) {
          return this.createToken(TokenType.EqualsEquals, '==');
        }
        return this.createToken(TokenType.Equals, '=');
        
      case '!':
        if (this.match('=')) {
          return this.createToken(TokenType.NotEquals, '!=');
        }
        return this.createToken(TokenType.Not, '!');
        
      case '<':
        if (this.match('=')) {
          return this.createToken(TokenType.LessThanEquals, '<=');
        }
        return this.createToken(TokenType.LessThan, '<');
        
      case '>':
        if (this.match('=')) {
          return this.createToken(TokenType.GreaterThanEquals, '>=');
        }
        return this.createToken(TokenType.GreaterThan, '>');

      case '&':
        if (this.match('&')) {
          return this.createToken(TokenType.And, '&&');
        }
        throw this.error(`Unexpected character '&'`);
      
      case '|':
        if (this.match('|')) {
          return this.createToken(TokenType.Or, '||');
        }
        throw this.error(`Unexpected character '|'`);

      case '/':
        if (this.isRegexStart()) {
          return this.scanRegex();
        }
        if (this.match('/')) {
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
          return null;
        } else if (this.match('*')) {
          this.handleBlockComment();
          return null;
        }
        return this.createToken(TokenType.Slash, '/');
        
      case ' ':
      case '\r':
      case '\t':
        return null;
        
      case '\n':
        this.line++;
        this.column = 1;
        return null;
        
      case '"':
      case "'":
        return this.scanString(c);
        
      default:
        if (this.isDigit(c)) {
          return this.scanNumber();
        }
        if (this.isAlpha(c)) {
          return this.scanIdentifier();
        }
        throw this.error(`Unexpected character '${c}'`);
    }
  }

  private isRegexStart(): boolean {
    if (this.tokens.length === 0) return true;
    
    const prevToken = this.tokens[this.tokens.length - 1];
    if (!prevToken) return true;
    
    const regexAllowedAfter = [
      TokenType.Equals, TokenType.LeftParen, TokenType.LeftBracket,
      TokenType.LeftBrace, TokenType.Comma, TokenType.Return,
      TokenType.Let, TokenType.Const, TokenType.If, TokenType.While,
      TokenType.For
    ];
    
    return regexAllowedAfter.includes(prevToken.type);
  }

  private scanRegex(): Token {
    let pattern = '';
    let inClass = false;
    
    while (!this.isAtEnd()) {
      const c = this.peek();
      
      if (c === '/' && !inClass) {
        this.advance(); 
        break;
      }
      
      if (c === '\\') {
        pattern += this.advance(); 
        if (!this.isAtEnd()) {
          pattern += this.advance(); 
        }
      } else if (c === '[') {
        inClass = true;
        pattern += this.advance();
      } else if (c === ']') {
        inClass = false;
        pattern += this.advance();
      } else if (c === '\n') {
        throw this.error('Unterminated regex literal');
      } else {
        pattern += this.advance();
      }
    }
    
    let flags = '';
    while (this.isRegexFlag(this.peek())) {
      flags += this.advance();
    }
    
    const regexStr = `/${pattern}/${flags}`;
    return this.createToken(TokenType.Regex, regexStr, { pattern, flags });
  }

  private isRegexFlag(c: string): boolean {
    return ['g', 'i', 'm', 's', 'u', 'y'].includes(c);
  }

  private scanString(quote: string): Token {
    let value = '';
    
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      value += this.advance();
    }
    
    if (this.isAtEnd()) {
      throw this.error('Unterminated string');
    }
    
    this.advance();
    
    return this.createToken(TokenType.String, `"${value}"`, value);
  }

  private scanNumber(): Token {
    while (this.isDigit(this.peek())) {
      this.advance();
    }
    
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    const numberStr = this.source.substring(this.start, this.current);
    return this.createToken(
      TokenType.Number, 
      numberStr, 
      parseFloat(numberStr)
    );
  }

  private scanIdentifier(): Token {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    
    const text = this.source.substring(this.start, this.current);
    const type = Lexer.keywords.get(text) || TokenType.Identifier;
    
    return this.createToken(type, text);
  }

  private handleBlockComment(): void {
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        return;
      }
      
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      
      this.advance();
    }
    
    throw this.error('Unterminated block comment');
  }

  private advance(): string {
    this.column++;
    return this.source[this.current++];
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    
    this.current++;
    this.column++;
    return true;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || 
           (c >= 'A' && c <= 'Z') || 
           c === '_' || c === '$';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private createToken(type: TokenType, lexeme: string, literal?: any): Token {
    return {
      type,
      lexeme,
      literal,
      line: this.line,
      column: this.column - lexeme.length
    };
  }

  private error(message: string): Error {
    return new Error(`Lexer error at ${this.line}:${this.column}: ${message}`);
  }
}