export interface CompilerOptions {
  targetArch: 'xsm' | 'x86';
  outputFormat: 'binary' | 'assembly';
  optimizations: boolean;
  debug: boolean;
  outFile: string;
}

export interface SourceLocation {
  line: number;
  column: number;
  file: string;
}

export interface CompilerError {
  message: string;
  location: SourceLocation;
  severity: 'error' | 'warning';
}