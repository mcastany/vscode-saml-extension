import BaseElement from './BaseElement';

export default class LogoutResponse extends BaseElement {
  constructor(xml){
    super(xml);
    this.signaturePath = "//*[local-name(.)='LogoutResponse']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']";
    this.reference = "//*[local-name(.)='LogoutResponse' and namespace-uri(.)='urn:oasis:names:tc:SAML:2.0:protocol']";
  } 
}
