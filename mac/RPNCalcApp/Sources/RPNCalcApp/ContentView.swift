import SwiftUI
import AppKit
import Foundation

final class RPNViewModel: ObservableObject {
    struct StackRow: Identifiable {
        let id = UUID()
        let label: String
        let value: String
        let isPlaceholder: Bool
    }

    @Published var stackRows: [StackRow] = []
    @Published var entry: String = ""
    @Published var statusText: String = "Ready"
    @Published var statusIsError: Bool = false
    @Published var showingHelp: Bool = false

    let helpText = CoreRPNCalculator.helpText

    private let calculator = CoreRPNCalculator()

    init() {
        refreshStack()
    }

    @discardableResult
    func pushEntryIfNeeded() -> Bool {
        let trimmed = entry.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return true }
        guard let value = Double(trimmed) else {
            setStatus("Invalid number", isError: true)
            return false
        }
        calculator.push(value)
        entry = ""
        setStatus("Pushed \(formatValue(value))", isError: false)
        refreshStack()
        return true
    }

    func submitEntry() {
        _ = pushEntryIfNeeded()
    }

    func clearEntry() {
        entry = ""
        setStatus("Entry cleared", isError: false)
    }

    func appendToEntry(_ character: Character) {
        entry.append(character)
    }

    func removeLastCharacter() {
        guard !entry.isEmpty else { return }
        entry.removeLast()
    }

    func triggerCommand(_ command: String) {
        guard pushEntryIfNeeded() else { return }
        perform(command: command)
    }

    func perform(command: String) {
        do {
            if let message = try calculator.execute(command: command) {
                if message == "quit" {
                    setStatus("Use ⌘+Q to quit the app.", isError: false)
                } else if message == CoreRPNCalculator.helpText {
                    showingHelp = true
                    setStatus("Showing help", isError: false)
                } else {
                    setStatus(message, isError: false)
                }
            } else {
                setStatus("OK", isError: false)
            }
        } catch let error as RPNError {
            setStatus(error.errorDescription ?? "Error", isError: true)
        } catch {
            setStatus(error.localizedDescription, isError: true)
        }

        refreshStack()
    }

    func handleKey(_ event: NSEvent) -> Bool {
        if event.keyCode == 53 { // Escape
            clearEntry()
            return true
        }

        if event.keyCode == 51 { // Delete / Backspace
            removeLastCharacter()
            return true
        }

        if event.keyCode == 36 || event.keyCode == 76 { // Return or keypad Enter
            submitEntry()
            return true
        }

        guard let characters = event.charactersIgnoringModifiers, !characters.isEmpty else {
            return false
        }

        let modifiers = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
        if modifiers.contains(.command) || modifiers.contains(.option) || modifiers.contains(.control) {
            return false
        }

        for character in characters {
            switch character {
            case "+", "-", "*", "/":
                guard pushEntryIfNeeded() else { return true }
                perform(command: String(character))
                return true
            case ".":
                if !entry.contains(".") {
                    appendToEntry(character)
                }
                return true
            case "0"..."9":
                appendToEntry(character)
                return true
            case "p":
                guard pushEntryIfNeeded() else { return true }
                perform(command: "pi")
                return true
            case "e":
                guard pushEntryIfNeeded() else { return true }
                perform(command: "e")
                return true
            case "h":
                perform(command: "help")
                return true
            default:
                break
            }
        }

        return false
    }

    private func refreshStack() {
        let values = calculator.stack
        let recent = Array(values.suffix(5))
        let padding = max(0, 5 - recent.count)
        var rows: [StackRow] = []
        for _ in 0..<padding {
            rows.append(StackRow(label: "-", value: "", isPlaceholder: true))
        }
        let startIndex = values.count - recent.count + 1
        for (offset, value) in recent.enumerated() {
            let label = String(startIndex + offset)
            rows.append(StackRow(label: label, value: formatValue(value), isPlaceholder: false))
        }
        stackRows = rows
    }

    private func setStatus(_ text: String, isError: Bool) {
        statusText = text
        statusIsError = isError
    }
}

struct ContentView: View {
    @StateObject private var viewModel = RPNViewModel()

