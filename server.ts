if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'
import 'zone.js/dist/zone-node';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';

import { AppServerModule } from './src/main.server';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';
import * as bodyParser from 'body-parser'
import * as path from 'path'
import * as expressSanitizer from 'express-sanitizer';
import { sp, idp } from './withSamlify';
// import * as db from './db';
import * as mysql from 'mysql2';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): any {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/angular-SSR-Demo/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  server.use(bodyParser.urlencoded({ extended: false }))
  server.use(expressSanitizer());

const db = mysql.createPool({
  host: "idp-soyyo-test-bd.cvxhtedkaix9.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "rRGpdFVbFcnsnjNJiH90",
  database: "idpsoyyotest"
})

const spurl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://saml-sp-kahuna.herokuapp.com'

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // console.log(indexHtml);
  // console.log(APP_BASE_HREF);
  // console.log(req.baseUrl);

  server.post('/addEntity', async (req:any, res:any) => {

    // Validate request
    if (!req.body) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    const entityName = req.sanitize(req.body.name);
    const acs = req.sanitize(req.body.acs);
    // const acs = req.sanitize(req.body.acs).replace('http:', 'http://').replace('https:', 'https://');
    // console.log(entityName);
    // console.log(acs);

    let sql = `INSERT INTO entities VALUES(null, '${entityName}', '${acs}')`;

    await db.execute(sql)

    const sql2 = `SELECT * FROM entities;`;

    const addedEntity = await db.query(sql2)

    return res.render('entities', { addedEntity: addedEntity[0] })

    // res.json({ "status": "Entidad Guardada" });
  })

  server.post('/login', async (req:any, res:any) => {
    const { samlContent, extract } = await idp.parseLoginRequest(sp, 'post', req)

    // console.log(extract);

    req.extract = extract
    const resp = await idp.createLoginResponse(
      sp,
      req,
      'post',
      {
        email: 'arandjel.sarenac@gmail.com'
      },
      undefined,
      true
    )
    const { id, context, entityEndpoint, type } = resp
    return res.redirect(spurl + '/login/callback/?SAMLReponse=' + context)
  })

  server.get('/login', async (req:any, res:any) => {

    // DEPENDIENDO LA URL DEL REFERER HEADERS ASIGNA DIFERENTE METADATA
    // console.log(req.headers.referer);
    const { samlContent, extract } = await idp.parseLoginRequest(
      sp,
      'redirect',
      req
    )

    // console.log(req); // here
    // console.log(extract);

    req.extract = extract
    const { id, context, entityEndpoint, type } = await idp.createLoginResponse(
      sp,
      req,
      'post',
      {
        email: 'arandjel.sarenac@gmail.com'
      },
      undefined,
      true
    )

    return res.render('response', {
      context, // respuesta saml
      RelayState: '',
      spurl // acs
    })
  })

  server.get('/idp/login', (req, res) => {
    res.render('index', {})
  })

  // server.get('/', (req, res) => {
  //   res.json({ msg: "ESTE VA A SER EL LOGIN DEL IDP" })
  //   // return res.render('init', {
  //   //   context,
  //   //   RelayState: '',
  //   //   spurl
  //   // })
  // })

  server.get('/idp/login/activate', async (req:any, res:any) => {

    req.extract = { request: { id: new Date().getSeconds() } }
    const { id, context, entityEndpoint, type } = await idp.createLoginResponse(
      sp,
      req,
      'post',
      {
        email: 'arandjel.sarenac@gmail.com'
      },
      undefined,
      true
    )

    return res.render('response', {
      context,
      RelayState: '',
      spurl
    })

  })

  server.get('/metadata', (req, res) => {
    // res.json({xml: idp.getMetadata()})
    res.header('Content-Type', 'text/xml').send(idp.getMetadata())
  })

  server.get('/spmetadata', (req, res) => {
    res.header('Content-Type', 'text/xml').send(sp.getMetadata())
  })

  server.get('/entities', async (req, res) => {

    const sql = `SELECT * FROM entities;`;

    const entities = await db.query(sql)

    // console.log(indexHtml); // index
    // console.log(APP_BASE_HREF); //
    // console.log(req.baseUrl);

    res.json({msg: "entidades CRUD"})
    // return res.render('entities', { entities: entities[0] })
    // return res.render(indexHtml, { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] });
  })

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));


  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    // console.log(APP_BASE_HREF);
// console.log(req);
//     console.log(`TE AMO MAMÁ`);
//     console.log(req.baseUrl);
  console.log(APP_BASE_HREF);
    res.render(indexHtml, { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] });
  });

  return server;
}

function run(): void {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
