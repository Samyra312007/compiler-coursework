import { TACInstruction, TACOp } from '../ir/tac.js';

export class XSMGenerator {
  private output: string[] = [];
  private registers: boolean[] = new Array(20).fill(false); // R0-R19
  private stackPointer: number = 4096; // XSM stack starts at 4096
  private basePointer: number = 4096;
  private labels: Map<number, number> = new Map(); // label -> address
  private currentAddress: number = 2056; // XSM code starts at 2056
  private symbolTable: any; // Your symbol table from semantic phase

  constructor(symbolTable: any) {
    this.symbolTable = symbolTable;
  }

  public generate(instructions: TACInstruction[]): string {
    this.output = [];
    this.registers.fill(false);
    
    this.firstPass(instructions);
    
    this.secondPass(instructions);
    
    return this.output.join('\n');
  }

  private firstPass(instructions: TACInstruction[]): void {
    let address = 2056;
    
    for (const inst of instructions) {
      if (inst.op === TACOp.LABEL && inst.label !== undefined) {
        this.labels.set(inst.label, address);
      }
      address += 2; 
    }
  }

  private secondPass(instructions: TACInstruction[]): void {
    for (const inst of instructions) {
      this.generateInstruction(inst);
    }
  }

  private generateInstruction(inst: TACInstruction): void {
    switch (inst.op) {
      case TACOp.ADD:
        this.generateAdd(inst);
        break;
      case TACOp.SUB:
        this.generateSub(inst);
        break;
      case TACOp.MUL:
        this.generateMul(inst);
        break;
      case TACOp.DIV:
        this.generateDiv(inst);
        break;
      case TACOp.ASSIGN:
        this.generateAssign(inst);
        break;
      case TACOp.LABEL:
        this.generateLabel(inst);
        break;
      case TACOp.JUMP:
        this.generateJump(inst);
        break;
      case TACOp.COND_JUMP:
        this.generateCondJump(inst);
        break;
      case TACOp.RETURN:
        this.generateReturn(inst);
        break;
      case TACOp.EQ:
      case TACOp.NE:
      case TACOp.LT:
      case TACOp.GT:
      case TACOp.LE:
      case TACOp.GE:
        this.generateComparison(inst);
        break;
    }
  }

  private generateAdd(inst: TACInstruction): void {
    const reg1 = this.getRegister(inst.arg1!);
    const reg2 = this.getRegister(inst.arg2!);
    const resultReg = this.allocateRegister();
    
    this.emit(`MOV R${resultReg}, R${reg1}`);
    this.emit(`ADD R${resultReg}, R${reg2}`);
    
    if (inst.result!.startsWith('t')) {
      this.freeRegister(reg1);
      this.freeRegister(reg2);
      this.mapTempToRegister(inst.result!, resultReg);
    } else {
      const address = this.getVariableAddress(inst.result!);
      this.emit(`MOV [${address}], R${resultReg}`);
      this.freeRegister(reg1);
      this.freeRegister(reg2);
      this.freeRegister(resultReg);
    }
  }

  private generateAssign(inst: TACInstruction): void {
    if (inst.arg1!.startsWith('t')) {
      const srcReg = this.getRegister(inst.arg1!);
      
      if (inst.result!.startsWith('t')) {
        this.mapTempToRegister(inst.result!, srcReg);
      } else {
        const address = this.getVariableAddress(inst.result!);
        this.emit(`MOV [${address}], R${srcReg}`);
        this.freeRegister(srcReg);
      }
    } else if (!isNaN(Number(inst.arg1))) {
      const reg = this.allocateRegister();
      this.emit(`MOV R${reg}, ${inst.arg1}`);
      
      if (inst.result!.startsWith('t')) {
        this.mapTempToRegister(inst.result!, reg);
      } else {
        const address = this.getVariableAddress(inst.result!);
        this.emit(`MOV [${address}], R${reg}`);
        this.freeRegister(reg);
      }
    } else {
      const address = this.getVariableAddress(inst.arg1!);
      const reg = this.allocateRegister();
      this.emit(`MOV R${reg}, [${address}]`);
      
      if (inst.result!.startsWith('t')) {
        this.mapTempToRegister(inst.result!, reg);
      } else {
        const destAddress = this.getVariableAddress(inst.result!);
        this.emit(`MOV [${destAddress}], R${reg}`);
        this.freeRegister(reg);
      }
    }
  }

