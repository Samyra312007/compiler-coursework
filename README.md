# JavaScript Compiler in TypeScript

This repository contains the coursework for a compiler project. It is a compiler built with TypeScript that translates a subset of JavaScript into machine code for the XSM (eXperimental Stack Machine) architecture.

The compiler processes JavaScript source code through several standard compilation phases, generating an executable `.xexe` file.

## Compiler Architecture

The compilation process is divided into distinct phases, each handled by a dedicated module:

1.  **Lexical Analysis (Lexer)**: The source code string is scanned and converted into a sequence of tokens. (`src/lexer/`)
2.  **Syntax Analysis (Parser)**: The token stream is parsed to build an Abstract Syntax Tree (AST) that represents the grammatical structure of the code. (`src/parser/`)
3.  **Semantic Analysis (Type Checker)**: The AST is traversed to check for semantic correctness, such as type errors and undeclared variables. A symbol table is built and maintained during this phase. (`src/semantic/`)
4.  **Intermediate Representation (IR) Generation**: The validated AST is converted into a simpler, machine-independent format called Three-Address Code (TAC). (`src/ir/`)
5.  **Code Generation**: The TAC is translated into assembly code for the target XSM architecture. This includes register allocation and instruction mapping. (`src/codegen/`)
6.  **Output Generation**: The generated XSM code is written to an `.xexe` file format, including a header with metadata about the program. (`src/codegen/`)

## Supported Features

The compiler supports a subset of JavaScript features, including:

*   **Variable Declarations**: `let` and `const`.
*   **Data Types**: `Number`, `String`, `Boolean`, `null`.
*   **Expressions**: Arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`), and logical (`&&`, `||`, `!`) operators.
*   **Control Flow**: `if-else` statements and `while` loops.
*   **Functions**: Function declarations, function calls, and `return` statements. Arrow functions are also parsed.
*   **Objects**: Object literals and property access (`.`).
*   **Arrays**: Array literals, `length` property, and methods like `push()` and `map()`.
*   **Built-in Objects**:
    *   `console.log()` for printing to the console.
    *   `Map` and `Set` constructors.
    *   `RegExp` literals and the `test()` method.

## Project Structure

The repository is organized as follows:

```
├── src/
│   ├── ast/          # Abstract Syntax Tree type definitions
│   ├── codegen/      # XSM code generator and .xexe file writer
│   ├── ir/           # Three-Address Code (TAC) generator
│   ├── lexer/        # Lexical analyzer (tokenizer)
│   ├── parser/       # Syntax analyzer (parser)
│   ├── runtime/      # JS runtime feature implementations (Array, Map, etc.)
│   ├── semantic/     # Semantic analyzer and symbol table
│   ├── cli.ts        # Command-line interface
│   └── compiler.ts   # Main compiler orchestration
├── tests/            # Test files and a test runner script
├── package.json      # Project dependencies and scripts
└── tsconfig.json     # TypeScript compiler configuration
```

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/samyra312007/compiler-coursework.git
cd compiler-coursework
npm install
```

### Build

Compile the TypeScript source code into JavaScript:

```bash
npm run build
```

This command cleans the `dist/` directory and then runs the TypeScript compiler (`tsc`), outputting the compiled files to `dist/`.

## Usage

### Compiling a File

The compiler can be run via the command-line interface.

```bash
node dist/cli.js <input-file> [options]
```

**Example:**

```bash
# Compile test1.js and output to test1.xexe
node dist/cli.js tests/test1.js -o test1.xexe
```

### Command-Line Options

| Option             | Description                                | Default |
| ------------------ | ------------------------------------------ | ------- |
| `-o, --output`     | Specify the output file path.              | `.xexe` |
| `--target`         | Set the target architecture.               | `xsm`   |
| `-O, --optimizations`| Enable optimizations (not implemented).    | `false` |
| `--debug`          | Enable debug output during compilation.    | `false` |
| `--dump-ast`       | Dump the generated AST to the console.     | `false` |
| `--dump-tac`       | Dump the generated TAC to the console.     | `false` |

## Development

### Available Scripts

*   `npm run build`: Compiles the project.
*   `npm run dev`: Starts the compiler in development mode with `nodemon`, which automatically restarts on file changes.
*   `npm run test:file <file-path>`: Runs a specific test file using the debug runner, printing detailed information for each compiler phase.

### Running Tests

To run a specific test and see the full compilation output for each phase, use the `test:file` script.

**Example:**

```bash
npm run test:file tests/test3.js
```

This will compile `tests/test3.js` and print the source code, token stream, AST, and TAC to the console.
