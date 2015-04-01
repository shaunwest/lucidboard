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

## Administration

A user can be flagged as an admin, giving them special abilities on the Lucidboard installation. Currently, these abilities include:

  - Actually deleting from the database archived boards

To flag a user, add the following lines to your config/local.js file, changing the adminMakerPassword:

    // Is the admin delegation screen available?
    adminMakerEnabled: true,
    adminMakerPassword: 'secretpassword',  // admin delegation password

Using this special password, you will be able to delegate a user as an admin by visiting the `/admin-delegation` page on your installation.

## Credits

**Developers/UI:** Adam Bellinson, Shaun West, Amber Febbraro, Phil Rinke

**Business Support:** Randy Pfeifer, Dan Boursalian

Big credit to Quicken Loans for allowing us to work on this project as part of Bullet Time -- when time slows and we can work on self-prioritized projects to elevate our engineering chops!
