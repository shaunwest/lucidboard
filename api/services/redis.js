var
  redisModule = require('redis'),
  async       = require('async')
  client      = redisModule.createClient(),
  redisUser   = require('./redis/user.js')(client);

var publish = function(signal, payload) {
  var stringified = JSON.stringify(payload);
  console.log('publishing ' + signal, stringified);
  client.publish(signal, stringified);
};

module.exports = {
  boardCreated: function(board) {
    publish('board:create', {id: board.id, title: board.title});
  },
  boardUpdated: function(board) {
    publish('board:update:' + board.id, board);
  },
  boardDeleted: function(boardId) {
    publish('board:delete:' + boardId, null);
  },

  columnCreated: function(column) {
    publish('column:create:' + column.board, column);
  },
  columnUpdated: function(column) {
    publish('column:update:' + column.board, column);
  },
  columnDeleted: function(column) {
    publish('column:delete:' + column.board, column.id);
  },

  cardCreated: function(boardId, card) {
    publish('card:create:' + boardId, card);
  },
  cardUpdated: function(boardId, card) {
    publish('card:update:' + boardId, card);
  },
  cardDeleted: function(boardId, card) {
    publish('card:delete:' + boardId, null);
  },

  cardUpvote: function(boardId, vote) {
    publish('card:upvote:' + boardId, vote);
  },

  socketOnConnection: function(session, socket) {
    // Create a new redis connection for the new websocket.
    socket.redis = redisModule.createClient();

    // This is critical to clean up the redis connection when the
    // corresponding websocket closes.
    socket.on('disconnect', function() { socket.redis.quit(); });

    // When a redis event comes in that the client has subscribed to,
    // forward it along over the websocket.
    socket.redis.on('message', function(channel, message) {
      console.log('redis->socket[' + socket.handshake.sessionID + '] ' +
        channel + ': ' + message);
      socket.emit(channel, JSON.parse(message));
    });
  },
};
