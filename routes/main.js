const router = require('express').Router();

const mainController = require('../controllers/mainController');

router.post('/login', mainController.login);
router.get('/votacion/:id', mainController.votacion);
router.post('/votar', mainController.save_votacion);
router.get('/votaciones', mainController.votaciones);

router.get('/', function(req, res) {
    res.render('home',{
        denied: false
      });
});

router.get('/logout', function(req, res) {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

module.exports = router;
