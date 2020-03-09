import * as DB_CONFIG from './../db_config.json';
import * as DB_CONFIG_X from './../db_config_x.json';
import * as DB_CONFIG_PROTO from './../db_config_proto.json';
import * as COUNTRY_JSON from './country-by-continent.json';

const maxTextLength = 255;

const emailRegex = new RegExp(/\w+@\w+\.\w+/);
const twitterRegex = new RegExp(/(?!\b)@[a-zA-Z0-9]{1,15}/g);
const telephoneRegex = new RegExp(/^(?:[0-9]|[ -()+#.])+$/);

export {DB_CONFIG, DB_CONFIG_X, DB_CONFIG_PROTO, COUNTRY_JSON, maxTextLength,
        emailRegex, twitterRegex, telephoneRegex};