    private let numberLayout: [[String]] = [
        ["7", "8", "9"],
        ["4", "5", "6"],
        ["1", "2", "3"],
        ["dup", "0", "."]
    ]

    private let commandButtons: [String] = [
        "+", "-", "*", "/",
        "pow", "sqrt", "sq", "sin",
        "cos", "tan", "log", "ln",
        "inv", "neg", "swap", "drop",
        "clear", "clr", "pi", "e",
        "help"
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("RPN Calculator")
                    .font(.title)
                    .bold()
                Text("Type numbers and press Enter to push. Operators fire immediately.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Stack (bottom → top)")
                    .font(.headline)
                VStack(spacing: 4) {
                    ForEach(viewModel.stackRows) { row in
                        HStack {
                            Text(row.label)
                                .font(.system(.body, design: .monospaced))
                                .foregroundColor(row.isPlaceholder ? .secondary : .accentColor)
                            Spacer()
                            Text(row.value)
                                .font(.system(.body, design: .monospaced))
                        }
                        .padding(.vertical, 6)
                        .padding(.horizontal, 10)
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(nsColor: row.isPlaceholder ? .windowBackgroundColor : .controlBackgroundColor))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.secondary.opacity(0.25), lineWidth: 1)
                                )
                        )
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Entry")
                    .font(.headline)
                HStack {
                    Text(viewModel.entry.isEmpty ? " " : viewModel.entry)
                        .font(.system(size: 24, design: .monospaced))
                        .padding(.vertical, 8)
                        .padding(.horizontal, 12)
                        .frame(minWidth: 140, alignment: .trailing)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.secondary.opacity(0.4), lineWidth: 1)
                        )
                        .accessibilityLabel("Entry field")
                    Button("Enter") {
                        viewModel.submitEntry()
                    }
                    .keyboardShortcut(.return, modifiers: [])
                    Button("CE") {
                        viewModel.clearEntry()
                    }
                    .keyboardShortcut(.escape, modifiers: [])
                }
            }

            HStack(alignment: .top, spacing: 16) {
                VStack(spacing: 8) {
                    ForEach(numberLayout, id: \.self) { row in
                        HStack(spacing: 8) {
                            ForEach(row, id: \.self) { label in
                                Button(label) {
                                    handleNumberButton(label)
                                }
                                .buttonStyle(CalculatorButtonStyle())
                            }
                        }
                    }
                }

                let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 4)
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(commandButtons, id: \.self) { label in
                        Button(label) {
                            handleCommandButton(label)
                        }
                        .buttonStyle(CalculatorButtonStyle())
                    }
                }
            }

            Text(viewModel.statusText)
                .font(.subheadline)
                .foregroundColor(viewModel.statusIsError ? .red : .accentColor)
        }
        .padding(20)
        .background(
            KeyCaptureView { event in
                viewModel.handleKey(event)
            }
            .frame(width: 0, height: 0)
        )
        .frame(minWidth: 480, idealWidth: 520)
        .sheet(isPresented: $viewModel.showingHelp) {
            ScrollView {
                Text(viewModel.helpText)
                    .font(.system(.body, design: .monospaced))
                    .padding()
            }
            .frame(width: 420, height: 260)
        }
    }

    private func handleNumberButton(_ label: String) {
        switch label {
        case "dup":
            viewModel.triggerCommand("dup")
        case ".":
            if !viewModel.entry.contains(".") {
                viewModel.appendToEntry(".")
            }
        default:
            if let scalar = label.unicodeScalars.first, CharacterSet.decimalDigits.contains(scalar) {
                viewModel.appendToEntry(Character(label))
            }
        }
    }

    private func handleCommandButton(_ label: String) {
        viewModel.triggerCommand(label)
    }
}

struct CalculatorButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.body, design: .monospaced).bold())
            .frame(minWidth: 48, minHeight: 36)
            .padding(.vertical, 6)
            .background(configuration.isPressed ? Color.accentColor.opacity(0.6) : Color(nsColor: .controlBackgroundColor))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.secondary.opacity(0.4), lineWidth: 1)
            )
            .foregroundColor(.primary)
    }
}
