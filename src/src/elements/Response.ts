import BaseElement from './BaseElement';
import Assertion from './Assertion';

const xpath  = require('xpath');
const xmldom = require('xmldom');

export default class Response extends BaseElement {
  Assertion: Assertion;
  signedResponse: boolean;
  signedAssertion: boolean;

  constructor(xml){
    super(xml);
    this.signaturePath = "//*[local-name(.)='Response']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']";
    this.reference =  "//*[local-name(.)='Response' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']";
    this.signedResponse = true;

    const assertion = xpath.select("//*[local-name(.)='Assertion']", this._xml)[0];
    if (assertion)    
      this.Assertion = new Assertion(xml);
  } 

  signXml(key){
    let xml;

    if (this.signedResponse){
      return super.signXml(key);
    } else {
      return this.Assertion.signXml(key);
    }
  }

  validateSignature(public_key?: string){
    const validationErrors = super.validateSignature(public_key);
    if (!this.Assertion)
      return validationErrors;
    
    return (validationErrors || []).concat(this.Assertion.validateSignature(public_key));
  }
}
