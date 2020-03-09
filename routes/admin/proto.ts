import express from "express";
import { add_filedata, add_countries } from "../../models/admin/proto"

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

export = router;