  private generateComparison(inst: TACInstruction): void {
    const reg1 = this.getRegister(inst.arg1!);
    const reg2 = this.getRegister(inst.arg2!);
    const resultReg = this.allocateRegister();
    
    let condition: string;
    switch (inst.op) {
      case TACOp.EQ: condition = 'EQ'; break;
      case TACOp.NE: condition = 'NE'; break;
      case TACOp.LT: condition = 'LT'; break;
      case TACOp.GT: condition = 'GT'; break;
      case TACOp.LE: condition = 'LE'; break;
      case TACOp.GE: condition = 'GE'; break;
      default: throw new Error(`Unknown comparison: ${inst.op}`);
    }
    
    this.emit(`MOV R${resultReg}, 0`);
    this.emit(`CMP R${reg1}, R${reg2}`);
    this.emit(`J${condition} L${this.getLabelForComparison()}`);
    this.emit(`MOV R${resultReg}, 1`);
    this.emit(`LABEL L${this.getLabelForComparison()}:`);
    
    this.freeRegister(reg1);
    this.freeRegister(reg2);
    
    if (inst.result!.startsWith('t')) {
      this.mapTempToRegister(inst.result!, resultReg);
    } else {
      const address = this.getVariableAddress(inst.result!);
      this.emit(`MOV [${address}], R${resultReg}`);
      this.freeRegister(resultReg);
    }
  }

  private generateLabel(inst: TACInstruction): void {
    if (inst.label !== undefined) {
      this.emit(`L${inst.label}:`);
    }
  }

  private generateJump(inst: TACInstruction): void {
    const address = this.labels.get(inst.label!);
    this.emit(`JMP ${address}`);
  }

  private generateCondJump(inst: TACInstruction): void {
    const reg = this.getRegister(inst.arg1!);
    const address = this.labels.get(inst.label!);
    
    if (inst.arg2 === 'false') {
      this.emit(`JZ R${reg}, ${address}`);
    } else {
      this.emit(`JNZ R${reg}, ${address}`);
    }
    
    this.freeRegister(reg);
  }

  private generateReturn(inst: TACInstruction): void {
    if (inst.arg1) {
      const reg = this.getRegister(inst.arg1);
      this.emit(`MOV [BP-2], R${reg}`);
      this.freeRegister(reg);
    }
    
    this.emit(`MOV BP, [SP]`);
    this.emit(`POP BP`);
    this.emit(`RET`);
  }

  private allocateRegister(): number {
    for (let i = 0; i < 20; i++) {
      if (!this.registers[i]) {
        this.registers[i] = true;
        return i;
      }
    }
    throw new Error('Out of registers');
  }

  private freeRegister(reg: number): void {
    if (reg >= 0 && reg < 20) {
      this.registers[reg] = false;
    }
  }

  private tempToRegister: Map<string, number> = new Map();

  private getRegister(temp: string): number {
    if (temp.startsWith('t')) {
      const reg = this.tempToRegister.get(temp);
      if (reg !== undefined) return reg;
    }
    
    const reg = this.allocateRegister();
    if (!temp.startsWith('t')) {
      const address = this.getVariableAddress(temp);
      this.emit(`MOV R${reg}, [${address}]`);
    }
    return reg;
  }

  private mapTempToRegister(temp: string, reg: number): void {
    this.tempToRegister.set(temp, reg);
  }

  private getVariableAddress(name: string): number {
    const symbol = this.symbolTable.lookup(name);
    if (symbol && symbol.binding !== undefined) {
      return symbol.binding;
    }
    
    return 4096 + (name.charCodeAt(0) - 'a'.charCodeAt(0));
  }

  private emit(code: string): void {
    this.output.push(code);
    this.currentAddress += 2;
  }

  private labelCounter: number = 0;
  private getLabelForComparison(): number {
    return this.labelCounter++;
  }
}