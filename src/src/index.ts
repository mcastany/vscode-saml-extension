import * as vscode from 'vscode';
import Assertion from './elements/Assertion';
import AuthNRequest from './elements/AuthNRequest';
import LogoutRequest from './elements/LogoutRequest';
import LogoutResponse from './elements/LogoutResponse';
import Response from './elements/Response';
import BaseElement from './elements/BaseElement';

import * as utils from './utils';

const xmldom = require('xmldom');
const zlib   = require('zlib');
const ELEMENT_NODE = 1;

let suggestedPrivateKey;
let suggestedCertificate;

export async function sign(){
  const settings = vscode.workspace.getConfiguration("samlExtension");
  const text = getText();
  if (!text){
    return;
  }

  const samlElement = createSAMLElement(text);          
  if (!(samlElement instanceof BaseElement)){
    return vscode.window.showErrorMessage('XML is not a valid SAML Element');    
  }

  let privateKey = await vscode.window.showInputBox({
    prompt: 'Private Key used to sign the request (it will be kept in memory). If blank, the "signaturePrivateKey" configured option will be used.', 
    value: suggestedPrivateKey 
  });
  if (typeof privateKey === 'undefined') {
    return;
  }

  suggestedPrivateKey = privateKey;
  privateKey = privateKey || settings.privateKey;

  if (!privateKey) {
    return vscode.window.showErrorMessage("You'll need to provide a private key or configure a default in samlExtension.privateKey");
  }

  let certificate = await vscode.window.showInputBox({
    prompt: 'Public Key Certificate to include in the signature. If blank, the "signatureCertificate" configured option will be used.', 
    value: suggestedCertificate
  });
  if (typeof certificate === 'undefined') {
    return;
  }
  suggestedCertificate = certificate;

  certificate = certificate || settings.publicKey;
  if (!certificate) {
    return vscode.window.showErrorMessage("You'll need to provide a certificate or configure a default in samlExtension.publicKey");
  }

  try{
    setText(samlElement.signXml(privateKey, certificate));
  } catch(e){
    return vscode.window.showErrorMessage(e.message);
  } 
};

export function verify(){
  var text = getText();
  if (!text){
    return;
  }

  var samlElement = createSAMLElement(text);
  if (!(samlElement instanceof BaseElement)){
    return vscode.window.showErrorMessage('XML is not a valid SAML Element');    
  }

   vscode.window.showInputBox({prompt: 'Provide public key to validate the certificate? (if empty we\'ll use the embedded cert or the default one)'})
    .then(val => {
      val = utils.formatCert(val || '');
      var validationErrors = samlElement.validateSignature(val);
      if ((validationErrors || []).length > 0) {
        return vscode.window.showErrorMessage(validationErrors.join('; '));
      }
      
      vscode.window.showInformationMessage('SAML signature is valid');   
    }); 
};

export function decrypt(){
  var text = getText();
  if (!text){
    return;
  }

  var samlElement = createSAMLElement(text);
  if (!(samlElement instanceof BaseElement)){
    return vscode.window.showErrorMessage('XML is not a valid SAML Element');    
  }

   vscode.window.showInputBox({prompt: 'Provide Decryption Key'})
    .then(val => {
      if (typeof val === "undefined") {
        return;
      }
      val = utils.formatCert(val || '');
      samlElement.decrypt(val, (err, dec) => {
        if (err) {
          return vscode.window.showErrorMessage(err.message);
        }
        
        setText(dec)
      });
    }); 
};

export function getThumbprint(){
  var text = getText();
  if (!text) {
    return;
  }
  setText(utils.calculateThumbprint(text));
};

export function encode(){
  setText(new Buffer(getText()).toString('base64'));
};

export function encodeAndDeflate(){
  zlib.deflateRaw(new Buffer(getText()), function (err, buffer) {
    if (err) 
      return vscode.window.showErrorMessage(err);
  
    setText(buffer.toString('base64'));  
  });
}

export function decode(){
  setText(new Buffer(getText(), 'base64').toString());
};

export function decodeAndInflate(){
  zlib.inflateRaw(new Buffer(getText(), 'base64'), (err, buffer) => {
    if (err)
      return vscode.window.showErrorMessage(err);

    setText(buffer.toString());
  });
}

export function urlDecode(){
  setText(decodeURIComponent(getText()));
}

export function urlEncode(){
  setText(encodeURIComponent(getText()));
}

export async function extractCertificate() {
  const workspace = vscode.workspace;
  if (!workspace) {
    return;
  }

  var xmlText = getText();
  if (!xmlText) {
    return;
  }
  var samlElement = createSAMLElement(xmlText);
  if (!(samlElement instanceof BaseElement)) {
    return vscode.window.showErrorMessage("The text doesn't appear to be a valid SAML XML document");
  }
  const certs = samlElement.extractCertificates();
  if (certs.length === 0) {
    return vscode.window.showErrorMessage("Couldn't find an x509 certificate");
  }
  let cert;
  // if there's just one, or they are all the same, don't bother showing the options
  if (certs.length === 1 || certs.every(cert => cert.text === certs[0].text)) {
    cert = certs[0];
  } else {
    const selection = await vscode.window.showQuickPick(certs.map(cert => cert.label), {
      placeHolder: "Pick the certificate that you want to extract"
    });
    if (!selection) {
      return;
    }
    cert = certs.find(cert => cert.label === selection);
    if (!cert) {
      return;
    }
  }
  const textDocument = await workspace.openTextDocument( {
    language: "text",
    content: cert.text
  });
  vscode.window.showTextDocument(textDocument);
}

function getText(){
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
      return ;
  }

  var selection = editor.selection;
  // new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE)
  return editor.document.getText(!selection.isEmpty ? selection : undefined);
}

function setText(txt){
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
      return ;
  }

  var selection = editor.selection;  
  editor.edit(function (edit) {
    if (selection.isEmpty){
      return edit.replace(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE), txt); 
    }
    
    edit.replace(selection, txt);
	});
}

function createSAMLElement(text):any{
  var xml = new xmldom.DOMParser().parseFromString(utils.normalizeLineEndings(text));
  var firstChild = xml.firstChild;
  // skip processing instructions
  while (firstChild && firstChild.nodeType !== ELEMENT_NODE) {
    firstChild = firstChild.nextSibling;
  }
  if (!firstChild)
    return 'Invalid XML';

  var nodeName = firstChild.nodeName;
  
  if (!nodeName)
    return 'Invalid XML';

  if (nodeName.indexOf('AuthnRequest') > -1) 
    return new AuthNRequest(xml);
  if (nodeName.indexOf('Assertion') > -1) 
    return new Assertion(xml);
  if (nodeName.indexOf('LogoutRequest') > -1) 
    return new LogoutRequest(xml);
  if (nodeName.indexOf('LogoutResponse') > -1) 
    return new LogoutResponse(xml);
  if (nodeName.indexOf('Response') > -1) 
    return new Response(xml);
  return new BaseElement(xml);
}

