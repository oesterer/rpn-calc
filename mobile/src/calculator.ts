export type Operation = '+' | '-' | '*' | '/' | 'pow' | 'sq' | 'sqrt' | 'sin' | 'cos' | 'tan' | 'log' | 'ln' | 'inv' | 'neg' | 'dup' | 'drop' | 'swap' | 'clear' | 'pi' | 'e';

export class CalculatorError extends Error {}

export class Calculator {
  stack: number[] = [];
  push(value: number) { this.stack.push(value); }

  execute(op: Operation): string {
    switch (op) {
      case '+': return this.binary('+', (a, b) => a + b);
      case '-': return this.binary('−', (a, b) => a - b);
      case '*': return this.binary('×', (a, b) => a * b);
      case '/':
        this.require(2, 'two values for ÷');
        if (this.stack.at(-1) === 0) throw new CalculatorError('Cannot divide by zero');
        return this.binary('÷', (a, b) => a / b);
      case 'pow': return this.binary('power', Math.pow);
      case 'sq': return this.unary('a value to square', x => x * x);
      case 'sqrt': return this.unary('a value for square root', x => {
        if (x < 0) throw new CalculatorError('Square root requires a non-negative value');
        return Math.sqrt(x);
      });
      case 'sin': return this.unary('a value for sine', Math.sin);
      case 'cos': return this.unary('a value for cosine', Math.cos);
      case 'tan': return this.unary('a value for tangent', Math.tan);
      case 'log': return this.positiveLog('log', Math.log10);
      case 'ln': return this.positiveLog('ln', Math.log);
      case 'inv': return this.unary('a value to invert', x => {
        if (x === 0) throw new CalculatorError('Cannot divide by zero');
        return 1 / x;
      });
      case 'neg': return this.unary('a value to negate', x => -x);
      case 'dup': {
        this.require(1, 'a value to duplicate');
        const value = this.stack.at(-1)!;
        this.stack.push(value);
        return `Duplicated ${formatValue(value)}`;
      }
      case 'drop':
        this.require(1, 'a value to drop');
        return `Dropped ${formatValue(this.stack.pop()!)}`;
      case 'swap': {
        this.require(2, 'two values to swap');
        const i = this.stack.length - 1;
        [this.stack[i], this.stack[i - 1]] = [this.stack[i - 1], this.stack[i]];
        return 'Swapped top two values';
      }
      case 'clear': this.stack = []; return 'Stack cleared';
      case 'pi': this.stack.push(Math.PI); return 'Pushed π';
      case 'e': this.stack.push(Math.E); return 'Pushed e';
    }
  }

  private require(count: number, message: string) {
    if (this.stack.length < count) throw new CalculatorError(`Need ${message}`);
  }
  private binary(label: string, fn: (a: number, b: number) => number) {
    this.require(2, `two values for ${label}`);
    const b = this.stack.pop()!, a = this.stack.pop()!, result = fn(a, b);
    this.stack.push(result);
    return `Result: ${formatValue(result)}`;
  }
  private unary(requirement: string, fn: (value: number) => number) {
    this.require(1, requirement);
    const result = fn(this.stack.at(-1)!);
    this.stack[this.stack.length - 1] = result;
    return `Result: ${formatValue(result)}`;
  }
  private positiveLog(name: 'log' | 'ln', fn: (value: number) => number) {
    return this.unary(`a value for ${name}`, x => {
      if (x <= 0) throw new CalculatorError(`${name} requires a positive value`);
      return fn(x);
    });
  }
}

export function formatValue(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Number.isInteger(value)) return value.toString();
  return Number(value.toPrecision(10)).toString();
}
