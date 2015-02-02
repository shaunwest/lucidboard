/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

var jsapp = { view: 'main' };

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  // Sign in
  'POST /api/signin': {
    controller: 'UserController',
    action:     'signin'
  },

  // Sign in with token
  'POST /api/refresh-token': {
    controller: 'UserController',
    action:     'refreshToken'
  },

  'POST /api/subscribe': {
    controller: 'UserController',
    action:     'subscribe'
  },

  'POST /api/unsubscribe': {
    controller: 'UserController',
    action:     'unsubscribe'
  },

  // Board list get
  'GET /api/boards': {
    controller: 'BoardController',
    action:     'getList'
  },

  // Board Get (Full!)
  'GET /api/boards/:id': {
    controller: 'BoardController',
    action:     'findById'
  },

  // Board Create
  'POST /api/boards': {
    controller: 'BoardController',
    action:     'create'
  },

  // Board Update
  'POST /api/boards/:id': {
    controller: 'BoardController',
    action:     'update'
  },

  // Board: Move card
  'POST /api/boards/:id/move-card': {
    controller: 'BoardController',
    action:     'moveCard'
  },

  // Board: Combine cards
  'POST /api/boards/:id/combine-cards': {
    controller: 'BoardController',
    action:     'combineCards'
  },

  // Board: Combine piles
  'POST /api/boards/:id/combine-piles': {
    controller: 'BoardController',
    action:     'combinePiles'
  },

  // Board: Move pile
  'POST /api/boards/:id/move-pile': {
    controller: 'BoardController',
    action:     'movePile'
  },

  // Board: Card flip (new card on top of pile)
  'POST /api/boards/:id/card-flip': {
    controller: 'BoardController',
    action:     'cardFlip'
  },

  // Board: Start timer
  'POST /api/boards/:id/timer-start': {
    controller: 'BoardController',
    action:     'timerStart'
  },

  // Column Create
  'POST /api/boards/:boardId/columns': {
    controller: 'ColumnController',
    action:     'create'
  },

  // Column Update
  'POST /api/boards/:boardId/columns/:columnId': {
    controller: 'ColumnController',
    action:     'update'
  },

  // Card Create
  'POST /api/boards/:boardId/columns/:columnId/cards': {
    controller: 'CardController',
    action:     'create'
  },

  // Card Update
  'POST /api/boards/:boardId/columns/:columnId/cards/:cardId': {
    controller: 'CardController',
    action:     'update'
  },

  // Card Vote
  'POST /api/boards/:boardId/columns/:columnId/cards/:cardId/upvote': {
    controller: 'CardController',
    action:     'upvote'
  },

  // Get the colset list
  'GET /api/colsets': {
    controller: 'BoardController',
    action:     'colsets'
  },



  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  *  If a request to a URL doesn't match any of the custom routes above, it  *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

  'GET /':                jsapp,
  'GET /signin':          jsapp,
  'GET /boards':          jsapp,
  'GET /boards/:boardId': jsapp,

  // Board Export (CSV)
  'GET /boards/:boardId/export/csv': {
    controller: 'ExportController',
    action:     'csv'
  }
};
