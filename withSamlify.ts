import * as fs from 'fs';
import * as saml from 'samlify';

const sp = saml.ServiceProvider({
  metadata: fs.readFileSync('./metadata/sp-metadata.xml') // OBLIGATORIO PARA TRAER VISTA DE LOGIN DESDE SP
  // metadata: 'fsdfsdf'
})

const idp = saml.IdentityProvider({
  isAssertionEncrypted: true,
  // metadata: fs.readFileSync('./metadata/idp.xml'),
  metadata: `asdfsdfsdf`,
  // optional
  // privateKey: fs.readFileSync('./idp-private-key.pem'),
  // encPrivateKey: fs.readFileSync('./idp-private-key.pem'),

  // obligatorio
  privateKey: fs.readFileSync('./keys/idp-private-key.pem'),
  encPrivateKey: fs.readFileSync('./keys/idp-private-key.pem'),
  // obligatorio

  // OPTIONAL
  // dataEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#aes128-cbc',
  // keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-1_5'
})

saml.setSchemaValidator({
  validate: _ => Promise.resolve(_)
})

export {
  sp,
  idp
}
