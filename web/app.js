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
    inv: () => calc.invert(),
    pow: () => calc.power(),
    neg: () => calc.negate(),
  };

  const lower = token.toLowerCase();

  if (lower === 'clear') {
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
    return;
  }

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
  }

  renderStack();
}

function submitEntry() {
  const value = entryEl.value;
  processToken(value);
  entryEl.value = '';
}

function clearEntry() {
  entryEl.value = '';
}

enterBtn.addEventListener('click', () => {
  submitEntry();
  entryEl.focus();
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
    processToken(button.dataset.command);
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
  }
});

document.addEventListener('keydown', (event) => {
  const { key, target } = event;
  if (target === entryEl) {
    if (['+', '-', '*', '/'].includes(key) && entryEl.value === '') {
      event.preventDefault();
      processToken(key);
      return;
    }
    return;
  }

  if (key === 'Enter') {
    event.preventDefault();
    submitEntry();
    entryEl.focus();
    return;
  }

  if (['+', '-', '*', '/'].includes(key) && entryEl.value === '') {
    event.preventDefault();
    processToken(key);
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
