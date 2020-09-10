import express from "express";
import { get_data, get_data_sc, get_data_compare, get_data_sc_compare, get_all_sc_data_app, get_names } from "../models/application";

const router = express.Router();

router.get('/scApp', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_all_sc_data_app(serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/appNames', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_names('app', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorNames', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_names('sector', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgNames', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_names('org', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/appData', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_data('app', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorData', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_data('sector', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgData', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_data('org', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/appDataSC', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_data_sc('app', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorDataSC', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_data_sc('sector', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgDataSC', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_data_sc('org', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/appDataCompare', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters;
    if(!!req.query.filters && req.query.filters !== '{}'){
      filters = req.query.filters;
    } else {
      throw({ code: 0, message: 'No queryParams given', err: 'EMPTY_PARAMS' });
    }
    get_data_compare('app', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorDataCompare', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters;
    if(!!req.query.filters && req.query.filters !== '{}'){
      filters = req.query.filters;
    } else {
      throw({ code: 0, message: 'No queryParams given', err: 'EMPTY_PARAMS' });
    }
    get_data_compare('sector', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgDataCompare', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters;
    if(!!req.query.filters && req.query.filters !== '{}'){
      filters = req.query.filters;
    } else {
      throw({ code: 0, message: 'No queryParams given', err: 'EMPTY_PARAMS' });
    }
    get_data_compare('org', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/appDataSCCompare', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters;
    if(req.query.filters){
      filters = req.query.filters;
    } else {
      throw({ code: 0, message: 'no queryParams given', err: 'EMPTY_PARAMS' });
    }
    get_data_sc_compare('app', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorDataSCCompare', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters;
    if(!!req.query.filters && req.query.filters !== '{}'){
      filters = req.query.filters;
    } else {
      throw({ code: 0, message: 'No queryParams given', err: 'EMPTY_PARAMS' });
    }
    get_data_sc_compare('sector', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgDataSCCompare', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters;
    if(!!req.query.filters && req.query.filters !== '{}'){
      filters = req.query.filters;
    } else {
      throw({ code: 0, message: 'No queryParams given', err: 'EMPTY_PARAMS' });
    }
    get_data_sc_compare('org', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;