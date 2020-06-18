import * as DB_CONFIG from './../db_config.json';
import * as DB_CONFIG_PROTO from './../db_config_proto.json';
import * as DB_CONFIG_PROTO_PT from './../db_config_proto_pt.json';
import * as COUNTRY_JSON from './country-by-continent.json';
import * as CONSTELLATIONS_JSON from './constellations.json';
import * as PROTODATA_JSON from './protodata.json';

const maxTextLength = 255;

const emailRegex = new RegExp(/\w+@\w+\.\w+/);
const twitterRegex = new RegExp(/(?!\b)@[a-zA-Z0-9]{1,15}/g);
const telephoneRegex = new RegExp(/^(?:[0-9]|[ -()+#.])+$/);

const urlRegex = new RegExp(/^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/);

const DB_NAMES: { [key: string]: string } = {
  'proto': 'placmproto',
  'pt': 'placmprotopt'
}

export {DB_CONFIG, DB_CONFIG_PROTO, DB_CONFIG_PROTO_PT, COUNTRY_JSON, CONSTELLATIONS_JSON, PROTODATA_JSON,
        maxTextLength, emailRegex, twitterRegex, telephoneRegex, urlRegex, DB_NAMES};