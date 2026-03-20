import * as fs from 'fs';
import * as path from 'path';

export interface XEXEHeader {
  magic: number;      // Always 0
  codeStart: number;  // Usually 2056
  codeSize: number;   // Size of code in words
  dataSize: number;   // Size of data section
  bssSize: number;    // Size of BSS section
  entryPoint: number; // Address of first instruction
  symbolTable: number;// Symbol table offset (0 if none)
}

export class XEXEWriter {
  private header: XEXEHeader;
  private code: string[] = [];
  
  constructor(entryPoint: number = 2056) {
    this.header = {
      magic: 0,
      codeStart: 2056,
      codeSize: 0,
      dataSize: 0,
      bssSize: 0,
      entryPoint,
      symbolTable: 0
    };
  }

  public addCode(line: string): void {
    this.code.push(line);
  }

  public addCodeLines(lines: string[]): void {
    this.code.push(...lines);
  }

  public writeToFile(filename: string): void {
    this.header.codeSize = this.code.length * 2;
    
    const content = this.generateXEXEContent();
    fs.writeFileSync(filename, content);
  }

  private generateXEXEContent(): string {
    const lines: string[] = [];
    
    lines.push(this.header.magic.toString());
    lines.push(this.header.codeStart.toString());
    lines.push(this.header.codeSize.toString());
    lines.push(this.header.dataSize.toString());
    lines.push(this.header.bssSize.toString());
    lines.push(this.header.entryPoint.toString());
    lines.push(this.header.symbolTable.toString());
    
    lines.push(...this.code);
    
    return lines.join('\n');
  }
}