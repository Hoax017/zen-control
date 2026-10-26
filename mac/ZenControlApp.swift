// Native launcher for "Zen Control.app": a Dock icon and a menu, so the app can be quit like any other.
// It starts the bundled server (Contents/MacOS/zen-control), opens the page once it answers, and stops
// the server when the app quits. Clicking the Dock icon reopens the page.

import AppKit

let port = 8765
let pageURL = URL(string: "http://localhost:\(port)/")!
let french = Locale.preferredLanguages.first?.hasPrefix("fr") ?? false
func tr(_ fr: String, _ en: String) -> String { french ? fr : en }

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var server: Process?
    private var quitting = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        startServer()
        openWhenReady(deadline: Date().addingTimeInterval(20))
    }

    private func startServer() {
        let p = Process()
        p.executableURL = Bundle.main.bundleURL.appendingPathComponent("Contents/MacOS/zen-control")
        p.arguments = ["--no-browser"]
        var env = ProcessInfo.processInfo.environment
        env["ZEN_APP"] = "1"  // the Dock icon is how the user quits: no idle auto-exit
        p.environment = env
        // If the server stops (Quit button in the page, crash), the app goes away with it.
        p.terminationHandler = { [weak self] _ in
            DispatchQueue.main.async { if self?.quitting == false { NSApp.terminate(nil) } }
        }
        do { try p.run(); server = p } catch {
            alert(tr("Zen Control n'a pas pu démarrer.", "Zen Control could not start."), error.localizedDescription)
            NSApp.terminate(nil)
        }
    }

    /// Waits for the server to answer, then opens the page in the default browser.
    private func openWhenReady(deadline: Date) {
        var req = URLRequest(url: URL(string: "http://127.0.0.1:\(port)/api/build")!)
        req.setValue("1", forHTTPHeaderField: "x-zen")
        req.timeoutInterval = 1
        URLSession.shared.dataTask(with: req) { _, resp, _ in
            DispatchQueue.main.async {
                if (resp as? HTTPURLResponse)?.statusCode == 200 { self.openPage() }
                else if Date() < deadline {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.openWhenReady(deadline: deadline) }
                }
            }
        }.resume()
    }

    @objc func openPage() {
        if ProcessInfo.processInfo.environment["ZEN_NO_BROWSER"] == nil { NSWorkspace.shared.open(pageURL) }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        openPage()
        return true
    }

    func applicationDockMenu(_ sender: NSApplication) -> NSMenu? {
        let m = NSMenu()
        m.addItem(withTitle: tr("Ouvrir la page", "Open the page"), action: #selector(openPage), keyEquivalent: "")
        return m
    }

    func applicationWillTerminate(_ notification: Notification) {
        quitting = true
        guard let p = server, p.isRunning else { return }
        p.terminate()
        p.waitUntilExit()
    }

    private func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem()
        main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: tr("Ouvrir la page", "Open the page"), action: #selector(openPage), keyEquivalent: "o")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: tr("Masquer Zen Control", "Hide Zen Control"), action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: tr("Quitter Zen Control", "Quit Zen Control"), action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        NSApp.mainMenu = main
    }

    private func alert(_ title: String, _ text: String) {
        let a = NSAlert()
        a.messageText = title
        a.informativeText = text
        a.runModal()
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
