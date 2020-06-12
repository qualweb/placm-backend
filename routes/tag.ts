import express from "express";
//import { get_number_of_tags, get_all_tag_data, get_all_tags_names } from "../models/tag";
import { get_data_filtered, get_all_tags_names } from "../models/tag";

const router = express.Router();

router.get('/allTagDataFiltered', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_filtered(filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/tagsNames', async function (req, res, next) {
  try {
      await get_all_tags_names()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;