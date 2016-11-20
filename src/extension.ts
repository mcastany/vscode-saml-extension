'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as SAMLExtension from './src';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('xmlSignature.sign', SAMLExtension.sign));
    context.subscriptions.push(vscode.commands.registerCommand('xmlSignature.verify', SAMLExtension.verify));
    context.subscriptions.push(vscode.commands.registerCommand('xmlSignature.encode', SAMLExtension.encode));
    context.subscriptions.push(vscode.commands.registerCommand('xmlSignature.decode', SAMLExtension.decode));
    context.subscriptions.push(vscode.commands.registerCommand('xmlSignature.encodeAndDeflate', SAMLExtension.encodeAndDeflate));
    context.subscriptions.push(vscode.commands.registerCommand('xmlSignature.decodeAndInflate', SAMLExtension.decodeAndInflate));
}

// this method is called when your extension is deactivated
export function deactivate() {
}