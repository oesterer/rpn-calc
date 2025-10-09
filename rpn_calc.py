#!/usr/bin/env python3
"""Command-line Reverse Polish Notation (RPN) calculator."""

from __future__ import annotations

import math
import sys
import termios
from typing import Callable, Dict, List


class StackUnderflowError(Exception):
    """Raised when an operation requires more operands than available."""


class RPNCalculator:
    """A simple stack-based calculator supporting RPN operations."""

    def __init__(self) -> None:
        self.stack: List[float] = []

    def push(self, value: float) -> None:
        self.stack.append(value)

    def pop(self) -> float:
        if not self.stack:
            raise StackUnderflowError("stack is empty")
        return self.stack.pop()

    def peek(self) -> float:
        if not self.stack:
            raise StackUnderflowError("stack is empty")
        return self.stack[-1]

    def clear(self) -> None:
        self.stack.clear()

    def drop(self) -> float:
        return self.pop()

    def dup(self) -> None:
        self.push(self.peek())

    def swap(self) -> None:
        if len(self.stack) < 2:
            raise StackUnderflowError("need at least two values to swap")
        self.stack[-1], self.stack[-2] = self.stack[-2], self.stack[-1]

    def binary_op(self, func: Callable[[float, float], float], op_name: str) -> float:
        if len(self.stack) < 2:
            raise StackUnderflowError(f"need at least two values for '{op_name}'")
        b = self.pop()
        a = self.pop()
        result = func(a, b)
        self.push(result)
        return result

    def unary_op(self, func: Callable[[float], float], op_name: str) -> float:
        value = self.pop()
        result = func(value)
        self.push(result)
        return result

    def add(self) -> float:
        return self.binary_op(lambda a, b: a + b, "+")

    def subtract(self) -> float:
        return self.binary_op(lambda a, b: a - b, "-")

    def multiply(self) -> float:
        return self.binary_op(lambda a, b: a * b, "*")

    def divide(self) -> float:
        def safe_div(a: float, b: float) -> float:
            if b == 0:
                raise ZeroDivisionError("division by zero")
            return a / b

        return self.binary_op(safe_div, "/")

    def sine(self) -> float:
        return self.unary_op(math.sin, "sin")

    def cosine(self) -> float:
        return self.unary_op(math.cos, "cos")

    def invert(self) -> float:
        def safe_inv(value: float) -> float:
            if value == 0:
                raise ZeroDivisionError("cannot invert zero")
            return 1 / value

        return self.unary_op(safe_inv, "inv")

    def power(self) -> float:
        def pow_func(a: float, b: float) -> float:
            return math.pow(a, b)

        return self.binary_op(pow_func, "pow")

    def negate(self) -> float:
        return self.unary_op(lambda value: -value, "neg")


def format_value(value: float) -> str:
    if math.isfinite(value) and float(value).is_integer():
        return str(int(value))
    return f"{value:.10g}"


def display_stack(stack: List[float]) -> None:
    print("Stack (bottom -> top):")
    last_values = stack[-5:]
    padding = 5 - len(last_values)
    for _ in range(padding):
        print("  -: ")
    start_index = len(stack) - len(last_values) + 1
    for offset, value in enumerate(last_values):
        index_label = start_index + offset
        print(f" {index_label:>2}: {format_value(value)}")


def parse_number(token: str) -> float | None:
    try:
        return float(token)
    except ValueError:
        return None


def handle_command(calc: RPNCalculator, token: str) -> tuple[bool, str | None]:
    commands: Dict[str, Callable[[], float]] = {
        "+": calc.add,
        "-": calc.subtract,
        "*": calc.multiply,
        "/": calc.divide,
        "sin": calc.sine,
        "cos": calc.cosine,
        "inv": calc.invert,
        "pow": calc.power,
        "neg": calc.negate,
    }

    lower = token.lower()

    if lower in ("q", "quit"):
        return False, None

    if lower == "clear":
        calc.clear()
        return True, "Stack cleared"

    if lower == "swap":
        calc.swap()
        return True, "Swapped top two values"

    if lower == "drop":
        dropped = calc.drop()
        return True, f"Dropped {format_value(dropped)}"

    if lower == "dup":
        value = calc.peek()
        calc.dup()
        return True, f"Duplicated {format_value(value)}"

    if lower in commands:
        result = commands[lower]()
        return True, f"Result: {format_value(result)}"

    raise ValueError(f"unknown token '{token}'")


def process_token(calc: RPNCalculator, token: str) -> bool:
    token = token.strip()

    if not token:
        display_stack(calc.stack)
        return True

    number = parse_number(token)

    try:
        if number is not None:
            calc.push(number)
            print(f"Pushed {format_value(number)}")
        else:
            should_continue, message = handle_command(calc, token)
            if not should_continue:
                return False
            if message:
                print(message)
    except (StackUnderflowError, ZeroDivisionError, ValueError) as err:
        print(f"Error: {err}")
    else:
        display_stack(calc.stack)
        return True

    display_stack(calc.stack)
    return True


def repl() -> None:
    calc = RPNCalculator()
    intro = (
        "RPN calculator ready. Numbers require Enter; operators (+, -, *, /) execute immediately."
    )
    print(intro)
    print("Commands: sin, cos, inv, pow, neg, swap, drop, dup, clear, quit.")

    if not sys.stdin.isatty() or not sys.stdout.isatty():
        while True:
            try:
                raw = input(">> ")
            except EOFError:
                print()
                break
            except KeyboardInterrupt:
                print("\nInterrupted. Use 'quit' to exit.")
                continue

            if not process_token(calc, raw):
                break

        print("Goodbye!")
        return

    fd = sys.stdin.fileno()
    old_attrs = termios.tcgetattr(fd)
    new_attrs = termios.tcgetattr(fd)
    new_attrs[3] &= ~(termios.ECHO | termios.ICANON)
    new_attrs[6][termios.VMIN] = 1
    new_attrs[6][termios.VTIME] = 0

    termios.tcsetattr(fd, termios.TCSADRAIN, new_attrs)

    prompt = ">> "
    buffer = ""

    def show_prompt() -> None:
        sys.stdout.write(prompt)
        sys.stdout.write(buffer)
        sys.stdout.flush()

    running = True

    try:
        show_prompt()
        while running:
            ch = sys.stdin.read(1)
            if ch == "":
                break

            if ch == "\x03":  # Ctrl-C
                print("\nInterrupted. Use 'quit' to exit.")
                buffer = ""
                show_prompt()
                continue

            if ch == "\x04":  # Ctrl-D
                print()
                break

            if ch == "\x7f":  # Backspace
                if buffer:
                    buffer = buffer[:-1]
                    sys.stdout.write("\b \b")
                    sys.stdout.flush()
                continue

            if ch in "+-*/" and not buffer:
                sys.stdout.write(ch + "\n")
                sys.stdout.flush()
                running = process_token(calc, ch)
                if running:
                    buffer = ""
                    show_prompt()
                continue

            if ch in ("\n", "\r"):
                sys.stdout.write("\n")
                sys.stdout.flush()
                running = process_token(calc, buffer)
                if running:
                    buffer = ""
                    show_prompt()
                continue

            buffer += ch
            sys.stdout.write(ch)
            sys.stdout.flush()
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_attrs)

    print("Goodbye!")


if __name__ == "__main__":
    repl()
