import express from "express";
import { add_accessibility_statement } from "../../models/admin/statement";

const router = express.Router();

router.post('/add', async function (req, res, next) {
    try {
      req.check('serverName', 'Invalid name').exists();
      req.check('numLinks', 'Invalid number of links').exists();
      req.check('links', 'Invalid links').exists();
      req.check('htmls', 'Invalid html codes').exists();
      const errors = req.validationErrors();
      if (errors) {
        console.log(errors);
        // or file === undefined, reiniciar pedido e button
        res.send(errors);
      } else {
        const serverName = req.body.serverName;
        const numLinks = req.body.numLinks;
        const arrayLinks = JSON.parse(req.body.links);
        const arrayHtmls = JSON.parse(req.body.htmls);
        await add_accessibility_statement(serverName, numLinks, ...arrayLinks, ...arrayHtmls)
          .then(result => res.send(result))
          .catch((err: any) => res.send(err));
        }
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  });

export = router;