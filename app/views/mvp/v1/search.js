const _ = require('lodash')

module.exports = router => {

  
  router.post(['/mvp/v1/search/'], (req, res, next) => {
    const data = req.session.data
    res.redirect('mrn')
  })


}
