'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as SAMLExtension from './src';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.sign', SAMLExtension.sign));
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.verify', SAMLExtension.verify));
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.encode', SAMLExtension.encode));
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.decode', SAMLExtension.decode));
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.encodeAndDeflate', SAMLExtension.encodeAndDeflate));
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.decodeAndInflate', SAMLExtension.decodeAndInflate));
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.encodeUrl', SAMLExtension.urlEncode));
    context.subscriptions.push(vscode.commands.registerCommand('samlExtension.decodeUrl', SAMLExtension.urlDecode));
}

// this method is called when your extension is deactivated
export function deactivate() {
}