import express from "express";
import {add_earl_report} from "../models/page"

const router = express.Router();

router.post('/earlReport', async function (req, res, next) {
    try {
      req.check('jsonFromLink', 'Invalid json from link').exists();
      req.check('jsonFromFile', 'Invalid json from file').exists();
      //req.check('jsons', 'Invalid jsons').exists();
      const errors = req.validationErrors();
      if (errors) {
        console.log(errors);
        // or file === undefined, reiniciar pedido e button
        res.send(errors);
      } else {
        //console.log(req.body.jsons);
        //console.log((req.body.jsons).length);
          const jsonFromLink = req.body.jsonFromLink;
          const jsonFromFile = req.body.jsonFromFile;
          await add_earl_report(jsonFromLink, jsonFromFile)
            .then(result => res.send(result))
            .catch((err: any) => res.send(err));
        }
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  });

export = router;