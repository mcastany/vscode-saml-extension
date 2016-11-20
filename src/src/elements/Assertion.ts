import BaseElement from './BaseElement';

export default class Assertion extends BaseElement {
  constructor(xml){
    super(xml);
    this.signaturePath = "//*[local-name(.)='Assertion']/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']";
    this.reference = "//*[local-name(.)='Assertion']";
  } 
}
