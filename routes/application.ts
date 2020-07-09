import express from "express";
import { get_data_filtered, get_data_filtered_sc } from "../models/application";

const router = express.Router();

router.get('/appDataFiltered', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_filtered('app', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorDataFiltered', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_filtered('sector', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgDataFiltered', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_filtered('org', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/appDataSucCriteria', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_filtered_sc('app', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorDataSucCriteria', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_filtered_sc('sector', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgDataSucCriteria', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_filtered_sc('org', serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;