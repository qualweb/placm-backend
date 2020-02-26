"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var express_1 = __importDefault(require("express"));
var path_1 = __importDefault(require("path"));
var http_1 = __importDefault(require("http"));
var cors_1 = __importDefault(require("cors"));
var morgan_1 = __importDefault(require("morgan"));
var body_parser_1 = __importDefault(require("body-parser"));
var compression_1 = __importDefault(require("compression"));
var express_validator_1 = __importDefault(require("express-validator"));
var debug = require('debug')('placm-backend:server');
var app = express_1.default();
app.use(compression_1.default());
app.use(cors_1.default());
app.use(morgan_1.default('dev'));
app.use(body_parser_1.default.json({ limit: '2mb' }));
app.use(body_parser_1.default.urlencoded({ extended: false, limit: '2mb' }));
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_validator_1.default());
app.use('/', function (req, res) { return res.send(req.app.get('env') + " " + process.env.PORT); });
app.use(function (err, req, res, next) {
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
var port = '3443';
app.set('port', port);
var server = http_1.default.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
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
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : addr !== null ? 'port ' + addr.port : 'nothing';
    debug('Listening on ' + bind);
}
module.exports = app;
