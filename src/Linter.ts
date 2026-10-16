import * as vscode from 'vscode';

export interface LinterRule {
    name: string;
    languages?: string[];
    pattern: string;
    flags?: string;
    message?: string;
    severity: string;
    deco?: boolean;
    back?: string;
    ruler?: string;
    bord?: string;
}

export class Linter implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection();
    private decorationType: vscode.TextEditorDecorationType;
    private subscriptions: vscode.Disposable[] = [];
    
    private name: string;
    private languages?: string[];
    private pattern: RegExp;
    private message?: string;
    private severity: vscode.DiagnosticSeverity;
    private deco?: boolean;
    private back?: string;
    private ruler?: string;
    private bord?: string;
    
    constructor(rule: LinterRule) {
        this.name = rule.name;
        this.languages = rule.languages;
        this.pattern = new RegExp(rule.pattern, rule.flags ?? 'g');
        // this.message = rule.message;
        this.deco = rule.deco ?? true;
        this.back = rule.back;
        this.ruler = rule.ruler;
        this.bord = rule.bord;
        
        const [rlColor, bgColor, bdColor] = (() => {
            switch (rule.severity) {
                case 'Error':
                    this.severity = vscode.DiagnosticSeverity.Error;
                    this.message = rule.message ?? "Error"
                    return [
                        this.ruler ?? new vscode.ThemeColor('editorError.foreground'),
                        this.back ?? new vscode.ThemeColor('editorError.background'),
                        this.bord ?? new vscode.ThemeColor('editorError.border')
                    ];
                
                case 'Information':
                    this.severity = vscode.DiagnosticSeverity.Information;
                    this.message = rule.message ?? "Information"
                    return [
                        this.ruler ?? new vscode.ThemeColor('editorInfo.foreground'),
                        this.back ?? new vscode.ThemeColor('editorInfo.background'),
                        this.bord ?? new vscode.ThemeColor('editorInfo.border')
                    ];
                
                case 'Hint':
                    this.severity = vscode.DiagnosticSeverity.Hint;
                    this.message = rule.message ?? "Hint"
                    return [
                        this.ruler ?? new vscode.ThemeColor('editorHint.foreground'),
                        this.back ?? new vscode.ThemeColor('editorHint.background'),
                        this.bord ?? new vscode.ThemeColor('editorHint.border')
                    ];
                
                default:
                    this.severity = vscode.DiagnosticSeverity.Warning;
                    this.message = rule.message ?? "Warning"
                    return [
                        this.ruler ?? new vscode.ThemeColor('editorWarning.foreground'),
                        this.back ?? new vscode.ThemeColor('editorWarning.background'),
                        this.bord ?? new vscode.ThemeColor('editorWarning.border')
                    ];
            }
        })();
        
        if (this.deco) {
            // Decorations
            this.decorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: bgColor,
                // color: fgColor,
                borderColor: bdColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                overviewRulerColor: rlColor,
                overviewRulerLane: vscode.OverviewRulerLane.Right
            });
            
        } else {
            this.decorationType = vscode.window.createTextEditorDecorationType({});
        }
        this.subscriptions.push(this.decorationType);
        
        // Register event listeners
        vscode.workspace.onDidChangeTextDocument(
            () => this.lint(vscode.window.activeTextEditor),
            this,
            this.subscriptions
        );
        
        vscode.window.onDidChangeActiveTextEditor(
            (textEditor) => this.lint(textEditor),
            this,
            this.subscriptions
        );
        
        // Run once on create
        if (vscode.window.activeTextEditor) {
            this.lint(vscode.window.activeTextEditor);
        }
    }
    
    private lint(textEditor?: vscode.TextEditor) {
        if (!textEditor) {
            return;
        }
        
        const doc = textEditor.document;
        
        // Only lint on configured languages (if any)
        if (this.languages && this.languages.indexOf(doc.languageId) === -1) {
            return;
        }
        
        const diagnostics: vscode.Diagnostic[] = [];
        const decorationOptions: vscode.DecorationOptions[] = [];
        
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i);
            
            let match;
            while ((match = this.pattern.exec(line.text))) {
                const s = match[0];
                
                const start = new vscode.Position(i, match.index);
                const end = new vscode.Position(i, match.index + s.length);
                const range = new vscode.Range(start, end);
                const message = s.replace(
                    new RegExp(this.pattern.source),
                    this.message!
                );
                
                diagnostics.push({
                    code: this.name,
                    range,
                    message,
                    severity: this.severity,
                });
                
                decorationOptions.push({
                    range,
                    hoverMessage: message,
                });
            }
        }
        
        this.diagnosticCollection.set(textEditor.document.uri, diagnostics);
        
        textEditor.setDecorations(this.decorationType, decorationOptions);
    }
    
    dispose() {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
        
        vscode.Disposable.from(...this.subscriptions).dispose();
    }
}
