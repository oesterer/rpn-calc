import SwiftUI
import AppKit

struct KeyCaptureView: NSViewRepresentable {
    typealias NSViewType = KeyCaptureHostingView

    var onKeyDown: (NSEvent) -> Bool

    func makeNSView(context: Context) -> KeyCaptureHostingView {
        let view = KeyCaptureHostingView()
        view.onKeyDown = onKeyDown
        DispatchQueue.main.async {
            view.window?.makeFirstResponder(view)
        }
        return view
    }

    func updateNSView(_ nsView: KeyCaptureHostingView, context: Context) {
        nsView.onKeyDown = onKeyDown
        DispatchQueue.main.async {
            if nsView.window?.firstResponder !== nsView {
                nsView.window?.makeFirstResponder(nsView)
            }
        }
    }
}

final class KeyCaptureHostingView: NSView {
    var onKeyDown: ((NSEvent) -> Bool)?

    override var acceptsFirstResponder: Bool { true }

    override func keyDown(with event: NSEvent) {
        if onKeyDown?(event) != true {
            super.keyDown(with: event)
        }
    }
}
