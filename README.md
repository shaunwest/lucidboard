# Lucidboard

A virtual board of adhesive sticky notes for all your brainstorming and retrospective needs.

## Setup

Make sure you have a running instance of Redis going on and do something like the following:

    npm install -g sails bower gulp
    cp config/local.js.example config/local.js  # maybe do this if you want to override defaults
    cp config/ldap.js.example config/ldap.js    # if you're using ldap
    vim config/local.js                         # or your editor of choice.
    vim config/ldap.js                          # or your editor of choice.
    bundle install
    bower install
    npm install
    npm start

## Credits

**Developers/UI:** Adam Bellinson, Shaun West, Amber Febbraro, Phil Rinke

**Business Support:** Randy Pfeifer, Dan Boursalian

Big credit to Quicken Loans for allowing us to work on this project as part of Bullet Time -- when time slows and we can work on self-prioritized projects to elevate our engineering chops!
