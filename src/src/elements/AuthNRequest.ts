import BaseElement from './BaseElement';

export default class AuthNRequest extends BaseElement {
  constructor(xml){
    super(xml);
    this.signaturePath = "//*[local-name(.)='AuthnRequest']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']";
    this.reference = "//*[local-name(.)='AuthnRequest' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']";
  } 
}
