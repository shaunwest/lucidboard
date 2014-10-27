/**
 * Provide convenience methods for our application's use of redis
 */

var
  redisModule = require('redis'),
  async       = require('async')
  client      = redisModule.createClient(),
  redisUser   = require('./redis/user.js')(client);


module.exports = {
};

/*
var validate = function(caller, fields, obj) {
    for (var i in fields) {
        if (obj[fields[i]] === undefined) {
            throw caller + ': Expected ' + fields.join(', ') + '; got '
                + JSON.stringify(obj);
        }
    }
};

var publish = function(signal, payload) {
    var stringified = JSON.stringify(payload);
    console.log('publishing ' + signal + ', ' + stringified);
    client.publish(signal, stringified);
};

var postGet = function(postId, cb) {
    client.hgetall('post:' + postId, function(err, p) {
        if (err) return cb(err);
        if (!p)  return cb(null, p);

        p.tags    = p.tags.split(',');
        p.id      = parseInt(p.id);
        p.upvotes = parseInt(p.upvotes);
        p.userId  = parseInt(p.userId);

        cb(null, p);
    });
};

var er = function(err) {
    console.log('!Redis: ' + err);
};


module.exports = {

    client: client,

    socketOnConnection: function(socket) {
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


    /**
     * MISC
     * /

    clearKeysByPatterns: function(patterns, cb) {
        var keys = [];

        var getKeys = function(keyPattern, _cb) {
            redis.client.keys(keyPattern, _cb);
        };

        async.map(patterns, getKeys, function(err, keyArrs) {

            keys = keys.concat.apply(keys, keyArrs);  // flatten arrays

            async.parallel(keys.map(function(key) {
                return function(_cb) {
                    redis.client.del(key, _cb);
                };
            }), cb);
        });
    },


    /**
     * POST THINGS
     * /

    postGet: postGet,

    postUpdate: function(post, cb) {
        client.hmset('post:' + post.id, post, cb);
        var i, tags = post.tags.split(',');
        for (i in tags) {
            client.sadd('tag:' + tags[i] + ':postIds', post.id);
        }
    },

    postIdsGetSubscribedByUserId: function(userId, cb) {
        client.smembers('user:' + userId + ':subscribed', cb);
    },

    postsGetWithAllTags: function(tags, cb) {
        var keys = tags.map(function(t) { return 'tag:' + t + ':postIds'; });

        client.sinter(keys, function(err, postIds) {
            if (err) return cb(err);
            async.map(postIds, postGet, cb);
        });
    },

    postsGetSubscribedByUserId: function(userId, cb) {
        this.postIdsGetSubscribedByUserId(userId, function(err, pIds) {
            if (err) return cb(err);
            async.map(pIds, postGet, cb);
        });
    },

    postsGetWithAtLeastOneOfTheseTags: function(tags, cb) {
        var keys = tags.map(function(t) { return 'tag:' + t + ':postIds'; });

        client.sunion(keys, function(err, postIds) {
            if (err) return cb(err);
            async.map(postIds, postGet, cb);
        });
    },

    emitChatEvent: function(obj) {
        validate('emitChatEvent',
            ['postId', 'name', 'fullname', 'gravatarHash', 'content', 'createdAt'],
            obj);

        publish('post:' + obj.postId + ':msg', {
            name:           obj.name,
            fullname:       obj.fullname,
            gravatarHash:   obj.gravatarHash,
            content:        obj.content,
            createdAt:      obj.createdAt,
            createdAtFancy: obj.createdAtFancy
        });

        // Indicate to subscribed users that a new message has been added to the chat
        publish('post:' + obj.postId + ':_msg', {});
    },


    /**
     * USER / TAG THINGS
     * /

    tagAdd: function(obj) {
        validate('tagAdd', ['userId', 'tag', 'newUserCount'], obj);
        client.sadd('user:' + obj.userId + ':tags', obj.tag, function(err) {
            if (err) return er(err);
            client.sadd('tag:' + obj.tag + ':userIds', obj.userId, function(err) {
                if (err) return er(err);
                publish('user:' + obj.userId + ':tag', {tag: obj.tag});
            });
        });
    },

    tagRm: function(obj) {
        validate('tagRm', ['userId', 'tag'], obj);
        client.srem('user:' + obj.userId + ':tags', obj.tag, function(err) {
            if (err) return er(err);
            client.srem('tag:' + obj.tag + ':userIds', obj.userId, function(err) {
                if (err) return er(err);
                publish('user:' + obj.userId + ':rmtag', {tag: obj.tag});
            });
        });
    },

    userIdsGetWithAllTags: function(tags, cb) {
        var keys = tags.map(function(t) { return 'tag:' + t + ':userIds'; });
        client.sinter(keys, cb);
    },

    userIdsGetWithAtLeastOneOfTheseTags: function(tags, cb) {
        var keys = tags.map(function(t) { return 'tag:' + t + ':userIds'; });
        client.sunion(keys, cb);
    },

    resetChatMessageUnreadCount: function(obj) {
        validate('resetChatMessageUnreadCount', ['postId', 'userId'], obj);
        publish('user:' + obj.userId + ':postChatUnreadReset', {postId: obj.postId});
    },


    /**
     * POST THINGS
     * /
    postSubscribe: function(obj) {
        validate('postSubscribe', ['postId', 'userId'], obj);
        client.sadd('user:' + obj.userId + ':subscribed', obj.postId, function(err) {
            if (err) return er(err);
            publish('user:' + obj.userId + ':sub', {postId: parseInt(obj.postId)});
        });
    },

    postUnsubscribe: function(obj) {
        validate('postUnsubscribe', ['postId', 'userId'], obj);
        client.srem('user:' + obj.userId + ':subscribed', obj.postId, function(err) {
            if (err) return er(err);
            publish('user:' + obj.userId + ':rmsub', {postId: parseInt(obj.postId)});
        });
    },

    hasUserUpvoted: function(obj, cb) {
        validate('hasUserUpvoted', ['userId', 'postId'], obj);
        client.sismember('user:' + obj.userId + ':upvoted', obj.postId, function(err, has) {
            cb(err, Boolean(has));
        });
    },

    upvote: function(obj) {
        validate('upvote', ['postId', 'userId'], obj);
        console.log('incrementing upvotes on postid ' + obj.postId + ' for ' + obj.userId);
        client.hincrby('post:' + obj.postId, 'upvotes', 1, function(err, upvotes) {
            if (err) return er(err);
            client.sadd('user:' + obj.userId + ':upvoted', obj.postId, function(err, u) {
                if (err) return er(err);
                publish('post:' + obj.postId, {upvotes: parseInt(upvotes)});
                publish('post:' + obj.postId + ':' + obj.userId, {upvoted: true});
            });
        });
    },

    unupvote: function(obj) {
        validate('unupvote', ['postId', 'userId'], obj);
        console.log('decrementing upvotes on postid ' + obj.postId + ' for ' + obj.userId);
        client.hincrby('post:' + obj.postId, 'upvotes', -1, function(err, upvotes) {
            if (err) return er(err);
            client.srem('user:' + obj.userId + ':upvoted', obj.postId, function(err, u) {
                if (err) return er(err);
                publish('post:' + obj.postId, {upvotes: parseInt(upvotes)});
                publish('post:' + obj.postId + ':' + obj.userId, {upvoted: false});
            });
        });
    },
};
*/
