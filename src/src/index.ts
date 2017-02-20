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

let suggestedPrivateKey;

export function sign(){
  var text = getText();
  if (!text){
    return;
  }

  vscode.window.showInputBox({prompt: 'Private Key? used to sign the request (it will be kept in memory)', value: suggestedPrivateKey })
    .then(val => {
      if (!val){ 
        return vscode.window.showErrorMessage('Certificate not provided');
      }
      
      suggestedPrivateKey = val;
      val = utils.formatCert(val || '');

      try{
        var samlElement = createSAMLElement(text);          
        setText(samlElement.signXml(val));
      } catch(e){
        return vscode.window.showErrorMessage(e.message);
      } 
    });
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

export function getThumbprint(){
  var text = getText();
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
  var xml = new xmldom.DOMParser().parseFromString(text);

  var nodeName = xml.firstChild.nodeName;
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
}

