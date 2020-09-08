import express from "express";
import { get_data_by_evaluation_tool, get_data_evaluation_tool, get_data_evaluation_tool_sc, get_data_evaluation_tool_compare, get_data_evaluation_tool_sc_compare } from "../models/evaluation";

const router = express.Router();

router.get('/byTool', async function (req, res, next) {
  try {
      get_data_by_evaluation_tool()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/evalToolData', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_evaluation_tool(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/evalToolDataSC', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_evaluation_tool_sc(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/evalToolDataCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_evaluation_tool_compare(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/evalToolDataSCCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_evaluation_tool_sc_compare(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;