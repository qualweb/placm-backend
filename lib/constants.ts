import * as DB_CONFIG from './../db_config.json';
import * as DB_CONFIG_PROTO from './../db_config_proto.json';
import * as DB_CONFIG_PROTO_PT from './../db_config_proto_pt.json';
import * as DB_CONFIG_PROTO_TEST from './../db_config_proto_test.json';
import * as COUNTRY_JSON from './jsons/country-by-continent.json';
import * as CONSTELLATIONS_JSON from './jsons/constellations.json';
import * as PROTODATA_JSON from './jsons/protodata.json';
import * as RULES_JSON from './jsons/act-rules_mapping.json';
import * as WCAG21 from './jsons/wcag21.json';
import * as ELEMENT_TYPES from './jsons/element_type_rule.json';

const maxTextLength = 255;

const emailRegex = new RegExp(/\w+@\w+\.\w+/);
const twitterRegex = new RegExp(/(?!\b)@[a-zA-Z0-9]{1,15}/g);
const telephoneRegex = new RegExp(/^(?:[0-9]|[ -()+#.])+$/);

const urlRegex = new RegExp(/^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/);

const DB_NAMES: { [key: string]: string } = {
  'proto': 'placmproto',
  'pt': 'placmprotopt'
}

export {DB_CONFIG, DB_CONFIG_PROTO, DB_CONFIG_PROTO_PT, DB_CONFIG_PROTO_TEST,
        COUNTRY_JSON, CONSTELLATIONS_JSON, PROTODATA_JSON,
        RULES_JSON, WCAG21, ELEMENT_TYPES,
        maxTextLength, emailRegex, twitterRegex, telephoneRegex, urlRegex, DB_NAMES};