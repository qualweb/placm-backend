import express from "express";
import { add_filedata, add_countries, correct_urls_files_json, add_as_from_links_excel, reset_database} from "../../models/admin/proto"
import { create } from "lodash";
import { query } from "express-validator/check";

const router = express.Router();

router.post('/addData', async function (req, res, next) {
  try {
    await add_filedata(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post('/addCountries', async function (req, res, next) {
  try {
    await add_countries(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/findASLinks', async function (req, res, next) {
  try {
      await add_as_from_links_excel()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/reset', async function (req, res, next) {
  try {
    await reset_database(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export = router;