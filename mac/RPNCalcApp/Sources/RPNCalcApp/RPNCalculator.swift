import Foundation

enum RPNError: LocalizedError {
    case stackUnderflow(String)
    case zeroDivision
    case invalidInput(String)

    var errorDescription: String? {
        switch self {
        case .stackUnderflow(let message):
            return "Error: \(message)"
        case .zeroDivision:
            return "Error: division by zero"
        case .invalidInput(let message):
            return "Error: \(message)"
        }
    }
}

final class CoreRPNCalculator {
    private(set) var stack: [Double] = []

    func push(_ value: Double) {
        stack.append(value)
    }

    @discardableResult
    func pop() throws -> Double {
        guard !stack.isEmpty else {
            throw RPNError.stackUnderflow("stack is empty")
        }
        return stack.removeLast()
    }

    @discardableResult
    func peek() throws -> Double {
        guard let last = stack.last else {
            throw RPNError.stackUnderflow("stack is empty")
        }
        return last
    }

    func clear() {
        stack.removeAll()
    }

    func swap() throws {
        guard stack.count >= 2 else {
            throw RPNError.stackUnderflow("need at least two values to swap")
        }
        stack.swapAt(stack.count - 1, stack.count - 2)
    }

    @discardableResult
    func drop() throws -> Double {
        try pop()
    }

    func dup() throws {
        let value = try peek()
        push(value)
    }

    @discardableResult
    func execute(command: String) throws -> String? {
        let lower = command.lowercased()

        if lower == "clear" || lower == "clr" {
            clear()
            return "Stack cleared"
        }

        switch lower {
        case "+":
            return try binaryOp(name: "+", operation: +)
        case "-":
            return try binaryOp(name: "-", operation: -)
        case "*":
            return try binaryOp(name: "*", operation: *)
        case "/":
            return try divide()
        case "pow":
            return try binaryOp(name: "pow", operation: pow)
        case "sq":
            return try unaryOp(name: "sq") { $0 * $0 }
        case "neg":
            return try unaryOp(name: "neg") { -$0 }
        case "sin":
            return try unaryOp(name: "sin", operation: sin)
        case "cos":
            return try unaryOp(name: "cos", operation: cos)
        case "tan":
            return try unaryOp(name: "tan", operation: tan)
        case "sqrt":
            return try unaryOp(name: "sqrt") {
                if $0 < 0 {
                    throw RPNError.invalidInput("cannot take square root of negative value")
                }
                return sqrt($0)
            }
        case "log":
            return try unaryOp(name: "log") {
                if $0 <= 0 {
                    throw RPNError.invalidInput("log undefined for non-positive values")
                }
                return log10($0)
            }
        case "ln":
            return try unaryOp(name: "ln") {
                if $0 <= 0 {
                    throw RPNError.invalidInput("ln undefined for non-positive values")
                }
                return log($0)
            }
        case "inv":
            return try unaryOp(name: "inv") {
                if $0 == 0 {
                    throw RPNError.zeroDivision
                }
                return 1 / $0
            }
        case "dup":
            try dup()
            return "Duplicated \(formatValue(try peek()))"
        case "swap":
            try swap()
            return "Swapped top two values"
        case "drop":
            let dropped = try drop()
            return "Dropped \(formatValue(dropped))"
        case "pi":
            push(Double.pi)
            return "Pushed π (\(formatValue(Double.pi)))"
        case "e":
            push(M_E)
            return "Pushed e (\(formatValue(M_E)))"
        case "help":
            return CoreRPNCalculator.helpText
        case "q", "quit":
            return "quit"
        default:
            throw RPNError.invalidInput("unknown token '\(command)'")
        }
    }

    private func binaryOp(name: String, operation: (Double, Double) -> Double) throws -> String {
        guard stack.count >= 2 else {
            throw RPNError.stackUnderflow("need at least two values for '\(name)'")
        }
        let rhs = try pop()
        let lhs = try pop()
        let result = operation(lhs, rhs)
        push(result)
        return "Result: \(formatValue(result))"
    }

    private func unaryOp(name: String, operation: (Double) throws -> Double) throws -> String {
        guard !stack.isEmpty else {
            throw RPNError.stackUnderflow("need at least one value for '\(name)'")
        }
        let value = try pop()
        let result = try operation(value)
        push(result)
        return "Result: \(formatValue(result))"
    }

    private func divide() throws -> String {
        guard stack.count >= 2 else {
            throw RPNError.stackUnderflow("need at least two values for '/'")
        }
        let rhs = try pop()
        let lhs = try pop()
        if rhs == 0 {
            push(lhs)
            push(rhs)
            throw RPNError.zeroDivision
        }
        let result = lhs / rhs
        push(result)
        return "Result: \(formatValue(result))"
    }

    static let helpText: String = (
        "Available commands:\n" +
        "  Arithmetic: +, -, *, /, pow, sq\n" +
        "  Transcendental: sin, cos, tan, inv, sqrt, log, ln\n" +
        "  Stack ops: dup, swap, drop, clear/clr\n" +
        "  Constants: pi, e\n" +
        "  Other: neg, help, quit/q\n" +
        "Type numbers and press Enter to push them onto the stack."
    )
}

func formatValue(_ value: Double) -> String {
    if value.isFinite, value.rounded(.towardZero) == value {
        return String(format: "%.0f", value)
    }
    if value.isFinite {
        return String(format: "%.10g", value)
    }
    return String(describing: value)
}
