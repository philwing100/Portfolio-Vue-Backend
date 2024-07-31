const express = require('express');
const router = express.Router();
const pool = require('../databaseConnection/database');

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

router.get('/', isAuthenticated, (req, res) => {
  const promisePool = pool.promise();

  const queries = [
    promisePool.query('SELECT * FROM lists'),
    promisePool.query('SELECT * FROM listItems')
  ];

  Promise.all(queries)
    .then(results => {
      const [listsResults, listItemsResults] = results;
      const [lists] = listsResults;
      const [listItems] = listItemsResults;

      console.log('Lists:', lists);
      console.log('List Items:', listItems);

      res.json({
        lists,
        listItems
      });
    })
    .catch(err => {
      console.error('Error executing queries:', err);
      res.status(500).send('An error occurred while fetching data');
    });
});

module.exports = router;
