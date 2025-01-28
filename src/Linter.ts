import * as vscode from 'vscode';

export interface LinterRule {
    name: string;
    languages?: string[];
    pattern: string;
    flags?: string;
    message: string;
    severity: string;
}

export class Linter implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection();
    private decorationType: vscode.TextEditorDecorationType;
    private subscriptions: vscode.Disposable[] = [];
    
    private name: string;
    private languages?: string[];
    private pattern: RegExp;
    private message: string;
    private severity: vscode.DiagnosticSeverity;
    
    constructor(rule: LinterRule) {
        this.name = rule.name;
        this.languages = rule.languages;
        this.pattern = new RegExp(rule.pattern, rule.flags ?? 'g');
        this.message = rule.message;
        
        const [fgColor, bgColor, bdColor] = (() => {
            switch (rule.severity) {
                case 'Error':
                    this.severity = vscode.DiagnosticSeverity.Error;
                    return [
                        new vscode.ThemeColor('editorError.foreground'),
                        new vscode.ThemeColor('editorError.background'),
                        new vscode.ThemeColor('editorError.border')
                    ];
                
                case 'Information':
                    this.severity = vscode.DiagnosticSeverity.Information;
                    return [
                        new vscode.ThemeColor('editorInfo.foreground'),
                        new vscode.ThemeColor('editorInfo.background'),
                        new vscode.ThemeColor('editorInfo.border')
                    ];
                
                case 'Hint':
                    this.severity = vscode.DiagnosticSeverity.Hint;
                    return [
                        new vscode.ThemeColor('editorHint.foreground'),
                        new vscode.ThemeColor('editorHint.background'),
                        new vscode.ThemeColor('editorHint.border')
                    ];
                
                default:
                    this.severity = vscode.DiagnosticSeverity.Warning;
                    return [
                        new vscode.ThemeColor('editorWarning.foreground'),
                        new vscode.ThemeColor('editorWarning.background'),
                        new vscode.ThemeColor('editorWarning.border')
                    ];
            }
        })();
        
        // Decorations
        this.decorationType = vscode.window.createTextEditorDecorationType({
            // color: fgColor,
            borderColor: bdColor,
            backgroundColor: bgColor,
            overviewRulerColor: fgColor,
            
            borderWidth: '1px',
            borderStyle: 'solid',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
        });
        
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
                    this.message
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
