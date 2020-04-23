import express from "express";
import { add_filedata, add_countries, correct_urls_files_json, add_as_from_links_excel} from "../../models/admin/proto"

const router = express.Router();

router.post('/addData', async function (req, res, next) {
  try {
      await add_filedata()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post('/addCountries', async function (req, res, next) {
  try {
      await add_countries()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post('/findASLinks', async function (req, res, next) {
  try {
      await add_as_from_links_excel()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export = router;