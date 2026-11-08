class StackUnderflowError extends Error {}

class RPNCalculator {
  constructor() {
    this.stack = [];
  }

  push(value) {
    this.stack.push(value);
  }

  pop() {
    if (this.stack.length === 0) {
      throw new StackUnderflowError('stack is empty');
    }
    return this.stack.pop();
  }

  peek() {
    if (this.stack.length === 0) {
      throw new StackUnderflowError('stack is empty');
    }
    return this.stack[this.stack.length - 1];
  }

  clear() {
    this.stack = [];
  }

  drop() {
    return this.pop();
  }

  dup() {
    this.push(this.peek());
  }

  swap() {
    if (this.stack.length < 2) {
      throw new StackUnderflowError('need at least two values to swap');
    }
    const last = this.stack.length - 1;
    [this.stack[last], this.stack[last - 1]] = [this.stack[last - 1], this.stack[last]];
  }

  binaryOp(fn, name) {
    if (this.stack.length < 2) {
      throw new StackUnderflowError(`need at least two values for '${name}'`);
    }
    const b = this.pop();
    const a = this.pop();
    const result = fn(a, b);
    this.push(result);
    return result;
  }

  unaryOp(fn, name) {
    if (this.stack.length < 1) {
      throw new StackUnderflowError(`need at least one value for '${name}'`);
    }
    const value = this.pop();
    const result = fn(value);
    this.push(result);
    return result;
  }

  add() {
    return this.binaryOp((a, b) => a + b, '+');
  }

  subtract() {
    return this.binaryOp((a, b) => a - b, '-');
  }

  multiply() {
    return this.binaryOp((a, b) => a * b, '*');
  }

  divide() {
    return this.binaryOp((a, b) => {
      if (b === 0) {
        throw new Error('division by zero');
      }
      return a / b;
    }, '/');
  }

  sine() {
    return this.unaryOp((v) => Math.sin(v), 'sin');
  }

  cosine() {
    return this.unaryOp((v) => Math.cos(v), 'cos');
  }

  invert() {
    return this.unaryOp((v) => {
      if (v === 0) {
        throw new Error('cannot invert zero');
      }
      return 1 / v;
    }, 'inv');
  }

  power() {
    return this.binaryOp((a, b) => Math.pow(a, b), 'pow');
  }

  negate() {
    return this.unaryOp((v) => -v, 'neg');
  }

  sqrt() {
    return this.unaryOp((v) => {
      if (v < 0) {
        throw new Error('cannot take square root of negative value');
      }
      return Math.sqrt(v);
    }, 'sqrt');
  }

  log10() {
    return this.unaryOp((v) => {
      if (v <= 0) {
        throw new Error('log undefined for non-positive values');
      }
      return Math.log10(v);
    }, 'log');
  }

  ln() {
    return this.unaryOp((v) => {
      if (v <= 0) {
        throw new Error('ln undefined for non-positive values');
      }
      return Math.log(v);
    }, 'ln');
  }

  tangent() {
    return this.unaryOp((v) => Math.tan(v), 'tan');
  }

  square() {
    return this.unaryOp((v) => v * v, 'sq');
  }

  pushConstant(value) {
    this.push(value);
    return value;
  }
}

const calc = new RPNCalculator();
const stackEl = document.getElementById('stack');
const statusEl = document.getElementById('status');
const entryEl = document.getElementById('entry');
const enterBtn = document.getElementById('enter-btn');
const clearEntryBtn = document.getElementById('clear-entry-btn');

function formatValue(value) {
  if (Number.isFinite(value) && Number.isInteger(value)) {
    return value.toString();
  }
  return Number.isFinite(value) ? Number(value.toPrecision(10)).toString() : value.toString();
}

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.classList.remove('status--error', 'status--success');
  if (type === 'error') {
    statusEl.classList.add('status--error');
  } else if (type === 'success') {
    statusEl.classList.add('status--success');
  }
}

function renderStack() {
  stackEl.innerHTML = '';
  const recent = calc.stack.slice(-5);
  const padding = 5 - recent.length;
  for (let i = 0; i < padding; i += 1) {
    const li = document.createElement('li');
    li.classList.add('empty');
    const label = document.createElement('span');
    label.className = 'stack__label';
    label.textContent = '-';
    const value = document.createElement('span');
    value.className = 'stack__value';
    li.append(label, value);
    stackEl.appendChild(li);
  }

  const startIndex = calc.stack.length - recent.length + 1;
  recent.forEach((item, idx) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'stack__label';
    label.textContent = `${startIndex + idx}`;
    const value = document.createElement('span');
    value.className = 'stack__value';
    value.textContent = formatValue(item);
    li.append(label, value);
    stackEl.appendChild(li);
  });
}

