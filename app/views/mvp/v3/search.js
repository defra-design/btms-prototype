const _ = require('lodash')

module.exports = router => {

  
  router.post(['/mvp/v2/search/'], (req, res, next) => {
    const data = req.session.data;
    var search = req.session.data['data.searchTerm'];



   if(search == '24GBDCS6GQ0LFQIAR1') {
      res.redirect('mrn')
    }
    else if(search == '25GB0HQ0W2IZKO9AR0') {
      res.redirect('mrn-auth')
    }
    else if(search == '24GBDX8QQ4WWFZNAR3') {
      res.redirect('mrn-try-auth')
    }
    else if(search == 'CHEDPP.GB.2025.5426583') {
      res.redirect('no-mrn')
    }
    else if(search == '25GB0P0TEP7CZCNAR6') {
      res.redirect('no-ched')
    }
    else {
      res.redirect('search')
    }
  })


}
