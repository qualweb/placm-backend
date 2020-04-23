import express from "express";
import path from "path";
import http from 'http';
import cors from "cors";
import logger from "morgan";
import bodyParser from "body-parser";
import compression from "compression";
import expressValidator from "express-validator";
const debug = require('debug')('placm-backend:server');

import protoRouter from "./routes/admin/proto";
import countryRouter from "./routes/country";
import tagRouter from './routes/tag';
import applicationRouter from './routes/application';
import pageRouter from './routes/page';
import ruleRouter from './routes/rule';
import evaluationRouter from './routes/evaluation';
import adminReportRouter from "./routes/admin/report";
import adminStatementRouter from "./routes/admin/statement";


const app = express();
app.use(compression());
app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressValidator());

app.use('/proto', protoRouter);
app.use('/country', countryRouter);
app.use('/tag', tagRouter);
app.use('/application', applicationRouter);
app.use('/page', pageRouter);
app.use('/rule', ruleRouter);
app.use('/evaluation', evaluationRouter);

app.use('/admin/report', adminReportRouter);
app.use('/admin/statement', adminStatementRouter);

app.use(function(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  // render the error page
  res.status(err.status || 500);
  res.json({ success: err.status || 500, message: 'SERVICE_NOT_FOUND', errors: null, results: null });
});

/**
 * * * * * * * * * * * * * * * * * * 
 * * * SERVER INITIALIZATION * * * *
 * * * * * * * * * * * * * * * * * *
 */
const port = process.env.PORT || '3000';
app.set('port', port);
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error: { syscall: string; code: any; }) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : addr !== null ? 'port ' + addr.port : 'nothing';
  debug('Listening on ' + bind);
}

export = app;