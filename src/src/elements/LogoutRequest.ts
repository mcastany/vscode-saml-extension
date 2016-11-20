import BaseElement from './BaseElement';

export default class LogoutRequest extends BaseElement {
  constructor(xml){
    super(xml);
    this.signaturePath = "//*[local-name(.)='LogoutRequest']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']";
    this.reference = "//*[local-name(.)='LogoutRequest' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']";
  } 
}
