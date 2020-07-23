import express from "express";
import { add_filedata, add_countries, correct_urls_files_json, add_as_from_links_excel, reset_database, prepare_database, group_elems, update_rules_table_element_type} from "../../models/admin/proto"

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

router.get('/idc', async function(req, res, next) {
  await group_elems();
});

router.get('/idc2', async function(req, res, next) {
  await update_rules_table_element_type();
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

router.get('/preparedb', async function (req, res, next) {
  prepare_database();
});

export = router;