const _ = require('lodash')

module.exports = router => {

  
  router.post(['/mvp/v1/search/'], (req, res, next) => {
    const data = req.session.data;
    var search = req.session.data['data.searchTerm'];


    if(search == 'CHEDP.GB.2024.4450758' ) {
        res.redirect('ched')
      } 
      else if(search == '24GB6T3HFCIZV1HAR9') {
      res.redirect('mrn')
    }
    else {
      res.redirect('search')
    }
  })


}
