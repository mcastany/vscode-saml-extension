import { calculateThumbprint } from "../utils";

const vscode        = require('vscode');
const xmlCrypto     = require('xml-crypto');
const xpath         = require('xpath');
const crypto        = require('crypto');
const xmlenc        = require('xml-encryption');
const SignedXml     = xmlCrypto.SignedXml;
const utils         = require('../utils');
const algorithms = {
  signature: {
    'rsa-sha256': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    'rsa-sha1':  'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
  },
  digest: {
    'sha256': 'http://www.w3.org/2001/04/xmlenc#sha256',
    'sha1': 'http://www.w3.org/2000/09/xmldsig#sha1'
  }
};

// xmlcrypto will use [ 'Id', 'ID', 'id' ] as possible ID attributes
// https://github.com/yaronn/xml-crypto/blob/6b9723785fe9f34ba363175468ee4e498015cd78/lib/signed-xml.js#L312
// we'll add this one too, seen on some SAML responses.
const additionalIdAttribute = "AssertionID";

export default class BaseElement{
  _sig_alg: string;
  _digest_alg: string;
  _publicKey: string; 
  _signingKey: string;
  _transforms: string;
  _signaturePrefix: string;
  _xml: any;

  idAttribute: string;
  reference: string;
  signaturePath: string;
  
  constructor(xml) {
    var settings = vscode.workspace.getConfiguration("samlExtension");
    this._sig_alg = settings.sig_alg;
    this._digest_alg = settings.digest_alg;
    this._publicKey = settings.publicKey; 
    this._signingKey = settings.signingKey;
    this._transforms = settings.transforms;
    this._signaturePrefix = settings.signaturePrefix;
    this._xml = xml;
  }

  signXml(privateKey, certificate) {
    var sig = new SignedXml(null, {
      signatureAlgorithm: algorithms.signature[this._sig_alg],
      idAttribute: additionalIdAttribute
    });

    sig.addReference(this.reference, this._transforms, algorithms.digest[this._digest_alg]);
    sig.signingKey = utils.formatCert(privateKey);

    sig.keyInfoProvider = {
      getKeyInfo: (key, prefix) => {
        prefix = prefix ? prefix + ':' : prefix;
        
        if (!certificate) return `<${prefix}X509Data></${prefix}X509Data>`;

        return `<${prefix}X509Data><${prefix}X509Certificate>${utils.removeHeaders(certificate)}</${prefix}X509Certificate></${prefix}X509Data>"`;
      }
    };
    sig.computeSignature(this._xml.toString(), {
      location: {
        reference: "//*[local-name(.)='Issuer']",
        action: 'after'
      },
      prefix: this._signaturePrefix || ''
    });

    // re-encode any previously encoded carriage return 
    return utils.encodeCarriageReturns(sig.getSignedXml());
  }

  validateSignature(public_key?: string) {
    try{
      var signature = xpath.select(this.signaturePath, this._xml)[0];
      if (!signature){
        return [];
      }

      var sig = new xmlCrypto.SignedXml(null, { idAttribute: additionalIdAttribute });
      sig.keyInfoProvider = {
        getKeyInfo: function() {
          return '<X509Data></X509Data>';
        },
        getKey: (keyInfo) => {
          // Use the cert passed by the command
          if (public_key){
            return  utils.certToPEM(public_key);
          }

          // Use embedded cert          
          if(keyInfo && keyInfo.length > 0){
            var embeddedSignature = keyInfo[0].getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "X509Certificate");
            if (embeddedSignature.length > 0) {
              var base64cer = embeddedSignature[0].firstChild.toString();
              return utils.certToPEM(base64cer);
            }  
          }

          // Use the one configured in settings
          return  utils.certToPEM(this._publicKey || '');
        }
      };

      sig.loadSignature(signature.toString());
      sig.checkSignature(this._xml.toString());
      
      return sig.validationErrors;
    } catch(e){
      return [`Error checking signature: ${e}`];
    }
  } 

  decrypt(key: string, cb){
    if (!key) {
      return cb(null, this._xml.toString());
    }

    var encryptedAssertion = this._xml.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'EncryptedAssertion');
    if (encryptedAssertion.length > 1) {
      return cb(new Error('A SAMLResponse can contains only one EncryptedAssertion element.'));
    }

    var encryptedToken = encryptedAssertion[0];
    if (encryptedToken) {
      var encryptedData = encryptedToken.getElementsByTagNameNS('http://www.w3.org/2001/04/xmlenc#', 'EncryptedData')[0];
      if (!encryptedData) {
        return cb(null,this._xml.toString());
      }
      
      return xmlenc.decrypt(encryptedData, { key: key,}, (err, val) => {
        if (err) return cb(err);

        cb(null, utils.encodeCarriageReturns(this._xml.toString().replace(encryptedToken.toString(), val)));
      });
    }
  }

  // Creates a label for the certificate, showing the path until reaching the KeyInfo element.
  // It includes the "use" attribute for KeyDescriptor, and the "type" for RoleDescriptor elements
  // so you get things like:
  // 'EntityDescriptor/IDPSSODescriptor/KeyDescriptor[use="signing"]' 
  // and 
  // 'EntityDescriptor/RoleDescriptor[type="fed:ApplicationServiceType"]/KeyDescriptor[use="signing"]'
  //
  // These labels are useful if there are multiple certs in the document and the user needs to choose one
  static getCertificateLabel(xmlElement) {
    const segments = [];
    let parent = xmlElement;
    while(parent.localName !== "KeyInfo") {
      parent = parent.parentNode;
    } 
    parent = parent.parentNode;

    while (parent) {
      if (parent.localName) {
        let segment = parent.localName;
        if (parent.localName === "KeyDescriptor") {
          const useAttribute = parent.attributes.getNamedItem("use");
          if (useAttribute) {
            segment += `[use="${useAttribute.value}"]`;
          }
        }

        if (parent.localName === "RoleDescriptor") {
          const typeAttribute = parent.attributes.getNamedItemNS("http://www.w3.org/2001/XMLSchema-instance", "type");
          if (typeAttribute) {
            segment += `[type="${typeAttribute.value}"]`;
          }
        }
        segments.unshift(segment);
      }

      parent = parent.parentNode;
    }

    return segments.join("/");
  }

  extractCertificates() {
    const allCerts = "//*[local-name(.)='KeyInfo' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']/*[local-name(.)='X509Data']/*[local-name(.)='X509Certificate']"
    const certificates = xpath.select(allCerts, this._xml);

    const results = [];

    let index = 1;
    for(const certificate of certificates) {
      const certificateText = xpath.select("text()", certificate);
      if (certificateText && certificateText.length === 1) {
        const pem = utils.certToPEM(certificateText[0].toString().trim());
        results.push({
          label: `${index} - ${BaseElement.getCertificateLabel(certificate)} - ${calculateThumbprint(pem)}`,
          text: pem
        });
        index++;
      }
    }

    return results;
  }
}