function handleCommand(token) {
  const commands = {
    '+': () => calc.add(),
    '-': () => calc.subtract(),
    '*': () => calc.multiply(),
    '/': () => calc.divide(),
    sin: () => calc.sine(),
    cos: () => calc.cosine(),
    tan: () => calc.tangent(),
    inv: () => calc.invert(),
    pow: () => calc.power(),
    neg: () => calc.negate(),
    sqrt: () => calc.sqrt(),
    log: () => calc.log10(),
    ln: () => calc.ln(),
    sq: () => calc.square(),
  };

  const lower = token.toLowerCase();

  if (lower === 'clear' || lower === 'clr') {
    calc.clear();
    return 'Stack cleared';
  }

  if (lower === 'swap') {
    calc.swap();
    return 'Swapped top two values';
  }

  if (lower === 'drop') {
    const dropped = calc.drop();
    return `Dropped ${formatValue(dropped)}`;
  }

  if (lower === 'dup') {
    const value = calc.peek();
    calc.dup();
    return `Duplicated ${formatValue(value)}`;
  }

  if (lower === 'pi') {
    const value = calc.pushConstant(Math.PI);
    return `Pushed π (${formatValue(value)})`;
  }

  if (lower === 'e') {
    const value = calc.pushConstant(Math.E);
    return `Pushed e (${formatValue(value)})`;
  }

  if (lower === 'q' || lower === 'quit') {
    return 'Close the tab or navigate away to exit the calculator.';
  }

  if (Object.prototype.hasOwnProperty.call(commands, lower)) {
    const result = commands[lower]();
    return `Result: ${formatValue(result)}`;
  }

  throw new Error(`unknown token '${token}'`);
}

function processToken(raw) {
  const token = raw.trim();
  if (token.length === 0) {
    renderStack();
    return true;
  }

  let success = true;
  const number = Number(token);
  try {
    if (!Number.isNaN(number)) {
      calc.push(number);
      setStatus(`Pushed ${formatValue(number)}`, 'success');
    } else {
      const message = handleCommand(token);
      setStatus(message, 'success');
    }
  } catch (err) {
    setStatus(err.message, 'error');
    success = false;
  }

  renderStack();
  return success;
}

function processPendingEntry() {
  const value = entryEl.value;
  if (value.trim().length === 0) {
    return true;
  }
  const success = processToken(value);
  if (success) {
    entryEl.value = '';
  }
  return success;
}

function submitEntry() {
  const success = processPendingEntry();
  entryEl.focus();
  return success;
}

function clearEntry() {
  entryEl.value = '';
}

enterBtn.addEventListener('click', () => {
  submitEntry();
});

clearEntryBtn.addEventListener('click', () => {
  clearEntry();
  setStatus('Entry cleared');
  entryEl.focus();
});

document.querySelectorAll('[data-append]').forEach((button) => {
  button.addEventListener('click', () => {
    entryEl.value += button.dataset.append;
    entryEl.focus();
  });
});

document.querySelectorAll('[data-command]').forEach((button) => {
  button.addEventListener('click', () => {
    const ok = processPendingEntry();
    if (ok) {
      processToken(button.dataset.command);
    }
    entryEl.focus();
  });
});

entryEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitEntry();
  } else if (event.key === 'Escape') {
    clearEntry();
    setStatus('Entry cleared');
  } else if (['+', '-', '*', '/'].includes(event.key)) {
    event.preventDefault();
    const ok = processPendingEntry();
    if (ok) {
      processToken(event.key);
    }
  }
});

document.addEventListener('keydown', (event) => {
  const { key, target } = event;
  if (target === entryEl) {
    return;
  }

  if (key === 'Enter') {
    event.preventDefault();
    submitEntry();
    return;
  }

  if (['+', '-', '*', '/'].includes(key)) {
    event.preventDefault();
    const ok = processPendingEntry();
    if (ok) {
      processToken(key);
    }
    entryEl.focus();
    return;
  }

  if ((key >= '0' && key <= '9') || key === '.') {
    event.preventDefault();
    entryEl.value += key;
    entryEl.focus();
  }
});

renderStack();
setStatus('Ready');
entryEl.focus();
